# Cấu trúc Frontend (Screens & Components) dự kiến

Tài liệu này liệt kê danh sách các màn hình (Screens/Pages) và các Component chính cần xây dựng cho ứng dụng Frontend (React/Next.js/Vite) của dự án **PeerReview-AI**, dựa trên các API và Database đã thiết kế.

---

## 1. 🔑 Auth & Public
Các màn hình dành cho việc xác thực và người dùng chưa đăng nhập.

- `src/pages/auth/Login.tsx` – Màn hình Đăng nhập (Email/Password).
- `src/pages/auth/Register.tsx` – Màn hình Đăng ký tài khoản mới.
- `src/pages/auth/ForgotPassword.tsx` – Quên mật khẩu.
- `src/pages/LandingPage.tsx` – Trang giới thiệu hệ thống.

---

## 2. 👨‍🎓 Student Portal (Dành cho Sinh Viên)
Khu vực dành riêng cho Sinh viên thực hiện các hoạt động học tập, làm nhóm và chấm chéo.

### 2.1 Dashboard & Lớp học
- `src/pages/student/Dashboard.tsx` – Tổng quan các lớp đang học, thông báo, và **Todo List** (bài tập sắp đến hạn, bài cần review).
- `src/pages/student/ClassDetail.tsx` – Chi tiết 1 lớp học (danh sách bài tập, danh sách thành viên).

### 2.2 Không gian làm việc nhóm (Group Workspace) - Tương ứng Phase 4, 5
- `src/pages/student/workspace/GroupDashboard.tsx` – Màn hình tổng quan của nhóm (Leader assignment, thành viên).
- `src/pages/student/workspace/AssignmentSubmission.tsx` – Nơi nộp bài, xem lịch sử các version bài nộp.
- `src/pages/student/workspace/DiscussionBoard.tsx` – Khung chat/thảo luận nội bộ nhóm.

### 2.3 Peer Review (Chấm chéo) - Tương ứng Phase 7, 8
- `src/pages/student/review/MyReviewTasks.tsx` – Danh sách các bài (Anonymous) mà nhóm được phân công chấm (API `GET /my-reviews`).
- `src/pages/student/review/ReviewGradingScreen.tsx` – **Màn hình quan trọng nhất (Task 08.1 & 08.2)**: 
  - Hiển thị bài nộp ẩn danh (PDF Viewer hoặc Link Download proxy).
  - Khung chấm điểm chi tiết theo Rubric.
  - Khung nhập nhận xét (Comment).
  - Tích hợp AI Mentor Suggestion (chấm nháp / nhận xét tự động).
- `src/pages/student/review/ReviewFeedback.tsx` – Xem lại các điểm và nhận xét (ẩn danh) mà nhóm mình nhận được từ các nhóm khác.

---

## 3. 👩‍🏫 Teacher Portal (Dành cho Giảng Viên)
Khu vực quản lý và điều hành lớp học.

### 3.1 Quản lý Lớp & Sinh viên
- `src/pages/teacher/Dashboard.tsx` – Tổng quan các lớp đang dạy.
- `src/pages/teacher/ClassManager.tsx` – Tạo lớp mới, duyệt sinh viên vào lớp, import danh sách sinh viên.
- `src/pages/teacher/GroupManager.tsx` – Quản lý việc chia nhóm (random, thủ công, hoặc cho phép sinh viên tự chọn).

### 3.2 Quản lý Bài tập & Rubric
- `src/pages/teacher/assignment/AssignmentList.tsx` – Danh sách các bài tập.
- `src/pages/teacher/assignment/CreateAssignment.tsx` – Form tạo bài tập mới.
- `src/pages/teacher/assignment/RubricBuilder.tsx` – Giao diện kéo thả/thêm bớt các tiêu chí chấm điểm (Criteria) và trọng số.

### 3.3 Điều phối Peer Review (Review Engine) - Tương ứng Phase 6
- `src/pages/teacher/review/ReviewEngineDashboard.tsx` – Nơi Giảng viên ấn nút **"Generate Review Assignments"** để chạy thuật toán chia bài ẩn danh. 
- `src/pages/teacher/review/ReviewProgress.tsx` – Màn hình theo dõi tiến độ chấm chéo (nhóm nào đã chấm, nhóm nào chưa).

### 3.4 Báo cáo & AI Analytics - Tương ứng Phase 11 & 12
- `src/pages/teacher/analytics/SubmissionAnalytics.tsx` – Bảng điểm tổng hợp cuối cùng của sinh viên.
- `src/pages/teacher/analytics/CollaborationRisks.tsx` – Màn hình Early Warning (Cảnh báo sớm) hiển thị các rủi ro làm việc nhóm (Dead Group, Low Activity, Free-rider, Unbalanced Contribution) phân tích on-the-fly từ Rule Engine.
- `src/pages/teacher/analytics/ContributionDashboard.tsx` – Bảng dashboard chi tiết điểm đóng góp (Contribution Score) và tỷ lệ hoàn thành task của từng cá nhân trong các nhóm.

### 3.5 Teacher Validation (Duyệt kết quả) - Tương ứng Phase 11
- `src/pages/teacher/validation/ReviewValidationScreen.tsx` – Màn hình dành cho Giảng viên duyệt các bài chấm chéo. Tích hợp tính năng AI Synthesis (tổng hợp nhận xét tự động) và cho phép giáo viên ghi đè (override) điểm cuối cùng.

---

## 4. 👑 Admin Portal (Dành cho Quản Trị Viên)
Khu vực quản lý hệ thống tổng thể (MVP mức cơ bản).

- `src/pages/admin/Dashboard.tsx` – Tổng quan hệ thống (số lượng User, Lớp học, Bài tập).
- `src/pages/admin/UserManager.tsx` – Quản lý người dùng, cấp quyền, reset mật khẩu.
- `src/pages/admin/ClassManager.tsx` – Quản lý toàn bộ danh sách lớp học và giáo viên phụ trách trên toàn hệ thống.

---

## 5. 🧩 Core Components (Dùng chung)
Các thành phần UI dùng lại nhiều lần ở nhiều màn hình.

- `src/components/layout/Sidebar.tsx` – Thanh điều hướng dọc (Tự động thay đổi menu dựa trên Role Teacher/Student).
- `src/components/layout/Header.tsx` – Thanh tiêu đề trên cùng (User Profile, Notifications).
- `src/components/shared/RubricViewer.tsx` – Component hiển thị Rubric (dùng chung cho lúc Teacher tạo bài, Student xem yêu cầu, và Student chấm điểm).
- `src/components/shared/FileUploader.tsx` – Component xử lý Upload file lên Server/S3.
- `src/components/shared/PDFViewer.tsx` – Xem trực tiếp file bài nộp trên trình duyệt mà không cần tải về.

---
*Ghi chú: Cấu trúc này bám sát thiết kế API "Fail-fast" và kiến trúc Domain-Driven mà chúng ta đang xây dựng ở Backend.*
