# POST-MVP Refactoring & Development Guidelines

Tài liệu này ghi chú các quy chuẩn kỹ thuật mới đã được thống nhất nhưng sẽ **chỉ áp dụng cho giai đoạn Post-MVP** hoặc **khi phát triển các tính năng hoàn toàn mới**, nhằm tránh việc refactor hàng loạt gây ảnh hưởng tiến độ và rủi ro cho codebase hiện tại trong giai đoạn MVP.

## 1. Unified Response Format (Chuẩn hóa API Response)
Tất cả các API Controller cần trả về dữ liệu theo cấu trúc bọc (wrapper) thay vì trả trực tiếp object hoặc message rời rạc.

**Thành công (Success):**
```javascript
return res.status(200).json({ 
    data: { ...result } 
});
```

**Thất bại (Error):**
```javascript
return res.status(400).json({ 
    error: { message: 'Mô tả chi tiết lỗi' } 
});
```
*(Hiện tại chuẩn này mới chỉ được áp dụng thí điểm ở cụm API Auth: Register, Login, GetMe).*

## 2. Centralized Error Handling (`AppError`)
Thay vì ném lỗi thông thường bằng `new Error()`, sử dụng class `AppError` (`src/utils/AppError.js`) để ném lỗi có kèm HTTP Status Code rõ ràng ngay từ tầng Service.

**Cách dùng:**
```javascript
import AppError from '../utils/AppError.js';

// Cũ:
// const error = new Error('Not found'); error.status = 404; throw error;

// Mới:
throw new AppError('Not found', 404);
```
*(Lợi ích: Code ngắn gọn hơn và sau này có thể dễ dàng bắt lỗi bằng một Global Error Middleware dựa trên cờ `isOperational`).*

## 3. Clean Error Logging
Tránh truyền trực tiếp object `error` vào log để không rò rỉ stack trace (gây ồn ào và tiềm ẩn rủi ro lộ logic nội bộ). Hãy log dạng cấu trúc an toàn:
```javascript
console.error('Tên hành động bị lỗi', { 
    message: error.message, 
    status: error.status 
});
```

---
**📍 QUY TẮC THỰC THI CHUNG:**
1. **Đối với các file hiện tại:** Không chủ động sửa hàng loạt. Giữ nguyên hiện trạng để đảm bảo tiến độ MVP.
2. **Khi refactor cục bộ:** Nếu có một task yêu cầu vào sửa một API cũ, thì nhân cơ hội đó sẽ refactor cụm API đó theo chuẩn này.
3. **Khi phát triển tính năng mới:** Bắt buộc áp dụng 100% chuẩn này ngay từ những dòng code đầu tiên.
