# Cấu trúc & Chi tiết Frontend Screens dự kiến

Tài liệu này liệt kê danh sách và **mô tả chi tiết UI/UX** của toàn bộ các màn hình (Screens/Pages) cần xây dựng cho Frontend (React/Next.js/Vite) của dự án **PeerReview-AI**, giúp Designer và Developer dễ dàng nắm bắt cấu trúc để triển khai.

---

## 1. 🔑 Auth & Public
Các màn hình dành cho việc xác thực và người dùng chưa đăng nhập.

### 1.1 `src/pages/auth/Login.tsx` (Đăng nhập)
- **Layout:** Căn giữa màn hình (Centered form) hoặc Split screen (1 nửa form, 1 nửa hình ảnh minh họa).
- **Components chính:**
  - Form: Email, Password.
  - Checkbox "Remember me".
  - Link "Quên mật khẩu?".
  - Nút "Đăng nhập" (Primary).
  - Link "Chưa có tài khoản? Đăng ký".

### 1.2 `src/pages/auth/Register.tsx` (Đăng ký)
- **Layout:** Tương tự Login.
- **Components chính:**
  - Form: Họ tên, Email, Password, Confirm Password, Mã Sinh Viên (Tùy chọn).
  - Nút "Đăng ký" (Primary).

### 1.3 `src/pages/auth/ForgotPassword.tsx` (Quên mật khẩu)
- **Layout:** Centered form.
- **Components chính:** Ô nhập Email, Nút "Gửi link khôi phục".

### 1.4 `src/pages/LandingPage.tsx` (Trang chủ giới thiệu)
- **Layout:** Dạng One-page scrolling.
- **Components chính:** Hero section (giới thiệu PeerReview-AI), Features (tính năng nổi bật), Footer.
- **Action:** Nút "Bắt đầu ngay" dẫn tới trang Login/Register.

---

## 2. 👨‍🎓 Student Portal (Khu vực Sinh Viên)
Khu vực dành riêng cho Sinh viên thực hiện các hoạt động học tập, làm nhóm và chấm chéo.

### 2.1 Dashboard & Lớp học
#### `src/pages/student/Dashboard.tsx` (Tổng quan Sinh viên)
- **Layout:** Sidebar menu + Main content.
- **Components chính:**
  - **Welcome Banner:** Lời chào, tóm tắt tiến độ.
  - **Todo List Widget:** Danh sách các việc cần làm khẩn cấp (Bài tập sắp hạn chót, Review đang pending).
  - **My Classes Grid:** Danh sách các lớp dạng Card (Hiển thị tên môn, giảng viên, số lượng bài tập mới).

#### `src/pages/student/ClassDetail.tsx` (Chi tiết Lớp học)
- **Layout:** Page Header (Tên môn) + Tab Navigation.
- **Tab 1 - Bài tập:** Danh sách Assignments (Timeline).
- **Tab 2 - Mọi người:** Danh sách thành viên lớp.
- **Tab 3 - Nhóm của tôi:** Thông tin nhóm hiện tại.

### 2.2 Không gian làm việc nhóm (Group Workspace)
#### `src/pages/student/workspace/GroupDashboard.tsx` (Tổng quan nhóm)
- **Layout:** Bảng điều khiển nhóm.
- **Components chính:**
  - **Member List:** Danh sách thành viên, chỉ định ai là Leader.
  - **Group Stats:** Số lượng activity logs, mức độ đóng góp tạm tính.

#### `src/pages/student/workspace/AssignmentSubmission.tsx` (Nộp bài)
- **Layout:** Form Upload + Lịch sử.
- **Components chính:**
  - **File Uploader:** Khu vực kéo thả file (PDF, Zip).
  - **Version History:** Danh sách các lần nộp bài (Thời gian, người nộp, file đính kèm). Có nút Download lại.

#### `src/pages/student/workspace/DiscussionBoard.tsx` (Thảo luận)
- **Layout:** Giống một khung Chat room.
- **Components chính:** Message Feed, Ô nhập tin nhắn, Nút đính kèm file.

### 2.3 Peer Review (Chấm chéo)
#### `src/pages/student/review/MyReviewTasks.tsx` (Nhiệm vụ chấm)
- **Layout:** Danh sách Card/Table.
- **Components chính:** Liệt kê các bài của nhóm khác được phân công chấm (ẩn danh). Nút "Bắt đầu chấm" hoặc "Sửa điểm".

#### `src/pages/student/review/ReviewGradingScreen.tsx` (Màn hình Chấm chéo - Quan trọng)
- **Layout:** Split-screen (Trái: Đề/Bài nộp, Phải: Phiếu chấm).
- **Bên Trái (PDF Viewer):** Render file PDF bài nộp của nhóm bạn (hoặc link download).
- **Bên Phải (Rubric Form):**
  - **Tiêu chí (Criteria):** Danh sách các tiêu chí chấm điểm, kéo thả thanh trượt hoặc chọn mức điểm.
  - **Nhận xét (Comment):** Ô Textarea cho từng tiêu chí và cho tổng thể.
  - **AI Mentor:** Nút "Nhờ AI gợi ý nhận xét", hiển thị popover text gợi ý từ AI.
- **Action:** "Lưu nháp", "Nộp bảng điểm".

#### `src/pages/student/review/ReviewFeedback.tsx` (Xem Feedback nhận được)
- **Layout:** View-only Mode.
- **Components chính:** Hiển thị điểm trung bình, đọc các nhận xét ẩn danh từ nhóm khác.

---

## 3. 👩‍🏫 Teacher Portal (Khu vực Giảng Viên)
Khu vực quản lý và điều hành lớp học dành cho Giáo viên.

