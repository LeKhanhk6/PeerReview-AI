# 📘 PEERREVIEW-AI — SCREEN DESIGN DOCUMENT (FINAL)

## I. 🎯 TỔNG QUAN HỆ THỐNG

Hệ thống gồm 3 role:
- **STUDENT** (core flow)
- **TEACHER**
- **ADMIN** (optional)

**🧭 Development Flow (theo roadmap)**
- PHASE 3 → Assignment
- PHASE 4 → Workspace
- PHASE 5 → Submission
- PHASE 6 → Review Assignment
- PHASE 7 → Peer Review
- PHASE 8 → AI Mentor
- PHASE 10 → Review Synthesis
- PHASE 11 → Analytics

---

## II. 🎓 STUDENT SCREENS (FINAL)

### 1. 🔐 Login Screen
- **Mục tiêu**: Xác thực user
- **Chức năng (Use Cases)**: Nhập email và password để đăng nhập hệ thống, xử lý lỗi đăng nhập.
- **UI**: Email input, Password input, Login button
- **State**: Loading, Error

### 2. 📊 Student Dashboard
- **Mục tiêu**: Trung tâm điều hướng chính
- **Chức năng (Use Cases)**: Xem danh sách bài tập (Assignment), xem trạng thái nộp bài và chấm chéo, truy cập nhanh vào thao tác phù hợp với trạng thái (Start, Continue, Waiting...).
- **UI**: Assignment list (Title, Deadline, Status)
- **🎯 Assignment Lifecycle (GLOBAL RULE)**
  - `NOT_STARTED` → `IN_PROGRESS` → `SUBMITTED` → `UNDER_REVIEW` → `REVIEWED`
- **UI Mapping**:
  - `NOT_STARTED` → Action: **Start**
  - `IN_PROGRESS` → Action: **Continue**
  - `SUBMITTED` → Action: **View Submission**
  - `UNDER_REVIEW` → Action: **Waiting**
  - `REVIEWED` → Action: **View Feedback**

### 3. 📄 Assignment Detail
- **Chức năng (Use Cases)**: Xem chi tiết yêu cầu bài tập, tải file đính kèm, xem tiêu chí chấm điểm (rubric).
- **UI**: Title, Description, Requirements, Deadline, Attachments, Rubric
- **Action**: Continue → Participation

### 4. 🧭 Assignment Participation Screen ⭐ (NEW)
- **Mục tiêu**: Resolve trạng thái group
- **Chức năng (Use Cases)**: Tự tạo nhóm mới, tham gia nhóm qua mã nhóm, hoặc chuyển thẳng vào Workspace nếu đã có nhóm.
- **Case A: Chưa có group**
  - Create Group / Join Group
- **Case B: Đã có group**
  - Show group info → Go to Workspace

### 5. 👥 Workspace Screen
- **Mục tiêu**: Làm việc nhóm
- **Chức năng (Use Cases)**: Quản lý công việc nhóm (Kanban/List), trao đổi tin nhắn (Chat), quản lý tài liệu chung của nhóm.
- **Tabs**: 
  - **Tasks**: Create / assign / update (Leader assign task)
  - **Discussion**: Chat
  - **Files**: Upload / download
- **State**: Empty ("Create first task"), Loading, Permission.

### 6. 📤 Submission Screen (REFACTORED)
- **Mục tiêu**: Nộp bài (tách khỏi workspace)
- **Chức năng (Use Cases)**: Chọn và tải file bài làm lên hệ thống, xem lịch sử các phiên bản đã nộp, cảnh báo nếu nộp trễ hạn.
- **UI**: Upload file, Submit button, Version history
- **State**: Draft, Submitted, Late

### 7. 📝 My Reviews Screen
- **Chức năng (Use Cases)**: Xem danh sách các bài nộp của nhóm khác mà mình được hệ thống phân công chấm chéo.
- **UI**: List bài cần chấm

### 8. ✍️ Review Grading Screen
- **Chức năng (Use Cases)**: Xem bài nộp (Split-screen), nhập điểm theo Rubric, ghi chú nhận xét, gọi AI Mentor để kiểm tra/phân tích nhận xét trước khi nộp.
- **Layout**: 
  - LEFT: File viewer
  - RIGHT: Rubric, Comment
- **Validation**: Highlight missing criteria. Error: "Please score all criteria"
- **AI States**: Analyzing, Success, Error → Retry

### 9. 🧾 Review Detail Screen ⭐ (NEW)
- **Mục tiêu**: Xem review đã gửi
- **Chức năng (Use Cases)**: Xem lại chi tiết phiếu chấm điểm (Review) mà nhóm mình đã gửi đi.
- **UI**: Score breakdown, Comment

