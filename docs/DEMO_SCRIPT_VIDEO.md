# KỊCH BẢN QUAY VIDEO DEMO SẢN PHẨM — PEERREVIEW-AI

> **Tài liệu hướng dẫn quay Video Demo Sản phẩm PeerReview-AI**
> **Tác giả:** Technical Project Assistant / Senior Developer
> **Phiên bản:** 2.0 (Kết hợp Luồng 9 Sinh viên & Analytics 30 Sinh viên)
> **Đơn vị áp dụng:** Dự án PeerReview-AI

---

## 🎬 TỔNG QUAN VIDEO DEMO

Video demo sản phẩm **PeerReview-AI** được cấu trúc thành **2 PHẦN LỚN** trình bày liên tục trong 1 video (hoặc 2 clip ghép lại):

- **PHẦN 1 (00:00 - 06:30): DEMO LUỒNG NGHIỆP VỤ HOÀN CHỈNH (END-TO-END WORKFLOW)**
  - **Môi trường thử nghiệm:** Lớp `SE301` - Kỹ thuật Phần mềm (9 sinh viên, 3 nhóm + 1 Giáo viên).
  - **Mục tiêu:** Trình bày chi tiết từng bước tương tác người dùng: từ khi Giáo viên khởi tạo lớp, tạo bài tập/rubric ➔ Sinh viên tham gia lớp, phân nhóm, làm việc workspace, nộp bài ➔ Chấm chéo ẩn danh (Double-Blind) + AI Peer-Review Mentor ➔ Chấm nội bộ C2-C4 ➔ Giáo viên tổng hợp AI Synthesis & Phát hiện Free-rider `vanf.sv09` ➔ Công bố kết quả & Sinh viên xem Biểu đồ Ra-đa.

- **PHẦN 2 (06:30 - 11:30): KẾT QUẢ THỬ NGHIỆM & ANALYTICS LỚP QUY MÔ LỚN (30 SINH VIÊN)**
  - **Môi trường thử nghiệm:** Lớp `CS201` - Lập trình Nâng cao (30 sinh viên, 6 nhóm + 1 Giáo viên).
  - **Mục tiêu:** Chứng minh sức mạnh của mô hình định lượng đa chiều ($C_1 - C_4$), Hệ thống Cảnh báo Sớm (Early Warning Board phát hiện 3 rủi ro nhóm bao gồm Free-rider `vanf.sv21`), và tốc độ AI Review Synthesis xử lý 24 bản chấm chéo.

---

## 🔑 DANH SÁCH TÀI KHOẢN SỬ DỤNG TRONG DEMO

> **Mật khẩu dùng chung cho TẤT CẢ tài khoản:** `Password123!`

### 👨‍🏫 Tài khoản Giáo viên (Dùng chung cho cả 2 phần)
- **Email:** `teacher.nguyen@peerreview.ai` | **Họ tên:** Thầy Nguyễn Văn A

### 👨‍🎓 Tài khoản Sinh viên đại diện trong Video:
- **Phần 1 (Lớp SE301 - 9 sinh viên):**
  - **Nhóm 01 (Alpha Team):** `tranmai.sv01@peerreview.ai` (Trần Thị Mai - Leader), `levanc.sv02@peerreview.ai` (Lê Văn Hùng), `vanf.sv09@peerreview.ai` (Hoàng Văn Lười)
  - **Nhóm 02 (Beta Innovators):** `phamminhd.sv03@peerreview.ai` (Phạm Minh Dũng - Leader), `tuananh.sv04@peerreview.ai` (Nguyễn Tuấn Anh), `vuquoch.sv05@peerreview.ai` (Vũ Quốc Huy)
  - **Nhóm 03 (Gamma Coders):** `baohai.sv06@peerreview.ai` (Đặng Bảo Hải - Leader), `ducminh.sv07@peerreview.ai` (Ngô Đức Minh), `thungan.sv08@peerreview.ai` (Dương Thu Ngân - Free-rider)
