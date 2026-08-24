# 📘 PEERREVIEW-AI — SCREEN DESIGN DOCUMENT (FINAL)

Tài liệu này định nghĩa chi tiết thiết kế UI, các luồng người dùng (User Flows), và sự tương quan trực tiếp giữa Màn hình (Screen) - Use Cases - APIs - UI States.

---

## I. 🎯 TỔNG QUAN HỆ THỐNG

Hệ thống gồm 3 role chính:
- **STUDENT** (Người dùng cốt lõi: Làm bài, nộp bài, chấm chéo)
- **TEACHER** (Quản lý lớp học, giao bài tập, theo dõi tiến độ, chốt điểm)
- **ADMIN** (Quản lý hệ thống - Optional)

**🧭 Development Flow (Roadmap Tích Hợp)**
- PHASE 3 → Assignment (Giao bài & Nhận bài)
- PHASE 4 → Workspace (Tạo nhóm & Làm việc nhóm)
- PHASE 5 → Submission (Nộp bài)
- PHASE 6 → Review Assignment (Phân công chấm chéo)
- PHASE 7 → Peer Review (Thực hiện chấm chéo)
- PHASE 8 → AI Mentor (AI hỗ trợ đánh giá nhận xét)
- PHASE 10 → Review Synthesis (AI tổng hợp kết quả đánh giá)
- PHASE 11 → Analytics (Thống kê và phát hiện rủi ro)

---

## II. 🎓 STUDENT SCREENS (FINAL)

### 1. 🔐 Login Screen
- **Mục tiêu**: Xác thực định danh người dùng vào hệ thống.
- **Chức năng (Use Cases)**: Nhập thông tin đăng nhập (email, password), xử lý các trường hợp sai mật khẩu hoặc tài khoản không tồn tại.
- **UI Components**:
  - Logo hệ thống (chính giữa).
  - Cụm Form: Input Email, Input Password (có nút toggle ẩn/hiện mk).
  - Button `Login` (Primary).
  - Link `Forgot Password?` (Tuỳ chọn).
  - Link `Chưa có tài khoản? Đăng ký ngay` (Trỏ sang màn hình Register).
- **APIs**: `POST /api/auth/login`
- **State**: 
  - `Loading`: Button hiển thị spinner, disable form.
  - `Error`: Hiển thị inline error text màu đỏ hoặc Toast notification.

### 1.5 📝 Register Screen (Student)
- **Mục tiêu**: Tạo tài khoản mới cho sinh viên.
- **Chức năng (Use Cases)**: Nhập thông tin cá nhân (Họ Tên, Email, Password) để tạo tài khoản.
- **UI Components**:
  - Logo hệ thống.
  - Cụm Form: Input Full Name, Input Email, Input Password.
  - Button `Register` (Primary).
  - Link `Đã có tài khoản? Đăng nhập` (Trỏ sang màn hình Login).
- **APIs**: `POST /api/auth/register` (với role mặc định là STUDENT)
- **State**: 
  - `Loading`: Button hiển thị spinner, disable form.
  - `Error`: Cảnh báo email trùng lặp, mật khẩu yếu.
  - `Success`: Hiển thị thông báo đăng ký thành công và tự động chuyển sang trang Login (hoặc tự động đăng nhập).

### 2. 📊 Student Dashboard
- **Mục tiêu**: Trung tâm điều hướng chính sau khi đăng nhập.
- **Chức năng (Use Cases)**: Theo dõi danh sách bài tập (Assignment) được giao, xem tiến độ (chưa làm, đang làm, đã nộp, chờ chấm), và truy cập nhanh vào thao tác tiếp theo phù hợp với trạng thái hiện tại.
- **UI Components**:
  - Header: Lời chào + User Profile Menu.
  - Tabs/Filters: `All`, `In Progress`, `Completed`.
  - Assignment List (Grid/List of Cards):
    - Title bài tập.
    - Thời hạn (Deadline) - bôi đỏ nếu sắp đến hạn.
    - Status Badge (VD: `Not Started`, `Submitted`).
    - Nút Call-to-Action (Action Button).
- **🎯 Assignment Lifecycle (GLOBAL RULE) & UI Mapping**:
  - `NOT_STARTED` → Nút Action: **Start**
  - `IN_PROGRESS` → Nút Action: **Continue**
  - `SUBMITTED` → Nút Action: **View Submission**
  - `UNDER_REVIEW` → Nút Action: **Waiting** (Disabled)
  - `REVIEWED` → Nút Action: **View Feedback**
