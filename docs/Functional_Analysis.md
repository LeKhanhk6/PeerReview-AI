# Tài liệu Phân tích Chi tiết Chức năng & Tính năng (Functional Analysis)
**Dự án: PeerReview-AI**

Tài liệu này đi sâu vào phân tích luồng nghiệp vụ (Business Logic), các ràng buộc (Constraints) và cơ chế hoạt động của từng tính năng cốt lõi trong hệ thống.

---

## 1. Module Quản lý Tài khoản & Phân quyền (Auth & RBAC)

### 1.1. Xác thực (Authentication)
- **Công nghệ:** Sử dụng JSON Web Token (JWT) kết hợp với Password Hashing (Bcrypt).
- **Quy trình bảo mật:**
  - Mật khẩu người dùng không bao giờ được lưu dưới dạng plaintext.
  - Token có thời hạn (Expiration) để giảm rủi ro bảo mật.
  - Hỗ trợ luồng Quên mật khẩu/Khôi phục mật khẩu (Gửi Token reset qua Email với hiệu lực 15 phút).

### 1.2. Phân quyền (Role-Based Access Control - RBAC)
Hệ thống sử dụng cơ chế kiểm tra Role ngay tại Middleware của Backend trước khi xử lý Logic.
- **ADMIN:** Quyền lực cao nhất. Quản trị hệ thống, xem Audit Logs, cấu hình System Config. (Ràng buộc: Không được phép tự hạ quyền hoặc tự khóa tài khoản của chính mình).
- **TEACHER:** Quyền quản lý lớp học. Được phép tạo bài tập, Rubric, xem báo cáo AI. Chỉ được phép truy cập vào dữ liệu của các Lớp học do chính Teacher đó tạo ra (Resource Ownership).
- **STUDENT:** Quyền tham gia. Chỉ được thao tác trong phạm vi Nhóm (Group) mà mình đã gia nhập.

---

## 2. Module Quản lý Lớp học & Bài tập (Class & Assignment)

### 2.1. Quản lý Lớp học (Class)
- Giảng viên tạo lớp với Mã mời (Invite Code) duy nhất.
- Sinh viên sử dụng Mã mời để gia nhập lớp. Điều này tự động hóa quá trình thêm thành viên thay vì Giảng viên phải add tay từng người.

### 2.2. Bài tập & Tiêu chí chấm điểm (Assignment & Rubric)
- Giảng viên tạo bài tập với Hạn nộp (Deadline) nghiêm ngặt.
- **Rubric:** Đây là "bộ luật" của bài tập. Mỗi tiêu chí (Criterion) có một mức Trọng số (Weight) riêng.
- **Ràng buộc quan trọng:** Tổng trọng số của tất cả các tiêu chí trong Rubric BẮT BUỘC phải bằng 100%. Nếu không, hệ thống sẽ từ chối lưu dữ liệu (Validation Error).

---

## 3. Module Không gian làm việc nhóm (Group Workspace)

Đây là nơi sinh viên hợp tác trước và sau khi nộp bài.
- **Tính năng Task (Kanban Board):** Sinh viên tạo, giao việc (Assign) và cập nhật trạng thái (TODO, IN PROGRESS, DONE). Mọi thành viên trong nhóm đều có quyền quản lý công việc chung để tối ưu hiệu quả nhóm.
- **Tính năng Discussion:** Mini-chat để thảo luận nội bộ.
- **Activity Tracker (Kẻ theo dõi thầm lặng):** Mọi thao tác (tạo task, chat, đổi trạng thái) đều được hệ thống backend lưu lại ngầm vào bảng `activity_logs`. Sinh viên không thể tự sửa hay xóa log này. Đây là dữ liệu cực kỳ quan trọng làm "thức ăn" cho thuật toán phân tích đóng góp.
- **Tính năng Đánh giá Nội bộ (Internal Evaluation Tab):** Cho phép các thành viên trong nhóm chấm điểm đóng góp lẫn nhau (C2, C3, C4) theo từng bài tập cụ thể với bộ chọn bài tập (Assignment Selector) linh hoạt và tự động quản lý cửa sổ thời gian chấm.

---

## 4. Module Nộp bài (Submission & Versioning)

- **Đại diện nộp bài:** Chỉ có Trưởng nhóm (Leader) hoặc người được ủy quyền mới được nộp bài.
- **Quản lý phiên bản (Versioning):**
  - Hệ thống không xóa file cũ nếu nộp lại.
  - Thay vào đó, mỗi lần nộp sẽ tạo ra một Phiên bản mới (Version 1, Version 2...).
  - Điều này giúp tránh mất mát dữ liệu và cho phép Giảng viên xem lại lịch sử làm bài của nhóm.

---

## 5. Module Đánh giá chéo Ẩn danh (Double-Blind Peer Review)

Đây là trái tim của hệ thống đánh giá.

### 5.1. Thuật toán phân công (Peer Allocation Algorithm)
Khi Giảng viên bấm "Chốt danh sách và Phân công", thuật toán backend sẽ chạy với các quy tắc nghiêm ngặt:
1. **Không tự chấm mình:** Nhóm A không bao giờ được phân công chấm bài của Nhóm A.
2. **Không chấm trùng:** Nhóm A không phải chấm 2 lần cho Nhóm B.
3. **Phân phối công bằng:** Số lượng bài mà mỗi nhóm phải chấm được chia đều nhất có thể.

### 5.2. Chấm chéo Ẩn danh 2 chiều (Double-Blind)
- Nhóm nộp bài không biết ai đang chấm bài của mình.
- Nhóm đi chấm không biết mình đang chấm bài của ai (Hiển thị "Nhóm ẩn danh #1234").
- **Lợi ích:** Xóa bỏ sự nể nang, thiên vị (Bias) hay thù hằn cá nhân giữa các sinh viên, giúp điểm số khách quan tuyệt đối.

