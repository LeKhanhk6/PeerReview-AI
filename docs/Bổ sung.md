# PHASE 3 — Teacher Assignment + Rubric

## Task: Assignment CRUD API + Ownership Authorization + Validation

### Mục tiêu

Xây dựng API quản lý bài tập (**Assignment**) với các chức năng CRUD cơ bản, đồng thời đảm bảo:

1. **Authentication:** Tất cả API yêu cầu người dùng đăng nhập hợp lệ thông qua JWT.
2. **Role Authorization:** Chỉ `TEACHER` và `ADMIN` được phép tạo, cập nhật và xóa Assignment.
3. **Resource Ownership Authorization:** `TEACHER` chỉ được phép tạo, sửa và xóa Assignment thuộc các Class mà mình phụ trách.
4. **Role-based Data Filtering:**
    - `ADMIN`: Có thể xem tất cả Assignment.
    - `TEACHER`: Chỉ xem Assignment thuộc các Class mà mình phụ trách.
    - `STUDENT`: Chỉ xem Assignment thuộc Class được xác định thông qua Group Membership.
5. **Input Validation:** Kiểm tra UUID, dữ liệu đầu vào, độ dài Title và Deadline.
6. **Resource Existence Handling:** Phân biệt rõ trường hợp tài nguyên không tồn tại (`404`) và người dùng không có quyền truy cập (`403`).

---

## Database Assumptions / Verification

Trước khi triển khai API, xác nhận các quan hệ Database sau:

```
classes.teacher_id
   ↓
users.id
```
Teacher được xác định là người phụ trách Class thông qua:

```
classes.teacher_id = users.id
```

Assignment thuộc một Class:

```
assignments.class_id
  ↓
classes.id
```

Student được xác định thuộc Class thông qua Group Membership:

```
users
   ↓
group_members.user_id
   ↓
groups.id
   ↓
groups.class_id
   ↓
classes.id
```

### Student/Class Membership Assumption

Trong schema MVP hiện tại, hệ thống không có bảng `class_members`, `student_classes` hoặc `enrollments`.

Do đó:

> Student được xác định thuộc một Class thông qua việc là thành viên của ít nhất một Group thuộc Class đó.

Nếu Student chưa được thêm vào Group, Student sẽ chưa thể xem Assignment của Class đó thông qua `GET /api/assignments`.

---

## API Endpoints

```
GET    /api/assignments
GET    /api/assignments/:id
POST   /api/assignments
PUT    /api/assignments/:id
DELETE /api/assignments/:id

```
---

# Authorization Rules

## GET /api/assignments

### ADMIN
```

→ Xem tất cả Assignment trong hệ thống.
```

### TEACHER

```
→ Chỉ xem Assignment thuộc các Class có:
classes.teacher_id = currentUser.id
```

### STUDENT

```
→ Chỉ xem Assignment thuộc Class mà Student được xác định là thành viên thông qua:
group_members
    ↓
groups
    ↓
classes
```

---

## POST /api/assignments

Role được phép:

```
TEACHER
ADMIN
```

### TEACHER

Trước khi tạo Assignment:

```
1. Validate class_id.
        ↓
2. Kiểm tra Class có tồn tại.
        ↓
Không tồn tại → 404 Not Found
        ↓
Có tồn tại
        ↓
3. Kiểm tra Teacher có phải người phụ trách Class.
        ↓
Không có quyền → 403 Forbidden
        ↓
Có quyền → Create Assignment
```
### ADMIN

```
→ Có thể tạo Assignment cho bất kỳ Class hợp lệ nào.

```
---

## PUT /api/assignments/:id

Role được phép:

```
TEACHER
ADMIN
```

Flow:
```

1. Validate Assignment UUID.
        ↓
2. Kiểm tra Assignment có tồn tại.
        ↓
Không tồn tại → 404 Not Found
        ↓
3. Nếu ADMIN
        ↓
Update Assignment
        ↓
4. Nếu TEACHER
        ↓
Kiểm tra Assignment thuộc Class mà Teacher phụ trách.
        ↓
Không có quyền → 403 Forbidden
        ↓
Có quyền → Update Assignment

```
---

## DELETE /api/assignments/:id

Role được phép:

```
TEACHER
ADMIN

```
Flow:

```
1. Validate Assignment UUID.
        ↓
2. Kiểm tra Assignment có tồn tại.
        ↓
Không tồn tại → 404 Not Found
        ↓
3. Nếu ADMIN
        ↓
Delete Assignment
        ↓
4. Nếu TEACHER
        ↓
Kiểm tra Assignment thuộc Class mà Teacher phụ trách.
        ↓
Không có quyền → 403 Forbidden
        ↓
Có quyền → Delete Assignment
```

---

# Input Validation

## `id`

```
- Required trong URL parameter.
- Phải là UUID hợp lệ.
- UUID không hợp lệ → 400 Bad Request.
```

---

## `class_id`

```
- Required khi Create Assignment.
- Phải là UUID hợp lệ.
- UUID không hợp lệ → 400 Bad Request.
- Class không tồn tại → 404 Not Found.
```

