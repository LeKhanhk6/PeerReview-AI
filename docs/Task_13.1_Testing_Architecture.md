# TASK 13.1 — Production-Grade Backend Testing Architecture

Tài liệu này định nghĩa chiến lược, kiến trúc, và quy chuẩn khắt khe cho Unit Test 12 service còn lại. Mục tiêu không chỉ là "Coverage cao", mà là tạo ra một bộ test suite **"khó phá vỡ" (Production-grade)**.

---

## 1. Test Layering (Kiến trúc Test dài hạn)

Để hệ thống không sụp đổ khi scale, kiến trúc test phải phân tầng rõ ràng (Test Pyramid):
- **Unit Test (Service - Current Scope)**: Mock 100% DB, focus vào Business Logic, Edge Cases, Auth, và Fallback. (Mục tiêu của Task 13.1).
- **Integration Test (DB + Service - Future Extension)**: Cắm DB test (PostgreSQL) thật để verify schema, trigger, và complex queries.
- **Contract / E2E Lite (API - Future Extension)**: Dùng `supertest` gọi thẳng Controller để bảo vệ API Contract.

---

## 2. Test Architecture & Foundation (TASK 13.0)

### 2.1 Folder Structure
```text
backend/tests/
  ├── services/               # BDD-style Test files
  ├── __mocks__/              # Mock configs (DB, AI)
  └── factories/              # Stateful Scenario-based Data generators
```

### 2.2 Stateful Scenario-based Factory
Không dùng Object Factory vô tri. Chuyển sang **Stateful Scenario** để test chuỗi lifecycle:
```javascript
const scenario = await createSubmissionScenario();
await scenario.submit();
await scenario.review();
await scenario.resubmit();
// Assert state consistency sau cả chuỗi lifecycle
```

### 2.3 Golden Path Snapshot
Các luồng quan trọng nhất (như flow lấy dashboard, flow tính điểm cuối) phải có Snapshot Test để chống Regression vô tình:
```javascript
const result = await submitAssignmentFlow(...);
expect(result).toMatchSnapshot();
```

---

## 3. Advanced Mock Strategy (Contract vs Implementation)

### 3.1 Behavior-First Testing (Cực kỳ quan trọng)
- **Tập trung Behavior Test**: Assert dữ liệu trả về `expect(result).toEqual(expectedData)`.
- **Hạn chế Implementation Test**: Không `expect` SQL string quá chi tiết, VÌ NẾU tối ưu SQL (VD: đổi JOIN thành Subquery), test sẽ fail.

### 3.2 Critical Implementation Lock (Ngoại lệ)
ĐƯỢC PHÉP assert Implementation (SQL strings) **CHỈ TRONG CÁC TRƯỜNG HỢP SAU**:
- **Transaction control**: Phải check `BEGIN`, `COMMIT`, `ROLLBACK`.
- **Row locking logic**: Phải check `FOR UPDATE`.
- **Idempotency guard**: Phải check điều kiện `WHERE` quyết định.
- **Security-sensitive queries**.

### 3.3 Transaction Integrity Deeper Check
Nếu query lỗi giữa chừng, không chỉ assert `ROLLBACK`. Phải kiểm chứng state **không bị ghi một phần**:
```javascript
expect(pool.query).toHaveBeenCalledWith("ROLLBACK");
expect(pool.query).not.toHaveBeenCalledWith(
  expect.stringContaining("INSERT INTO submission_versions")
);
```

### 3.4 Fake Timers cho Time-based Logic
- **Cấm** dùng `Date.now()`. Bắt buộc dùng Fake Timers: `jest.useFakeTimers()`, `jest.setSystemTime()`.

### 3.5 Test Isolation
- Ngăn ngừa flaky test bằng cách xoá sạch trạng thái: `afterEach(() => { jest.clearAllMocks(); });`

---

## 4. Quality Coverage Strategy (Không Fake Coverage)

Mỗi hàm phải quét qua các góc chết sau:

### 4.1 Concurrency Realism (Race condition)
Test tranh chấp bằng `Promise.all` và simulate interleaving:
```javascript
// Test 2 request chạy song song
const [res1, res2] = await Promise.all([ submit(), submit() ]);
// Assert chỉ 1 cái thành công
```

