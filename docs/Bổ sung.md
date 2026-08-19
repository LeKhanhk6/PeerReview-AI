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


## TASK 04.2 — Rubric & Criteria Management API

### Mục tiêu

Xây dựng Backend API cho phép quản lý **Rubric** và các **Rubric Criteria** của một **Assignment**.

Mỗi Assignment có tối đa một Rubric và một Rubric có thể chứa nhiều Criteria.

Teacher có thể thiết lập cấu trúc chấm điểm cho Assignment thông qua Rubric và các tiêu chí chi tiết.

### Chức năng

* [ ] Lấy thông tin Rubric và toàn bộ Criteria của một Assignment.
* [ ] Tạo Rubric cho Assignment.
* [ ] Cập nhật Rubric và toàn bộ Criteria.
* [ ] Thêm Criteria.
* [ ] Chỉnh sửa Criteria.
* [ ] Xóa Criteria.
* [ ] Define weight/score.
* [ ] Define description.
* [ ] Validate tổng `weight` của tất cả Criteria phải bằng `100`.

### Authorization

#### ADMIN

* Có quyền xem và quản lý Rubric của mọi Assignment hợp lệ.

#### TEACHER

Teacher chỉ được phép tạo hoặc cập nhật Rubric của Assignment thuộc Class mà Teacher phụ trách.

Kiểm tra quyền sở hữu thông qua:

```text
Assignment
    ↓
Class
    ↓
classes.teacher_id = currentUser.id
```

#### STUDENT

* Có thể xem Rubric khi được cấp quyền truy cập Assignment theo logic Authorization của Assignment.
* Không được tạo hoặc cập nhật Rubric.

### API Endpoints

```http
GET /api/rubrics/assignment/:assignmentId
PUT /api/rubrics/assignment/:assignmentId
```

#### GET `/api/rubrics/assignment/:assignmentId`

Lấy thông tin Rubric và toàn bộ Criteria của Assignment.

Flow:

```text
Validate assignmentId UUID
        ↓
Kiểm tra Assignment tồn tại
        ↓
Không tồn tại → 404
        ↓
Kiểm tra quyền truy cập Assignment
        ↓
Có quyền
        ↓
Lấy Rubric + Criteria
```

#### PUT `/api/rubrics/assignment/:assignmentId`

Tạo mới hoặc cập nhật toàn bộ Rubric và Criteria.

Flow:

```text
Validate assignmentId UUID
        ↓
Kiểm tra Assignment tồn tại
        ↓
Không tồn tại → 404
        ↓
Kiểm tra Role
        ↓
ADMIN
→ Có quyền

TEACHER
→ Kiểm tra Assignment thuộc Class mà Teacher phụ trách

STUDENT
→ 403 Forbidden
        ↓
Validate Rubric data
        ↓
Validate Criteria
        ↓
Validate tổng weight = 100
        ↓
BEGIN TRANSACTION
        ↓
Rubric chưa tồn tại
→ Create Rubric

Rubric đã tồn tại
→ Update Rubric
        ↓
DELETE Criteria cũ
        ↓
INSERT Criteria mới
        ↓
COMMIT
```

Nếu có lỗi trong quá trình lưu:

```text
ROLLBACK
```

### Input Validation

#### `assignmentId`

* Required trong URL parameter.
* Phải là UUID hợp lệ.
* UUID không hợp lệ → `400 Bad Request`.
* Assignment không tồn tại → `404 Not Found`.

#### `description`

* Optional.
* Nếu được gửi phải là String.

#### `criteria`

* Required.
* Phải là Array.
* Không được rỗng.
* Mỗi Criteria phải có `name`.
* `name` phải là String.
* `name` không được chỉ chứa khoảng trắng.
* `name` được trim trước khi lưu.
* Maximum `255 characters`.

#### `weight`

* Required.
* Phải là Number hợp lệ.
* Phải lớn hơn `0`.
* Tổng weight của tất cả Criteria phải bằng `100`.

Ví dụ:

```text
Content Quality    30%
Research           30%
Presentation       20%
Creativity         20%

Total = 100%
```

Do Database sử dụng:

```sql
weight DECIMAL(5,2)
```

Khi kiểm tra tổng weight cần xử lý trường hợp số thập phân.

Ví dụ:

```text
Math.abs(totalWeight - 100) < 0.01
```

### HTTP Status Handling

| Tình huống                        | HTTP Status                 |
| --------------------------------- | --------------------------- |
| Request data không hợp lệ         | `400 Bad Request`           |
| Chưa đăng nhập / JWT không hợp lệ | `401 Unauthorized`          |
| User không có quyền phù hợp       | `403 Forbidden`             |
| Teacher không sở hữu Assignment   | `403 Forbidden`             |
| Assignment không tồn tại          | `404 Not Found`             |
| Rubric không tồn tại              | `404 Not Found`             |
| Lấy Rubric thành công             | `200 OK`                    |
| Tạo/Cập nhật Rubric thành công    | `200 OK`                    |
| Lỗi Server/Database               | `500 Internal Server Error` |

### Database Logic

Database sử dụng các bảng hiện có:

```text
assignments
    │
    │ 1 — 1
    ▼
rubrics
    │
    │ 1 — N
    ▼
rubric_criteria
```

Không thay đổi Database Schema.

Việc lưu Rubric và Criteria phải sử dụng PostgreSQL Transaction để đảm bảo tính toàn vẹn dữ liệu.

### Files dự kiến

#### Tạo mới

```text
backend/src/routes/rubrics.routes.js

backend/src/controllers/rubric.controller.js

backend/src/services/rubric.service.js
```

#### Sử dụng lại

```text
backend/src/utils/validation.util.js
```

Sử dụng các validation utility chung như:

```text
isValidUUID()
```

#### Chỉnh sửa

```text
backend/src/server.js
```

### Git Branch

```text
develop
    ↓
feature/rubric-api
    ↓
implement
    ↓
test
    ↓
commit
    ↓
Pull Request
    ↓
develop
```

### Tiêu chí hoàn thành

* [ ] GET Rubric theo Assignment hoạt động.
* [ ] Tạo Rubric hoạt động.
* [ ] Cập nhật Rubric hoạt động.
* [ ] Quản lý Rubric Criteria hoạt động.
* [ ] Mỗi Assignment chỉ có tối đa một Rubric.
* [ ] Validate `assignmentId` là UUID hợp lệ.
* [ ] Kiểm tra Assignment tồn tại.
* [ ] Validate Criteria là Array.
* [ ] Criteria không được rỗng.
* [ ] Validate Criteria `name`.
* [ ] Validate `weight`.
* [ ] Tổng `weight` của Criteria bằng `100`.
* [ ] TEACHER chỉ có thể quản lý Rubric của Assignment thuộc Class mình phụ trách.
* [ ] ADMIN có thể quản lý Rubric của mọi Assignment hợp lệ.
* [ ] STUDENT không thể tạo hoặc cập nhật Rubric.
* [ ] Sử dụng PostgreSQL Transaction khi cập nhật Rubric và Criteria.
* [ ] Rollback khi xảy ra lỗi.
* [ ] HTTP Status Code phù hợp.
* [ ] Manual Testing bằng Postman hoặc REST Client.