---

## `title`

```
- Required.

- Phải là String.

- Không được rỗng.

- Không được chỉ chứa khoảng trắng.

- Trim trước khi lưu Database.

- Maximum 255 characters.
```

Lỗi validation:

```
400 Bad Request

```
---

## `description`

```
- Optional.
- Nếu được gửi lên phải là String.
```

---

## `requirements`

```
- Optional.
- Nếu được gửi lên phải là String.
```

---

## `deadline`

```
- Required.
- Phải là ISO 8601 datetime hợp lệ.
- Phải lớn hơn thời điểm hiện tại.
```
Ví dụ:

```
2026-08-25T23:59:00+07:00
```

hoặc:

```
2026-08-25T16:59:00.000Z
```

Dữ liệu không hợp lệ:

```
400 Bad Request
```

---

# HTTP Status Handling

| Tình huống                            | HTTP Status                 |
| ------------------------------------- | --------------------------- |
| Request data không hợp lệ             | `400 Bad Request`           |
| Chưa đăng nhập / JWT không hợp lệ     | `401 Unauthorized`          |
| User không có Role phù hợp            | `403 Forbidden`             |
| Teacher không sở hữu Class/Assignment | `403 Forbidden`             |
| Role không được hỗ trợ                | `403 Forbidden`             |
| Class không tồn tại                   | `404 Not Found`             |
| Assignment không tồn tại              | `404 Not Found`             |
| Tạo Assignment thành công             | `201 Created`               |
| Lấy/Update Assignment thành công      | `200 OK`                    |
| Delete Assignment thành công          | `204 No Content`            |
| Lỗi Server/Database không mong muốn   | `500 Internal Server Error` |

---

# Database Logic Requirements

## Class Existence Check

Cần có logic:

```
checkClassExists(classId)
```

Dùng để phân biệt:

```
Class không tồn tại
→ 404

Class tồn tại nhưng Teacher không sở hữu
→ 403
```

---

## Assignment Existence Check

Cần có logic:

```
getAssignmentById(id)
```

Dùng để phân biệt:

```
Assignment không tồn tại
→ 404
Assignment tồn tại nhưng Teacher không có quyền
→ 403
```

---

## Update Assignment

Sau khi chạy query:
```sql
UPDATE assignments
...
RETURNING *;
```

Phải kiểm tra:
```
result.rowCount === 0
```
Nếu không có record:
```
→ 404 Assignment not found
```

---

## Delete Assignment

Sau khi chạy query:

```sql
DELETE FROM assignments
WHERE id = $1
RETURNING id;
```
Phải kiểm tra:
```
result.rowCount === 0
```
Nếu không có record:
```
→ 404 Assignment not found

```
---

# Validation Utility

Tạo utility dùng chung:

```
backend/src/utils/validation.util.js
```

Bao gồm tối thiểu:

```
isValidUUID(value)
isValidFutureDate(value)
validateTitle(value)
```
Có thể mở rộng cho các API khác trong tương lai.

---

# Files Dự Kiến

### Tạo mới

```
backend/src/services/assignment.service.js
backend/src/controllers/assignment.controller.js
backend/src/routes/assignments.routes.js
backend/src/utils/validation.util.js
```

### Chỉnh sửa
```
backend/src/server.js
```

---

# Tiêu Chí Hoàn Thành

```
[ ] CRUD Assignment API hoàn thành.
[ ] JWT Authentication hoạt động.
[ ] TEACHER/ADMIN được phép Create Assignment.
[ ] STUDENT không thể Create/Update/Delete Assignment.
[ ] TEACHER chỉ có thể thao tác Assignment thuộc Class mình phụ trách.
[ ] ADMIN có thể thao tác Assignment của mọi Class.
[ ] Role-based data filtering hoạt động.
[ ] ADMIN xem được tất cả Assignment.
[ ] TEACHER chỉ xem Assignment của Class mình phụ trách.
[ ] STUDENT chỉ xem Assignment của Class được xác định qua Group Membership.
[ ] Validate UUID.
[ ] Validate title: required, string, trim, max 255 characters.
[ ] Validate description nếu được gửi.
[ ] Validate requirements nếu được gửi.
[ ] Validate deadline theo ISO 8601 và phải lớn hơn thời điểm hiện tại.
[ ] Class không tồn tại trả về 404.
[ ] Assignment không tồn tại trả về 404.
[ ] Teacher không có quyền trả về 403.
[ ] Update/Delete xử lý trường hợp result.rowCount === 0.
[ ] HTTP Status Code phù hợp.
[ ] Kiểm tra cấu trúc req.user từ verifyToken middleware trước khi tích hợp.
[ ] Manual Testing bằng Postman hoặc REST Client.
```

---
## Phần không cần đưa vào Task hiện tại

```
Để tránh **over-engineering MVP**, chưa cần thêm:
- Pagination
- Search
- Advanced Filter
- Swagger/OpenAPI
- Automated Testing
- Global Error Handler
- Zod/Joi
- Soft Delete
```