- **APIs**: `GET /api/submissions/me/dashboard`
- **State**: `Loading` (Skeleton list), `Empty` (Illustration "Bạn chưa có bài tập nào").

### 3. 📄 Assignment Detail
- **Chức năng (Use Cases)**: Đọc kỹ yêu cầu đề bài, tài liệu đính kèm từ giảng viên, và xem trước bảng tiêu chí chấm điểm (Rubric) để biết cách làm bài.
- **UI Components**:
  - Breadcrumb navigation.
  - Meta info: Title, Deadline, Status.
  - Rich-text box hiển thị Description & Requirements.
  - Attachments section (danh sách file có icon download).
  - Rubric Table (Hiển thị các tiêu chí, tỷ trọng % và các mức điểm).
  - Cụm Button: `Back` và `Join/Continue Workspace`.
- **APIs**: `GET /api/assignments/:id/detail`

### 4. 🧭 Assignment Participation Screen ⭐ (NEW)
- **Mục tiêu**: Giải quyết bài toán "Làm việc nhóm hay cá nhân" trước khi vào không gian làm bài.
- **Chức năng (Use Cases)**: Chọn hình thức tham gia. Tự tạo nhóm mới làm Leader, tham gia nhóm có sẵn qua mã mời (Invite Code), hoặc chuyển thẳng vào Workspace nếu đã có nhóm.
- **UI Components**:
  - Phân nhánh UI theo **Case A (Chưa có nhóm)**:
    - Nút to: `Tạo nhóm mới` (Mở modal nhập tên nhóm).
    - Input: `Nhập mã nhóm` + Nút `Tham gia`.
  - Phân nhánh UI theo **Case B (Đã có nhóm)**:
    - Hiển thị Group Info Card (Tên nhóm, Vai trò, Danh sách thành viên).
    - Nút bự: `Vào Workspace`.

### 5. 👥 Workspace Screen
- **Mục tiêu**: Không gian tương tác và làm việc chung của nhóm.
- **Chức năng (Use Cases)**: Phân chia công việc (Kanban/List), trao đổi tin nhắn (Group Chat), tải lên và chia sẻ tài liệu chung.
- **UI Components**:
  - Tabs Navigation: `Tasks`, `Discussion`, `Files`.
  - **Tasks Tab**: Bảng Kanban (To-do, In-progress, Done) hoặc Task List. Nút `Add Task`. Leader có quyền assign.
  - **Discussion Tab**: Khung chat thời gian thực, input gửi tin nhắn.
  - **Files Tab**: Danh sách file, nút upload kéo thả. Cột hiển thị người tải lên và ngày tải.
- **State**: `Empty` ("Hãy tạo công việc đầu tiên"), `Permission` (Chỉ Leader mới được sửa Task).

### 6. 📤 Submission Screen (REFACTORED)
- **Mục tiêu**: Giao diện nộp bài tập chính thức.
- **Chức năng (Use Cases)**: Nộp file bài làm cuối cùng lên hệ thống. Cho phép nộp nhiều lần (ghi nhận phiên bản - version history). Cảnh báo rõ ràng nếu nộp trễ hạn.
- **UI Components**:
  - Box Upload (Drag & Drop) chấp nhận file PDF/Word/Zip.
  - Button `Submit Assignment`.
  - Submission History Table: Hiển thị version, thời gian nộp, tên file, người nộp.
  - Warning Alert: Cảnh báo đỏ nếu đã quá Deadline.
- **APIs**: 
  - `POST /api/submissions/assignments/:assignmentId`
  - `GET /api/submissions/assignments/:assignmentId/submission-history`
- **State**: `Draft`, `Submitted`, `Late`.

### 7. 📝 My Reviews Screen
- **Chức năng (Use Cases)**: Xem danh sách các bài làm của nhóm khác mà mình được hệ thống phân công (ẩn danh - double blind) để chấm chéo.
- **UI Components**:
  - Danh sách bài cần chấm: Tên bài (Thường bị ẩn danh: Nhóm A, Bài 1), Deadline chấm bài, Status (Chưa chấm, Đang chấm, Đã hoàn thành).
- **APIs**: `GET /api/reviews/assignments/:assignmentId/my-reviews`