- **Phần 2 (Lớp CS201 - 30 sinh viên):**
  - **Sinh viên tiêu biểu (Leader Nhóm 1):** `tranmai.sv01@peerreview.ai` (Trần Thị B)
  - **Sinh viên Free-rider Nhóm 5:** `vanf.sv21@peerreview.ai` (Vũ Văn F)

---

# 🎥 PHẦN 1: DEMO LUỒNG NGHIỆP VỤ HOÀN CHỈNH (9 SINH VIÊN - LỚP SE301)
*(Thời lượng gợi ý: 6 - 7 phút)*

### 🎯 Mục tiêu:
Kinh qua toàn bộ trải nghiệm người dùng thực tế theo đúng kịch bản nghiệp vụ chi tiết của 9 sinh viên chia làm 3 nhóm.

---

### 📍 MÀN 1: GIÁO VIÊN ĐĂNG NHẬP, TẠO LỚP HỌC & XÂY DỰNG RUBRIC
- **Góc quay:** Màn hình Teacher Dashboard.
- **Tài khoản:** `teacher.nguyen@peerreview.ai`
- **Hành động trên UI:**
  1. Đăng nhập với vai trò **Giáo viên**.
  2. Bấm **Tạo lớp học mới**:
     - *Mã môn:* `SE301` | *Tên môn:* `Kỹ thuật Phần mềm`
     - *Tên lớp:* `Lớp SE301 - Kỹ thuật Phần mềm HK1`
     - *Mã mời:* `SE301TEST` | *Học kỳ:* `HK1-2025-2026`
  3. Chọn Lớp `SE301` ➔ Bấm **Tạo bài tập mới**:
     - *Tiêu đề:* `Đồ án Kỹ thuật Phần mềm: Xây dựng Web Học tập Trực tuyến`
     - *Mô tả:* `Xây dựng ứng dụng Web Full-stack hỗ trợ đăng ký học phần, nộp bài tập và tương tác nhóm.`
     - *Yêu cầu:* `Frontend dùng ReactJS, Backend Node.js REST API, CSDL PostgreSQL. Đính kèm link Github và Slide báo cáo.`
     - *Hạn nộp:* Đặt mốc thời gian sau 7 ngày.
  4. Thiết lập **Khung tiêu chí đánh giá (Rubric)** (3 Tiêu chí):
     - **Tiêu chí 1:** `Kiến trúc & RESTful API Backend` (Trọng số `40.00%`) — *API thiết kế chuẩn RESTful, xử lý ngoại lệ tốt, phân tầng logic rõ ràng.*
     - **Tiêu chí 2:** `Giao diện UI/UX & Trải nghiệm` (Trọng số `30.00%`) — *Giao diện mượt mà, phối màu hài hòa, đáp ứng responsive trên điện thoại.*
     - **Tiêu chí 3:** `Tài liệu Kỹ thuật & Sơ đồ CSDL` (Trọng số `30.00%`) — *Tài liệu README chi tiết, sơ đồ ERD CSDL và hướng dẫn chạy ứng dụng.*
- **Lời thoại / Thuyết minh:**
  > *"Đầu tiên, Giáo viên đăng nhập vào hệ thống PeerReview-AI, khởi tạo Lớp học SE301 với Mã mời SE301TEST và tạo Bài tập đồ án Kỹ thuật Phần mềm. Giáo viên thiết lập khung Rubric 3 tiêu chí minh bạch với tổng trọng số 100%. Rubric này sẽ được áp dụng xuyên suốt cho quá trình chấm chéo ẩn danh."*

---

