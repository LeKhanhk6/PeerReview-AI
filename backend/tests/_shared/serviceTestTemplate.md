# Backend Service Test Template & Standards

Tài liệu này định nghĩa cấu trúc chuẩn (Golden Standard) bắt buộc phải tuân theo khi viết Unit Test cho bất kỳ Service nào trong dự án, nhằm ngăn chặn tình trạng "Test Drift" (lệch chuẩn) khi scale.

## 1. Structure

```javascript
describe("serviceName.service", () => {
    describe("methodName", () => {
        // Các test cases
    });
});
```

## 2. Required Cases (Mọi hàm đều phải quét qua)

- **Happy Path**: Test thành công với input hợp lệ.
- **Not Found (404)**: Test xử lý khi resource không tồn tại trong DB.
- **Unauthorized / Forbidden (401/403)**: Test rò rỉ quyền, user không có quyền access.
- **Invalid Input (400)**: Bắt các trường hợp null, rỗng, không đúng format (không cho lọt xuống query).
- **DB Crash (Throw 500)**: Không bao giờ nuốt lỗi khi DB sụp. Test `pool.query.mockRejectedValueOnce()`.
- **Unexpected DB Shape**: Đảm bảo fail có kiểm soát khi DB trả rác (ví dụ: trả về `null` thay vì `rows: []`).
- **Dependency Crash**: Test lỗi các external lib (như `bcrypt`, `jsonwebtoken`) để bảo vệ luồng chính.
- **Transaction Integrity**: Đối với luồng Write, nếu một nửa query thành công nhưng nửa sau sập -> phải throw lỗi và hủy side-effects.

## 3. Assertions Standards

- **Output Contract**: Bắt buộc assert cấu trúc trả về (`expect(result).toEqual({...})`).
- **Query Call Count**: Bắt buộc assert số lần gọi DB (`expect(pool.query).toHaveBeenCalledTimes(n)`).
- **Short-circuit Behavior**: Nếu validation fail từ đầu, DB không được gọi (`expect(pool.query).not.toHaveBeenCalled()`).
- **No Swallow Error**: Mọi error đều phải sủi bọt ra ngoài.

## 4. Naming Convention

```javascript
it("should [behavior] when [condition]", async () => { ... })
// Ví dụ: "should throw and not swallow error when DB crashes"
// Không dùng tên generic như "should handle errors"
```

## 5. Rules

- **No `console.error`**: Lỗi rác in ra sẽ làm hỏng CI.
- **No `.only` / `.skip`**: Test bị bỏ qua sẽ dẫn đến false positive coverage.
- **Mock Isolation**: Bắt buộc reset module trong `beforeEach` đối với các service có state, hoặc `mockReset()` để không bị leak mock.
