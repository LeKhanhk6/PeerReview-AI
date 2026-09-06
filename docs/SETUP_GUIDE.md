# HƯỚNG DẪN CÀI ĐẶT VÀ CẤU HÌNH LOCAL DEVELOPMENT (SETUP GUIDE)

Tài liệu này hướng dẫn chi tiết cách thiết lập môi trường phát triển (Local Development) cho dự án **PeerReview-AI**.

---

## 📋 1. YÊU CẦU TIÊN QUYẾT (PREREQUISITES)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
- **Node.js:** Phiên bản `>= 18.0.0` (Khuyên dùng LTS v20.x).
- **npm:** Phiên bản `>= 9.0.0` (Đi kèm sẵn với Node.js).
- **Git:** Phiên bản `>= 2.30.0`.
- **Cơ sở dữ liệu:** PostgreSQL (Cài đặt cục bộ) hoặc Tài khoản **Supabase Cloud PostgreSQL**.

---

## ⚙️ 2. CẤU HÌNH BÀN LÀM VIỆC (BACKEND SETUP)

### Bước 2.1: Cài đặt Dependencies
Mở Terminal tại thư mục gốc của dự án:
```bash
cd backend
npm install
```

### Bước 2.2: Cấu hình Biến môi trường (`backend/.env`)
Tạo file `.env` trong thư mục `backend/` với nội dung mẫu sau:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection (Supabase PostgreSQL / Local Postgres)
# Lưu ý: Sử dụng Pooler Connection (Port 6543) nếu dùng Supabase Cloud
DATABASE_URL="postgresql://postgres.<project_ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"

# JWT Authentication
JWT_SECRET="your_local_jwt_secret_key_change_me_in_production"
JWT_EXPIRES_IN="24h"

# AI Service Config (Gemini API Provider)
AI_PROVIDER="gemini"
GEMINI_API_KEY="your_gemini_api_key_here"
GEMINI_MODEL="gemini-1.5-flash"
AI_TIMEOUT=30000

# CORS Configuration (Hỗ trợ danh sách origin cách nhau bằng dấu phẩy)
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"

# System Config & Audit
AUDIT_ENABLED=true
```

### Bước 2.3: Thao tác Database & Seed Data
Chạy các script khởi tạo schema và tạo dữ liệu mẫu cho môi trường local:
```bash
# Khởi tạo bảng và các constraints
node scripts/setup_db.js

# Nạp dữ liệu mẫu (Admin, Giáo viên, Sinh viên, Lớp học mẫu)
npm run seed
```

### Bước 2.4: Khởi chạy Backend Server
```bash
# Chạy chế độ Development (tự động reload khi sửa code qua nodemon)
npm run dev

# Hoặc chạy chế độ Production local
npm start
```
Server Backend sẽ khởi chạy tại: `http://localhost:5000`  
Kiểm tra sức khỏe Backend tại: `http://localhost:5000/api/health`

---

## 💻 3. CẤU HÌNH FRONTEND (FRONTEND SETUP)

### Bước 3.1: Cài đặt Dependencies
Mở một tab Terminal mới:
```bash
cd frontend
npm install
```

### Bước 3.2: Cấu hình Biến môi trường (`frontend/.env.local`)
Tạo file `.env.local` trong thư mục `frontend/`:

```ini
# API Endpoint Backend Local
VITE_API_URL="http://localhost:5000/api"

# Tùy chọn: Bật Mock Service Worker (MSW) nếu không muốn gọi Backend thật
VITE_ENABLE_MSW="false"
```

### Bước 3.3: Khởi chạy Frontend Server
```bash
npm run dev
```
Giao diện Web sẽ khởi chạy tại: `http://localhost:5173`

---

## 🧪 4. KIỂM THỬ VÀ CHẠY SUITE TEST (TESTING)

Dự án có sẵn bộ Service Unit Tests cho toàn bộ API phía Backend:

```bash
cd backend

# Chạy tất cả Unit & Integration Tests
npm test

# Chạy test xem tỉ lệ bao phủ (Coverage report)
npm run test:coverage
```

---

## 🔐 5. QUY TẮC BẢO MẬT KHI LÀM VIỆC LOCAL
- **Tuyệt đối KHÔNG commit file `.env` chứa API Key hoặc Passwords thật vào Git.**
- Luôn kiểm tra `git status` trước khi push để đảm bảo `.env` bị `.gitignore` bỏ qua.