### 3.1 Quản lý Lớp & Sinh viên
#### `src/pages/teacher/Dashboard.tsx`
- **Layout:** Sidebar + Main Content.
- **Components chính:** Báo cáo số liệu tổng quan (Số lớp, số bài tập chờ review), List các lớp đang dạy.

#### `src/pages/teacher/ClassManager.tsx`
- **Layout:** Table view.
- **Components chính:** Nút "Tạo lớp mới", Bảng danh sách sinh viên, Nút "Import Excel", Xóa/Mời sinh viên.

#### `src/pages/teacher/GroupManager.tsx`
- **Layout:** Grid/List hiển thị các nhóm.
- **Components chính:** Chức năng chia nhóm (Auto-random, Manual drag-drop), khóa nhóm.

### 3.2 Quản lý Bài tập & Rubric
#### `src/pages/teacher/assignment/AssignmentList.tsx`
- **Layout:** Table view. Hiển thị Trạng thái (Mới, Đang nộp bài, Đang Review, Đã chốt điểm).

#### `src/pages/teacher/assignment/CreateAssignment.tsx`
- **Layout:** Wizard form (Nhiều bước).
- **Steps:** 1. Thông tin chung (Tên, Hạn nộp) -> 2. Cài đặt Review (Hạn review, ẩn danh) -> 3. Chọn Rubric.

#### `src/pages/teacher/assignment/RubricBuilder.tsx`
- **Layout:** Trình kéo thả (Builder).
- **Components chính:** Nút "Thêm Tiêu chí", form nhập tên tiêu chí, trọng số (%). Tự động tính tổng = 100%.

### 3.3 Điều phối Peer Review
#### `src/pages/teacher/review/ReviewEngineDashboard.tsx`
- **Layout:** Màn hình cài đặt thuật toán.
- **Components chính:** Chọn số lượng bài (N) mỗi nhóm phải chấm, nút "Chạy thuật toán Random". Hiển thị preview kết quả phân chia.

#### `src/pages/teacher/review/ReviewProgress.tsx`
- **Layout:** Bảng tiến độ.
- **Components chính:** Danh sách nhóm, thanh Progress Bar (Đã chấm 2/3 bài), Nút "Nhắc nhở qua Email".

### 3.4 Báo cáo & AI Analytics (Cảnh báo sớm)
#### `src/pages/teacher/analytics/SubmissionAnalytics.tsx`
- **Layout:** Data Table chuyên sâu. Hiển thị điểm số cuối cùng của toàn bộ lớp học, cho phép Export ra Excel.

#### `src/pages/teacher/analytics/CollaborationRisks.tsx` (Early Warning)
- **Layout:** Dashboard với các thẻ Cảnh báo.
- **Components chính:** 
  - Filter (DEAD_GROUP, LOW_CONTRIBUTION...).
  - Risk Cards: Hiển thị tên nhóm/cá nhân, icon mức độ nghiêm trọng (Đỏ/Vàng), và mô tả (Ví dụ: "User A có mức đóng góp quá thấp"). Có nút xem chi tiết.

#### `src/pages/teacher/analytics/ContributionDashboard.tsx`
- **Layout:** Accordion / Master-detail.
- **Components chính:** Bảng thống kê số lượng Message, Task hoàn thành, Contribution Score của từng sinh viên. Báo động đỏ với Free-riders.

### 3.5 Teacher Validation (Duyệt kết quả)
#### `src/pages/teacher/validation/ReviewValidationScreen.tsx`
- **Layout:** Master-Detail (Bên trái: List bài nộp, Bên phải: Chi tiết).
- **Components chính:**
  - **AI Synthesis Card:** Hiển thị nhận xét tổng hợp từ AI, mức điểm AI đề xuất, độ tự tin, các câu hỏi cần chú ý.
  - **Review History:** Các bài review gốc ẩn danh để giáo viên đối chiếu.
  - **Finalize Form:** Ô input ghi đè điểm, Textarea nhận xét chốt của Giảng viên, nút "Approve & Finalize".

---

## 4. 👑 Admin Portal (Quản Trị Viên)
Khu vực quản lý hệ thống tổng thể.

### 4.1 `src/pages/admin/Dashboard.tsx`
- **Components:** Các Widget thống kê (Tổng số User, Băng thông, Số lượng Class).

### 4.2 `src/pages/admin/UserManager.tsx`
- **Components:** Bảng quản lý User. Đổi Role, Khóa tài khoản (Ban/Deactivate), Reset mật khẩu.

### 4.3 `src/pages/admin/ClassManager.tsx`
- **Components:** Xem danh sách toàn bộ các lớp trên server để monitor, phân công lại Giáo viên nếu cần.

---

## 5. 🧩 Core Components (Dùng chung)
Các thành phần UI dùng lại nhiều lần ở nhiều màn hình (UI Library).

- `Sidebar.tsx`: Thanh điều hướng dọc, đổi Menu tùy theo Role.
- `Header.tsx`: Avatar, Profile Dropdown, Bell Notifications.
- `RubricViewer.tsx`: Bảng hiển thị Tiêu chí chấm điểm dạng Read-only (cho SV xem đề) và Interactive (cho SV chấm).
- `FileUploader.tsx`: Dropzone kéo thả file, hiển thị progress bar upload.
- `PDFViewer.tsx`: Component nhúng iframe/pdf.js để đọc trực tiếp bài báo cáo mà không cần tải về.
- `RiskBadge.tsx`: Nhãn hiển thị màu sắc theo độ nghiêm trọng của Risk (High = Đỏ, Medium = Cam).
- `AIChatBubble.tsx`: Khung pop-up hoặc box mang phong cách AI (gradient border, có icon Sparkles ✨) dùng cho AI Mentor và AI Synthesis.