### 📍 MÀN 2: SINH VIÊN THAM GIA LỚP, PHÂN NHÓM & QUẢN LÝ GROUP WORKSPACE
- **Góc quay:** Màn hình Student Dashboard & Group Workspace.
- **Tài khoản:** `tranmai.sv01@peerreview.ai` (Trần Thị Mai - Leader Nhóm 01 - Alpha Team)
- **Hành động trên UI:**
  1. Đăng nhập vai trò **Sinh viên**.
  2. Bấm **Tham gia lớp học** ➔ Nhập Mã mời `SE301TEST` ➔ Gia nhập thành công Lớp `SE301`.
  3. Truy cập vào **Group Workspace** của `Nhóm 01 - Alpha Team` (cùng 2 thành viên `levanc.sv02` và `vanf.sv09`).
  4. **Quản lý Task:** Mở Board công việc, tạo các nhiệm vụ:
     - `Thiết kế CSDL PostgreSQL` (Giao cho `tranmai.sv01`, trạng thái `DONE`)
     - `Viết API Auth JWT` (Giao cho `levanc.sv02`, trạng thái `DONE`)
     - `Xây dựng UI Dashboard` (Giao cho `vanf.sv09`, trạng thái `DONE`)
  5. **Thảo luận (Discussion):** Nhập tin nhắn: *"Đã khởi tạo repo Github cho đồ án, các bạn vào pull code về làm nhé!"*
  6. Mở tab **Activity Log**: Cho thấy toàn bộ thao tác tạo task, thảo luận và nộp tài liệu đều được hệ thống tự động ghi lại thời gian thực để làm căn cứ tính chỉ số đóng góp $C_1$.
- **Lời thoại / Thuyết minh:**
  > *"Sinh viên đăng nhập, nhập mã SE301TEST để vào lớp và truy cập Group Workspace. Nhóm phân công task, thảo luận công việc và tải lên tài liệu. Mọi tương tác của các thành viên đều được hệ thống tự động lưu vào Activity Log để tính toán chỉ số đóng góp cá nhân $C_1$."*

---

### 📍 MÀN 3: NHÓM SINH VIÊN NỘP BÀI TẬP (SUBMISSION & VERSIONING)
- **Góc quay:** Màn hình Submit Assignment của Student.
- **Tài khoản:** `tranmai.sv01@peerreview.ai`
- **Hành động trên UI:**
  1. Mở trang bài tập `Đồ án Kỹ thuật Phần mềm: Xây dựng Web Học tập Trực tuyến`.
  2. Nhập URL file đính kèm: `https://storage.peerreview.ai/submissions/se301_group01_v1.pdf` và link Repository Github.
  3. Bấm **Nộp bài tập**.
  4. Giao diện báo trạng thái **SUBMITTED (Version 1)** kèm mốc thời gian nộp hợp lệ.
  5. Minh họa ngắn tính năng **Submission Versioning** (cho phép nộp cập nhật phiên bản trước deadline).
- **Lời thoại / Thuyết minh:**
  > *"Nhóm trưởng đại diện nộp bài làm lên hệ thống. PeerReview-AI tự động ghi nhận phiên bản nộp bài (Versioning), lưu trữ đường link báo cáo và mã nguồn an toàn trên hệ thống."*

---

### 📍 MÀN 4: THUẬT TOÁN PHÂN CÔNG CHẤM CHÉO ẨN DANH (DOUBLE-BLIND PEER ALLOCATION)
- **Góc quay:** Màn hình Phân công Chấm chéo của Teacher.
- **Tài khoản:** `teacher.nguyen@peerreview.ai`
- **Hành động trên UI:**
  1. Giáo viên quay lại Teacher Dashboard ➔ Vào trang Bài tập Lớp `SE301`.
  2. Nhấn nút **Kích hoạt Thuật toán Phân công Chấm chéo (Double-Blind Allocation)**.
  3. Hệ thống hiển thị kết quả phân công xoay vòng tự động giữa 3 nhóm:
     - Nhóm 01 (Alpha Team) ➔ Chấm bài Nhóm 02 (Beta Innovators)
     - Nhóm 02 (Beta Innovators) ➔ Chấm bài Nhóm 03 (Gamma Coders)
     - Nhóm 03 (Gamma Coders) ➔ Chấm bài Nhóm 01 (Alpha Team)
  4. Nhấn mạnh tính năng **Sanitization (Ẩn danh hóa 100%)**: Mọi tên sinh viên, tên nhóm, MSSV của bài làm được chấm đều bị gỡ bỏ, chỉ hiển thị tên mã hóa: `Nhóm Ẩn Danh #02`.
