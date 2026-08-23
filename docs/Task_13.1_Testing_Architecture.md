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
- `review-assignment.service.js` ✅ COMPLETED (93.33% Coverage)
- `review.service.js` ✅ COMPLETED (84.28% Coverage)
- `contribution.service.js` (Pending)

### 7.7. review.service.js (BATCH 3 - HARD GATE V2)
- **Status**: ✅ COMPLETED (12/12 Test Cases Passed)
- **Coverage**: `Lines: 84.28%`
- **Key Vulnerabilities Tested & Fixed**:
  - Double-Submit Race Condition (Transaction Isolation): Bắn 2 luồng `Promise.all` cùng lúc, sử dụng `FOR UPDATE` và `WHERE status = 'PENDING'` chặn đứng luồng thứ 2.
  - Deadline Race Condition: Vá lỗ hổng sát giờ deadline bằng `EXISTS (SELECT ... WHERE a.deadline >= NOW())` ngay trong truy vấn `UPDATE`, triệt tiêu khả năng nộp bài trễ dù đã vượt qua khâu check ban đầu.
  - Idempotency Guarantee: Chạy tuần tự gọi 2 lần `submitReview` để đảm bảo lỗi văng ra là chuẩn 400 (Review already submitted) chứ không sinh duplicate.
  - Deep Rollback (No Partial Writes): Giả lập DB crash ngay khúc cuối (Bulk Insert criteria scores) -> Khẳng định không có record `reviews` nào bị sót lại nhờ `ROLLBACK`.
  - Non-Reversible Masking: Đảm bảo toàn bộ Submission ra ngoài frontend đều bọc qua `publicId` hash một chiều (vd: `A7F2BC`), ngăn dò ngược lại `group_id` hay `submission_id` thực tế. Lột sạch cả `file_url` gốc, chỉ trả proxy endpoint `/api/v1/submissions/.../download`.
  - Score Integrity: Bắn score âm, score lố weight max, hoặc text `NaN` -> Văng lỗi 400.
  - Hybrid Sampling Degradation: Hàm bốc mẫu cho AI (`getAssignmentReviewsForSynthesis`) vượt mượt mà qua các case `total < 100`, `total = 100` và `total = 1000`.

### 7.8. review-assignment.service.js (BATCH 3 - HARD GATE V2)
- **Status**: ✅ COMPLETED (5/5 Test Cases Passed)
- **Coverage**: `Lines: 93.33%`
- **Key Vulnerabilities Tested & Fixed**:
  - Algorithm Determinism (Fairness Bias Fix): Thay thế `Math.random()` bằng hàm `mulberry32` PRNG có seed, đảm bảo kết quả shuffle có thể tái tạo (reproducible) để truy vết và xử lý khiếu nại.
  - No Self-Review Invariant: Xác nhận toàn bộ n group phân bổ 2 bài/nhóm tuyệt đối không có nhóm nào được phân bài của chính mình.
  - Dynamic Membership Guard (Immutability): Chặn đứng việc gọi `generateReviewAssignments` khi hệ thống đã có assignments rồi -> Tránh sinh ra Orphan assignments hoặc phá hủy logic. Đã vô hiệu hóa logic `DELETE` cũ để ngăn chặn việc lỡ tay xóa nhầm data production.
  - Transaction Rollback Guard: Bắn lỗi giả lập khi Bulk Insert assignments để chứng minh lệnh DELETE assignments cũ bị thu hồi an toàn.

**[5] BATCH 4: AI & Synthesis**
- `ai.service.js` ✅ COMPLETED (79.87% Coverage)
- `summary.service.js` ✅ COMPLETED (66.26% Coverage)

### 7.9. ai.service.js (BATCH 4 - STAFF-LEVEL RESILIENCE)
- **Status**: ✅ COMPLETED (7/7 Test Cases Passed)
- **Coverage**: `Lines: 79.87%`
- **Key Vulnerabilities Tested & Fixed**:
  - Retry Storm Prevention: Tích hợp Exponential Backoff (`retryWithBackoff`) và Error Classification (không retry trên 4xx, chỉ retry trên 5xx hoặc Timeout).
  - Memory Explosion Guard: Kiểm tra dung lượng Response trả về từ AI bằng `Buffer.byteLength`. Nếu vượt mức 1MB (`MAX_RESPONSE_SIZE`), huỷ giao dịch và kích hoạt Fallback để chống OOM.
  - Timeout Hard Cancel: Áp dụng `AbortController` chính xác để chém đứt Connection đang treo với Gemini Provider.
  - Partial Update Guard: Bất kỳ Chunk nào sụp đổ cũng không làm hỏng toàn bộ pipeline, và DB Update Transaction hoàn toàn nằm riêng lẻ ở bước cuối (`updateSummaryItemsAI`), triệt tiêu Partial DB Write.
  - Teacher Overwrite Race Condition: Ràng buộc kiên quyết cờ `is_teacher_edited = false` trong câu query UPDATE để đảm bảo AI Job không chèn đè lên chỉnh sửa của Teacher.

