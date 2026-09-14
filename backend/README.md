# PEERREVIEW-AI — BACKEND REST API SERVICE

[![Backend Status](https://img.shields.io/badge/Render-Online-blue?style=for-the-badge)](https://peerreview-ai-backend.onrender.com/api/health)
[![NodeJS](https://img.shields.io/badge/Node.js-v18%2B-green?style=for-the-badge)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-4.x-black?style=for-the-badge)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=for-the-badge)](https://supabase.com)

Thành phần Backend REST API của dự án **PeerReview-AI**, chịu trách nhiệm xử lý toàn bộ Logic Nghiệp vụ, Xác thực & Phân quyền, Phân công Chấm chéo Ẩn danh (Double-Blind), Thuật toán Phân tích Đóng góp Cá nhân ($C_1 - C_4$), Tích hợp Động cơ Gemini AI và Cảnh báo Rủi ro Giám sát.

> 🌐 **Production API Endpoint (Render):** [https://peerreview-ai-backend.onrender.com](https://peerreview-ai-backend.onrender.com)  
> 🔗 **Health Check & Diagnostics:** [https://peerreview-ai-backend.onrender.com/api/health](https://peerreview-ai-backend.onrender.com/api/health)

---

## 🛠 KIẾN TRÚC BACKEND & CẤU TRÚC THƯ MỤC

Dự án áp dụng mô hình kiến trúc **Layered Architecture (Routes - Controllers - Services - Middleware - Config)** giúp tối ưu hóa khả năng kiểm thử (Unit Testing) và bảo trì mã nguồn:

```text
backend/
├── src/
│   ├── config/             # Cấu hình DB Pool, Supabase Client & Env Variables
│   ├── constants/          # Định nghĩa Constants, Enums & Error Messages
│   ├── controllers/        # Xử lý Request/Response, Validation & Call Services
│   ├── middleware/         # Auth JWT, Role Middleware, Rate Limiter, PII Sanitizer
│   ├── providers/          # Gemini AI API Integration & Auto-Rotation Service
│   ├── routes/             # Định tuyến API (Auth, Class, Assignment, Review, Analytics)
│   ├── services/           # Logic nghiệp vụ lõi (Double-Blind, Contribution Engine, Cron)
│   ├── utils/              # Helper functions, Zod Schemas & Logger
│   └── server.js           # Express App Entry Point & Middleware Configuration
├── scripts/                # Database Seed scripts & realistic demo scores
├── tests/                  # Bộ Test Suite đóng gói (Jest Service Unit Tests)
├── clean_db.sql            # Script làm sạch CSDL thử nghiệm
├── seed_data.sql           # Seed data cơ bản 30 sinh viên
└── package.json            # Node.js Dependencies & Test Scripts
```

---

## ⚡ CÁC TÍNH NĂNG KỸ THUẬT NỔI BẬT

### 1. 🙈 Phân công Chấm chéo Ẩn danh (Double-Blind Allocation & Sanitization)
- Thuật toán phân công tự động ngăn chặn tự chấm bài của chính mình hoặc trùng lặp giữa các nhóm.
- **Backend Identity Sanitizer:** Middleware & Service chủ động loại bỏ toàn bộ dữ liệu nhạy cảm (`full_name`, `student_id`, `class_name`, `group_name`) khỏi phôi phản hồi JSON trước khi trả về Client.

### 2. 🤖 Gemini AI Integration & Multi-Model Auto-Rotation
- Động cơ AI tích hợp thế hệ mới **Google Gemini 3.x Flash Family** (`gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.7-flash`).
- **Multi-Model Auto-Rotation:** Tự động chuyển đổi mượt mà sang Model dự phòng khi gặp lỗi `429 Quota Exhaustion` hoặc `404 Not Found`.
- **SHA-256 Comment Caching (7 ngày):** Lưu bản băm nhận xét trong Cache để tránh gọi trùng API, giúp tối ưu tốc độ và chi phí.

### 3. 📊 Thuật toán Phân tích Đóng góp Cá nhân ($V_i = [C_1, C_2, C_3, C_4]$)
- Hợp nhất chỉ số $C_1$ (Activity Logs từ Kanban Task/Discussions) và $C_2 - C_4$ (Chấm nội bộ 1-5 sao ẩn danh).
- Tính toán Hệ số Quy đổi Cá nhân ($S_i / G_{ind}$) và hỗ trợ tính năng **Snapshot** bảo lưu dữ liệu lịch sử khi Giảng viên Publish Analytics.

### 4. ⚠️ Rule Engine Cảnh báo Sớm (Early Warnings)
- Tự động quét và phát hiện các rủi ro: *LOW_CONTRIBUTION* (Free-rider $S_i < 0.5$), *REVIEW_INACTIVITY* (Chưa chấm chéo), *INCOMPLETE_TASKS* (Chậm tiến độ Task sát deadline).

### 5. ⏰ Cron Job Tự động Đóng Hạn (Deadline Cron Service)
- Dịch vụ Background Worker (`cron-deadline.service.js`) tự động kiểm tra hạn nộp bài tập và khóa sổ bài nộp chính xác theo giờ.

---

## 🚦 DANH SÁCH REST API ENDPOINTS CHÍNH

### 🔑 Authentication & Users (`/api/auth`)
- `POST /api/auth/register` - Đăng ký tài khoản Sinh viên mới
- `POST /api/auth/login` - Đăng nhập nhận JWT Token
- `GET  /api/auth/me` - Lấy thông tin cá nhân hiện tại
- `PATCH /api/auth/profile` - Cập nhật Họ tên, Avatar URL
- `POST /api/auth/change-password` - Đổi mật khẩu bảo mật

### 📚 Lớp học & Bài tập (`/api/classes`, `/api/assignments`)
- `GET    /api/classes` - Danh sách lớp học theo Role
- `POST   /api/assignments` - Tạo bài tập mới kèm Rubric (Teacher)
- `GET    /api/assignments/:id` - Xem chi tiết bài tập & Rubric

### 👥 Group Workspace (`/api/workspace`)
- `GET    /api/workspace/groups/:groupId/tasks` - Danh sách Task Kanban
- `POST   /api/workspace/groups/:groupId/tasks` - Tạo Task mới
- `PATCH /api/workspace/tasks/:taskId` - Cập nhật trạng thái Task (TODO, IN_PROGRESS, DONE)
- `GET    /api/workspace/groups/:groupId/discussions` - Thảo luận nhóm
- `GET    /api/workspace/groups/:groupId/activity-logs` - Nhật ký hoạt động nhóm

### 📝 Submission & Double-Blind Review (`/api/submissions`, `/api/reviews`)
- `POST   /api/submissions` - Nộp bài đồ án (Đính kèm link GitHub / File Cloud)
- `POST   /api/review-assignments/allocate` - Kích hoạt phân công chấm chéo ẩn danh
- `GET    /api/reviews/inbox` - Hòm thư nhận bài chấm ẩn danh của sinh viên
- `POST   /api/reviews` - Nộp bài phản biện kèm điểm Rubric & Nhận xét

### 🤖 AI Services (`/api/ai`, `/api/summary`)
- `POST   /api/ai/analyze-review` - Trợ lý AI Peer-Review Mentor phân tích nhận xét real-time
- `POST   /api/summary/assignments/:assignmentId/synthesis` - AI Synthesis tổng hợp cả lớp
- `PATCH /api/summary/submissions/:submissionId/submissionId` - Giảng viên duyệt bản tổng hợp (Human-in-the-loop)

### 📊 Analytics & Early Warning (`/api/analytics`, `/api/groups`)
- `GET    /api/groups/:groupId/contribution` - Lấy điểm đóng góp $S_i$ & Ra-đa 4 trục Nhóm
- `POST   /api/groups/:groupId/publish-analytics` - Giảng viên công bố điểm đóng góp
- `GET    /api/analytics/dashboard` - Dashboard thống kê dành cho Giảng viên
- `GET    /api/analytics/early-warnings` - Bảng Cảnh báo Sớm rủi ro nhóm

---

## 🛠 HƯỚNG DẪN CHẠY LOCAL BACKEND

### 1. Cài đặt Dependencies
```bash
cd backend
npm install
```

### 2. Thiết lập Biến môi trường (`.env`)
Tạo file `.env` từ mẫu `.env.example`:
```ini
PORT=5000
DATABASE_URL="<your-database-connection-string>"
JWT_SECRET="<your-jwt-secret-key>"
GEMINI_API_KEY="<your-gemini-api-key>"
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
```
> 🛡️ **Bảo mật:** Mọi Secret Key thực tế chỉ lưu trong file `.env` cá nhân (đã `.gitignore`) hoặc cấu hình trên Dashboard Cloud (Render/Vercel). Tuyệt đối KHÔNG commit Secret Key thực tế lên Git Repository.

### 3. Chạy Server ở chế độ Development
```bash
npm run dev
```

### 4. Thao tác Cơ sở Dữ liệu & Seed Data Demo
```bash
# Seed dữ liệu 30 sinh viên demo thực tế
node scripts/seed_realistic_scores.js
```

---

## 🧪 CHẠY BỘ KIỂM THỬ BACKEND (JEST UNIT TESTS)

Bộ test suite được đóng gói sẵn trong `tests/`, sử dụng Fake Timers & Mock Pool để kiểm tra độc lập các Service:

```bash
# Chạy toàn bộ Unit Tests
npm test

# Xuất báo cáo độ phủ mã nguồn (Coverage Report)
npm run test:coverage
```

---

## 📄 LICENSE
Dự án thuộc bộ mã nguồn dự án **PeerReview-AI**. Bảo lưu mọi quyền © 2026.