- **Lời thoại / Thuyết minh:**
  > *"Hết hạn nộp bài, Giáo viên kích hoạt thuật toán phân công chấm chéo tự động. Hệ thống phân công theo sơ đồ xoay vòng và tự động ẩn danh 100% dữ liệu bài nộp (Double-Blind Peer Review), loại bỏ hoàn toàn thiên vị hay tâm lý nể dội."*

---

### 📍 MÀN 5: SINH VIÊN ĐÁNH GIÁ CHÉO & TRỢ LÝ AI PEER-REVIEW MENTOR HỖ TRỢ
- **Góc quay:** Màn hình Peer Review Screen của Student.
- **Tài khoản:** `tranmai.sv01@peerreview.ai`
- **Hành động trên UI:**
  1. Sinh viên vào tab **Bài cần Chấm chéo** ➔ Mở bài của `Nhóm Ẩn Danh #02`.
  2. Đọc file bài làm, nhập điểm cho 3 tiêu chí Rubric:
     - *Kiến trúc & RESTful API Backend:* `9.0 / 10`
     - *Giao diện UI/UX & Trải nghiệm:* `9.0 / 10`
     - *Tài liệu Kỹ thuật & Sơ đồ CSDL:* `9.0 / 10`
  3. Thử gõ một lời nhận xét sơ sài/tiêu cực: *"Bài nộp làm sơ sài quá, giao diện xấu quắc không dùng được."*
  4. Trợ lý **AI Peer-Review Mentor** tự động phân tích (Debounce 1.5s):
     - AI đưa ra cảnh báo: 🔴 **Toxicity High / Thiếu tính đóng góp xây dựng**.
     - AI đề xuất câu sửa đổi văn minh: *"Bài làm đã hoàn thiện đầy đủ chức năng REST API Backend sạch sẽ. Tuy nhiên tài liệu README còn hơi sơ sài, cần bổ sung thêm sơ đồ ERD CSDL để người đọc dễ theo dõi hơn."*
  5. Sinh viên nhấn **Áp dụng gợi ý của AI** và nhấn **Gửi Đánh giá (Submit Review)**.
- **Lời thoại / Thuyết minh:**
  > *"Điểm đặc biệt ở đây là Trợ lý AI Peer-Review Mentor. Nếu sinh viên nhập nhận xét mang tính chỉ trích hoặc hời hợt, AI sẽ lập tức phân tích và đóng vai trò người thầy gợi ý lại câu nhận xét chuẩn mực, mang tính đóng góp cao trước khi gửi đi."*

---

### 📍 MÀN 6: CHẤM CHÉO NỘI BỘ NHÓM (INTERNAL EVALUATION C2 - C4)
- **Góc quay:** Màn hình Internal Evaluation Form của Student.
- **Tài khoản:** `tranmai.sv01@peerreview.ai`
- **Hành động trên UI:**
  1. Sinh viên mở tab **Đánh giá Đóng góp Nội bộ Nhóm**.
  2. Hệ thống hiển thị danh sách các thành viên cùng nhóm: `Lê Văn Hùng` (`levanc.sv02`) và `Hoàng Văn Lười` (`vanf.sv09`).
  3. Nhập điểm 1 – 5 sao cho 3 tiêu chí:
     - $C_2$ (*Artifact Quality - Chất lượng sản phẩm*)
     - $C_3$ (*Timeliness - Đúng hạn*)
     - $C_4$ (*Teamwork & Discipline - Tương tác & Kỷ luật*)
  4. Nhấn **Lưu Đánh giá Nội bộ**.
- **Lời thoại / Thuyết minh:**
  > *"Sau đó, sinh viên thực hiện Chấm điểm Đóng góp Nội bộ ($C_2, C_3, C_4$) cho các đồng đội trong nhóm. Dữ liệu chấm này hoàn toàn riêng tư và ẩn danh, giúp phản ánh chính xác thái độ làm việc của từng cá nhân."*

---

