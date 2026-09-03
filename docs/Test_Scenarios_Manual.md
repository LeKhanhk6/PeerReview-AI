# Kịch bản Kiểm thử Hệ thống (Manual Testing & UAT)
**Dự án: PeerReview-AI**

Tài liệu này được soạn thảo dành riêng cho các thành viên trong nhóm tham gia kiểm thử (Manual Testing / User Acceptance Testing). Tài liệu cung cấp cái nhìn tổng quan về hệ thống và hướng dẫn từng bước (step-by-step) để chạy các kịch bản kiểm thử, đảm bảo bao phủ toàn bộ chức năng, nghiệp vụ và phân quyền (Roles) của hệ thống.

---

## PHẦN 1: GIỚI THIỆU TỔNG QUAN VỀ DỰ ÁN

### 1.1. Bối cảnh và Bài toán thực tế
Trong phương pháp học tập hiện đại, làm việc nhóm (Teamwork) là một kỹ năng thiết yếu. Tuy nhiên, ở các trường Đại học và cơ sở giáo dục hiện nay, việc tổ chức các bài tập nhóm thường gặp phải **2 vấn đề nhức nhối** sau:
1. **Sự bất công trong đánh giá (Vấn đề "Free-rider" - Kẻ ăn bám):** Giảng viên rất khó để biết chính xác sinh viên nào thực sự làm việc, sinh viên nào "ngồi mát ăn bát vàng". Việc đánh giá điểm chung cho cả nhóm thường gây bức xúc cho những người đóng góp nhiều.
2. **Chất lượng chấm chéo (Peer-Review) rất thấp:** Việc cho các nhóm sinh viên chấm điểm bài làm của nhau là một cách tốt để học hỏi, nhưng thực tế sinh viên thường chấm qua loa, cho điểm tối đa vì nể nang, hoặc để lại những lời nhận xét hời hợt, đôi khi mang tính công kích cá nhân, thiếu tính xây dựng.

### 1.2. PeerReview-AI là gì?
**PeerReview-AI** là hệ thống Web tích hợp Trí tuệ Nhân tạo (AI) được sinh ra để giải quyết triệt để 2 bài toán trên. Đây không chỉ là một nền tảng nộp bài thông thường như Google Classroom hay Moodle, mà là một **"Hệ sinh thái đánh giá chất lượng cao"**.

Hệ thống giúp số hóa toàn bộ quy trình: từ lúc giảng viên giao đề, sinh viên chia việc trong nhóm, nộp bài, cho đến khi hệ thống tự động xáo trộn bài để các nhóm chấm chéo lẫn nhau một cách ẩn danh hoàn toàn (Double-Blind).

### 1.3. Sức mạnh của Trí tuệ Nhân tạo (AI) trong dự án
Điểm làm nên sự khác biệt của PeerReview-AI chính là sự tham gia của AI trong vai trò **Trợ lý (Mentor) và Giám sát viên**:
- **AI Peer-Review Mentor (Hỗ trợ sinh viên):** Khi sinh viên gõ lời nhận xét cho bài của nhóm khác, AI sẽ đọc và phân tích theo thời gian thực (Real-time). Nếu câu từ quá hời hợt hoặc mang tính xúc phạm, AI sẽ "tuýt còi" và gợi ý cách hành văn mang tính xây dựng, bám sát các tiêu chí chấm điểm (Rubric).
- **AI Contribution Analytics (Hỗ trợ giảng viên):** Dựa vào lịch sử thảo luận, chia task và nộp file của sinh viên, AI sẽ tự động phân loại xem ai là người đóng góp chính (High Contributor), ai là người ỷ lại (Free-rider) và gửi Cảnh báo sớm (Early Warning) cho giảng viên.
- **AI Review Synthesis (Tổng hợp báo cáo):** Thay vì phải đọc hàng trăm phiếu chấm chéo của sinh viên, giảng viên chỉ cần bấm 1 nút, AI sẽ đọc toàn bộ và tóm tắt thành 1 bản báo cáo duy nhất (những lỗi sai phổ biến nhất, những điểm sáng của lớp).

*Nguyên tắc cốt lõi của hệ thống:* AI không quyết định điểm số thay con người. AI chỉ đóng vai trò phân tích, cảnh báo và gợi ý. Giảng viên luôn là người chốt điểm cuối cùng.