### 4.2 Defensive Handling (Catch Errors)
- **Read-only APIs (GET)**: Fallback allowed (`return []`).
- **Write APIs (POST, PUT, DELETE)**: Bắt buộc ném lỗi kèm `ROLLBACK`.

### 4.3 Logic Branch Coverage & Auth Leakage
- Quét đủ nhánh Role (ADMIN, TEACHER-owner, TEACHER-not-owner, STUDENT).
- Đảm bảo User A không thấy data User B. Đảm bảo chặn truyền id láo (VD: gửi request group B nhưng là user group A).

---

## 5. Paranoid AI Testing (Test AI cực đoan)

Test AI không bao giờ được tin API từ Google.
- **Invalid JSON / Partial Data**: Xử lý JSON rách, Markdown lỗi, hoặc thiếu field.
- **Timeout**: Trả về fallback nếu AI treo quá lâu.
- **Prompt Injection**: Giả lập AI bị lừa trả về text rác "Ignore previous instruction".
- **Large Output**: Giả lập trả về 10k tokens -> Assert hệ thống truncate an toàn.
- **Deterministic Fallback**: Dù lỗi kiểu gì, Output của AI module phải Predictable:
  ```javascript
  expect(result).toEqual({ strengths: [], weaknesses: [], score: null });
  ```

---

## 6. Execution Plan & CI Rules (HARD GATE)

### 6.1 Strict CI Rules
1. **Coverage Threshold**: `lines: 80`, `branches: 70`.
2. **Forbid Test Leaks**: Chạy `jest --detectOpenHandles` để bắt API treo. Cài ESLint `no-focused-tests` (Chặn commit dính `.only`).
3. **Fail on Unexpected Error (Noise Control)**: Test cấu hình `jest.spyOn(console, "error")` và báo lỗi nếu có error không nằm trong Allow-list:
  ```javascript
  const allowedErrors = ["Expected DB error"];
  // Fail CI nếu có error rác hoặc leak stack trace
  ```

### 6.2 Lộ trình 5 Bước triển khai
Áp dụng **Batch-by-Batch + HARD GATE**. Sau mỗi Batch, phải pass **Test Review Checklist**:
- [ ] Tên Test rõ nghĩa (Behavior-driven)?
- [ ] Test có tách rời Implementation (Trừ Transaction/Lock)?
- [ ] Factory có bảo toàn quan hệ (Relations)?
- [ ] Đã phủ Negative cases?
- [ ] Có test Concurrency/Idempotency chưa?
- [ ] Có check rò rỉ Auth (Auth leakage) chưa?

**[1] TASK 13.0 — Testing Foundation**
- Setup `tests/factories/`, `tests/__mocks__/`, Test Isolation, Fake Timers.

**[2] BATCH 1: Core Systems**
- `auth.service.js`, `group.service.js`, `rubric.service.js`, `assignment.service.js`.

**[3] BATCH 2: Collaboration & Workspace**
- `workspace.service.js`, `activity.service.js`, `submission.service.js`.

**[4] BATCH 3: Review Engine**
- `review-assignment.service.js`, `review.service.js`, `contribution.service.js`.

**[5] BATCH 4: AI & Synthesis**
- `ai.service.js`, `summary.service.js`.

---

## 7. Execution Report & Test Metrics

### 7.1. auth.service.js (Golden Standard)
- **Status**: ✅ COMPLETED (16/16 Test Cases Passed)
- **Coverage**: `Lines: 100%`, `Branches: 91.3%`, `Funcs: 100%`, `Stmts: 98%`
- **Key Vulnerabilities Tested & Fixed**:
  - Module init crash (`JWT_SECRET` missing).
  - Implicit 400 validation for empty credentials.
  - Mock leaks blocked by dynamic import (`jest.resetModules()`).
  - DB crash (500) and Transaction Integrity (crash at INSERT).
  - Invalid DB shape response crash handling.
  - External dependency crash (`bcrypt`, `jwt`).
