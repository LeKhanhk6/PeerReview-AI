# UI/UX Design Specifications (Frontend Screens)

Tài liệu này đóng vai trò là bản đặc tả thiết kế (Design Spec) dành riêng cho UI/UX Designer (triển khai trên Figma). Nó định nghĩa chi tiết những gì cần thiết kế trên giao diện, các luồng người dùng (User Flows), và những ràng buộc về UX để đảm bảo hệ thống sát với thực tế dữ liệu của Backend (chuẩn MVP).

---

## 1. Global UX & Design Guidelines

Để đảm bảo tính nhất quán trên toàn bộ hệ thống, Designer cần chuẩn bị các UI Component dùng chung sau:

### 1.1 Trạng thái UI cơ bản (UI States)
- **Empty States**: Thiết kế các màn hình/khối rỗng có hình minh họa (Illustration) hoặc Icon + Text.
  - Workspace cần rỗng theo từng Tab: "No tasks yet", "No messages yet", "No files uploaded", "No submissions yet".
  - Bảng cảnh báo: "Tuyệt vời, không có vấn đề nào được phát hiện".
- **Loading States**: Thiết kế hệ thống Skeleton Loader (khung xám tải trang) thay vì màn hình trắng. Cần có bản vẽ Partial Loading (ví dụ: Text load xong trước, khung ảnh load sau).
- **Error States**: Thiết kế Toast Notification (thông báo nhỏ góc màn hình, tự tắt) cho lỗi nhẹ, và Full-page Error Message kèm nút "Thử lại" cho lỗi gián đoạn mạng.

### 1.2 UX Constraints (MVP)
- **Data Limits**: Một số danh sách (như Cảnh báo Analytics) sẽ giới hạn 50 phần tử. Cần thiết kế nhãn nhỏ "Top 50 Risks only".
- **Allowed Components**: Ưu tiên sử dụng Progress bars, Badges (Nhãn màu), Tables, và Simple Gauges (vòng cung đo % độ tự tin của AI).
- **Avoid**: Tuyệt đối không vẽ các biểu đồ phức tạp (Line chart, Radar, Pie chart) để giữ đúng scope MVP.
- **Accessibility**: Các trạng thái cảnh báo không chỉ dùng màu (Đỏ) mà bắt buộc phải đi kèm Icon (⚠️) để người mù màu dễ nhận biết.

---

## 2. Các luồng người dùng chính (Main User Flows)

- **Student Flow**: Đăng nhập → Student Dashboard → Click Bài tập (vào Assignment Detail) → Bấm "Enter Group Workspace" → Sử dụng các Tabs (Tasks/Chat/Files) → Nộp bài → Nhận thông báo chấm chéo → Vào Màn hình Grading để chấm điểm.
- **Teacher Flow**: Đăng nhập → Teacher Dashboard → Click Lớp học (vào Class Detail Hub) → Mở xem Cảnh báo nhóm (Analytics) → Gửi tin nhắn cảnh báo → Mở Review Engine để phân công bài → Mở Màn hình AI Validation duyệt điểm cuối cùng.

---

## 3. Đặc tả chi tiết các màn hình (Screen Breakdown)

### 👨‍🎓 Khu vực Sinh Viên (Student Screens)

#### 3.1 Student Dashboard
- **Mục đích**: Trang chủ tổng quan cho Sinh viên.
- **Layout & Components**:
  - **Urgent Tasks Widget**: Nhấn mạnh các công việc/deadline sắp đến hạn (Dưới 2 ngày).
  - **Assignment List/Grid**: Danh sách bài tập, hiển thị: Tên môn, Tên bài, Ngày hết hạn. Kèm theo Trạng thái Nộp bài (LATE, SUBMITTED) và Trạng thái Chấm chéo.

#### 3.2 Assignment Detail
- **Mục đích**: Đọc đề bài và tiêu chí chấm điểm trước khi bắt đầu làm bài.
- **Layout & Components**:
  - Hạn nộp (Cần nhãn phân loại màu: Sắp đến hạn / Quá hạn).
  - Khối Mô tả (Description) & Yêu cầu (Requirements).
  - Khối File đính kèm (Danh sách file để tải về).
  - Khối Bảng Rubric (Bảng Tiêu chí chấm điểm).
- **Action quan trọng**: Cần một nút bấm to, nổi bật (Primary CTA) ghi rõ **"Enter Group Workspace"** (Vào không gian làm việc nhóm).

#### 3.3 Group Workspace (Khu vực Làm việc Nhóm)
- **Mục đích**: Không gian để thành viên nhóm tương tác.
- **Layout**: Sử dụng Tab Navigation để chia rõ 4 công năng, tránh quá tải một màn hình.
- **Các Tabs**:
  - **Tab - Tasks (Công việc)**: Dạng bảng Kanban đơn giản (To Do, Done) hoặc List công việc. 
  - **Tab - Discussion (Thảo luận)**: Giao diện Chat box (có ô nhập liệu, danh sách tin nhắn).
  - **Tab - Files (Tài liệu)**: Giao diện danh sách file đính kèm nút Upload.
  - **Tab - Submission (Nộp bài)**: (Xem chi tiết ở mục 3.4).

#### 3.4 Assignment Submission (Nộp bài - Tab trong Workspace)
- **Layout & Components**:
  - Khối Upload File chính.
  - **UX States**: Bắt buộc vẽ Progress bar (Thanh tiến trình) khi đang upload. Nút Submit phải mờ đi (disabled) khi đang tải.
  - **Cảnh báo**: Nếu thời điểm nộp đã qua deadline, phải hiện rõ Badge đỏ "Late submission".
  - **Lịch sử nộp**: Bảng/danh sách hiển thị các phiên bản (Version) đã từng nộp trước đó.

