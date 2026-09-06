# 📗 CẨM NANG HƯỚNG DẪN KIỂM THỬ DỰ ÁN PEERREVIEW-AI (END-TO-END TESTING GUIDE)

Tài liệu này cung cấp kịch bản kiểm thử toàn diện (End-to-End Test Suite) dành cho Giảng viên, Sinh viên, Quản trị viên và Đánh giá viên độc lập để trải nghiệm và kiểm tra toàn bộ các chức năng của hệ thống **PeerReview-AI**.

---

## 📌 1. TỔNG QUAN HỆ THỐNG & ĐƯỜNG DẪN TRUY CẬP

* **🌐 Web Application (Frontend Live):** [https://peer-review-ai-tau.vercel.app](https://peer-review-ai-tau.vercel.app)
* **⚙️ REST API Server (Backend Live):** [https://peerreview-ai-backend.onrender.com](https://peerreview-ai-backend.onrender.com)
* **🩺 Diagnostics & Health Check:** [https://peerreview-ai-backend.onrender.com/api/health](https://peerreview-ai-backend.onrender.com/api/health)

> 💡 **Mẹo nghiệm thu nhanh (Warm-up):**
> Do máy chủ Backend sử dụng gói đám mây Render (có cơ chế nghỉ sau 15 phút rảnh), trước khi bắt đầu kiểm thử 2–3 phút, bạn nên nhấp vào đường dẫn **Health Check** ở trên để đun nóng server (Cold Start). Khi đó mọi thao tác trên giao diện Web sẽ có phản hồi tức thì trong `< 1s`.

---

## 🔑 2. DANH SÁCH TÀI KHOẢN MẪU (SEED TEST ACCOUNTS)

Tất cả các tài khoản thử nghiệm bên dưới đã được chuẩn bị sẵn dữ liệu trên hệ thống. **Mật khẩu chung cho tất cả tài khoản mẫu là:** `password123`

| Vai trò (Role) | Email Đăng nhập | Mật khẩu | Phạm vi & Mục đích kiểm thử |
| :--- | :--- | :--- | :--- |
| **👑 ADMIN** | `admin@example.com` | `password123` | Quản trị người dùng, phân quyền Role, khóa/mở khóa tài khoản, xem Audit Logs, cấu hình tham số động hệ thống (`system_config`). |
| **👨‍🏫 TEACHER** | `teacher01@example.com` | `password123` | Quản lý Lớp học, tạo Bài tập & Tiêu chí Rubric, chạy thuật toán Phân công Chấm chéo tự động, duyệt AI Review Synthesis, xem báo cáo Contribution & Cảnh báo rủi ro (Early Warnings). |
| **🎓 STUDENT 01** | `student01@example.com` | `password123` | Nhóm trưởng/Thành viên nhóm: Tạo Task Kanban, trao đổi nhóm, nộp bài tập (Submit Assignment), thực hiện chấm chéo bài bạn với Trợ lý AI Mentor. |
| **🎓 STUDENT 02** | `student02@example.com` | `password123` | Thành viên nhóm chấm chéo đối ứng: Kiểm thử tính ẩn danh 2 chiều (Double-Blind Privacy), xem kết quả tổng hợp nhận xét từ AI. |

> 🆕 **Tự đăng ký mới:** Bạn cũng có thể mở trang [Đăng ký](https://peer-review-ai-tau.vercel.app/register) trên web để tự tạo một tài khoản Sinh viên mới với địa chỉ Gmail cá nhân của bạn.

---

## 🧪 3. QUY TRÌNH KIỂM THỬ CHI TIẾT THEO TỪNG VAI TRÒ (ROLE-BASED TEST SCENARIOS)

---

### 3.1. 👑 KỊCH BẢN KIỂM THỬ VAI TRÒ QUẢN TRỊ VIÊN (ADMIN)

**Mục tiêu:** Kiểm tra khả năng giám sát toàn hệ thống, quản lý người dùng, nhật ký vết hoạt động và điều chỉnh tham số vận hành.

#### 📍 Kịch bản A1: Quản lý Người dùng & Phân quyền Role (`/admin/users`)
1. **Đăng nhập:** Dùng tài khoản `admin@example.com` / `password123`.
2. **Truy cập:** Màn hình **Quản lý Người dùng** (`/admin/users`).
3. **Thao tác Kiểm thử:**
   - Sử dụng thanh tìm kiếm để tìm người dùng theo tên hoặc email (ví dụ: gõ `student01`).
   - Lọc người dùng theo Vai trò (`STUDENT`, `TEACHER`, `ADMIN`) hoặc Trạng thái (`ACTIVE`, `LOCKED`).
   - Thử thay đổi vai trò của một tài khoản sinh viên thành `TEACHER` hoặc ngược lại.
   - Thử bấm **Khóa tài khoản (Lock User)** một tài khoản thử nghiệm.
4. **Kết quả mong đợi:**
   - Danh sách phản hồi tức thì với hiệu ứng phân trang mượt mà.
   - Trạng thái người dùng được cập nhật ngay lập tức.
   - **Rào chắn Bảo mật (Security Guard):** Hệ thống chặn không cho phép Admin tự khóa hoặc tự hạ quyền ADMIN của chính mình (Hiển thị cảnh báo an toàn).

#### 📍 Kịch bản A2: Cấu hình Tham số Vận hành Động (`/admin/settings`)
1. **Truy cập:** Màn hình **Cấu hình Hệ thống** (`/admin/settings`).
2. **Thao tác Kiểm thử:**
   - Điều chỉnh các tham số giới hạn hệ thống:
     - Giới hạn gọi AI Mentor per Student (`ai_daily_limit` / `ai_rate_limit`).
     - Thời gian đếm lùi mặc định cho chấm chéo.
     - Kích hoạt / Tắt tính năng AI Peer Mentor.
   - Bấm **Lưu cấu hình (Save Configuration)**.
3. **Kết quả mong đợi:**
   - Thông báo thành công hiển thị. Các tham số này được cập nhật ngay tại Runtime mà không cần khởi động lại Server backend.

#### 📍 Kịch bản A3: Giám sát Nhật ký Hoạt động (Audit Logs) (`/admin/audit-logs`)
1. **Truy cập:** Màn hình **Nhật ký Hoạt động** (`/admin/audit-logs`).
2. **Thao tác Kiểm thử:**
   - Xem danh sách các hành động vừa thực hiện trong hệ thống (Đăng nhập, Nộp bài, Đổi quyền, Cấu hình).
   - Kiểm tra định dạng hiển thị: Tên người thực hiện, Loại hành động (`LOGIN`, `SUBMISSION_CREATED`, `ROLE_CHANGE`), Địa chỉ IP và Thời gian thực.
3. **Kết quả mong đợi:**
   - Mọi thao tác quan trọng đều được ghi nhận chính xác. Email người dùng trong log được che giấu PII dạng `a***@domain.com` để đảm bảo quyền riêng tư.

#### 📍 Kịch bản A4: Dashboard Tổng quan Admin (`/admin/dashboard`)
1. **Truy cập:** Màn hình **Admin Dashboard** (`/admin/dashboard`).
2. **Kết quả mong đợi:** Hiển thị thẻ thống kê tổng số lượng Sinh viên, Giảng viên, Bài nộp, Phiếu chấm chéo và biểu đồ hoạt động hệ thống.

---

### 3.2. 👨‍🏫 KỊCH BẢN KIỂM THỬ VAI TRÒ GIẢNG VIÊN (TEACHER)

**Mục tiêu:** Kiểm tra luồng tạo bài tập, tạo tiêu chí chấm Rubric, tự động phân công chấm chéo, duyệt tổng hợp AI Synthesis và theo dõi cảnh báo rủi ro nhóm.

#### 📍 Kịch bản T1: Quản lý Lớp học & Tạo Bài tập kèm Rubric (`/teacher/assignments`)
1. **Đăng nhập:** Dùng tài khoản `teacher01@example.com` / `password123`.
2. **Truy cập:** Màn hình **Quản lý Bài tập** (`/teacher/dashboard` hoặc `/teacher/assignments`).
3. **Thao tác Kiểm thử:**
   - Bấm **"Tạo bài tập mới"**.
   - Điền thông tin: Tên bài tập (VD: *Đồ án Thiết kế Kiến trúc Hệ thống*), Mô tả, Hạn nộp bài (Deadline Nộp), Hạn chấm chéo (Deadline Review).
   - **Thiết lập Rubric tiêu chí:**
     - Tiêu chí 1: *Tính Đúng đắn & Kỹ thuật* (Trọng số 40%).
     - Tiêu chí 2: *Chất lượng Mã nguồn & Tài liệu* (Trọng số 30%).
     - Tiêu chí 3: *Đóng góp & Trình bày* (Trọng số 30%).
   - Bấm **Lưu Bài tập**.
4. **Kết quả mong đợi:** Bài tập và Ma trận Rubric được khởi tạo thành công, các tiêu chí hiển thị rõ ràng cho Sinh viên làm căn cứ chấm.

#### 📍 Kịch bản T2: Kích hoạt Thuật toán Phân công Chấm chéo Ẩn danh (`/teacher/assignments/:id/review-assignments`)
1. **Truy cập:** Chọn một bài tập đã đến hạn nộp bài.
2. **Thao tác Kiểm thử:**
   - Bấm nút **"Kích hoạt Phân công Chấm chéo" (Generate Review Assignments)**.
   - Cấu hình số bài chấm quy định cho mỗi nhóm (VD: 2 – 3 bài/nhóm).
3. **Kết quả mong đợi:**
   - Thuật toán phân công tự động chia bài chấm theo các nguyên tắc:
     - 🚫 **No Self-Review:** Nhóm không bao giờ tự chấm bài của chính mình.
     - 🚫 **No Duplicate:** Không phân công trùng lặp 1 bài nộp cho cùng 1 sinh viên.
   - Danh sách phân công chuyển sang trạng thái `PENDING` sẵn sàng cho Sinh viên chấm.

#### 📍 Kịch bản T3: Duyệt Tổng hợp Đánh giá bằng AI (AI Review Synthesis) (`/teacher/assignments/:id/synthesis`)
1. **Truy cập:** Chọn một Bài nộp đã tích lũy các phiếu chấm chéo từ sinh viên.
2. **Thao tác Kiểm thử:**
   - Bấm nút **"Tạo Tổng hợp AI" (Generate AI Synthesis)**.
   - Chờ AI phân tích mẫu Hybrid (tối đa 100 nhận xét).
   - Kiểm tra bản xem trước do AI xuất ra gồm 3 phần:
     - 🟢 **Điểm mạnh (Strengths)**
     - 🔴 **Điểm cần cải thiện (Weaknesses)**
     - 💡 **Gợi ý hành động (Suggestions)**
   - Bấm nút **Chỉnh sửa** (Giảng viên có thể điều chỉnh lại văn phong hoặc bổ sung lưu ý).
   - Bấm **"APPROVED" (Phê duyệt)** để công bố cho sinh viên.
3. **Kết quả mong đợi:**
   - AI thực hiện tổng hợp chính xác trong `< 5s`. Bản tổng hợp sau khi được Giảng viên phê duyệt sẽ hiển thị công khai cho nhóm sinh viên nhận bài.

#### 📍 Kịch bản T4: Phân tích Đóng góp Nhóm & Cảnh báo Sớm (`/teacher/analytics`)
1. **Truy cập:** Trang **Contribution Analytics & Collaboration Risk** (`/teacher/analytics`).
2. **Thao tác Kiểm thử:**
   - Chọn Lớp học và Nhóm cần theo dõi.
   - Xem bảng chỉ số đóng góp **Contribution Score (0 – 100%)** của từng thành viên dựa trên lịch sử nộp bài, thảo luận Kanban và hoạt động chấm chéo.
   - Kiểm tra danh sách **Cảnh báo sớm (Early Warnings / At-Risk Students)** đối với các sinh viên có dấu hiệu bỏ cuộc hoặc không đóng góp.
3. **Kết quả mong đợi:** Biểu đồ phân bổ đóng góp hiển thị trực quan, hỗ trợ Giảng viên can thiệp kịp thời trước deadline.

---

### 3.3. 🎓 KỊCH BẢN KIỂM THỬ VAI TRÒ SINH VIÊN (STUDENT)

**Mục tiêu:** Kiểm tra luồng thao tác nhóm, nộp bài làm, chấm chéo bài của nhóm bạn với Trợ lý AI Mentor và xem kết quả tổng hợp.

#### 📍 Kịch bản S1: Đăng nhập & Không gian làm việc Nhóm (Group Workspace) (`/student/workspace`)
1. **Đăng nhập:** Dùng tài khoản `student01@example.com` / `password123`.
2. **Truy cập:** Trang **Group Workspace** (`/student/workspace`).
3. **Thao tác Kiểm thử:**
   - Xem danh sách thành viên trong Nhóm làm việc.
   - **Bảng Kanban:** Tạo một Task mới (VD: *Viết báo cáo phần 3*), kéo thả Task giữa các cột *To Do ➔ In Progress ➔ Done*.
   - **Thảo luận Nhóm:** Nhập một đoạn chat thảo luận công việc với các thành viên.
   - **Tài liệu Nhóm (Files):** Đăng tải 1 tệp tài liệu hỗ trợ nhóm.
4. **Kết quả mong đợi:** Mọi hành động cập nhật trạng thái Task và Chat hiển thị tức thì, tạo cảm giác làm việc nhóm chuyên nghiệp.

#### 📍 Kịch bản S2: Nộp Bài tập & Quản lý Phiên bản (`/student/assignments/:id`)
1. **Truy cập:** Mở bài tập đang diễn ra.
2. **Thao tác Kiểm thử:**
   - Chọn tệp bài làm từ máy tính (hỗ trợ định dạng `.pdf`, `.docx`, `.zip`, `.txt` dung lượng `< 10MB`).
   - Điền ghi chú nộp bài và bấm **Nộp Bài (Submit Assignment)**.
   - **Thử Nộp lại (Resubmit):** Upload một tệp cập nhật mới và nộp lại.
3. **Kết quả mong đợi:**
   - Hệ thống chấp nhận tệp hợp lệ và lưu vết lịch sử phiên bản (*Version 1, Version 2*).
   - Nếu chọn tệp vượt quá 10MB hoặc sai định dạng (VD: `.exe`), hệ thống chặn ngay tại Client kèm thông báo lỗi rõ ràng `413 File Too Large` / `400 Invalid File Type`.

#### 📍 Kịch bản S3: Chấm chéo Ẩn danh & Trợ lý AI Peer-Review Mentor (`/student/reviews`)
1. **Truy cập:** Màn hình **Danh sách Chấm chéo** (`/student/reviews`).
2. **Kiểm tra Bảo mật Ẩn danh:**
   - Quan sát bài nộp được phân công.
   - *Xác nhận:* Tên sinh viên nộp, MSSV, Email và Tên nhóm hoàn toàn **bị ẩn** (chỉ hiển thị mã ẩn danh VD: `Anonymous Submission #A9F42`).
3. **Thử nghiệm Trợ lý AI Mentor (Real-time Analysis):**
   - **Thử nghiệm 1 (Nhận xét qua loa / tiêu cực):** Nhập lời nhận xét *"Bài này làm quá kém, không có gì để xem"*, dừng gõ **1.5 giây**.
     - *Kết quả:* Thẻ **AI Peer-Review Mentor** xuất hiện ngay lập tức với cảnh báo nhãn *"Văn phong tiêu cực / Chưa mang tính xây dựng"* kèm lời khuyên sửa đổi.
   - **Thử nghiệm 2 (Nhận xét tích cực & bám sát Rubric):** Nhập lời nhận xét chi tiết *"Bài viết trình bày mạch lạc, cấu trúc rõ ràng. Cần bổ sung thêm sơ đồ kiến trúc ở phần 2 để hoàn thiện hơn"*.
     - *Kết quả:* AI Mentor đánh giá tích cực, ghi nhận điểm xây dựng cao.
4. **Nộp Đánh giá:** Điền điểm cho từng tiêu chí Rubric và bấm **Gửi Đánh giá (Submit Review)**.
5. **Kết quả mong đợi:** Phiếu đánh giá chuyển sang trạng thái `COMPLETED` và không thể sửa đổi sau khi nộp.

#### 📍 Kịch bản S4: Xem Báo cáo Tổng hợp Nhận xét Bài làm (`/student/submissions/:id/summary`)
1. **Truy cập:** Màn hình chi tiết bài nộp của nhóm mình sau khi hết hạn chấm chéo.
2. **Kết quả mong đợi:**
   - Hiển thị điểm số trung bình tích lũy từ các bạn chấm chéo.
   - Hiển thị bản **Tổng hợp Đánh giá từ AI** (đã được Giảng viên phê duyệt) trình bày đẹp mắt dưới dạng 3 nhóm: Điểm mạnh, Điểm yếu và Gợi ý cải thiện.

---

## 🛡️ 4. KIỂM THỬ TÍNH NĂNG ĐẶC BIỆT & CÁC TRƯỜNG HỢP BIÊN (EDGE CASES)

---

### 4.1. 🔒 Kiểm tra Bảo mật Ẩn danh 2 chiều (Double-Blind Privacy Check)
* **Thao tác:** Mở công cụ Developer Tools (`F12`) -> Tab **Network** trên trình duyệt Sinh viên khi đang ở trang chấm chéo.
* **Soi dữ liệu JSON API trả về (`GET /api/review-assignments/...`):**
* **Kết quả mong đợi:** Toàn bộ các trường nhạy cảm `full_name`, `email`, `student_id`, `class_name`, `group_name` đều bị lọc sạch (**Sanitized**) ngay tại Backend Node.js trước khi trả dữ liệu về Frontend Client.

---

### 4.2. 📧 Khôi phục Mật khẩu qua Email (Forgot / Reset Password via Gmail SMTP)
* **Thao tác:**
  1. Đăng xuất khỏi hệ thống, truy cập trang [/login](https://peer-review-ai-tau.vercel.app/login).
  2. Bấm **"Quên mật khẩu?"** -> Nhập email cá nhân thực của bạn (VD: `doituyentin9a1@gmail.com`).
  3. Bấm **Gửi yêu cầu**.
  4. Mở Gmail cá nhân, kiểm tra hòm thư (bao gồm cả thư mục **Spam / Thư rác**).
  5. Bấm vào nút **"Đặt Lại Mật Khẩu"** trong email (Đường dẫn có dạng `https://peer-review-ai-tau.vercel.app/reset-password?token=...`).
  6. Nhập mật khẩu mới (tối thiểu 6 ký tự) và bấm Đặt lại mật khẩu.
* **Kết quả mong đợi:** Email gửi tới trong vòng 1-2 phút, đường liên kết có hiệu lực lên tới **60 phút**. Đặt lại mật khẩu thành công và có thể đăng nhập ngay bằng mật khẩu mới.

---

### 4.3. 🚫 Kiểm tra Giới hạn Tải tệp (File Upload Limits)
* **Thao tác:** Thử nộp 1 tệp có dung lượng `> 10MB` hoặc chọn 1 tệp đuôi thực thi `.exe` / `.bat`.
* **Kết quả mong đợi:** Middleware `fileUpload.middleware.js` phát hiện và chặn tức thì với mã lỗi `413 FILE_TOO_LARGE` hoặc `400 INVALID_FILE_TYPE`, bảo vệ máy chủ Render khỏi rủi ro tràn RAM 512MB.

---

### 4.4. 🔄 Kiểm tra Router Client SPA (Chống lỗi 404 khi F5 Reload)
* **Thao tác:** Khi đang ở các đường dẫn sâu như `/student/workspace` hoặc `/teacher/analytics`, bấm phím **F5 (Reload)** trình duyệt.
* **Kết quả mong đợi:** Trang web nạp lại mượt mà, giữ nguyên trạng thái làm việc, **không bao giờ bị lỗi `404 Not Found`** nhờ cấu hình Rewrite trong `frontend/vercel.json`.

---

### 4.5. ⛔ Phân quyền Tuyệt đối (Route Guard 401/403 Enforcement)
* **Thao tác:** Đăng nhập tài khoản Sinh viên, cố tình gõ trực tiếp URL của trang Quản trị (`/admin/dashboard`) hoặc trang Giảng viên (`/teacher/dashboard`) trên thanh địa chỉ trình duyệt.
* **Kết quả mong đợi:** Hệ thống chặn truy cập, hiển thị thông báo lỗi `403 Forbidden` hoặc tự động đẩy người dùng về đúng trang Dashboard Sinh viên (`/student/dashboard`).

---

## 🛠️ 5. HƯỚNG DẪN DEPLOY & CẤU HÌNH HẠ TẦNG (RENDER & VERCEL)

Nếu bạn muốn tự xây dựng một bản Deploy độc lập từ mã nguồn GitHub, hãy làm theo hướng dẫn 2 bước dưới đây:

### 1️⃣ Deploy Backend lên Render (Làm TRƯỚC)
1. Truy cập [dashboard.render.com](https://dashboard.render.com/) -> Bấm **New +** -> Chọn **Web Service**.
2. Kết nối với Repository `PeerReview-AI`.
3. Cấu hình tham số:
   * **Name:** `peerreview-ai-backend`
   * **Root Directory:** `backend` *(⚠️ BẮT BUỘC)*
   * **Environment:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node src/server.js`
4. **Cấu hình Environment Variables:**
   * `PORT`: `5000` *(Render sẽ tự cấp)*
   * `DATABASE_URL`: Connection string PostgreSQL Supabase (Port `6543` với đuôi `?sslmode=require`).
   * `JWT_SECRET`: Chuỗi khóa 32-byte ngẫu nhiên an toàn.
   * `GEMINI_API_KEY`: API Key kết nối Trợ lý AI Google Gemini.
   * `SMTP_HOST`: `smtp.gmail.com` | `SMTP_PORT`: `587`
   * `SMTP_USER`: Email gửi mail hệ thống (VD: `peerreviewsangtaoai@gmail.com`)
   * `SMTP_PASS`: Mật khẩu ứng dụng Gmail (App Password) 16 ký tự.
   * `CORS_ORIGIN`: `https://peer-review-ai-tau.vercel.app,http://localhost:5173`
   * `FRONTEND_URL`: `https://peer-review-ai-tau.vercel.app`
5. Bấm **Create Web Service** và copy URL Backend vừa tạo (VD: `https://peerreview-ai-backend.onrender.com`).

---

### 2️⃣ Deploy Frontend lên Vercel (Làm SAU)
1. Truy cập [vercel.com](https://vercel.com/) -> Bấm **Add New...** -> **Project** -> Import repo `PeerReview-AI`.
2. Cấu hình thông số:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Chọn thư mục `frontend` *(⚠️ BẮT BUỘC)*
3. **Environment Variables:**
   * `VITE_API_URL`: Dán URL Render Backend ở Bước 1 vào (VD: `https://peerreview-ai-backend.onrender.com`).
4. Bấm **Deploy** để phát hành trang web live.

---

## ❓ 6. BẢNG TRA CỨU KHẮC PHỤC SỰ CỐ NHANH (TROUBLESHOOTING)

| Triệu chứng lỗi | Nguyên nhân chính | Cách xử lý nhanh |
| :--- | :--- | :--- |
| **Vercel gọi API bị báo lỗi CORS Block** | `CORS_ORIGIN` trên Render chưa liệt kê URL Vercel. | Vào Render Dashboard -> Cập nhật `CORS_ORIGIN` chứa đúng URL Vercel (có `https://`, không có `/` ở cuối). |
| **F5 Refresh trang bị 404** | Vercel chưa nhận cấu hình `frontend/vercel.json`. | Kiểm tra phần Root Directory trong Vercel Project Settings đã đặt chính xác là `frontend` chưa. |
| **Request đầu tiên load mất 30–40 giây** | Máy chủ Render Free Tier ở trạng thái ngủ đông (Cold Start). | Mở trước trang `https://peerreview-ai-backend.onrender.com/api/health` trước khi bắt đầu thử nghiệm 2 phút. |
| **Không nhận được Email đặt lại mật khẩu** | Thư bị lọc vào Spam hoặc token thử nghiệm đã cũ. | 1. Kiểm tra thư mục **Spam (Thư rác)** hoặc tab **Quảng cáo/Cập nhật**.<br>2. Thực hiện lại thao tác "Quên mật khẩu" từ web để nhận link mới nhất (có hiệu lực 60 phút). |
| **Lỗi 500 khi nộp bài tập** | Tệp nộp vượt dung lượng 10MB hoặc sai định dạng. | Đảm bảo tệp nộp có dung lượng dưới 10MB và thuộc các định dạng được phép (`.pdf`, `.docx`, `.zip`, `.txt`). |

---

## 📋 TỔNG KẾT

Bộ cẩm nang hướng dẫn kiểm thử này bao phủ **100% các tính năng và vai trò sử dụng** của hệ thống **PeerReview-AI**. Hãy thực hiện theo từng bước kịch bản để có trải nghiệm đánh giá toàn diện nhất!