### 1.4. Các Role (Vai trò) trong hệ thống
Hệ thống phân quyền vô cùng chặt chẽ, đảm bảo tính bảo mật và trải nghiệm riêng biệt cho 3 nhóm người dùng:
1. **Quản trị viên (ADMIN):** Quản lý tài khoản (khóa/mở), xem log hoạt động (Audit logs) và cấu hình hệ thống.
2. **Giảng viên (TEACHER):** Là người điều phối chính. Tạo lớp học, ra đề bài, tạo phiếu chấm (Rubric), theo dõi tiến độ nhóm, theo dõi cảnh báo từ AI và xem báo cáo tổng hợp.
3. **Sinh viên (STUDENT):** Là người thực thi. Tham gia vào nhóm, chia việc (Task), chat nhóm, nộp file, và thực hiện chấm chéo ẩn danh các nhóm khác với sự hướng dẫn của AI Mentor.

---

## PHẦN 2: CHUẨN BỊ MÔI TRƯỜNG KIỂM THỬ

Trước khi bắt đầu, các Tester cần đảm bảo sử dụng các tài khoản có sẵn trong cơ sở dữ liệu mẫu (Seed Data) hoặc tự đăng ký tài khoản mới:
- **Link truy cập:** `http://localhost:5173` (Hoặc đường dẫn server nếu đã Deploy).
- **Tài khoản Admin (Mẫu):** `admin@example.com` | Pass: `password123`
- **Tài khoản Giảng viên (Mẫu):** `teacher01@example.com` | Pass: `password123`
- **Tài khoản Sinh viên (Mẫu):** `student01@example.com`, `student02@example.com` | Pass: `password123`

---

## PHẦN 3: KỊCH BẢN ROLE (PHÂN QUYỀN TRUY CẬP)

Kịch bản này đảm bảo tính bảo mật, người dùng ở Role nào chỉ được thấy và thao tác các chức năng của Role đó.

### Test Case R1: Kiểm tra quyền của Sinh viên (STUDENT)
- **Bước 1:** Đăng nhập bằng tài khoản `student01@example.com`.
- **Bước 2:** Nhìn vào thanh điều hướng (Sidebar/Navbar). Kiểm tra xem có thấy các menu như "Quản lý Lớp học", "Quản lý Người dùng" (của Teacher/Admin) hay không.
- **Kết quả mong đợi:** Giao diện chỉ hiển thị Dashboard sinh viên, Bài tập của tôi, Nhóm của tôi, Hòm thư phản biện. Thử gõ trực tiếp URL `/teacher/dashboard` lên thanh địa chỉ, hệ thống phải báo lỗi 403 (Forbidden) hoặc đá văng về trang chủ.

### Test Case R2: Kiểm tra quyền của Giảng viên (TEACHER)
- **Bước 1:** Đăng xuất và đăng nhập bằng tài khoản `teacher01@example.com`.
- **Bước 2:** Nhìn vào thanh điều hướng.
- **Kết quả mong đợi:** Thấy các menu: Lớp học đang dạy, Quản lý Bài tập, Dashboard thống kê. Không thấy phần "Nhóm của tôi" hay "Hòm thư phản biện" của sinh viên. Không thấy phần "Quản lý tài khoản" của Admin.

### Test Case R3: Kiểm tra quyền của Quản trị viên (ADMIN)
- **Bước 1:** Đăng xuất và đăng nhập bằng tài khoản `admin@example.com`.
- **Bước 2:** Nhìn vào thanh điều hướng.
- **Kết quả mong đợi:** Thấy các menu: Quản lý Người dùng, Cấu hình Hệ thống, Bảng điều khiển (Dashboard). Không có quyền xem hay nộp bài tập của sinh viên.

---

## PHẦN 4: KỊCH BẢN CHỨC NĂNG (FUNCTIONAL SCENARIOS)

Kiểm thử chức năng lẻ của hệ thống.

### Test Case F1: Đăng nhập, Đăng ký & Quên mật khẩu
- **Bước 1:** Vào trang Đăng nhập. Nhập sai mật khẩu và nhấn Đăng nhập.
- **Bước 2:** Nhập đúng mật khẩu (`password123`).
- **Bước 3:** Thử chức năng "Quên mật khẩu" bằng cách nhập email `student01@example.com`.
- **Kết quả mong đợi:** Lần sai báo lỗi "Sai tài khoản hoặc mật khẩu". Lần đúng vào Dashboard. Quên mật khẩu gửi email khôi phục thành công.