### 📍 MÀN 7: TEACHER ANALYTICS, AI REVIEW SYNTHESIS & CẢNH BÁO RỦI RO (NHÓM 2 & NHÓM 3)
- **Góc quay:** Màn hình Teacher Analytics Dashboard & Early Warnings Board.
- **Tài khoản:** `teacher.nguyen@peerreview.ai`
- **Hành động trên UI:**
  1. Giáo viên truy cập **Teacher Analytics Dashboard** lớp `SE301`.
  2. **AI Review Synthesis:** Nhấn nút **Tổng hợp AI**. Hệ thống AI quét toàn bộ phiếu chấm chéo và tạo ngay báo cáo tóm tắt ưu nhược điểm bài làm cả lớp.
  3. **Bảng Cảnh báo Rủi ro Sớm (Early Warning Board):** Hệ thống quét phân tích định lượng và đưa ra các cảnh báo cụ thể cho **Nhóm 2** và **Nhóm 3** (Nhóm 1 hoạt động tốt không có cảnh báo):
     - 🔴 **Cảnh báo Free-rider (`LOW_CONTRIBUTION`) (Nhóm 3):** Sinh viên `Dương Thu Ngân` (`thungan.sv08@peerreview.ai` - Nhóm 3) có $C_1 = 0.00$ (không có task/hoạt động) và điểm chấm nội bộ từ đồng đội chỉ đạt 1.0/5 sao. Điểm quy đổi cá nhân $S_i = 0.40$.
     - 🟠 **Cảnh báo Phân chia công việc không đều (`UNBALANCED_CONTRIBUTION`) (Nhóm 2):** Trưởng nhóm `phamminhd.sv03` đảm nhận 80% khối lượng task của nhóm, tạo chênh lệch đóng góp lớn.
     - 🟡 **Cảnh báo Mức độ tương tác thấp (`LOW_ACTIVITY`) (Nhóm 3):** Sinh viên `ducminh.sv07` chưa phát sinh tương tác thảo luận trên Group Workspace.
  4. Giáo viên duyệt kết quả và bấm **Publish Analytics** (Công bố báo cáo).
- **Lời thoại / Thuyết minh:**
  > *"Tại Teacher Dashboard, AI Review Synthesis giúp Giáo viên tóm tắt ưu nhược điểm bài làm của cả lớp chỉ trong vài giây. Đồng thời, hệ thống Early Warning Board tự động phân tích và đưa ra 3 loại cảnh báo thực tế ở Nhóm 2 và Nhóm 3: Cảnh báo Free-rider, Cảnh báo lệch pha công việc và Cảnh báo thiếu tương tác."*


---

### 📍 MÀN 8: SINH VIÊN XEM BÁO CÁO CÁ NHÂN & BIỂU ĐỒ RA-ĐA
- **Góc quay:** Màn hình Personal Analytics của Student.
- **Tài khoản:** `tranmai.sv01@peerreview.ai`
- **Hành động trên UI:**
  1. Sinh viên đăng nhập lại ➔ Mở trang **Báo cáo Cá nhân**.
  2. Hiển thị thông báo: *Kết quả đã được Giáo viên công bố*.
  3. Xem **Biểu đồ Ra-đa 4 trục ($C_1, C_2, C_3, C_4$)** căng rộng thể hiện năng lực xuất sắc và Điểm đóng góp cá nhân $S_i \ge 1.0$.
- **Lời thoại / Thuyết minh:**
  > *"Sinh viên truy cập lại hệ thống để xem Biểu đồ Ra-đa thể hiện trực quan mức độ đóng góp cá nhân ở cả 4 tiêu chí, đảm bảo sự công bằng và minh bạch tuyệt đối."*

---

# 📊 PHẦN 2: KẾT QUẢ THỬ NGHIỆM & ANALYTICS LỚP QUY MÔ LỚN (30 SINH VIÊN - LỚP CS201)
*(Thời lượng gợi ý: 4 - 5 phút)*

### 🎯 Mục tiêu:
Chứng minh tính mở rộng, độ chính xác của thuật toán phân tích rủi ro làm việc nhóm và tốc độ xử lý AI trên dữ liệu lớp học quy mô 30 sinh viên (6 nhóm).

---

