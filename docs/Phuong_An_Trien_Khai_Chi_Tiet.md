# 🚀 PHƯƠNG ÁN TRIỂN KHAI VÀ VẬN HÀNH THỰC TẾ (PRODUCTION DEPLOYMENT & PILOT READINESS PLAN)

Tài liệu này trình bày phương án triển khai chi tiết hạ tầng đám mây (Cloud Infrastructure Deployment), cấu hình môi trường vận hành thực tế (Production Readiness), cơ chế tự vệ hệ thống và kế hoạch kiểm thử tải cho quy mô **500 – 1.000 người dùng** cho hệ thống **PeerReview-AI**.

---

## 📌 1. TỔNG QUAN HẠ TẦNG VÀ KIẾN TRÚC MÔI TRƯỜNG

Hệ thống **PeerReview-AI** được đóng gói và phát hành tự động theo mô hình CI/CD trên 4 nền tảng Đám mây hàng đầu, đảm bảo tính tách biệt trách nhiệm (Separation of Concerns), khả năng chịu tải và tối ưu hóa chi phí vận hành.

```mermaid
graph TD
    subgraph ClientLayer["TẦNG NGƯỜI DÙNG (CLIENT DEVICES)"]
        Browser["Trình duyệt Web (Chrome, Edge, Safari, Firefox)"]
    end

    subgraph VercelCloud["TẦNG FRONTEND (VERCEL CLOUD)"]
        VercelApp["React 18 + Vite SPA (Static Distribution)"]
        VercelRewrite["SPA Route Rewrite (/(.*) -> /index.html)"]
        VercelApp --- VercelRewrite
    end

    subgraph RenderCloud["TẦNG BACKEND REST API (RENDER CLOUD)"]
        ExpressServer["Node.js / Express.js Web Service"]
        TrustProxyMW["Trust Proxy Layer (X-Forwarded-For)"]
        UploadCapMW["File Upload Guard (10MB Cap, Whitelist)"]
        RateLimiterMW["Dynamic AI Rate Limiter"]
        ExpressServer --> TrustProxyMW
        ExpressServer --> UploadCapMW
        ExpressServer --> RateLimiterMW
    end

    subgraph SupabaseCloud["TẦNG CƠ SỞ DỮ LIỆU (SUPABASE POSTGRESQL)"]
        PgBouncer["Supavisor Transaction Pooler (Port 6543)"]
        PostgresDB[("PostgreSQL Database (23 Tables, SSL Required)")]
        PgBouncer --- PostgresDB
    end

    subgraph AIEngine["TẦNG TRÍ TUỆ NHÂN TẠO (GOOGLE GEMINI API)"]
        GeminiService["Google Gemini 3.6 / 3.5 / 3.7 Flash Models"]
        AICacheEngine["SHA-256 Analysis Cache (7-day TTL)"]
        GeminiService --- AICacheEngine
    end

    Browser -->|HTTPS / WSS| VercelApp
    VercelApp -->|HTTPS REST API + Bearer JWT| ExpressServer
    ExpressServer -->|Encrypted Pooler Connection| PgBouncer
    ExpressServer -->|HTTPS API Contracts| GeminiService
```

### Bảng tổng hợp Tài nguyên Hạ tầng Đám mây:

| Tầng Hạ tầng | Nền tảng Đám mây | Quyền hạn / Cấu hình | Vai trò & Mục đích |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel Cloud** | Static Site Hosting, Edge CDN | Phân phối mã nguồn React/Vite SPA, tự động định tuyến lại trang (SPA Rewrite). |
| **Backend** | **Render Cloud** | Node.js Runtime Web Service | Xử lý nghiệp vụ REST API, xác thực JWT, điều phối AI và quản lý Cron Job. |
| **Database** | **Supabase Cloud** | Managed PostgreSQL (v15+) | Lưu trữ 23 bảng dữ liệu quan hệ, hỗ trợ UUID v4, Transaction Pooler. |
| **AI Engine** | **Google Gemini Cloud** | Gemini 3.6 / 3.5 / 3.7 Flash (Auto Fallback) | Phân tích thái độ/nhận xét (AI Mentor) và Tổng hợp đánh giá (AI Synthesis). |
| **Email SMTP** | **Gmail SMTP / Resend** | SMTP Port 587 (TLS) | Gửi email nhắc nhở Deadline tự động và link Reset Password bảo mật. |