### 8. ✍️ Review Grading Screen
- **Chức năng (Use Cases)**: Màn hình trọng tâm để chấm điểm. Xem bài nộp của bạn, nhập điểm số cho từng tiêu chí, ghi chú lời khuyên. Tích hợp AI Mentor để kiểm tra tính xây dựng của nhận xét.
- **UI Components** (Split-screen layout):
  - **LEFT PANEL (File Viewer)**: Nhúng PDF Viewer để đọc bài làm.
  - **RIGHT PANEL (Grading Form)**:
    - Danh sách các Rubric Criteria dạng accordion hoặc list.
    - Mỗi tiêu chí có: Slider/Input nhập điểm + Textarea ghi chú.
    - Khung "Overall Comment" (Nhận xét chung).
    - Nút `Check with AI` (Kiểm tra nhận xét có toxic hay sơ sài không).
    - Floating Action Bar: Nút `Lưu nháp` và `Nộp phiếu chấm`.
- **APIs**: 
  - `GET /api/reviews/my-reviews/:reviewAssignmentId`
  - `POST /api/reviews/my-reviews/:reviewAssignmentId/submit`
- **AI States**: `Analyzing` (Loading spinner), `Success` (Hiển thị tip của AI), `Error → Retry`.
- **Validation**: Đỏ viền (Highlight) các tiêu chí chưa chấm nếu bấm Submit. Báo lỗi "Vui lòng chấm đủ các tiêu chí".

### 9. 🧾 Review Detail Screen ⭐ (NEW)
- **Mục tiêu**: Xem lại nội dung chấm sau khi đã submit.
- **Chức năng (Use Cases)**: Đối chiếu và xem lại phiếu chấm điểm (Review) mà nhóm mình đã gửi đi để đảm bảo tính chính xác, không cho phép sửa đổi nữa.
- **UI Components**:
  - Score Breakdown (Biểu đồ hoặc danh sách điểm đã chấm).
  - Text block hiển thị Overall Comment (ReadOnly).

### 10. 📊 Submission Feedback Screen ⭐ (CORE)
- **Mục tiêu**: Xem kết quả tổng hợp cuối cùng khi giai đoạn Peer Review đóng lại.
- **Chức năng (Use Cases)**: Xem điểm tổng kết (Final Score), phổ điểm của các tiêu chí, đọc tóm tắt nhận xét từ các nhóm khác, và tiếp thu báo cáo phân tích sâu từ AI (Điểm mạnh / Yếu).
- **UI Components**:
  - Big Score Card: Điểm cuối cùng trên 100.
  - Radar Chart / Bar Chart so sánh điểm các tiêu chí (Rubric breakdown).
  - AI Synthesis Report (3 cột hoặc 3 tabs): `Strengths` (Điểm mạnh), `Weaknesses` (Điểm cần cải thiện), `Suggestions` (Gợi ý).
  - Danh sách lời phê ẩn danh từ các Reviewer.
- **APIs**: `GET /api/submissions/assignments/:assignmentId/feedback`

---

## III. 🧑‍🏫 TEACHER SCREENS

### 11. 📚 Teacher Dashboard
- **Chức năng (Use Cases)**: Trung tâm điều khiển của Giảng viên. Xem danh sách các lớp học đang phụ trách, tổng quan về số lượng bài tập, trạng thái bài tập của từng lớp.
- **UI Components**:
  - Header Dashboard với thống kê nhanh.
  - Grid danh sách Lớp học (Class Cards).
- **APIs**: `GET /api/classes` *(To be implemented)*

### 12. ⚙️ Assignment Management
- **Chức năng (Use Cases)**: Nơi giáo viên tạo mới bài tập, chỉnh sửa thông tin (đề bài, deadline), thiết lập form chấm điểm (Rubric) hoặc xóa bài tập.
- **UI Components**:
  - Data Table danh sách Assignment (Search, Filter, Sort).
  - Nút `Create Assignment` mở ra Full-page Form (hoặc Modal lớn).
  - Action menu (Edit, Delete, Duplicate) trên từng dòng table.
- **APIs**: 
  - `GET /api/assignments`
  - `POST /api/assignments`

### 13. 🧠 Review Engine
- **Chức năng (Use Cases)**: Bảng điều khiển phân công chấm chéo. Theo dõi số lượng nhóm đã nộp bài, kích hoạt thuật toán tự động phân công chéo.
- **UI Components**:
  - Vùng config: Nhập số lượng review/nhóm (VD: 3 bài/nhóm).
  - Nút lớn `Generate Review Assignments`.
  - Progress Bar theo dõi tỷ lệ các nhóm đã nộp phiếu chấm (VD: 60% completed).
- **APIs**: `POST /api/assignments/:assignmentId/review-assignments/generate`