### 📍 MÀN 1: TỔNG QUAN DỮ LIỆU LỚP CS201 (30 SINH VIÊN, 6 NHÓM)
- **Góc quay:** Màn hình Teacher Class Overview & Metrics.
- **Tài khoản:** `teacher.nguyen@peerreview.ai`
- **Hành động trên UI:**
  1. Chuyển sang Lớp `CS201 - Lập trình Nâng cao`.
  2. Trình bày các con số thống kê quy mô lớn:
     - 🎓 **Tổng số sinh viên:** 30 sinh viên
     - 👥 **Số nhóm học tập:** 6 nhóm (Nhóm 01 ➔ Nhóm 06)
     - 📂 **Tỷ lệ nộp bài (Submission Rate):** 100% (6/6 nhóm)
     - 📝 **Tỷ lệ hoàn thành Peer Review:** 100% (12/12 phiếu chấm chéo chính thức do 6 Trưởng nhóm nộp — mỗi nhóm đại diện chấm chéo 2 bài tập của nhóm khác)
     - ⏱️ **Tỷ lệ chấm nội bộ:** 100% (30/30 sinh viên)
- **Lời thoại / Thuyết minh:**
  > *"Tiếp theo, chúng ta cùng kiểm chứng khả năng vận hành của PeerReview-AI trên dữ liệu thực tế của một lớp học lớn gồm 30 sinh viên chia làm 6 nhóm. Hệ thống tự động phân công mỗi nhóm chấm chéo 2 bài tập khác nhau. Dữ liệu lớp CS201 đã hoàn tất 100% bài nộp và 12 phiếu chấm chéo chính thức do các Trưởng nhóm nộp sau khi thảo luận nhóm."*

---

### 📍 MÀN 2: BẢNG PHÂN TÍCH CHỈ SỐ CÁ NHÂN (C1-C4) & SO SÁNH PHÂN HOÁ DỮ LIỆU
- **Góc quay:** Màn hình Contribution Analytics Table & Radar Comparison.
- **Tài khoản:** `teacher.nguyen@peerreview.ai`
- **Hành động trên UI:**
  1. Mở bảng **Báo cáo Đóng góp Cá nhân (Contribution Metrics Table)** 30 sinh viên.
  2. **So sánh Nhóm 1 (High Performers) vs Nhóm 5 (High Risk):**
     - **Nhóm 1:** 5 thành viên có biểu đồ Ra-đa căng rộng cân đối, chỉ số $C_1 \ge 0.8$, $S_i \approx 1.05 - 1.15$.
     - **Nhóm 5:** Chọn sinh viên `Vũ Văn F` (`vanf.sv21@peerreview.ai`): $C_1 = 0.12$ (Activity log rất thấp), điểm $C_2, C_3, C_4$ chỉ 1.5/5. Điểm quy đổi $S_i = 0.45$ ➔ Hệ thống tự động gán nhãn 🔴 **Potential Free-rider**.
- **Lời thoại / Thuyết minh:**
  > *"Bảng chỉ số đóng góp phân hoá vô cùng rõ ràng: Với Nhóm 1 xuất sắc, biểu đồ Ra-đa của các thành viên phát triển toàn diện. Trong khi ở Nhóm 5, sinh viên Vũ Văn F có Activity Log cực kỳ khiêm tốn và nhận điểm chấm nội bộ kém, lập tức bị phân loại là Potential Free-rider."*

---

### 📍 MÀN 3: BẢNG CẢNH BÁO SỚM (EARLY WARNING BOARD - 3 CẢNH BÁO RỦI RO)
- **Góc quay:** Màn hình Early Warnings Panel.
- **Tài khoản:** `teacher.nguyen@peerreview.ai`
- **Hành động trên UI:**
  1. Mở Bảng điều khiển **Early Warning Board / Collaboration Risks**.
  2. Trình bày **3 Cảnh báo Rủi ro thực tế** được thuật toán phát hiện tự động:
     - 🔴 **Warning 1 (Free-rider Alert):** Sinh viên `Vũ Văn F` (`vanf.sv21` - Nhóm 5) — *Tỷ lệ đóng góp $S_i = 0.45$, Activity Log chiếm dưới 5% cả nhóm.*
     - 🟠 **Warning 2 (Unbalanced Contribution):** Nhóm 03 — *Chênh lệch đóng góp quá lớn giữa Trưởng nhóm (đảm nhận 70% công việc) và các thành viên.*
     - 🟡 **Warning 3 (Review Inactivity):** Sinh viên `student14` — *Bỏ quên nhiệm vụ chấm chéo quá hạn 24 giờ.*
  3. Thao tác nhấp nút **Send Notification** để phát thông báo nhắc nhở tự động tới các sinh viên rủi ro.