### Test Case F2: Giảng viên tạo và sửa Bài tập & Rubric
- **Bước 1:** Đăng nhập tài khoản Teacher.
- **Bước 2:** Vào menu "Quản lý Bài tập" -> Nhấn "Tạo bài tập mới".
- **Bước 3:** Điền tên bài tập (VD: Báo cáo giữa kỳ), chọn Lớp học, thiết lập Hạn nộp (Deadline).
- **Bước 4:** Ở phần Rubric, thêm 2 tiêu chí: "Nội dung" (Trọng số 60%) và "Trình bày" (Trọng số 40%). Nhấn Lưu.
- **Bước 5:** Thử vào lại bài tập vừa tạo để sửa trọng số Rubric (50% - 50%).
- **Kết quả mong đợi:** Lưu thành công ở cả 2 lần (Tạo mới và Chỉnh sửa). Tổng trọng số không đủ 100% hệ thống phải báo lỗi.

### Test Case F3: Không gian làm việc nhóm của Sinh viên (Group Workspace)
- **Bước 1:** Đăng nhập tài khoản Student (Trưởng nhóm).
- **Bước 2:** Vào "Nhóm của tôi" -> Chọn nhóm tương ứng với bài tập.
- **Bước 3:** Vào tab "Công việc (Tasks)". Tạo 1 task mới và gán (assign) cho một thành viên khác.
- **Bước 4:** Vào tab "Thảo luận (Discussions)". Gửi 1 tin nhắn vào nhóm.
- **Kết quả mong đợi:** Task mới và tin nhắn hiển thị ngay lập tức. Hệ thống ngầm ghi nhận (Activity Logs) các hành động này.

### Test Case F4: Sinh viên Nộp bài tập
- **Bước 1:** Vẫn ở tài khoản Student (Trưởng nhóm).
- **Bước 2:** Vào tab Nộp bài (Submission).
- **Bước 3:** Tải lên một tệp PDF/Word bất kỳ, điền nội dung note, nhấn Nộp bài.
- **Bước 4:** Sửa lại note và nộp lại một file khác.
- **Kết quả mong đợi:** Hệ thống hiển thị "Đã nộp bài thành công", lưu lại thời gian nộp bài và phiên bản mới (Version 2).

### Test Case F5: Quản trị viên xem và phân tích Nhật ký hệ thống (Audit Logs)
- **Bước 1:** Đăng nhập tài khoản Admin (`admin@example.com`).
- **Bước 2:** Vào menu "Nhật ký hệ thống (Audit Logs)".
- **Bước 3:** Thử sử dụng các bộ lọc (Filter): Lọc theo hành động (VD: `LOGIN`, `CREATE_ASSIGNMENT`), lọc theo khoảng thời gian (Từ ngày - Đến ngày).
- **Kết quả mong đợi:** Hệ thống hiển thị chính xác lịch sử các thao tác vừa thực hiện ở Test Case F1, F2. Email của người dùng hiển thị trong log phải được che dấu một phần (Masked: `a***@example.com`) để bảo mật.

---

## PHẦN 5: KỊCH BẢN NGHIỆP VỤ (END-TO-END BUSINESS SCENARIOS)

Đây là kịch bản quan trọng nhất, mô phỏng luồng chảy nghiệp vụ thực tế từ đầu đến cuối (Full Lifecycle) của hệ thống. Yêu cầu test kỹ.

### Scenario B1: Luồng Chấm chéo Ẩn danh & Trợ lý AI Mentor (Double-Blind Peer Review)

**Mục đích:** Đảm bảo hệ thống tự động phân công chấm chéo, ẩn danh hoàn toàn 2 bên và AI Mentor can thiệp đúng lúc.

- **Bước 1 (Giảng viên chốt danh sách):** 
  - Teacher đăng nhập, vào trang Chi tiết bài tập.
  - Nhấn nút "Bắt đầu phân công chấm chéo" (Trigger thuật toán Double-Blind).
  
- **Bước 2 (Sinh viên kiểm tra ẩn danh):**
  - Đăng nhập bằng `student02@example.com` (thành viên nhóm đi chấm).
  - Vào "Hòm thư phản biện". Nhấn vào bài tập vừa được phân công.
  - **Kỳ vọng:** Màn hình hiển thị "Bài nộp ẩn danh #XXXX". KHÔNG được phép nhìn thấy tên của nhóm đã nộp bài.