### 10. 📊 Submission Feedback Screen ⭐ (CORE)
- **Mục tiêu**: Xem kết quả cuối (khi assignment ở trạng thái REVIEWED)
- **Chức năng (Use Cases)**: Xem điểm tổng kết cuối cùng, phân tích điểm Rubric, xem tổng hợp nhận xét từ các nhóm, và phân tích sâu của AI (Điểm mạnh / Điểm yếu).
- **UI**: Final score, Rubric breakdown, Comments, Strengths / Weaknesses

---

## III. 🧑‍🏫 TEACHER SCREENS

### 11. 📚 Teacher Dashboard
- **Chức năng (Use Cases)**: Xem danh sách các lớp học đang phụ trách, tổng quan về trạng thái bài tập của từng lớp.
- **UI**: Class list
- **API**: `GET /api/classes` (Cần define trong backend)

### 12. ⚙️ Assignment Management
- **Chức năng (Use Cases)**: Tạo mới, chỉnh sửa, hoặc xóa bài tập. Xem danh sách toàn bộ bài tập.
- **UI**: List assignment, Create / Edit / Delete

### 13. 🧠 Review Engine
- **Chức năng (Use Cases)**: Theo dõi tiến độ chấm chéo của lớp, kích hoạt tính năng tự động phân công bài chấm chéo.
- **UI**: Generate review assignments, Progress tracking

### 14. 📈 Analytics Screen
- **Chức năng (Use Cases)**: Xem điểm đóng góp của sinh viên, theo dõi và phát hiện các nhóm có rủi ro mâu thuẫn/hoạt động kém.
- **UI**: Contribution chart, Risk detection

### 15. 🧪 Review Validation (AI)
- **Chức năng (Use Cases)**: Xem tổng hợp nhận xét của AI từ các nhóm chấm, phát hiện mâu thuẫn điểm, và duyệt (hoặc từ chối) bản tóm tắt trước khi trả cho sinh viên.
- **UI**: Summary, Conflicts (Approve/Reject review summaries)

---

## IV. ⚙️ SUPPORT SCREENS

### 16. 🧾 Rubric Builder
- **Chức năng (Use Cases)**: Xây dựng các tiêu chí chấm điểm, gán trọng số và mô tả chi tiết cho từng mức điểm.
- **UI**: Add criteria, Weight, Description

### 17. 👥 Group Management
- **Chức năng (Use Cases)**: Quản lý thành viên nhóm, phân công nhóm trưởng, theo dõi hoạt động thành viên.
- **UI**: Member list, Assign leader

### 18. 📜 Submission History
- **Chức năng (Use Cases)**: Xem lịch sử các lần nộp bài, so sánh các phiên bản.
- **UI**: Version timeline

### 19. 🛠 Admin Dashboard (Optional)
- **Chức năng (Use Cases)**: Quản trị hệ thống, cấp quyền, quản lý user, cấu hình chung.
- **UI**: Manage user/class

---

## V. 🔌 API MAPPING (ĐÃ ĐƯỢC CHUẨN HÓA VỚI BACKEND)

### Student
- `GET /api/submissions/me/dashboard` (Lấy dashboard tổng quan)
- `GET /api/assignments/:id/detail` (Chi tiết assignment)
- `GET /api/submissions/assignments/:assignmentId/submission-history` (Lịch sử submission / bản nộp hiện tại)
- `POST /api/submissions/assignments/:assignmentId` (Nộp bài)
- `GET /api/reviews/assignments/:assignmentId/my-reviews` (Danh sách bài cần chấm)
- `GET /api/reviews/my-reviews/:reviewAssignmentId` (Lấy detail để chấm)
- `POST /api/reviews/my-reviews/:reviewAssignmentId/submit` (Submit điểm/comment)
- `GET /api/submissions/assignments/:assignmentId/feedback` (Student xem kết quả tổng hợp AI + điểm cuối cùng)

### Teacher
- `GET /api/classes` *(To be implemented)*
- `GET /api/assignments` (Lấy danh sách)
- `POST /api/assignments` (Tạo mới)
- `POST /api/assignments/:assignmentId/review-assignments/generate` (Generate assignment review random)
- `GET /api/analytics/classes/:classId/reviews` (Lấy analytics)
- `GET /api/analytics/classes/:classId/collaboration-risks` (Lấy rủi ro nhóm)

---

## VI. 🧭 NAVIGATION FLOW (FINAL)

**🎯 Main Flow**
```text
Login
 → Dashboard
   → Assignment Detail
     → Participation
       → Workspace
         → Submission
           → Review Phase
             → Feedback
```

**🎯 Review Flow**
```text
My Reviews
 → Review Grading
   → Submit
     → Review Detail
```

---

## VII. 🌐 GLOBAL UI RULES

**Bắt buộc cho mọi screen:**
- Loading state
- Empty state + CTA (Call to Action)
- Error state
- Pagination
