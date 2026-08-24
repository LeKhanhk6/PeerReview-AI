# UI/UX Design Specifications (Frontend Screens)

Tài liệu này định nghĩa chi tiết những gì cần thiết kế trên giao diện, các luồng người dùng (User Flows), và sự tương quan trực tiếp giữa Màn hình (Screen) - Use Cases - APIs - UI States để đảm bảo Frontend kết nối liền mạch với Backend.

---

## 1. Global UX & Design Guidelines (UI States & Constraints)
- **Empty States**: Thiết kế màn hình rỗng có hình minh họa/Icon + Text.
- **Loading States**: Sử dụng Skeleton Loader hoặc Spinner/Partial Loading.
- **Error States**: Toast Notification (lỗi nhẹ), Full-page Error Message + nút "Thử lại".
- **Pagination**: Mọi list lớn đều trả về kèm `page`, `limit`, `hasNext`.
- **API Loading & Mutation Rules**:
  - GET → cache data.
  - POST/PUT/DELETE → invalidate cache tương ứng.
  - Disable button & show spinner khi đang submit dữ liệu.

---

## 2. Chi tiết các màn hình (Screen Breakdown - Student)

### 2.1 Screen: Login
#### Use Cases
- Nhập email và password để đăng nhập vào hệ thống.
#### APIs
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ message, user, accessToken }`
#### UI States
- Normal
- Loading (Khi đang gọi API)
- Error (Sai thông tin, Toast hoặc Text màu đỏ)

### 2.2 Screen: Student Dashboard
#### Use Cases
- Xem danh sách assignment
- Xem trạng thái submission
- Xem review status
#### APIs
- `GET /api/submissions/me/dashboard`
  - Query: `page, limit, sort`
  - Response: 
    ```json
    {
      "data": [
        {
          "assignment_id": "uuid",
          "title": "string",
          "deadline": "date",
          "submission_status": "enum",
          "review_status": "enum"
        }
      ],
      "page": 1,
      "limit": 10,
      "hasNext": true
    }
    ```
#### UI States
- Loading (Skeleton list)
- Empty (Không có assignment nào)
- Error (API fail)

### 2.3 Screen: Assignment Detail
#### Use Cases
- Đọc đề bài, tải file đính kèm, xem tiêu chí (rubric) chấm điểm.
- Nút truy cập vào Workspace.
#### APIs
- `GET /api/assignments/:id/detail`
  - Response: Thông tin chi tiết assignment kèm danh sách file.
- `GET /api/rubrics/assignment/:id`
  - Response: Cấu trúc điểm của bài tập.
#### UI States
- Loading (Skeleton nội dung)
- Error (Không tìm thấy bài tập hoặc mất kết nối)

### 2.4 Screen: Group Workspace
#### Use Cases
- Quản lý công việc chung (Tasks - Kanban/List).
- Nhắn tin, thảo luận (Chat).
- Quản lý tệp tin (Files).
#### APIs
- `GET /api/groups/:id`
- `GET /api/groups/:id/tasks`
- `GET /api/groups/:id/discussions`
- `GET /api/groups/:id/files`
- (Có các API `POST/PATCH/DELETE` tương ứng cho từng tính năng)
#### UI States
- Loading (Khi vừa chuyển tab)
- Empty (Chưa có Task, Chưa có Chat, Chưa upload File)
- Error (Không tải được nội dung)

### 2.5 Screen: Assignment Submission (Tab trong Workspace)
#### Use Cases
- Upload file nộp bài.
- Xem lịch sử các version đã nộp.
#### APIs
- `POST /api/submissions/assignments/:assignmentId`
  - Gửi file multipart/form-data.
- `GET /api/submissions/assignments/:assignmentId/submission-history`
  - Lấy các phiên bản đã nộp.
#### UI States
- Uploading (Progress bar % tải lên, disable nút Submit).
- Uploaded (Thành công).
- Late Warning (Badge đỏ cảnh báo nộp trễ).
- Error (File quá lớn, sai định dạng, v.v.).

### 2.6 Screen: My Reviews (Danh sách bài cần chấm)
#### Use Cases
- Xem danh sách các bài của nhóm khác được phân công chấm chéo.
#### APIs
- `GET /api/reviews/assignments/:assignmentId/my-reviews`
#### UI States
- Loading
- Empty (Chưa đến hạn phân công hoặc giáo viên chưa phân).
- Error

### 2.7 Screen: Review Grading (Màn hình chấm chéo)
#### Use Cases
- Xem bài nộp của nhóm khác (Split-screen).
- Nhập điểm theo Rubric, ghi chú nhận xét.
- Sử dụng AI Mentor để phân tích văn bản nhận xét.
#### APIs
- `GET /api/reviews/my-reviews/:reviewAssignmentId`
- `POST /api/reviews/analyze` (Gửi text nhận xét để AI đánh giá)
- `POST /api/reviews/my-reviews/:reviewAssignmentId/submit` (Nộp phiếu chấm)
#### UI States
- Loading PDF / Skeleton Form
- Analyzing (Khi AI Mentor đang phân tích)
- Error (Không lưu được điểm)
- Disabled Submit (Nếu chưa điền đủ điểm)

---

## 3. Chi tiết các màn hình (Screen Breakdown - Teacher)

### 3.1 Screen: Teacher Dashboard
#### Use Cases
- Xem danh sách các lớp học đang phụ trách.
#### APIs
- ⚠️ **Missing API**: Cần API `GET /api/classes` hoặc lấy danh sách lớp học của Teacher.
#### UI States
- Loading, Empty, Error.

### 3.2 Screen: Teacher Review Engine
#### Use Cases
- Theo dõi tiến độ chấm chéo của cả lớp.
- Trigger hệ thống tự động phân công bài (Generate Assignments).
#### APIs
- `POST /api/review-assignments/assignments/:assignmentId/review-assignments/generate`
#### UI States
- Not Started (Trống, sẵn sàng bấm nút phân công).
- Generating (Loading spinner disable màn hình).
- Generated (Bảng tiến độ hiển thị).
- Locked (Chốt, không cho thay đổi).

### 3.3 Screen: Teacher Class Analytics
#### Use Cases
- Xem rủi ro làm việc nhóm (Collaboration Risks).
- Xem điểm đóng góp (Contributions) của từng sinh viên.
#### APIs
- `GET /api/analytics/classes/:classId/collaboration-risks`
- `GET /api/analytics/classes/:classId/contributions`
#### UI States
- Loading
- Empty (Tuyệt vời, không có rủi ro nào)
- Error

### 3.4 Screen: Teacher Review Validation
#### Use Cases
- Xem AI tổng hợp ý kiến từ nhiều nhóm chấm (Synthesis).
- Xem mâu thuẫn điểm (nếu có).
- Chốt điểm số cuối cùng.
#### APIs
- `GET /api/reviews/assignments/:assignmentId/reviews/synthesis`
- `PATCH /api/summary/:summaryId/finalize`
#### UI States
- Loading (AI đang tổng hợp hoặc Server đang xử lý).
- Synthesis Ready (Hiển thị thẻ màu sắc theo Sentiment).
- Error (AI lỗi, cho phép chấm thủ công).

---

## 4. Technical Requirements for Frontend-Backend Integration

### 4.1 Authentication (JWT)
- **Sau khi login:**
  - Backend trả về: `accessToken` (và `user` data).
- **Frontend xử lý:**
  - Lưu token vào: `localStorage` (MVP OK).
  - Đính kèm Header cho mọi request bảo mật:
    `Authorization: Bearer <token>`
- **Xử lý hết hạn/lỗi (401):**
  - Bắt buộc clear token và redirect người dùng về màn hình Login.

### 4.2 API Structure
- **Base URL:**
  `http://localhost:5000/api` (hoặc tuỳ môi trường `VITE_API_URL`).