### 7.10. summary.service.js (BATCH 4 - COLLABORATION LOCKING)
- **Status**: ✅ COMPLETED (5/5 Test Cases Passed)
- **Coverage**: `Lines: 66.26%`
- **Key Vulnerabilities Tested & Fixed**:
  - Optimistic Locking: Cập nhật hàm edit summary item `WHERE id = $3 AND updated_at <= $4::timestamp` xử lý bài toán lệch nhịp precision (clock drift) giữa Node.js Date và PostgreSQL Time.
  - Pessimistic Locking (`NOWAIT`): Lệnh `FOR UPDATE NOWAIT` sẽ nổ ra `55P03` (Lock Not Available) khi 2 giáo viên cùng duyệt. Hàm đã map chuẩn lỗi này sang `409 Conflict`.

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

### 7.2. group.service.js
- **Status**: ✅ COMPLETED (48/48 Test Cases Passed)
- **Coverage**: `Lines: 80%+`
- **Key Vulnerabilities Tested & Fixed**:
  - Auth Leakage: Ngăn chặn triệt để lộ lọt ID hoặc tên nhóm với các truy vấn trái phép (Luôn throw 404 thay vì 403 để không bị dò ID).
  - Data Structure: Xác thực kiểu dữ liệu ID (`NaN`, rỗng, object).
  - Role-based Access: Teacher (owner vs non-owner) và Student membership checking.

### 7.3. assignment.service.js
- **Status**: ✅ COMPLETED (16/16 Test Cases Passed)
- **Coverage**: `Lines: 95%+`
- **Key Vulnerabilities Tested & Fixed**:
  - Time-based Logic: Chặn nộp bài trễ hạn, sử dụng Fake Timers `jest.useFakeTimers()` triệt để.
  - Auth Ownership: Xác thực Teacher có thực sự quản lý Class không, chặn đứng leak dữ liệu lớp học khác.
  - Mock Architecture: Chuyển sang mô hình dynamic import và ESM mock (`jest.unstable_mockModule`) cho toàn bộ project.

### 7.4. submission.service.js
- **Status**: ✅ COMPLETED (13/13 Test Cases Passed)
- **Coverage**: `Lines: 100%`
- **Key Vulnerabilities Tested & Fixed**:
  - Concurrency/Race Conditions: Xử lý Promise.all mô phỏng đụng độ lưu trữ, đảm bảo `FOR UPDATE` lock chạy đúng.
  - Partial Failures: Bắt chính xác lỗi giữa transaction và `ROLLBACK` an toàn, không bị treo DB.
  - Idempotency & Limits: Ngăn chặn spam nộp bài (Giới hạn tối đa 20 versions).

### 7.5. rubric.service.js
- **Status**: ✅ COMPLETED (21/21 Test Cases Passed)
- **Coverage**: `Lines: 91.66%`, `Branches: 83.95%`
- **Key Vulnerabilities Tested & Fixed**:
  - Short-circuit Validation: Ngăn chặn input rác (mảng rỗng, sai kiểu dữ liệu) ngay từ đầu để tránh hit DB.
  - Transaction Leak Guard: Test đảm bảo không hề có `COMMIT` lọt ra ngoài khi bị lỗi mid-transaction (criteria insert fail).
  - Driver & Data Corruption Bug: Bắt dính DB trả về `null` hoặc array rỗng do lỗi driver hoặc data hỏng, không gây crash ngầm (silent crash).
  - Floating Point Integrity: Áp dụng `Math.round(val * 100) / 100` để check trọng số tổng chuẩn xác tuyệt đối `100`.

### 7.6. workspace.service.js (BATCH 2)
- **Status**: ✅ COMPLETED (15/15 Test Cases Passed)
- **Coverage**: `Lines: ~80%`
- **Key Vulnerabilities Tested & Fixed**:
  - Auth Leakage Deep Test: Chặn triệt để (ném 403) nếu user cố tình update task/files nằm ngoài group họ thuộc về.
  - Side-effect Isolation: Test giả lập lỗi từ hàm `logActivity`. Khẳng định rằng dù `logActivity` bắn lỗi, toàn bộ flow tạo task (`createTask`) vẫn thành công và không bị gián đoạn.
  - Concurrency Test: Giả lập Promise.all race condition với `updateTask`. `expect` chính xác giá trị hợp lệ cuối cùng trong tập hợp trạng thái.
  - Patch Validation: Chặn đứng thao tác `PATCH {}` (payload rỗng) với AppError 400. Toàn bộ tham số đầu vào được validate qua `validateId`.

### 7.7. activity.service.js (BATCH 2)
- **Status**: ✅ COMPLETED (9/9 Test Cases Passed)
- **Coverage**: `Lines: ~80%`
- **Key Vulnerabilities Tested & Fixed**:
  - Fire-and-Forget Resilience: `logActivity` được test cơ chế âm thầm bắt lỗi, ghi structured `console.error` `{ message, status }`, và không throw làm crash tiến trình chính.
  - GET Fallback: `getGroupActivities` và `getGroupActivityStats` được giả lập DB crash. Thay vì quăng 500, service sẽ an toàn fallback trả về array trống `[]`.
  - Pagination Boundary (Clamp): `limit` truyền vào được kẹp an toàn `(max 1000)`. Test tính toán chuẩn xác cờ `hasNext` thay vì ném thô array rows.