---

## 6. Trí tuệ Nhân tạo Hỗ trợ & Thuật toán Phân tích Đóng góp (AI & Contribution Analytics)

Hệ thống tích hợp AI và thuật toán phân tích qua 4 tính năng chính nhằm hỗ trợ (Mentor), không nhằm thay thế con người.

### 6.1. AI Peer-Review Mentor (Dành cho Sinh viên)
- **Cơ chế Real-time:** Khi sinh viên đang gõ nhận xét trong lúc chấm bài, AI phân tích liên tục.
- **Phát hiện độc hại (Toxicity Detection):** Nếu có từ ngữ xúc phạm, chê bai cực đoan, AI sẽ nháy cảnh báo đỏ.
- **Đề xuất tính xây dựng (Constructive Suggestion):** Nếu sinh viên gõ quá ngắn ("Bài này hay"), AI sẽ nhắc nhở "Hãy chỉ ra cụ thể hay ở điểm nào dựa trên Rubric" và cho câu mẫu để sinh viên bấm "Áp dụng".

### 6.2. Phân tích đóng góp & Đánh giá Nội bộ (Contribution Analytics & Internal Peer Evaluation)
- **Mô hình Đánh giá Kết hợp 4 Chiều (C1 - C4):**
  - **Tự động (C1 - Auto Activity & Task Completion):** Tính toán từ 70% Tỷ lệ hoàn thành công việc được giao trên Kanban Board (`tasks`) và 30% Tần suất đóng góp thực tế trên hệ thống (`activity_logs`).
  - **Chấm chéo Nội bộ (C2, C3, C4 - Peer Ratings):** Các thành viên trong nhóm chấm điểm lẫn nhau qua 3 tiêu chí (thang 1-5 sao):
    - **C2 (Chất lượng công việc - Quality)**
    - **C3 (Tính đúng hạn - Timeliness)**
    - **C4 (Phối hợp & Giao tiếp - Teamwork)**
- **Công thức Điểm Tổng hợp ($S_i$) & Hệ số Nhân cá nhân ($G_{ind}$):**
  $$S_i = 0.35 \times \left(\frac{C1}{100}\right) + 0.30 \times \left(\frac{C2}{5}\right) + 0.20 \times \left(\frac{C3}{5}\right) + 0.15 \times \left(\frac{C4}{5}\right)$$
  - **Hệ số Nhân cá nhân:** $G_{ind} = \frac{S_i}{\text{mean}(S)}$ (dùng làm hệ số nhân vào điểm bài tập chung của nhóm để ra điểm cá nhân).
- **Phân loại Đóng góp (Classification):**
  - **High Contributor** ($G_{ind} \ge 1.2$): Đóng góp xuất sắc.
  - **Normal Contributor** ($0.8 \le G_{ind} < 1.2$): Đóng góp đạt yêu cầu.
  - **Low Contributor** ($0.5 \le G_{ind} < 0.8$): Đóng góp mức thấp.
  - **Free-rider** ($G_{ind} < 0.5$): Cảnh báo ăn bám / đóng góp quá yếu.
- **Biểu đồ Radar Năng lực (Group Radar Chart):** Quy đổi các chỉ số C1 (0-100) và C2-C4 (1-5 $\rightarrow$ 0-100%) lên cùng một hệ tọa độ Radar 4 chiều, hỗ trợ Giảng viên và Sinh viên so sánh trực quan độ lệch năng lực trong nhóm.
- **Cơ chế Đóng băng Snapshot Bất biến (Immutable Snapshot & Publish Flow):**
  - Khi Giảng viên duyệt & bấm **Publish Analytics**, hệ thống sẽ đóng băng kết quả (snapshot) và lưu vào bảng `contribution_metrics`.
  - Giúp bảo vệ dữ liệu đóng góp khỏi bị thay đổi sau khi đã chốt điểm. Sinh viên chỉ truy cập được bảng phân tích và biểu đồ sau khi Giảng viên công bố.

### 6.3. Cảnh báo sớm rủi ro (Early Warning / Collaboration Risk)
- Nếu nhóm không có hoạt động gì suốt nhiều ngày (Inactivity).
- Nếu AI phát hiện có thành viên 0% đóng góp.
- Hệ thống đẩy thông báo "Cờ đỏ" (Red Flag) hiển thị ngay trên Dashboard của Giảng viên để Giảng viên kịp thời can thiệp (ví dụ: gọi nhóm lên trao đổi).

### 6.4. AI Tổng hợp Báo cáo (Review Synthesis)
- **Vấn đề:** 1 bài tập có 20 nhóm, mỗi nhóm nhận được 3 phiếu đánh giá. Giảng viên phải đọc 60 phiếu đánh giá? Quá mệt mỏi!
- **Giải pháp AI:** 
  - Backend sử dụng AI để đọc (Clustering & Summarization) toàn bộ 60 phiếu đó.
  - Tổng hợp thành 1 bản báo cáo duy nhất dài 1 trang: "Những điểm mạnh chung của cả lớp là X", "Những lỗi sai phổ biến nhất là Y", "Đề xuất giảng viên nên dạy lại phần kiến thức Z".

---

## Tổng kết Nguyên lý thiết kế
Toàn bộ hệ thống được xây dựng trên triết lý **"Human-in-the-loop" (Con người là trung tâm)**. AI làm các việc nặng nhọc (thu thập dữ liệu, phân tích hàng nghìn dòng log, đọc hàng trăm văn bản, phát hiện rủi ro) nhưng **AI không bao giờ tự ra quyết định điểm số**. Điểm số và quyết định cuối cùng hoàn toàn thuộc về chuyên môn và quyền lực của Giảng viên.
