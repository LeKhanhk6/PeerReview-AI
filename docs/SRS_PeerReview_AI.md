# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENT SPECIFICATION)

**Tên dự án (Project Name): PeerReview-AI**

– Hà Nội, Tháng 9/2026 –

---

## **Mục lục (Table of Contents)**

1. [I. Lịch sử thay đổi (Record of Changes)](#i-lịch-sử-thay-đổi-record-of-changes)
2. [II. Đặc tả Yêu cầu Phần mềm (Software Requirement Specification)](#ii-đặc-tả-yêu-cầu-phần-mềm-software-requirement-specification)
   1. [1. Yêu cầu Tổng quan (Overall Requirements)](#1-yêu-cầu-tổng-quan-overall-requirements)
      1. [1.1 Sơ đồ Ngữ cảnh (Context Diagram)](#11-sơ-đồ-ngữ-cảnh-context-diagram)
      2. [1.2 Quy trình Nghiệp vụ Chính (Main Business Processes)](#12-quy-trình-nghiệp-vụ-chính-main-business-processes)
      3. [1.3 Yêu cầu Người dùng (User Requirements)](#13-yêu-cầu-người-dùng-user-requirements)
      4. [1.4 Chức năng Hệ thống (System Functionalities)](#14-chức-năng-hệ-thống-system-functionalities)
      5. [1.5 Sơ đồ Thực thể Liên kết (Entity Relationship Diagram)](#15-sơ-đồ-thực-thể-liên-kết-entity-relationship-diagram)
   2. [2. Đặc tả Use Case (Use Case Specifications)](#2-đặc-tả-use-case-use-case-specifications)
   3. [3. Yêu cầu Chức năng (Functional Requirements)](#3-yêu-cầu-chức-năng-functional-requirements)
   4. [4. Yêu cầu Phi chức năng (Non-Functional Requirements)](#4-yêu-cầu-phi-chức-năng-non-functional-requirements)
   5. [5. Phụ lục Yêu cầu (Requirement Appendix)](#5-phụ-lục-yêu-cầu-requirement-appendix)

---

# **I. Lịch sử thay đổi (Record of Changes)**

| **Ngày (Date)** | **A*M, D** | **Người phụ trách (In charge)** | **Mô tả thay đổi (Change Description)** |
| :---: | :---: | :---: | :---: |
| 03/09/2026 | A | Nhóm phát triển (Team) | Khởi tạo bản thảo SRS cho PeerReview-AI |

*A - Thêm mới (Added), M - Chỉnh sửa (Modified), D - Xóa (Deleted)

---

# **II. Đặc tả Yêu cầu Phần mềm (Software Requirement Specification)**

## **1. Yêu cầu Tổng quan (Overall Requirements)**

### **1.1 Sơ đồ Ngữ cảnh (Context Diagram)**
*PeerReview-AI* là một nền tảng giáo dục hiện đại được thiết kế nhằm tối ưu hóa và nâng cao chất lượng quy trình làm việc nhóm cũng như chấm điểm chéo trong môi trường học thuật. Hệ thống đóng vai trò là trung tâm kết nối Giảng viên (Teachers), Sinh viên (Students), và Dịch vụ Trí tuệ Nhân tạo (AI Mentor Service). Hệ thống tích hợp với dịch vụ email bên ngoài (để gửi thông báo) và lưu trữ đám mây (Cloud Storage) để lưu trữ các bài nộp.

### **1.2 Quy trình Nghiệp vụ Chính (Main Business Processes)**
1. **Quản lý Bài tập (Assignment Management):** Giảng viên (Teacher) tạo lớp học -> Tạo Bài tập (Assignment) kèm Tiêu chí chấm điểm (Rubric) -> Sinh viên (Students) tham gia lớp qua Mã mời (Invite code).
2. **Không gian Làm việc Nhóm (Group Workspace):** Sinh viên tạo nhóm -> Thảo luận và chia công việc (Tasks) -> Trưởng nhóm nộp bài hoàn chỉnh (Submit Assignment).
3. **Chấm chéo Ẩn danh (Double-Blind Peer Review):** Hệ thống tự động phân công các bài nộp để chấm chéo (ẩn danh) -> Sinh viên chấm bài nhóm khác dựa trên Rubric, với sự hỗ trợ của Trợ lý AI (AI Mentor) theo thời gian thực -> Tính toán điểm số cuối cùng.
4. **Phân tích bằng AI (AI Analytics):** AI đọc nhật ký hoạt động (Activity Logs) để tính tỷ lệ đóng góp (Contribution %), phát hiện những kẻ ăn bám (Free-riders) -> AI tổng hợp mọi đánh giá (Reviews) thành một báo cáo duy nhất cho Giảng viên.

### **1.3 Yêu cầu Người dùng (User Requirements)**

#### ***1.3.1 Tác nhân (Actors)***

| **#** | **Tác nhân (Actor)** | **Mô tả (Description)** |
| :---: | :--- | :--- |
| 1 | **Quản trị viên (Administrator)** | Quản lý hệ thống, tài khoản người dùng, cấu hình chung và xem nhật ký hệ thống (Audit logs). |
| 2 | **Giảng viên (Teacher)** | Quản lý lớp học, tạo bài tập, cấu hình Rubric, xem báo cáo từ AI, và chốt điểm cuối cùng. |
| 3 | **Sinh viên (Student)** | Tham gia nhóm, theo dõi công việc (Tasks), chat, nộp bài, và thực hiện chấm chéo với sự trợ giúp của AI. |
| 4 | **Dịch vụ AI (AI Service)** | Một dịch vụ xử lý ngôn ngữ tự nhiên (NLP) nội bộ/bên ngoài đóng vai trò Trợ lý (Mentor) và Phân tích dữ liệu. |

#### ***1.3.2 Các trường hợp sử dụng (Use Cases - UC)***

| **ID** | **Use Case** | **Tính năng (Feature)** | **Mô tả Use Case (Use Case Description)** |
| :---: | :--- | :--- | :--- |
| 01 | Đăng nhập (Login System) | Xác thực (Authentication) | Người dùng đăng nhập vào hệ thống |
| 02 | Quản lý Lớp (Manage Class) | Quản lý Lớp (Class Management) | Giảng viên tạo/sửa lớp học và tạo mã mời (Invite codes) |
| 03 | Quản lý Bài tập (Manage Assignment)| Bài tập (Assignment) | Giảng viên đặt hạn nộp (Deadline) và tạo Rubric với tổng trọng số 100% |
| 04 | Hợp tác (Collaborate) | Không gian nhóm (Group Workspace) | Sinh viên tạo Task, chat, và hệ thống theo dõi hoạt động (Activity logs) |
| 05 | Nộp bài (Submit Work) | Nộp bài (Submission) | Trưởng nhóm tải lên file bài tập |
| 06 | Chấm chéo (Peer Review) | Chấm điểm (Grading) | Sinh viên đánh giá bài làm của một nhóm ẩn danh khác |
| 07 | Xem Phân tích (View Analytics) | Phân tích AI (AI Analytics) | Giảng viên xem báo cáo đóng góp và báo cáo tổng hợp đánh giá |

### **1.4 Chức năng Hệ thống (System Functionalities)**

#### ***1.4.1 Phân quyền màn hình (Screen Authorization)***

| **Màn hình (Screen)** | **Quản trị viên (Administrator)** | **Giảng viên (Teacher)** | **Sinh viên (Student)** |
| :--- | :---: | :---: | :---: |
| Đăng nhập / Đăng ký (Login / Register) | X | X | X |
| Bảng điều khiển Admin (Admin Dashboard) | X | | |
| Quản lý Lớp & Bài tập (Class & Assignment Mgt) | | X | |
| Bảng Phân tích (Analytics Dashboard) | | X | |
| Không gian Nhóm (Group Workspace) | | | X |
| Nộp bài & Chấm chéo (Submission & Review) | | | X |

### **1.5 Sơ đồ Thực thể Liên kết (Entity Relationship Diagram)**
Các thực thể (Entities) cốt lõi bao gồm:
1. **User (Người dùng):** `id`, `email`, `role`, `password_hash`
2. **Class (Lớp học):** `id`, `teacher_id`, `name`, `invite_code`
3. **Assignment (Bài tập):** `id`, `class_id`, `title`, `deadline`
4. **Rubric & Criterion (Tiêu chí):** Các tiêu chí chấm điểm gắn liền với một Bài tập.
5. **Group (Nhóm):** `id`, `assignment_id`, `name`
6. **ActivityLog (Nhật ký hoạt động):** `id`, `group_id`, `user_id`, `action_type`
7. **Submission (Bài nộp):** `id`, `group_id`, `file_url`, `version`
8. **Review (Bản đánh giá):** `id`, `reviewer_group_id`, `submission_id`, `total_score`

---

## **2. Đặc tả Use Case (Use Case Specifications)**

### **2.1 Xác thực người dùng (User Authentication)**

#### ***2.1.1 Đăng nhập hệ thống (Login System)***

| Tác nhân chính (Primary Actors) | Người dùng (Admin, Teacher, Student) | Tác nhân phụ (Secondary Actors) | Không có (None) |
| ---: | :--- | ---: | :--- |
| Mô tả (Description) | Là người dùng, tôi muốn đăng nhập vào hệ thống để có thể sử dụng các chức năng yêu cầu xác thực. |
| Điều kiện tiên quyết (Preconditions) | Tài khoản người dùng đã được tạo và cấp quyền |
| Điều kiện hậu quyết (Postconditions) | - Người dùng đăng nhập thành công<br>- Hệ thống lưu vết đăng nhập vào Nhật ký hệ thống (Audit Log) |
| Luồng cơ bản (Normal Sequence) | 1. Người dùng truy cập màn hình Login.<br>2. Nhập email và mật khẩu.<br>3. Hệ thống xác thực thông tin (BR-01).<br>4. Hệ thống cấp JWT token và chuyển hướng tới Dashboard của Role tương ứng. |
| Luồng thay thế (Alternative Flow) | **Thông tin không hợp lệ (Invalid Credentials):** Nếu sai email/mật khẩu, hiển thị thông báo MSG09. Nếu tài khoản bị khóa, hiển thị MSG12. |

### **2.2 Chấm chéo Ẩn danh (Double-Blind Peer Review)**

#### ***2.2.1 Thực hiện Chấm chéo (Perform Peer Review)***

| Tác nhân chính (Primary Actors) | Sinh viên (Student) | Tác nhân phụ (Secondary Actors) | Dịch vụ AI (AI Service) |
| ---: | :--- | ---: | :--- |
| Mô tả (Description) | Là Sinh viên, tôi muốn đánh giá bài làm của một nhóm ẩn danh khác và nhận phản hồi từ AI về chất lượng bài đánh giá của tôi. |
| Điều kiện tiên quyết (Preconditions) | Hạn nộp (Deadline) đã qua, Giảng viên đã chạy Thuật toán Phân công (Allocation Algorithm). |
| Điều kiện hậu quyết (Postconditions) | Điểm đánh giá (Review score) được lưu lại. Nhóm được đánh dấu là đã hoàn thành chấm. |
| Luồng cơ bản (Normal Sequence) | 1. Sinh viên mở "Bài nộp ẩn danh #XYZ" (Anonymous Submission).<br>2. Sinh viên nhập điểm cho từng tiêu chí Rubric.<br>3. Sinh viên gõ lời nhận xét (feedback comments).<br>4. AI Service phân tích văn bản theo thời gian thực. Gợi ý từ ngữ tốt hơn nếu phát hiện ngôn từ độc hại (Toxic).<br>5. Sinh viên nộp bản đánh giá (Submit Review). |

---

## **3. Yêu cầu Chức năng (Functional Requirements)**

### **3.1 Xác thực & Phân quyền (Authentication & Authorization)**
- **FR-AUTH-01:** Hệ thống phải cho phép đăng nhập qua Email/Mật khẩu bằng thuật toán mã hóa bcrypt.
- **FR-AUTH-02:** Hệ thống phải cấp JWT tokens có thời hạn (Expirations).
- **FR-AUTH-03:** Hệ thống phải áp dụng Phân quyền theo Vai trò (Role-Based Access Control - RBAC) trên tất cả các API endpoints.

### **3.2 Quản lý Bài tập & Rubric (Assignment & Rubric Management)**
- **FR-ASSM-01:** Giảng viên phải có khả năng tạo bài tập với Hạn nộp (Deadlines) khắt khe.
- **FR-ASSM-02:** Tổng trọng số của tất cả tiêu chí trong một Rubric **bắt buộc phải bằng đúng 100%**.

### **3.3 Không gian Nhóm & Theo dõi (Group Workspace & Tracking)**
- **FR-GRP-01:** Hệ thống phải cung cấp giao diện quản lý Công việc (Task) và Chat cho Sinh viên.
- **FR-GRP-02:** Hệ thống phải ngầm ghi lại (implicitly log) mọi hành động của sinh viên vào `activity_logs` để AI phân tích mà không cần thao tác thủ công.

### **3.4 Chấm chéo & Trợ lý AI (Peer Review & AI Mentor)**
- **FR-REV-01:** Hệ thống phải phân công đánh giá đảm bảo: không tự đánh giá bài mình (self-review) và không đánh giá trùng (duplicate reviews).
- **FR-REV-02:** Hệ thống phải ẩn danh tính (hide identities) của cả nhóm đi chấm và nhóm nộp bài.
- **FR-AI-01:** Trợ lý AI (AI Mentor) phải can thiệp vào bình luận đánh giá, phát hiện ngôn từ độc hại (toxicity), và trả về các đề xuất mang tính xây dựng.
- **FR-AI-02:** AI phải tính toán Phần trăm Đóng góp (Contribution Percentage) dựa trên `activity_logs` để đánh dấu những Kẻ ăn bám (Free-riders) cho Giảng viên.

---

## **4. Yêu cầu Phi chức năng (Non-Functional Requirements)**

### **4.1 Giao diện Bên ngoài (External Interfaces)**
- Frontend giao tiếp với Backend qua RESTful JSON APIs.
- Hệ thống tích hợp với một API Dịch vụ AI bên ngoài (vd: OpenAI/Gemini) cho các tác vụ Xử lý Ngôn ngữ Tự nhiên (NLP).

### **4.2 Thuộc tính Chất lượng (Quality Attributes)**

#### ***4.2.1 Hiệu năng (Performance)***
- Thời gian phản hồi API cho các thao tác CRUD tiêu chuẩn phải dưới 500ms.
- Các yêu cầu phân tích gửi cho AI phải được xử lý bất đồng bộ (asynchronously) để tránh treo giao diện người dùng (blocking UI).

#### ***4.2.2 Bảo mật (Security)***
- Mật khẩu phải được mã hóa (hashed) bằng Bcrypt.
- Mật khẩu và Thông tin Cá nhân Nhạy cảm (PII) phải được che giấu (Masked) trong Nhật ký hệ thống (Audit Logs) của Admin.
- Bắt buộc kiểm tra Quyền sở hữu Tài nguyên (Resource Ownership) (ví dụ: Teacher A không thể sửa bài tập của Teacher B).

---

## **5. Phụ lục Yêu cầu (Requirement Appendix)**

### **5.1 Luật Nghiệp vụ (Business Rules)**

| **ID** | **Định nghĩa Luật (Rule Definition)** |
| :---: | :--- |
| BR-01 | Tài khoản người dùng bị khóa trong 30 phút sau 5 lần đăng nhập sai liên tiếp. |
| BR-02 | Tổng trọng số các tiêu chí Rubric luôn luôn phải bằng chính xác 100%. |
| BR-03 | Một nhóm không bao giờ được phân công chấm chính bài nộp của nhóm mình (Luật Double-Blind). |
| BR-04 | Trợ lý AI (AI Mentor) không thể tự động thay đổi điểm số hay lời nhận xét của sinh viên; nó chỉ có quyền đề xuất (suggest). |
| BR-05 | Điểm số cuối cùng của bài tập chỉ có thể được phê duyệt/ghi đè (approved/overridden) bởi Giảng viên (Teacher). |

### **5.2 Thông điệp Hệ thống (System Messages)**

| **#** | **Mã (Message code)** | **Loại thông báo (Message Type)** | **Ngữ cảnh (Context)** | **Nội dung (Content)** |
| :--- | :--- | :--- | :--- | :--- |
| 1 | MSG01 | Thông báo nổi (Toast message) | Nộp bài thành công | *Bài làm của bạn đã được nộp thành công. (Your assignment has been submitted successfully).* |
| 2 | MSG02 | Chữ đỏ, dưới ô nhập (In red, below box) | Trọng số Rubric không hợp lệ | *Tổng trọng số phải bằng 100%. Hiện tại đang là X%. (Total weight must equal 100%).* |
| 3 | MSG09 | Cùng dòng (In line) | Đăng nhập thất bại | *Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại. (Incorrect email or password).* |
| 4 | MSG12 | Thông báo nổi (Toast message) | Truy cập bị từ chối | *Tài khoản của bạn đã bị khóa hoặc bạn không có quyền. (Your account is blocked).* |
| 5 | MSG-AI1 | Cùng dòng, Cảnh báo (In line Warning) | Phát hiện ngôn từ độc hại | *Nhận xét của bạn có vẻ thiếu tính xây dựng. Hãy xem xét viết lại dựa trên Rubric.* |