### 14. 📈 Analytics Screen
- **Chức năng (Use Cases)**: Giám sát hiệu suất lớp học. Đánh giá điểm đóng góp thực tế của sinh viên trong nhóm, phát hiện sớm các nhóm có rủi ro (làm trễ, mâu thuẫn nội bộ, hoặc có 1 người gánh team).
- **UI Components**:
  - Charts (Biểu đồ tròn/Cột) thống kê Contribution.
  - Danh sách Risk Alerts (Báo động rủi ro): Màu đỏ/vàng tuỳ mức độ.
- **APIs**: 
  - `GET /api/analytics/classes/:classId/reviews`
  - `GET /api/analytics/classes/:classId/collaboration-risks`

### 15. 🧪 Review Validation (AI)
- **Chức năng (Use Cases)**: Bước cuối cùng để chốt điểm. Giáo viên xem AI tổng hợp ý kiến từ nhiều nhóm chấm, rà soát các trường hợp bị lệch điểm (Conflict) và đưa ra quyết định Duyệt (Approve) hoặc Điều chỉnh.
- **UI Components**:
  - Bảng danh sách các nhóm đã được AI tổng hợp điểm (Review Summaries).
  - Cảnh báo cờ đỏ (Red Flag) cho các bài bị chênh lệch điểm quá cao giữa các reviewer.
  - Nút `Approve` hàng loạt hoặc chi tiết từng bài.

---

## IV. ⚙️ SUPPORT SCREENS

### 16. 🧾 Rubric Builder
- **Chức năng (Use Cases)**: Trình dựng tiêu chí chấm bài trực quan dành cho Giáo viên.
- **UI Components**:
  - Form động thêm/xoá hàng (tiêu chí) và cột (mức độ).
  - Input nhập trọng số (%) tự động tính tổng = 100%.

### 17. 👥 Group Management
- **Chức năng (Use Cases)**: Giúp Giảng viên hoặc Admin quản lý thành viên nhóm, phân công nhóm trưởng, theo dõi hoạt động của nhóm (ai đang online, ai lười).
- **UI Components**:
  - Danh sách member (Avatar, Name, Role).
  - Menu đổi Role (Member <-> Leader).

### 18. 📜 Submission History
- **Chức năng (Use Cases)**: Màn hình chi tiết xem lịch sử các lần nộp bài (Version control) để xử lý tranh chấp.
- **UI Components**: Timeline dọc hiển thị thời gian nộp và file đính kèm.

### 19. 🛠 Admin Dashboard (Optional)
- **Chức năng (Use Cases)**: Giao diện tối cao quản trị hệ thống, cấp quyền, cấu hình thông số chung (VD: API Key cho AI).
- **UI Components**: Bảng điều khiển admin tổng hợp.

---

## V. 🧭 NAVIGATION FLOW (FINAL)

**🎯 Main Flow (Hành trình sinh viên làm bài)**
```text
(Register) → Login
 → Dashboard
   → Assignment Detail
     → Participation (Tạo/Vào nhóm)
       → Workspace (Làm việc chung)
         → Submission (Nộp bài)
           → Review Phase (Giai đoạn chấm chéo)
             → Feedback (Xem điểm tổng hợp cuối cùng)
```

**🎯 Review Flow (Hành trình sinh viên chấm bài)**
```text
Dashboard
 → My Reviews (Xem danh sách phân công)
   → Review Grading (Thực hiện chấm bài)
     → Submit
       → Review Detail (Xem lại phiếu đã chấm)
```

---

## VI. 🌐 GLOBAL UI RULES

**Bắt buộc tuân thủ trên mọi màn hình:**
- **Loading State**: Hiển thị Skeleton cho dữ liệu list/bảng, Spinner cho các nút bấm (Button). Tránh làm chớp giật màn hình (Gợi ý dùng React Query).
- **Empty State**: Phải có hình minh họa (Illustration) + Đoạn text thân thiện + Nút CTA (Call to Action) hướng dẫn người dùng bước tiếp theo.
- **Error State**: Lỗi nhẹ dùng Toast Notification (Góc trên phải). Lỗi nặng (Mất mạng, 404) dùng Full-page Error Message + nút "Thử lại".
- **Pagination**: Bất kỳ danh sách nào có thể vượt quá 15 items đều phải phân trang (hoặc Infinite Scroll). API luôn trả về `page`, `limit`, `hasNext`.
- **Mutation Rules**: Khóa (Disable) nút submit ngay khi click để chặn hành vi double-click gửi trùng dữ liệu.