#### 3.5 Review Grading Screen (Màn hình Chấm chéo)
- **Mục đích**: Sinh viên chấm điểm cho nhóm khác.
- **Layout**: Split-screen (Chia đôi màn hình). Bên Trái: Hiển thị file PDF/bài làm. Bên Phải: Phiếu chấm điểm (Rubric).
- **Constraints (Ràng buộc UX)**:
  - Bắt buộc nhập điểm cho TẤT CẢ tiêu chí thì Nút "Submit" mới được sáng lên.
  - Các ô nhập điểm cần có range (Ví dụ chỉ cho nhập 0-10).
  - Nút **"Request AI Mentor"**: Thiết kế một action nhỏ kèm icon ✨. Khi bấm vào hiện loading mờ, sau đó bung ra đoạn text gợi ý nhận xét từ AI.

---

### 👨‍🏫 Khu vực Giảng Viên (Teacher Screens)

#### 3.6 Teacher Dashboard & Class Detail
- **Teacher Dashboard**: Màn hình hiển thị danh sách các lớp đang quản lý dưới dạng Card. Bấm vào một Lớp sẽ nhảy sang Class Detail.
- **Teacher Class Detail (Central Hub)**: Đóng vai trò là trạm trung chuyển. Chứa các Dashboard Widgets hoặc Menu lớn dẫn tới: Danh sách bài tập, Analytics (Phân tích), Review Engine (Phân công chấm).

#### 3.7 Review Engine & Progress (Điều phối chấm chéo)
- **Mục đích**: Phân công bài tự động và theo dõi sinh viên chấm.
- **Layout phải phản ánh 3 Trạng thái (Lifecycle)**:
  - **State 1: Chưa chia bài (NOT_STARTED)**: Màn hình trống, nằm chính giữa là nút "Generate Review Assignments" (Bắt đầu chia bài).
  - **State 2: Đã chia (GENERATED)**: Hiện Bảng Tiến độ chấm chéo của sinh viên (Ai xong, ai chưa). Bổ sung thêm nút "Nhắc nhở qua Email", và nút "Re-generate" (Chia lại nếu lỡ chia sai).
  - **State 3: Khóa (LOCKED)**: Trạng thái chốt sổ. Các action button đều chuyển xám (disabled).

#### 3.8 Class Analytics (Dashboard Cảnh báo)
- **Layout**: Sử dụng Tab Navigation.
- **Tab - Collaboration Risks (Cảnh báo sớm)**:
  - Hiển thị danh sách các thẻ cảnh báo (Risk Cards). Cần có nhãn "Top 50 Risks only".
  - **Thiết kế Card**: Dùng Badge màu đỏ (High Risk) hoặc màu Vàng (Medium Risk) + Icon (như ⚠️).
  - **Dữ liệu trên Card**: Thể hiện Risk Type (DEAD_GROUP, LOW_CONTRIBUTION...). Tên sinh viên vi phạm.
  - **Action Layer**: Thêm nút bấm nhỏ "Gửi tin nhắn cảnh báo" đặt ngay trên từng Card. Nút "Xem chi tiết".
- **Tab - Contributions (Điểm đóng góp)**:
  - Bảng danh sách chi tiết (Table).
  - Thể hiện: Điểm cống hiến, Tỷ lệ công việc. Bổ sung nhãn cảnh báo (Free-Rider) nếu có. Người dùng có thể bấm xổ dọc (expand row) để xem chi tiết số lượng Message/Task.

#### 3.9 Review Validation (Duyệt kết quả & AI Synthesis)
- **Mục đích**: Xem AI tóm tắt các nhận xét của nhóm sinh viên, Giáo viên chốt điểm cuối.
- **Layout**: Master-Detail. (Bên Trái: Danh sách các bài nộp của cả lớp, Bên Phải: Nội dung AI Synthesis & Khung Chốt điểm).
- **Thiết kế phần AI Synthesis (Bên Phải)**:
  - **Khối Tổng hợp AI**: Vẽ các mảng chữ tóm tắt Ưu điểm, Nhược điểm. Thêm điểm số AI đề xuất thật to (Ví dụ: 8.5/10).
  - **UX Enhancement (Khai thác AI)**: 
    - Gắn cảm xúc (Sentiment) bằng màu nền nhẹ (Xanh lá = Khen, Vàng = Trung lập, Đỏ = Chê).
    - Danh sách các điểm nghi vấn (Important Questions) vẽ dưới dạng Checklist.
    - **Highlight Mâu thuẫn**: Phải thiết kế vùng cảnh báo (Icon dấu chấm than/viền đỏ) nếu AI phát hiện các nhóm sinh viên chấm điểm cho nhau có độ lệch lớn (Mâu thuẫn kết quả).
  - **Fallback State**: Lỡ AI chết, vẽ form báo lỗi chữ nhỏ "AI không thể tóm tắt lúc này" nhưng vẫn mở danh sách Review thô ở bên dưới để Giáo viên tự đọc và chấm thủ công.
- **Khối Chốt điểm (Validation Action)**: Nằm ở dưới cùng (Sticky bottom). Gồm Input nhập điểm cuối cùng, Textarea ghi chú, và nút "Approve & Finalize".
