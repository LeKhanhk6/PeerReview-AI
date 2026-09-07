# PEERREVIEW-AI — HỆ THỐNG AI HỖ TRỢ CHẤM CHÉO & ĐÁNH GIÁ TƯƠNG TÁC NHÓM

[![Production Status](https://img.shields.io/badge/Production-Live-emerald?style=for-the-badge)](https://peer-review-ai-tau.vercel.app)
[![Backend Status](https://img.shields.io/badge/Backend-Render-blue?style=for-the-badge)](https://peerreview-ai-backend.onrender.com/api/health)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**PeerReview-AI** là hệ thống Web tích hợp Trí tuệ Nhân tạo (AI) hỗ trợ số hóa toàn bộ quy trình làm việc nhóm, nộp bài đồ án, chấm chéo ẩn danh (Double-Blind Peer Review) và phân tích tương tác thành viên trong lớp học.

> 🌐 **Live Demo Application:** [https://peer-review-ai-tau.vercel.app](https://peer-review-ai-tau.vercel.app)  
> 🔗 **Backend API Health Check:** [https://peerreview-ai-backend.onrender.com/api/health](https://peerreview-ai-backend.onrender.com/api/health)

---

## 🌟 TÍNH NĂNG CỐT LÕI (CORE FEATURES)

### 1. 👥 Quản lý Lớp học & Nhóm (Group Workspace & Activity Tracking)
- Tự động hóa tạo lớp, tham gia lớp qua Mã mời (Invite Code).
- Không gian làm việc nhóm (Workspace) đầy đủ tính năng: Task Management (Kanban/List), Group Discussions, Group File Attachments.
- Nhật ký hoạt động (`activity_logs`) tự động ghi vết mọi thao tác của sinh viên.

### 2. 🙈 Đánh giá Đồng đẳng Ẩn danh (Double-Blind Peer Review)
- Thuật toán phân công chấm chéo tự động: Ngăn chặn tự chấm, chống duplicate review, phân bổ số lượng bài cân bằng.
- **Bảo mật danh tính tuyệt đối (Backend Sanitized):** Loại bỏ hoàn toàn Họ tên, MSSV, Tên lớp, Tên nhóm của cả Người nộp và Người chấm ở cấp độ Backend API.

### 3. 🤖 AI Peer-Review Mentor (Hỗ trợ Góp ý Real-time)
- Phân tích trực tiếp phản hồi của sinh viên theo các tiêu chí: **Tính xây dựng (Constructiveness)**, **Độ liên quan (Relevance)**, **Văn phong (Tone)**, **Độ độc hại (Toxicity)**.
- Động cơ AI thế hệ mới **Google Gemini 3.x Flash Family** (`gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.7-flash`) với khả năng trích xuất JSON an toàn khỏi khối suy luận (Thought block).
- Cơ chế **Tự động Xoay vòng & Dự phòng Model (Multi-Model Auto-Rotation & Fallback)** khi gặp lỗi `429 Quota Exhaustion` hoặc `404 Not Found`, giúp nhân 4 lần dung lượng xử lý miễn phí (lên đến 80 request/phút).
- Tích hợp **Debounce (1.5s)** và **SHA-256 Comment Caching (7 ngày)** giúp tối ưu chi phí AI API và chống spam server.

### 4. 📊 Engine Phân tích Đóng góp Nhóm (Contribution Analytics Engine)
- Tính toán chỉ số đóng góp cá nhân **Contribution Score (0 – 100%)** dựa trên thuật toán trọng số hoạt động thực tế.
- Tự động phân loại thành viên: *High Contributor*, *Normal Contributor*, *Low Contributor*, và phát hiện nguy cơ ăn bám (*Potential Free-rider*).

### 5. 📝 AI Review Synthesis cho Giáo viên (Human-in-the-loop)
- AI tự động tổng hợp hàng trăm nhận xét chấm chéo thành bản tóm tắt súc tích: **Điểm mạnh (Strengths)**, **Điểm yếu (Weaknesses)**, **Gợi ý cải thiện (Suggestions)**.
- **Đồng bộ hóa thang điểm 10 (0 - 10 điểm):** Toàn bộ điểm số tổng quan bài nộp, bài đánh giá và tổng hợp đều được chuẩn hóa thống nhất trên thang điểm 10.
- **Giáo viên toàn quyền điều khiển & Khóa an toàn:** Xem danh sách review gốc, chỉnh sửa/bổ sung tóm tắt (`is_teacher_edited`), duyệt bản tổng hợp (`APPROVED`). Bảo vệ bằng cơ chế **Khóa lạc quan (Optimistic Concurrency Control)** chính xác microsecond chống ghi đè dữ liệu.

### 6. ⚠️ Cảnh báo Rủi ro & Dashboard dành cho Giáo viên (Teacher Analytics & Early Warning)
- Dashboard tổng quan thống kê tỷ lệ nộp bài, tiến độ chấm chéo, điểm số trung bình.
- Hệ thống **Early Warnings** phát hiện sớm các rủi ro: *Hoạt động thấp (Low Activity)*, *Đóng góp không đồng đều (Unbalanced Contribution)*, *Tương tác tiêu cực (Negative Interaction)*.

### 7. 🛡 Quản trị Hệ thống & Nhật ký Audit (Admin System & Audit Logs)
- Quản lý người dùng, phân quyền Role (`STUDENT`, `TEACHER`, `ADMIN`), khóa/mở tài khoản.
- Cơ chế tự bảo vệ: Chặn Admin tự khóa chính mình và bảo vệ Admin duy nhất của hệ thống.
- Cấu hình tham số vận hành hệ thống động (`system_config`) và lưu nhật ký thao tác nhạy cảm (`activity_logs`).

### 8. ☁️ Tích hợp Supabase Storage & Quản lý File Cloud
- Hệ thống lưu trữ file đồ án/bài nộp (`submissions`), đề bài (`assignments`), và tài liệu làm việc nhóm (`workspace`).
- Tự động khởi tạo Bucket (Auto-bucket provisioning) và tạo đường dẫn Signed URL/Public URL bảo mật.
- Kiểm soát dung lượng file nộp bài tối đa **10MB** (bảo vệ RAM 512MB trên Render) và kiểm tra danh sách trắng MIME/Extension.

### 9. ⚡ Tự vệ Hạ tầng & Giám sát Sức khỏe (System Resilience & Diagnostics)
- Diagnostic API `GET /api/health` đo lường độ trễ kết nối Supabase DB (`SELECT 1`), Process Uptime và sử dụng RAM Heap.
- Bật Express `trust proxy` và CORS Regex hỗ trợ các Vercel Preview Deployments (`*.vercel.app`).

---

## 🛠 CÔNG NGHỆ SỬ DỤNG (TECH STACK)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, TanStack Query (React Query v5), TailwindCSS, Zustand, Lucide Icons, Sonner |
| **Backend** | Node.js, Express.js (ESM), PostgreSQL (pg pool), Zod Schema Validation, JWT, Bcrypt |
| **Database** | PostgreSQL (Supabase Cloud Pooler), UUID Primary Keys, Composite & GIN Indexes |
| **Cloud Storage** | Supabase Storage (Submissions, Assignments & Workspace File Buckets) |
| **AI Integration** | Google Gemini 3.x Flash Family (`gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.7-flash`) với Multi-Model Rotation, Rate Limiter & SHA-256 Cache |
| **Testing** | Jest, Service Unit Testing, Fake Timers & Mock Pool |
| **Cloud Deployment** | Vercel (Frontend Client), Render (Backend Node API), Supabase (Managed Postgres & Storage) |

---

## 📐 KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND CLIENT (Vercel Production)                  │
│        https://peer-review-ai-tau.vercel.app (React 18 + SPA)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         REST API (Bearer JWT / HTTPS)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND SERVER (Render Production)                   │
│        https://peerreview-ai-backend.onrender.com (Node.js/Express)    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Middlewares: Dynamic CORS, JWT Auth, RBAC Role Check,          │   │
│   │ Dynamic AI Rate Limiter, PII Sanitizer, Centralized Error      │   │
│   └──────┬────────────────────────┬────────────────────────┬───────┘   │
└──────────┼────────────────────────┼────────────────────────┼───────────┘
           │                        │                        │
           ▼                        ▼                        ▼
┌──────────────────────┐ ┌────────────────────┐ ┌──────────────────────────┐
│ SUPABASE POSTGRESQL  │ │  SUPABASE STORAGE  │ │  AI SERVICE INTEGRATION  │
│ (28+ Tables, Foreign │ │ (Cloud File Buckets│ │ (Gemini 3.x Flash Family │
│ Keys, Indexes, GIN)  │ │  Submissions/Assg) │ │  Multi-Model Auto-Rotate)│
└──────────────────────┘ └────────────────────┘ └──────────────────────────┘
```

---

## 🚀 KHỞI CHẠY NHANH TRÊN LOCAL (QUICK START)

### 1. Clone Repository
```bash
git clone https://github.com/LeKhanhk6/PeerReview-AI.git
cd PeerReview-AI
```

### 2. Khởi chạy Backend
```bash
cd backend
npm install
# Tạo file .env dựa trên .env.example (Xem chi tiết tại docs/SETUP_GUIDE.md)
npm run dev
```

### 3. Khởi chạy Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Mở trình duyệt tại [http://localhost:5173](http://localhost:5173) để trải nghiệm ứng dụng.

---

## 📚 TÀI LIỆU DỰ ÁN CHI TIẾT (DOCUMENTATION)

- 🏗 [Kiến trúc Hệ thống & Phương án Triển khai (10_Kien_Truc_He_Thong_Va_Phuong_An_Trien_Khai.md)](docs/10_Kien_Truc_He_Thong_Va_Phuong_An_Trien_Khai.md)
- 📖 [Hướng dẫn Cài đặt Local (SETUP_GUIDE.md)](docs/SETUP_GUIDE.md)
- ☁️ [Hướng dẫn Vận hành & Deploy Cloud (DEPLOYMENT_GUIDE.md)](docs/DEPLOYMENT_GUIDE.md)
- 🎨 [Quy chuẩn Thiết kế & Hệ thống UI Tokens (DESIGN_TOKENS.md)](docs/DESIGN_TOKENS.md)
- 📋 [Lộ trình & Báo cáo Tiến độ (Plan.md)](docs/Plan.md)
- 🗄 [Thiết kế Cơ sở Dữ liệu (Database.md)](docs/Database.md)

---

## 📄 LICENSE
Dự án được phát triển phục vụ học thuật và nghiên cứu. Bảo lưu mọi quyền © 2026 PeerReview-AI Team.