- **Response format chuẩn (Success):**
  ```json
  {
    "data": ...,
    "message": "Optional success message"
  }
  ```
- **Error format chuẩn (Fail):**
  ```json
  {
    "error": {
      "message": "Detailed error string",
      "code": "ERROR_CODE"
    }
  }
  ```

### 4.3 State Management (Quy tắc lưu trữ trạng thái)
Frontend cần phân chia rõ ràng Server State và Local UI State:
- **Server State (Dữ liệu từ API):**
  - Yêu cầu sử dụng **React Query** (hoặc SWR) làm thư viện quản lý.
  - Tính năng: Tự động retry, cache dữ liệu, background fetching.
  - Các module cần Caching cực mạnh: Dashboard (giữ mượt), Assignments Detail, Workspace (để chuyển tab không chớp giật).
- **Local UI State (Trạng thái UI tạm thời):**
  - Dùng `useState`, `useReducer` hoặc **Zustand**.
  - Áp dụng cho: Mở/đóng Modal, Toggle Tabs, Form inputs (chưa submit).

### 4.4 API Groups Mapping
Danh sách tổng hợp các route tương ứng để FE chuẩn bị tích hợp:

- **Auth:**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- **Assignments:**
  - `GET /api/assignments`
  - `GET /api/assignments/:id/detail`
- **Groups / Workspace:**
  - `GET /api/groups/:id`
  - `/api/groups/:id/tasks`
  - `/api/groups/:id/files`
  - `/api/groups/:id/discussions`
- **Submissions:**
  - `GET /api/submissions/me/dashboard`
  - `POST /api/submissions/assignments/:id`
- **Reviews & Grading:**
  - `/api/reviews/assignments/:id/my-reviews`
  - `/api/reviews/my-reviews/:id`

### 4.5 Error Handling Strategy & API Loading Rules
- **Error Routing:**
  - **400 Bad Request** → Hiển thị thông báo (Toast/Text) báo lỗi nhập liệu hoặc logic.
  - **401 Unauthorized** → Tự động đăng xuất (Clear token + redirect `/login`).
  - **403 Forbidden** → Hiển thị trang/Toast "No permission" (Không có quyền).
  - **500 Internal Error** → Hiển thị thông báo lỗi hệ thống chung chung (Generic error).
- **Pagination Contract:**
  ```json
  {
    "data": [...],
    "page": 1,
    "limit": 10,
    "hasNext": true
  }
  ```
- **Mutation & Loading Rules (Bắt buộc FE tuân thủ):**
  - Mọi action thay đổi dữ liệu (POST/PUT/DELETE) phải disable button submit.
  - Hiển thị spinner/loading ở vùng thao tác để chặn Double-click.
  - Call API xong (thành công) → Phải Invalidate Cache của Query chứa dữ liệu đó (vd: Thêm task xong phải clear cache danh sách Task).
