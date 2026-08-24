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
- **UI**: Email input, Password input, Login button
- **State**: Loading, Error

### 2. 📊 Student Dashboard
- **Mục tiêu**: Trung tâm điều hướng chính
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
- **UI**: Title, Description, Requirements, Deadline, Attachments, Rubric
- **Action**: Continue → Participation

### 4. 🧭 Assignment Participation Screen ⭐ (NEW)
- **Mục tiêu**: Resolve trạng thái group
- **Case A: Chưa có group**
  - Create Group / Join Group
- **Case B: Đã có group**
  - Show group info → Go to Workspace

### 5. 👥 Workspace Screen
- **Mục tiêu**: Làm việc nhóm
- **Tabs**: 
  - **Tasks**: Create / assign / update (Leader assign task)
  - **Discussion**: Chat
  - **Files**: Upload / download
- **State**: Empty ("Create first task"), Loading, Permission.

### 6. 📤 Submission Screen (REFACTORED)
- **Mục tiêu**: Nộp bài (tách khỏi workspace)
- **UI**: Upload file, Submit button, Version history
- **State**: Draft, Submitted, Late

### 7. 📝 My Reviews Screen
- **UI**: List bài cần chấm

### 8. ✍️ Review Grading Screen
- **Layout**: 
  - LEFT: File viewer
  - RIGHT: Rubric, Comment
- **Validation**: Highlight missing criteria. Error: "Please score all criteria"
- **AI States**: Analyzing, Success, Error → Retry

### 9. 🧾 Review Detail Screen ⭐ (NEW)
- **Mục tiêu**: Xem review đã gửi
- **UI**: Score breakdown, Comment

### 10. 📊 Submission Feedback Screen ⭐ (CORE)
- **Mục tiêu**: Xem kết quả cuối (khi assignment ở trạng thái REVIEWED)
- **UI**: Final score, Rubric breakdown, Comments, Strengths / Weaknesses

---

## III. 🧑‍🏫 TEACHER SCREENS

### 11. 📚 Teacher Dashboard
- **UI**: Class list
- **API**: `GET /api/classes` (Cần define trong backend)

### 12. ⚙️ Assignment Management
- **UI**: List assignment, Create / Edit / Delete

### 13. 🧠 Review Engine
- **UI**: Generate review assignments, Progress tracking

### 14. 📈 Analytics Screen
- **UI**: Contribution chart, Risk detection

### 15. 🧪 Review Validation (AI)
- **UI**: Summary, Conflicts (Approve/Reject review summaries)

---

## IV. ⚙️ SUPPORT SCREENS

### 16. 🧾 Rubric Builder
- **UI**: Add criteria, Weight, Description

### 17. 👥 Group Management
- **UI**: Member list, Assign leader

### 18. 📜 Submission History
- **UI**: Version timeline

### 19. 🛠 Admin Dashboard (Optional)
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
