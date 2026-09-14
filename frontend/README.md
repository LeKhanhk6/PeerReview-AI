# PEERREVIEW-AI — FRONTEND WEB APPLICATION

[![Frontend Status](https://img.shields.io/badge/Vercel-Online-emerald?style=for-the-badge)](https://peer-review-ai-tau.vercel.app)
[![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple?style=for-the-badge)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.x-38BDF8?style=for-the-badge)](https://tailwindcss.com)

Thành phần Frontend Web Application của dự án **PeerReview-AI**, cung cấp giao diện người dùng hiện đại, phản hồi thời gian thực, tích hợp hệ thống Design Tokens v2 (Google Royal Blue `#0B57D0`) tệp 100% WCAG AA contrast evidence và trải nghiệm Full-Viewport Shell.

> 🌐 **Production Web Application (Vercel):** [https://peer-review-ai-tau.vercel.app](https://peer-review-ai-tau.vercel.app)

---

## 🛠 KIẾN TRÚC FRONTEND & CẤU TRÚC THƯ MỤC

Dự án tổ chức mã nguồn theo mô hình **Feature-driven Folder Architecture** kết hợp với Atomic Components:

```text
frontend/
├── src/
│   ├── assets/             # Hình ảnh, Logos, SVG Icons
│   ├── components/         # Shared UI Components
│   │   ├── common/         # Modals, Badges, NetworkBanner, LoadingSpinners
│   │   ├── layout/         # StudentLayout, TeacherLayout, AdminLayout (100vh Shell)
│   │   └── ui/             # Reusable Primitive Components (Buttons, Inputs, Cards)
│   ├── constants/          # Environment & Application Constants
│   ├── features/           # Modules Nghiệp vụ chính
│   │   ├── admin/          # Admin Dashboard, User Management, Audit Logs
│   │   ├── analytics/      # Teacher Analytics, Radar Chart $C_1-C_4$, Early Warnings
│   │   ├── assignment/     # Quản lý Bài tập đồ án & Rubric
│   │   ├── auth/           # Login, Register, Profile, Store (Zustand)
│   │   ├── classes/        # Quản lý Lớp học & Danh sách Sinh viên/Nhóm
│   │   ├── groups/         # Quản lý Nhóm học tập
│   │   ├── review/         # Review Inbox, Review Writing & AI Peer-Review Mentor
│   │   ├── student-dashboard/ # Student Dashboard & Task Tracker
│   │   ├── submission/     # Nộp bài GitHub/File Cloud & Monitor phiên bản
│   │   ├── synthesis/      # AI Review Synthesis & Teacher Approval Page
│   │   └── workspace/      # Group Workspace, Kanban Tasks, Discussions & Activity Log
│   ├── hooks/              # Custom React Hooks (Debounce, Network status, Storage)
│   ├── lib/                # Config TanStack Query Client (`queryClient.ts`)
│   ├── services/           # Axios API Client & Base Instance Config
│   ├── utils/              # Helper functions, Formatters, Date Utilities
│   ├── App.tsx             # Root Application Routing & Auth Providers
│   ├── index.css           # Design Tokens v2 & TailwindCSS v4 Imports
│   └── main.tsx            # Application Entry Point
├── e2e/                    # Kịch bản Kiểm thử Tự động E2E (Playwright Test Suite)
├── vercel.json             # SPA Rewrite Rules (Xử lý lỗi F5 404 trên Vercel)
└── package.json            # Frontend Dependencies & Scripts
```

---

## 🎨 HỆ THỐNG DESIGN SYSTEM V2 (DESIGN TOKENS)

Giao diện Frontend tuân thủ nghiêm ngặt **Design System v2** chuẩn WCAG AA Contrast Evidence:

- **Primary Color:** Google Royal Blue (`#0B57D0` / `bg-brand-primary` / `text-brand-primary`).
- **Role Color Mapping:**
  - 🛡 **ADMIN:** Rose Palette (`text-rose-600`, `bg-rose-50`, `border-rose-200`)
  - 👨‍🏫 **TEACHER:** Emerald Palette (`text-emerald-600`, `bg-emerald-50`, `border-emerald-200`)
  - 🎓 **STUDENT:** Brand/Slate Palette (`text-brand-primary`, `bg-brand-soft-bg`)
- **Layout Shell:** Full-Viewport Flexbox Shell (`h-screen overflow-hidden`), không có thanh cuộn toàn trang trên Desktop, cuộn nội bộ tự nhiên với `overflow-y-auto min-h-0`.
- **AI Highlight Badges:** AI Mentor Soft Blue (`bg-ai-blue-bg`) và AI Synthesis Soft Purple (`bg-ai-purple-bg`).

---

## ⚡ CÁC KỸ THUẬT NỔI BẬT NÓI TRÊN FRONTEND

1. **Debounce Optimization (1.5s):** Áp dụng Kỹ thuật Debounce khi người dùng gõ nhận xét trong màn hình Review, tránh gọi API liên tục làm sập server Backend.
2. **State Management Kép:**
   - **Zustand (`useAuthStore`):** Quản lý State phiên làm việc Auth (User session, Token, Roles).
   - **TanStack Query v5 (`React Query`):** Quản lý Server State, Caching, Refetching tự động.
3. **Double-Blind UI Isolation:** Đảm bảo không render bất kỳ thông tin nhận dạng nào (Họ tên, MSSV, Lớp) trên giao diện Chấm chéo.
4. **SPA Single Page App Client Routing:** Cấu hình file `vercel.json` rewrite mọi route về `index.html` loại bỏ lỗi 404 khi F5 trên Vercel Production.

---

## 🚀 HƯỚNG DẪN CHẠY LOCAL FRONTEND

### 1. Cài đặt Dependencies
```bash
cd frontend
npm install
```

### 2. Thiết lập Biến môi trường (`.env.development`)
Tạo file `.env.development`:
```ini
VITE_API_URL="http://localhost:5000"
```
> 🛡️ **Bảo mật:** Mọi URL API Production được thiết lập trên Vercel Dashboard (`VITE_API_URL`). Không lưu Secret Keys phía Client.

### 3. Khởi chạy Development Server
```bash
npm run dev
```
Mở trình duyệt tại: [http://localhost:5173](http://localhost:5173)

---

## 🧪 CHẠY KIỂM THỬ FRONTEND E2E (PLAYWRIGHT)

```bash
# Chạy bộ test E2E tự động
npx playwright test

# Xem báo cáo HTML Playwright Report
npx playwright show-report
```

---

## 📄 LICENSE
Dự án thuộc bộ mã nguồn dự án **PeerReview-AI**. Bảo lưu mọi quyền © 2026.
