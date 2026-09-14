# PEERREVIEW-AI — HỆ THỐNG AI HỖ TRỢ CHẤM CHÉO & ĐÁNH GIÁ TƯƠNG TÁC NHÓM

[![Production Status](https://img.shields.io/badge/Production-Live-emerald?style=for-the-badge)](https://peer-review-ai-tau.vercel.app)
[![Backend Status](https://img.shields.io/badge/Backend-Render-blue?style=for-the-badge)](https://peerreview-ai-backend.onrender.com/api/health)
[![Database](https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E?style=for-the-badge)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**PeerReview-AI** là hệ thống Web tích hợp Trí tuệ Nhân tạo (AI) hỗ trợ số hóa toàn bộ quy trình làm việc nhóm, nộp bài đồ án, chấm chéo ẩn danh (Double-Blind Peer Review), định lượng mức độ đóng góp cá nhân ($C_1 - C_4$) và tự động tổng hợp phản biện cũng như cảnh báo rủi ro nhóm cho Giảng viên.

> 🌐 **Live Demo Application:** [https://peer-review-ai-tau.vercel.app](https://peer-review-ai-tau.vercel.app)  
> 🔗 **Backend API Health Check:** [https://peerreview-ai-backend.onrender.com/api/health](https://peerreview-ai-backend.onrender.com/api/health)

---

## 🎬 VIDEO DEMO & BỘ PHỤ ĐỀ (DEMO VIDEO & CAPTIONS)

Dự án cung cấp trọn bộ Video Demo sản phẩm quy mô thực tế **30 sinh viên (Lớp CS201)** cùng các tài liệu kịch bản và bộ phụ đề được đồng bộ chính xác 100% từng giây:

* 🎥 **Video Demo Sản phẩm (04:58):** [PeerReview Video Demo.mp4](docs/PeerReview%20Video%20Demo.mp4)
* 📖 **Kịch bản Quay Video:** [DEMO_SCRIPT_VIDEO.md](docs/DEMO_SCRIPT_VIDEO.md)
* 🎙️ **Kịch bản Thuyết minh Chi tiết (Voiceover Script):** [VOICEOVER_SCRIPT_DEMO.md](docs/VOICEOVER_SCRIPT_DEMO.md)
* 📄 **Bộ Phụ đề Đơn dòng Chuẩn SRT:** [demo_captions.srt](docs/demo_captions.srt) *(Import trực tiếp vào CapCut / Premiere Pro / Camtasia)*
* 📄 **Bộ Phụ đề WebVTT:** [demo_captions.vtt](docs/demo_captions.vtt) *(Nhúng trực tiếp vào Web HTML5 Player)*

---

## 🌟 TÍNH NĂNG CỐT LÕI (CORE FEATURES)

### 1. 👥 Quản lý Lớp học & Nhóm (Group Workspace & Activity Tracking)
- Tự động hóa tạo lớp, tham gia lớp qua Mã mời (Invite Code).
- Không gian làm việc nhóm (Workspace) đầy đủ tính năng: Task Management (Kanban/List), Group Discussions, Group File Attachments.
- Nhật ký hoạt động (`activity_logs`) tự động ghi vết mọi thao tác thời gian thực của sinh viên.

### 2. 🙈 Đánh giá Đồng đẳng Ẩn danh (Double-Blind Peer Review)
- Thuật toán phân công chấm chéo tự động: Ngăn chặn tự chấm, chống duplicate review, phân bổ số lượng bài cân bằng.
- **Bảo mật danh tính tuyệt đối (Backend Sanitized):** Loại bỏ hoàn toàn Họ tên, MSSV, Tên lớp, Tên nhóm của cả Người nộp và Người chấm ở cấp độ Backend API.

### 3. 🤖 AI Peer-Review Mentor (Hỗ trợ Góp ý Real-time)
- Phân tích trực tiếp phản hồi của sinh viên theo các tiêu chí: **Tính xây dựng (Constructiveness)**, **Độ liên quan (Relevance)**, **Văn phong (Tone)**, **Độ độc hại (Toxicity)**.
- Động cơ AI thế hệ mới **Google Gemini 3.x Flash Family** (`gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.7-flash`) với khả năng trích xuất JSON an toàn khỏi khối suy luận (Thought block).
- Cơ chế **Tự động Xoay vòng & Dự phòng Model (Multi-Model Auto-Rotation & Fallback)** khi gặp lỗi `429 Quota Exhaustion` giúp nâng cao độ tin cậy vận hành.
- Tích hợp **Debounce (1.5s)** và **SHA-256 Comment Caching (7 ngày)** giúp tối ưu chi phí AI API và chống spam server.

### 4. 📊 Engine Định lượng Đóng góp Cá nhân ($V_i = [C_1, C_2, C_3, C_4]$)
- Thuật toán định lượng đa chiều hợp nhất 4 chỉ số:
  - $C_1$: Tỷ lệ hoàn thành công việc & Hoạt động thực tế (`activity_logs`).
  - $C_2, C_3, C_4$: Điểm chấm nội bộ ẩn danh (1 - 5 sao) về *Chất lượng*, *Đúng hạn* và *Tinh thần làm việc nhóm*.
- Tính toán **Hệ số Quy đổi Cá nhân ($S_i / G_{ind}$)** và trực quan hóa bằng **Biểu đồ Ra-đa 4 trục (Radar Chart)** sinh động.
- Phát hiện chính xác sinh viên ăn bám (**Potential Free-rider**) và thực hiện đóng băng dữ liệu (Snapshot) khi Giảng viên nhấn *Publish Analytics*.

### 5. 📝 AI Review Synthesis cho Giáo viên (Human-in-the-loop)
- AI tự động tổng hợp toàn bộ bài chấm chéo cả lớp chỉ trong **3 giây**: **Điểm mạnh (Strengths)**, **Điểm yếu (Weaknesses)**, **Gợi ý cải thiện (Suggestions)** với độ tin cậy 85%.
- **Vết Ngôn Phản Biện (Traceability):** Cho phép Giảng viên xem lại bản phản biện gốc ẩn danh một cách minh bạch.
- **Giáo viên toàn quyền điều khiển & Khóa an toàn:** Xem danh sách review gốc, chỉnh sửa/bổ sung tóm tắt (`is_teacher_edited`), duyệt bản tổng hợp (`APPROVED`). Bảo vệ bằng cơ chế **Khóa lạc quan (Optimistic Concurrency Control)** chống ghi đè dữ liệu.

### 6. ⚠️ Cảnh báo Rủi ro & Dashboard dành cho Giáo viên (Teacher Analytics & Early Warning)
- Dashboard tổng quan thống kê tỷ lệ nộp bài, tiến độ chấm chéo, điểm số trung bình.
- Hệ thống **Early Warnings Board** tự động quét và phát hiện các rủi ro: *Low Activity*, *Unbalanced Contribution*, *Review Inactivity* (chưa chấm chéo), *Incomplete Tasks* (chậm tiến độ task).

### 7. 🛡 Quản trị Hệ thống & Nhật ký Audit (Admin System & Audit Logs)
- Quản lý người dùng, phân quyền Role (`STUDENT`, `TEACHER`, `ADMIN`), khóa/mở tài khoản.
- Cơ chế tự bảo vệ: Chặn Admin tự khóa chính mình và bảo vệ Admin duy nhất của hệ thống.
- Cấu hình tham số vận hành hệ thống động (`system_config`) và lưu nhật ký thao tác nhạy cảm (`activity_logs`).

### 8. ☁️ Tích hợp Supabase Storage & Quản lý File Cloud
- Hệ thống lưu trữ file đồ án/bài nộp (`submissions`), đề bài (`assignments`), và tài liệu làm việc nhóm (`workspace`).
- Tự động khởi tạo Bucket (Auto-bucket provisioning) và tạo đường dẫn Signed URL/Public URL bảo mật.
- Kiểm soát dung lượng file nộp bài tối đa **10MB** (bảo vệ RAM 512MB trên Render) và kiểm tra danh sách trắng MIME/Extension.

---

## 🛠 CÔNG NGHỆ SỬ DỤNG (TECH STACK)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, TanStack Query (React Query v5), TailwindCSS v4, Zustand, Lucide Icons, Sonner |
| **Backend** | Node.js, Express.js (ESM), PostgreSQL (pg pool), Zod Schema Validation, JWT, Bcrypt |
| **Database** | PostgreSQL (Supabase Cloud Pooler), UUID Primary Keys, Composite & GIN Indexes |
| **Cloud Storage** | Supabase Storage (Submissions, Assignments & Workspace File Buckets) |
| **AI Integration** | Google Gemini 3.x Flash Family (`gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.7-flash`) với Multi-Model Rotation & SHA-256 Cache |
| **Testing** | Jest (Backend Service & API Unit Tests), Playwright (Frontend E2E Testing) |
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

## 🧪 QUY TRÌNH KIỂM THỬ (TESTING SUITE)

Dự án áp dụng mô hình **Test Pyramid** với kiểm thử đơn vị Backend và kiểm thử tích hợp E2E:

### 1. Backend Unit Testing (Jest)
```bash
cd backend
npm test                    # Chạy toàn bộ bộ test cho Auth, Assignment, Rubric, Group, Review, AI, Analytics
npm run test:coverage       # Xuất báo cáo độ phủ mã nguồn (Coverage Report)
```

### 2. Frontend E2E Testing (Playwright)
```bash
cd frontend
npx playwright test         # Chạy kịch bản kiểm thử E2E tự động
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

## 📚 TÀI LIỆU DỰ ÁN CHI TIẾT (DOCUMENTATION INDEX)

| Tên Tài liệu | Đường dẫn File | Mô tả Nội dung |
| :--- | :--- | :--- |
| 🎥 **Video Demo Sản phẩm** | [PeerReview Video Demo.mp4](docs/PeerReview%20Video%20Demo.mp4) | Video quay demo 5 phút trên quy mô 30 sinh viên |
| 📖 **Kịch bản Quay Video** | [DEMO_SCRIPT_VIDEO.md](docs/DEMO_SCRIPT_VIDEO.md) | Kịch bản 5 phút chuẩn hóa 5 tiêu chí cuộc thi |
| 🎙️ **Kịch bản Thuyết minh** | [VOICEOVER_SCRIPT_DEMO.md](docs/VOICEOVER_SCRIPT_DEMO.md) | Lời thoại thuyết minh kèm mô tả thao tác UI từng giây |
| 📄 **Phụ đề Chuẩn SRT** | [demo_captions.srt](docs/demo_captions.srt) | File phụ đề đơn dòng đồng bộ 100% video demo |
| 📄 **Phụ đề WebVTT** | [demo_captions.vtt](docs/demo_captions.vtt) | File phụ đề HTML5 Web Player |
| 🏗 **Kiến trúc Hệ thống** | [10_Kien_Truc_He_Thong_Va_Phuong_An_Trien_Khai.md](docs/10_Kien_Truc_He_Thong_Va_Phuong_An_Trien_Khai.md) | Phân tích chi tiết kiến trúc & triển khai Cloud |
| 📖 **Hướng dẫn Local** | [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) | Hướng dẫn cài đặt & cấu hình môi trường Local |
| ☁️ **Deploy Cloud Guide** | [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Hướng dẫn vận hành Vercel, Render & Supabase |
| 🎨 **Design Tokens v2** | [DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md) | Hệ thống màu sắc Google Blue, Role Mapping & Tokens |
| 📋 **Báo cáo Tiến độ** | [project_progress_report.md](docs/project_progress_report.md) | Báo cáo tiến độ hoàn thành các Phase 0-13 |
| 🗄 **Thiết kế Cơ sở Dữ liệu** | [Database.md](docs/Database.md) | Sơ đồ ERD, Schemas & ràng buộc PostgreSQL |

---

## 📄 LICENSE
Dự án được phát triển phục vụ học thuật và nghiên cứu. Bảo lưu mọi quyền © 2026 PeerReview-AI Team.