- **Lời thoại / Thuyết minh:**
  > *"Bảng Early Warning Board quét tự động 30 sinh viên và đưa ra ngay 3 cảnh báo rủi ro chính xác: Cảnh báo Free-rider, Cảnh báo lệch pha đóng góp trong nhóm, và Cảnh báo bỏ quên nhiệm vụ chấm chéo. Giáo viên có thể gửi thông báo can thiệp chỉ với 1 click."*

---

### 📍 MÀN 4: HIỆU QUẢ CỦA AI REVIEW SYNTHESIS TRÊN 12 PHIẾU CHẤM CHÉO CHÍNH THỨC
- **Góc quay:** Màn hình AI Review Synthesis dành cho Giáo viên.
- **Tài khoản:** `teacher.nguyen@peerreview.ai`
- **Hành động trên UI:**
  1. Mở tab **AI Synthesis Tổng hợp Lớp CS201**.
  2. Thể hiện tốc độ xử lý: AI phân tích đồng thời **12 phiếu chấm chéo chính thức** (với tổng cộng 36 tiêu chí nhận xét chi tiết do 6 Trưởng nhóm nộp cho 2 bài được phân công) trong chưa đầy **3 giây**.
  3. Báo cáo xuất ra chuẩn mực:
     - 🟢 **Điểm mạnh lớp học:** 85% bài nộp có cấu trúc Backend chuẩn RESTful API, chia layer logic rõ ràng.
     - 🔴 **Điểm yếu phổ biến:** Thiếu middleware xử lý lỗi tập trung, UI trên điện thoại bị vỡ khung.
     - 💡 **Đề xuất giảng dạy:** Dành 20 phút đầu buổi tới để hướng dẫn về Global Error Handler trong Express.js.
- **Lời thoại / Thuyết minh:**
  > *"Thay vì mất nhiều giờ đọc toàn bộ các phiếu review chi tiết của các nhóm, tính năng AI Review Synthesis tổng hợp toàn bộ bức tranh học tập của cả lớp từ 12 bản chấm chéo chính thức trong chưa đầy 3 giây, giúp Giáo viên nắm bắt ngay các vấn đề kiến thức của học sinh."*

---

### 📍 MÀN 5: TỔNG KẾT & THÔNG ĐIỆP SẢN PHẨM PEERREVIEW-AI
- **Góc quay:** Màn hình Landing Page / Full System Dashboard.
- **Lời thoại / Thuyết minh:**
  > *"Tóm lại, PeerReview-AI mang lại giải pháp toàn diện cho 3 thách thức lớn trong học tập nhóm: (1) Loại bỏ tình trạng Free-rider nhờ dữ liệu định lượng 4 chiều minh bạch, (2) Đột phá chất lượng phản biện với Trợ lý AI Peer-Review Mentor, và (3) Tối ưu 80% công sức cho Giáo viên bằng AI Synthesis và Early Warning System. Cảm ơn Thầy Cô và các bạn đã theo dõi video!"*

---

## 📋 CHECKLIST CHUẨN BỊ KHI QUAY

1. [ ] **Dữ liệu Database:** 
   - Chạy `backend/scripts/seed_test_9students.sql` (Cho Phần 1 - Lớp SE301).
   - Chạy `backend/scripts/seed_demo_30students.sql` (Cho Phần 2 - Lớp CS201).
2. [ ] **Môi trường Server:**
   - Backend: `npm run dev` (Port 5000)
   - Frontend: `npm run dev` (Port 5173 / 3000)
3. [ ] **Trình duyệt:** Chrome Incognito hoặc 2 Profile (1 Profile Giáo viên, 1 Profile Sinh viên `tranmai.sv01@peerreview.ai`). Độ phân giải 1080p.