- **Bước 3 (Thực hiện chấm bài & Test AI Mentor):**
  - Mở phiếu chấm điểm (Rubric). Ở tiêu chí "Nội dung", chấm 5/10.
  - Ở ô nhận xét, cố tình nhập một câu tiêu cực: *"Bài làm quá tệ, copy paste trên mạng, không có não."*
  - **Kỳ vọng AI:** AI Mentor (hiển thị góc phải) ngay lập tức nhấp nháy, cảnh báo văn phong tiêu cực (Toxicity/Xúc phạm) và gợi ý câu sửa lại (VD: *"Bài làm cần bổ sung thêm dẫn chứng, tránh trích dẫn nguyên văn từ nguồn ngoài..."*).
  
- **Bước 4 (Áp dụng gợi ý & Nộp đánh giá):**
  - Nhấn nút "Áp dụng câu mẫu" của AI.
  - Nhập điểm cho tiêu chí "Trình bày" (8/10).
  - Nhấn "Nộp bài phản biện".
  - **Kỳ vọng:** Báo thành công, hệ thống khóa phiếu chấm chéo, chuyển trạng thái sang "Đã hoàn thành".

### Scenario B2: Luồng Phân tích Nhật ký hoạt động nhóm (Activity Logs & Contribution)

**Mục đích:** Đảm bảo hệ thống AI đọc đúng **Nhật ký hoạt động (Activity Logs)** của sinh viên trong nhóm để phân tích tỷ lệ đóng góp, và báo cáo Cảnh báo sớm (Early Warnings) cho Giảng viên.

- **Bước 1 (Tạo ra nhật ký hoạt động - Activity Logs):**
  - Đăng nhập tài khoản Sinh viên 1. Tạo 5 tasks trong Nhóm, chat 10 tin nhắn, tải file tài liệu lên, và nộp bài. (Hệ thống ngầm ghi vào Activity Logs).
  - Sinh viên 2 trong nhóm không đăng nhập, không làm gì cả (Không có nhật ký).
  
- **Bước 2 (Giảng viên xem báo cáo phân tích nhật ký):**
  - Teacher đăng nhập, vào "Dashboard Cảnh báo sớm" (Early Warnings) hoặc "Phân tích Đóng góp" (Contribution Analytics).
  - **Kỳ vọng:** AI đã phân tích xong Nhật ký hoạt động (Activity Logs) và phát cờ cảnh báo (Red Flag) cho Nhóm đó với lý do "Unbalanced Contribution" (Đóng góp không đồng đều). Sinh viên 1 đạt 100% Contribution (High Contributor), Sinh viên 2 đạt 0% (Free-rider).

### Scenario B3: AI Tổng hợp Đánh giá (Review Synthesis)

**Mục đích:** Giảng viên không cần đọc từng phiếu chấm, AI sẽ tổng hợp lại.

- **Bước 1:** Sau khi toàn bộ lớp đã chấm chéo xong (hoàn thành Scenario B1 với nhiều nhóm).
- **Bước 2:** Teacher vào chi tiết Bài tập, chuyển sang tab "Tổng hợp đánh giá (Synthesis)".
- **Bước 3:** Nhấn nút "Phân tích bằng AI".
- **Kỳ vọng:** AI trả ra một bản tóm tắt mạch lạc bao gồm:
  - Những điểm mạnh chung của cả lớp.
  - Những lỗi sai phổ biến mà sinh viên hay mắc phải.
  - Gợi ý cho Giảng viên về những phần kiến thức cần dạy lại (Remedial actions).

---

## MỘT SỐ LƯU Ý KHI GHI NHẬN LỖI (BUG REPORTING)
Khi phát hiện lỗi trong quá trình chạy kịch bản, các Tester vui lòng báo cáo theo mẫu sau:
1. **Scenario / Bước đang test:** (VD: Test Case F3, Bước 4).
2. **Hành động đã làm:** (VD: Nhấn nút nộp bài nhưng đính kèm file .exe).
3. **Kết quả thực tế (Bug):** (VD: Trang web bị trắng (crash)).
4. **Kết quả mong đợi:** (VD: Phải hiện thông báo "Định dạng file không được hỗ trợ").
5. **Ảnh chụp màn hình (Screenshot / Video):** Đính kèm nếu có.

Chúc các bạn có một phiên kiểm thử hiệu quả!
