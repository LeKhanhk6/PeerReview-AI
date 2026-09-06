# HƯỚNG DẪN VẬN HÀNH VÀ DEPLOY CLOUD PRODUCTION (DEPLOYMENT GUIDE)

Tài liệu này tổng hợp quy trình phát hành (Deploy), vận hành và bảo trì hệ thống **PeerReview-AI** trên môi trường Cloud Production thực tế.

---

## 🌐 1. ĐỊA CHỈ HỆ THỐNG PRODUCTION (LIVE URLS)

- 🔹 **Frontend Application (Vercel):** [https://peer-review-ai-tau.vercel.app](https://peer-review-ai-tau.vercel.app)
- 🔹 **Backend REST API (Render):** [https://peerreview-ai-backend.onrender.com](https://peerreview-ai-backend.onrender.com)
- 🔹 **Health Check Endpoint:** [https://peerreview-ai-backend.onrender.com/api/health](https://peerreview-ai-backend.onrender.com/api/health)
- 🔹 **Database Infrastructure (Supabase):** PostgreSQL Cloud (AWS ap-southeast-1 Singapore)

---

## 🚀 2. THIẾT LẬP DỊCH VỤ BACKEND TRÊN RENDER

### 2.1. Cấu hình Web Service
- **Source Repo:** `LeKhanhk6/PeerReview-AI`
- **Branch:** `main` (hoặc `develop`)
- **Root Directory:** `backend` *(⚠️ Bắt buộc)*
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

### 2.2. Biến môi trường trên Render Dashboard (Environment Variables)
```ini
PORT=5000
DATABASE_URL="postgresql://postgres.<project_ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
JWT_SECRET="<Chuỗi ngẫu nhiên 32-byte sinh bằng openssl rand -hex 32, KHÁC local>"
AI_API_KEY="<Gemini_API_Key_Production>"
CORS_ORIGIN="https://peer-review-ai-tau.vercel.app,http://localhost:5173"

# Supabase Storage Configuration (Cho tính năng Upload/Download file)
SUPABASE_URL="https://<project_ref>.supabase.co"
SUPABASE_ANON_KEY="<Supabase_Anon_Public_Key_Hoac_Service_Key>"
```

---

## 💻 3. THIẾT LẬP DỊCH VỤ FRONTEND TRÊN VERCEL

### 3.1. Cấu hình Project
- **Framework Preset:** `Vite`
- **Root Directory:** `frontend` *(⚠️ Bắt buộc)*
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 3.2. Cấu hình SPA Client Routing (`frontend/vercel.json`)
Để xử lý triệt để lỗi F5 Refresh `404 Not Found` trên React Single Page Application (SPA), dự án đã tích hợp sẵn file `frontend/vercel.json`:

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

### 3.3. Biến môi trường trên Vercel Dashboard (Environment Variables)
```ini
VITE_API_URL="https://peerreview-ai-backend.onrender.com"
```
*(⚠️ Lưu ý: Biến `VITE_API_URL` được đưa vào lúc build-time của Vite. Phía Frontend đã hỗ trợ tự động bổ sung đuôi `/api` nếu bị thiếu).*

---

## ⚡ 4. LƯU Ý VẬN HÀNH & CẢNH BÁO COLD START (RENDER FREE TIER)

### ⚠️ Cơ chế "Ngủ đông" (Cold Start) của Render Free Instance:
- Dịch vụ Render gói Free sẽ tự động đi vào trạng thái tạm ngưng (spin down/sleep) sau 15 phút không có lưu lượng truy cập.
- **Request đầu tiên** sau khi ngủ đông sẽ tốn khoảng **30 - 50 giây** để Render khởi động lại container (Cold Start).
- **Khuyến cáo khi Demo / Kiểm thử:** Hãy mở trình duyệt và truy cập trước URL `https://peerreview-ai-backend.onrender.com/api/health` trước 3-5 phút để đánh thức server trước khi bắt đầu bài thuyết trình hoặc chạy kiểm thử End-to-End.

---

## 🛡 5. CHÍNH SÁCH BẢO MẬT & XOAY AN TOÀN KHOÁ (SECRET ROTATION)

1. **Không rò rỉ Keys vào Git History:**
   - Đã kiểm định bằng `git log -p -- .env` -> Lịch sử commit sạch 100%.
   - Mọi Secret Key chỉ được nhập trực tiếp trên Dashboard của Render/Vercel.
2. **Quy trình Xoay Key (Secret Rotation) nếu nghi ngờ lộ:**
   - Nếu đổi `JWT_SECRET` trên Render Dashboard: Mọi phiên làm việc cũ sẽ tự động hết hạn, người dùng chỉ cần đăng nhập lại để nhận Token mới.
   - Nếu đổi `DATABASE_URL` trên Supabase: Cập nhật lại chuỗi kết nối trên Render Dashboard và Render sẽ tự động restart dịch vụ trong 5s.