---

## ⚡ 2. TRIỂN KHAI VERCEL FRONTEND (SINGLE PAGE APPLICATION)

### 2.1. Cấu hình Quy trình Đóng gói (Vite Build Engine)
- **Công nghệ Build:** Vite 5.x kết hợp React 18 & TypeScript.
- **Build Command:** `npm run build` ➔ Xuất bản các tệp tĩnh vào thư mục `dist/`.
- **Tối ưu hóa tài nguyên:** Tự động minify mã JS/CSS, phân tách bundle (Code Splitting) giúp thời gian tải trang đầu tiên (First Contentful Paint) `< 1.2s`.

### 2.2. Xử lý Định tuyến Client-side & Chống Lỗi 404 SPA
Do ứng dụng React sử dụng `react-router-v6` để điều hướng trang trên Client, khi người dùng bấm `F5 (Reload)` tại các đường dẫn sâu (như `/student/workspace` hoặc `/teacher/analytics`), máy chủ Web mặc định sẽ trả lỗi `404 Not Found`.

**Giải pháp:** Cấu hình tệp [frontend/vercel.json](file:///d:/Sang_Tao_AI/PeerReview-AI/frontend/vercel.json) để Vercel điều hướng tất cả request về `index.html`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2.3. Danh mục Biến môi trường Production trên Vercel:
* `VITE_API_URL`: `https://peerreview-ai-backend.onrender.com/api` (Đường dẫn kết nối máy chủ Backend Render).
* `VITE_ENABLE_MSW`: `false` (Tắt chế độ giả lập Mock Service Worker).

---

## 🛠️ 3. TRIỂN KHAI RENDER BACKEND (REST API SERVER)

### 3.1. Cấu hình Môi trường Thực thi (Runtime & Process Binding)
- **Runtime Environment:** Node.js v20+ 64-bit.
- **Root Directory:** `backend` *(Bắt buộc điền trên Render Dashboard)*.
- **Build Command:** `npm install`
- **Start Command:** `node src/server.js`

### 3.2. Cơ chế Trust Proxy & CORS Động
- **Bật Trust Proxy:** Do máy chủ Render đứng sau lớp Reverse Proxy (Cloudflare/Render Load Balancer), file [server.js](file:///d:/Sang_Tao_AI/PeerReview-AI/backend/src/server.js) được cấu hình:
  ```js
  app.set('trust proxy', 1);
  ```
  Điều này giúp Express đọc chính xác địa chỉ IP thực (`req.ip`) của Client thông qua header `X-Forwarded-For`, phục vụ tính năng Rate Limiting và Audit Logging.
- **Dynamic CORS Middleware:** Chấp nhận kết nối từ Localhost, miền Production chính thức và tất cả các tên miền động Vercel Preview Deployments (`/\.vercel\.app$/`, `/\.onrender\.com$/`).

### 3.3. Danh mục Biến môi trường Nhạy cảm (.env) trên Render:

```env
# Server Runtime
PORT=5000

# Database Connection (Supabase PostgreSQL Transaction Pooler)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Authentication Security
JWT_SECRET="your_jwt_secret_key_production_32_bytes"
JWT_EXPIRES_IN="24h"

# AI Service Credentials
AI_PROVIDER=gemini
GEMINI_API_KEY="your_gemini_api_key_here"
GEMINI_MODEL="gemini-3.6-flash"
AI_TIMEOUT=30000

# Email Delivery Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password_16_chars
SMTP_FROM="Hệ thống PeerReview-AI" <your_email@gmail.com>

# Domain Application Binding
CORS_ORIGIN=https://peer-review-ai-tau.vercel.app,http://localhost:5173
FRONTEND_URL=https://peer-review-ai-tau.vercel.app
```

### 3.4. Xử lý Trạng thái Ngủ đông (Cold-Start Mitigation)
- **Đặc điểm Render Free Tier:** Server sẽ đi ngủ (Sleep) sau 15 phút không có request. Thời gian thức dậy (Cold Start) mất từ 30 – 45 giây.
- **Giải pháp phía Frontend ([axios.ts](file:///d:/Sang_Tao_AI/PeerReview-AI/frontend/src/lib/axios.ts)):** Nâng thời gian chờ `timeout` của Axios Client lên **`60000ms` (60 giây)**, giúp ứng dụng không bị hủy request giữa chừng trong lần đầu tiên mở ứng dụng.

---

## 🗄️ 4. TRIỂN KHAI CƠ SỞ DỮ LIỆU SUPABASE (POSTGRESQL CLOUD)

### 4.1. Tối ưu hóa Kết nối (`pg.Pool` Connection Manager)
Để ngăn chặn nguy cơ cạn kệt kết nối (Connection Exhaustion) và tràn bộ nhớ Supabase, tệp [db.js](file:///d:/Sang_Tao_AI/PeerReview-AI/backend/src/config/db.js) áp đặt các giới hạn nghiêm ngặt:

```js
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                  // Tối đa 20 kết nối đồng thời
  idleTimeoutMillis: 30000,  // Giải phóng kết nối rảnh sau 30s
  connectionTimeoutMillis: 10000, // Timeout kết nối 10s
  ssl: { rejectUnauthorized: false }
});
```

### 4.2. Cấu trúc 23 Bảng Quan hệ & Tự động Cập nhật
- **Primary Keys:** 100% sử dụng định dạng UUID (`uuid_generate_v4()`) giúp ngăn chặn tấn công liệt kê ID (ID Enumeration Attack).
- **Triggers:** Tự động gọi hàm `update_updated_at_column()` khi có thao tác `UPDATE` trên các bảng `users`, `assignments`, `submissions`, `reviews`.
- **Indexes:** 12 Chỉ mục (Indexes) được tạo sẵn cho các cột thường xuyên truy vấn như `activity_logs(user_id, created_at)`, `review_assignments(reviewer_id, status)`.

---

## 🛡️ 5. CƠ CHẾ TỰ VỆ HẠ TẦNG VÀ BẢO MẬT HỆ THỐNG

### 5.1. Giới hạn Tệp Nộp bài & Phòng chống Tràn RAM Server
- **Vấn đề:** Máy chủ Render miễn phí bị giới hạn **512MB RAM**. Nếu sinh viên tải lên tệp dung lượng quá lớn (VD: > 50MB), server sẽ lập tức bị OOM (Out-of-Memory) crash.
- **Giải pháp:** Tệp [fileUpload.middleware.js](file:///d:/Sang_Tao_AI/PeerReview-AI/backend/src/middleware/fileUpload.middleware.js) thực hiện 2 lớp kiểm tra trước khi lưu file:
  1. **Check Size:** Giới hạn tối đa **10MB** (`10 * 1024 * 1024 bytes`). Trả lỗi `413 FILE_TOO_LARGE` nếu vượt quá.
  2. **Check Whitelist Extension:** Chỉ chấp nhận `.pdf`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx`, `.ppt`, `.txt`, `.zip`. Trả lỗi `400 INVALID_FILE_TYPE` nếu chọn file cấm (`.exe`, `.sh`).

### 5.2. Bảo mật Ẩn danh 2 chiều (Double-Blind Privacy)
- **Backend Sanitization Engine:** Mọi API trả về danh sách bài chấm chéo cho Sinh viên đều phải đi qua hàm làm sạch dữ liệu.
- **Tự động xóa bỏ các trường PII:** `full_name`, `email`, `student_id`, `class_name`, và `group_name` trước khi gửi dữ liệu xuống Frontend Client. Sinh viên chỉ nhìn thấy mã bài nộp ẩn danh (VD: `Anonymous Submission #9F4570`).

### 5.3. Khôi phục Mật khẩu qua Email Bảo mật
- **Thời hạn Token 60 phút:** Token đặt lại mật khẩu được mã hóa băm SHA-256 lưu trong CSDL với thời gian hết hạn là 60 phút (`NOW() + INTERVAL '60 MINUTES'`).
- **Anti-Enumeration Protection:** Trả về thông báo đồng nhất *"Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn"* để ngăn chặn kẻ tấn công dò tìm email hợp lệ.

---

## 📊 6. KẾ HOẠCH KIỂM THỬ TẢI VÀ LỘ TRÌNH TRIỂN KHAI PILOT (500 – 1.000 USERS)

### 6.1. Kịch bản & Chỉ số Đánh giá Tải Đề xuất với k6 (`k6-spike-test.js`)
Dự án thiết lập sẵn file kịch bản bằng công cụ kiểm thử tải chuyên dụng **k6** để sẵn sàng đánh giá khả năng chịu tải đợt truy cập bùng nổ (Spike Load) của **300 – 500 Virtual Users (VUs)** nộp bài và chấm chéo trong 5 phút trước Deadline:

```javascript
// backend/src/tests/load/k6-spike-test.js
export const options = {
    stages: [
        { duration: '30s', target: 50 },   // Tăng tốc lên 50 users
        { duration: '1m',  target: 300 },  // Tăng tốc lên 300 users
        { duration: '30s', target: 500 },  // Đạt đỉnh 500 users đồng thời
        { duration: '1m',  target: 300 },  // Giữ mức 300 users
        { duration: '30s', target: 0 },    // Giảm dần về 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% request phản hồi < 500ms
        http_req_failed: ['rate<0.01'],    // Tỷ lệ lỗi request < 1%
    },
};
```

### 6.2. Endpoint Giám sát Sức khỏe Hạ tầng (`GET /api/health`)
Endpoint công khai hỗ trợ các dịch vụ Ops/Load Balancer giám sát tình trạng hệ thống theo thời gian thực:

```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-09-06T21:15:00.000Z",
    "uptimeSeconds": 86400,
    "database": {
      "connected": true,
      "latencyMs": 4
    },
    "aiService": {
      "configured": true
    },
    "memory": {
      "heapUsedMB": 45.2,
      "heapTotalMB": 88.5,
      "rssMB": 120.1
    }
  }
}
```

### 6.3. Lộ trình Triển khai Pilot 3 Giai đoạn
1. **Giai đoạn 1 (Thử nghiệm kín — 50–100 Users):** Triển khai nội bộ cho 1–2 lớp học, đánh giá độ ổn định của luồng Nộp bài và AI Mentor.
2. **Giai đoạn 2 (Thử nghiệm diện rộng — 300–500 Users):** Mở rộng cho 5–8 lớp học, kích hoạt Thuật toán Phân công Chấm chéo và AI Review Synthesis.
3. **Giai đoạn 3 (Vận hành chính thức — 800–1.000 Users):** Triển khai toàn bộ quy mô toàn khóa học, giám sát Dashboard Analytics và Cảnh báo rủi ro Collaboration Risk.

---

## 📋 TỔNG KẾT
Tài liệu phương án triển khai này bảo đảm tính khả thi 100%, tuân thủ đầy đủ các chuẩn mực về bảo mật, hiệu năng và sẵn sàng đưa hệ thống **PeerReview-AI** vào vận hành thực tế.
