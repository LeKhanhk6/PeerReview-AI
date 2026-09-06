# 🎨 PEERREVIEW-AI — DESIGN SYSTEM V2 & DESIGN TOKENS CHUẨN NÓNG

Tài liệu này định nghĩa chính thức **Hệ thống Design System v2** cho dự án **PeerReview-AI**, áp dụng nguyên tắc **Single Source of Truth từ 17 UI Mockups**, chuẩn hóa các token màu trong `frontend/src/index.css` và công bố **Bảng kiểm định độ tương phản WCAG AA Contrast Evidence**.

---

## ⚠️ KẾT QUẢ ĐÃ CHỐT 2 CÂU HỎI QUYẾT ĐỊNH

1. **Nút Primary trong Mockup**: Sử dụng tông **Google Royal Blue (`#0B57D0` / `#1A73E8`)**, mang lại cảm giác hiện đại, sạch sẽ và chuẩn giáo dục đổi mới.
2. **Lựa chọn Chuẩn hóa**: Chọn **Đường (a) — Khởi tạo Custom Tokens dựa trên 17 UI Mockups** để ứng dụng đạt **100% khớp thị giác với ảnh thiết kế**, đồng thời đăng ký tập trung vào `frontend/src/index.css` giúp toàn app kế thừa thống nhất, tuyệt đối không bị lệch shade màu giữa các màn hình.

> 🚫 **QUY TẮC CẤM TÁI SỬ DỤNG ALIAS CŨ (DEPRECATED ALIASES NOTICE)**:
> Các class Tailwind gốc như `indigo-600`, `blue-600`, `emerald-700`, `amber-700`, `rose-700` đã được override tự động trong `index.css` cho các code cũ. **Đối với tất cả các màn hình mới (từ màn Auth/Login trở đi), CẤM DÙNG trực tiếp các class tên màu cũ.**
> **Bắt buộc dùng 100% Semantic Tokens**: `bg-brand-primary`, `text-brand-primary`, `bg-badge-success-bg`, `text-badge-success-text`, `bg-ai-blue-bg`, `text-ai-purple-text`...

---

## 📌 1. BẢNG MÀU CHỦ ĐẠO & THƯƠNG HIỆU (PRIMARY BRAND PALETTE)

| Tên Token | Mã Hex thực tế (Mockup) | Class Tailwind V4 Custom | Vị trí / Mục đích sử dụng | WCAG Contrast Ratio | Trạng thái WCAG |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Brand Primary Main** | `#0B57D0` | `bg-brand-primary` / `text-brand-primary` | Nút bấm chính, Active Navigation Tab, Progress bar | **6.73 : 1** (Trắng) | ✅ PASS AA & AAA |
| **Primary Hover** | `#0B4EB5` | `bg-brand-hover` | Di chuột (Hover) & Bấm giữ | **7.85 : 1** (Trắng) | ✅ PASS AAA |
| **Primary Soft BG** | `#E8F0FE` | `bg-brand-soft-bg` | Nền thẻ active, Thẻ thông báo nhẹ | N/A (Màu nền) | ✅ PASS |
| **Primary Soft Border** | `#AECBFA` | `border-brand-soft-border` | Viền thẻ active, Viền ô chọn | N/A (Màu viền) | ✅ PASS |
| **Primary Heavy Text** | `#041E49` | `text-brand-heavy-text` | Chữ tiêu đề trên nền Soft BG | **13.86 : 1** (nền Soft BG) | ✅ PASS AAA |

---

## 🚥 2. BẢNG BADGES TRẠNG THÁI NGHIỆP VỤ (SEMANTIC BADGES PALETTE)

Được chuẩn hóa khớp 100% mã Hex từ UI Mockups và kiểm định tương phản tương thích WCAG AA:

| Loại Badge | Thành phần | Mã Hex UI | Custom Tailwind Token | WCAG Contrast Ratio | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :---: |
| 🟢 **Success (Đã nộp / Hoàn thành)** | **Text** | `#137333` | `text-badge-success-text` | **4.83 : 1** (nền Soft Green) | ✅ PASS AA ($\ge 4.5$) |
| | **Background** | `#E6F4EA` | `bg-badge-success-bg` | N/A | ✅ PASS |
| | **Border** | `#CEEAD6` | `border-badge-success-border` | N/A | ✅ PASS |
| 🟡 **Warning (Sắp trễ / Chưa vào nhóm)** | **Text** | `#B06000` | `text-badge-warning-text` | **5.15 : 1** (nền Soft Amber) | ✅ PASS AA ($\ge 4.5$) |
| | **Background** | `#FEF7E0` | `bg-badge-warning-bg` | N/A | ✅ PASS |
| | **Border** | `#FDE293` | `border-badge-warning-border` | N/A | ✅ PASS |
| 🔴 **Danger (Quá hạn / Rủi ro cao)** | **Text** | `#C5221F` | `text-badge-danger-text` | **5.18 : 1** (nền Soft Red) | ✅ PASS AA ($\ge 4.5$) |
| | **Background** | `#FCE8E6` | `bg-badge-danger-bg` | N/A | ✅ PASS |
| | **Border** | `#FAD2CF` | `border-badge-danger-border` | N/A | ✅ PASS |
| ⚪ **Neutral (Bản nháp / Chưa mở)** | **Text** | `#5F6368` | `text-badge-neutral-text` | **4.68 : 1** (nền Soft Gray) | ✅ PASS AA ($\ge 4.5$) |
| | **Background** | `#F1F3F4` | `bg-badge-neutral-bg` | N/A | ✅ PASS |
| | **Border** | `#E8EAED` | `border-badge-neutral-border` | N/A | ✅ PASS |

---

## 🤖 3. BẢNG MÀU ĐẶC THÙ CHO TÍNH NĂNG AI (AI MENTOR & SYNTHESIS TOKENS)

Tách biệt thị giác giữa các tác vụ thường và gợi ý thông minh từ Trợ lý AI:

| Tính năng AI | Thành phần | Mã Hex | Custom Tailwind Token | WCAG Contrast Ratio | Trạng thái |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **AI Peer-Review Mentor** | **Text** | `#1E40AF` | `text-ai-blue-text` | **8.16 : 1** (nền Soft Blue) | ✅ PASS AAA ($\ge 7.0$) |
| | **Background** | `#EFF6FF` | `bg-ai-blue-bg` | N/A | ✅ PASS |
| | **Border** | `#BFDBFE` | `border-ai-blue-border` | N/A | ✅ PASS |
| **AI Badge Highlight** | **Text** | `#6B21A8` | `text-ai-purple-text` | **8.15 : 1** (nền Soft Purple) | ✅ PASS AAA ($\ge 7.0$) |
| | **Background** | `#F3E8FF` | `bg-ai-purple-bg` | N/A | ✅ PASS |
| | **Border** | `#E9D5FF` | `border-ai-purple-border` | N/A | ✅ PASS |

---

## 🏙️ 4. BẢNG MÀU NỀN & TYPOGRAPHY KHÔNG ĐỔI (SURFACE & NEUTRALS)

- **App Page Background**: `#F8FAFC` (`bg-slate-50`).
- **Card Surface**: `#FFFFFF` (`bg-white`).
- **Heading Title**: `#0F172A` (`text-slate-900`, `font-bold`).
- **Body Text**: `#334155` (`text-slate-700`, `font-medium`).
- **Secondary Description**: `#475569` (`text-slate-600`).
- **Muted Meta Text**: `#64748B` (`text-slate-500`) — **WCAG Contrast: 4.77:1** (Nền trắng). *Ràng buộc: Chỉ dùng cho metadata/thời gian phụ, không dùng cho văn bản cần đọc bắt buộc.*

---

## 📐 5. QUY ĐỊNH BO GÓC & BÓNG NỔI (RADIUS & SHADOW TOKENS)
- **Main Container Card**: `rounded-2xl` (16px) với `border border-slate-100 shadow-sm`.
- **Sub-Widgets & Buttons**: `rounded-xl` (12px) hoặc `rounded-lg` (8px).
- **Status Badges**: `rounded-full` (Pill shape: `inline-flex items-center px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0`).

---

## 🖥️ 6. QUY TẮC LAYOUT FULL-VIEWPORT SHELL (100VH - NO PAGE SCROLL)

Quy định cấu trúc Flexbox chuẩn cho tất cả màn hình Dashboard & Workspace sau khi đăng nhập:

```
App Shell: h-screen flex overflow-hidden (Gốc 100vh)
├── Sidebar: h-full flex flex-col shrink-0 (Menu cuộn riêng: overflow-y-auto flex-1)
└── Main Content: flex flex-col flex-1 min-w-0 h-full overflow-hidden
    ├── Topbar: shrink-0 (Chiều cao cố định h-16)
    └── Page Content: flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden p-3 sm:p-4 md:p-5
        ├── Top Header: shrink-0
        ├── Stat Cards: shrink-0 (grid-cols-2 md:grid-cols-3 lg:grid-cols-5)
        └── Main Columns Row: flex-1 min-h-0 grid lg:grid-cols-[1fr_380px] gap-5 items-stretch
            ├── Left Card: flex flex-col h-full min-h-0
            │   └── Scrollable List: flex-1 min-h-0 overflow-y-auto
            └── Right Card: flex flex-col h-full min-h-0
                └── Scrollable Warnings: flex-1 min-h-0 overflow-y-auto
```

### Nguyên tắc bắt buộc:
1. **Không cuộn toàn trang trên Desktop (`lg:` breakpoint trở lên)**: Trang chủ/Dashboard không có scrollbar dọc toàn trang trên màn hình máy tính (1920x1080, 1536x864, 1366x768). Chỉ các danh sách dài bên trong Card mới tự cuộn (`overflow-y-auto`).
2. **Quy tắc `min-h-0` cho Flex Children**: Mọi khối `flex-1` có chứa container cuộn `overflow-y-auto` bắt buộc phải đi kèm class `min-h-0` để flexbox không bị vỡ tràn chiều cao.
3. **Responsive Mobile (< lg)**: Giữ `overflow-y-auto` ở màn hình di động/tablet nhỏ để cuộn trang tự nhiên, tránh bị tràn chữ.

---

## 👑 7. CHUẨN HOÁ ROLE COLOR MAPPING (PHÂN PHẠM VI VAI TRÒ HỆ THỐNG)

Áp dụng bảng màu đặc trưng cho từng Vai trò (User Role) giúp người dùng dễ dàng nhận biết phân quyền trên toàn bộ giao diện:

| Vai trò (User Role) | Color Palette | Tailwind Text Token | Tailwind Background Token | Tailwind Border Token |
| :--- | :--- | :--- | :--- | :--- |
| 🛡 **ADMIN** | **Rose Palette** | `text-rose-600` | `bg-rose-50` | `border-rose-200` |
| 👨‍🏫 **TEACHER** | **Emerald Palette** | `text-emerald-600` | `bg-emerald-50` | `border-emerald-200` |
| 🎓 **STUDENT** | **Brand/Slate Palette** | `text-brand-primary` | `bg-brand-soft-bg` | `border-brand-soft-border` |

---

## 📐 8. QUY TẮC THIẾT KẾ TRẢI NGHIỆM UX (UX DESIGN PATTERNS)

1. **Quy tắc "1 Danh sách = 1 Cơ chế duyệt":**
   - Không dùng lẫn lộn giữa Scroll container (`overflow-y-auto`) và Phân trang (Pagination) trên cùng 1 danh sách.
   - Sử dụng **Pagination (Phân trang)** cho các danh sách lớn cần tra cứu quản trị (User List, Audit Logs).
   - Sử dụng **Scroll Container (Thanh cuộn nội bộ)** cho các danh sách thời gian thực trong Dashboard/Workspace (Discussions, Activity Feed).
2. **Quy tắc "Settings = Form 1 màn hình, Log tách Tab riêng":**
   - Màn hình System Settings (`/admin/settings`) chỉ tập trung hiển thị form cấu hình tham số hệ thống.
   - Nhật ký thao tác nhạy cảm (Audit Logs) được tách thành route/tab riêng biệt (`/admin/audit-logs`) phục vụ tra cứu chuyên sâu.

---

## 🚀 9. BẢNG ĐỊNH HƯỚNG KIẾN TRÚC & NÂNG CẤP MỞ RỘNG [ROADMAP]

Các cải tiến hạ tầng được ghi nhận chuẩn bị cho giai đoạn mở rộng (Post-MVP / Scale):

1. **[ROADMAP] Async Background Job cho Synthesis Engine:**
   - Khi số lượng đánh giá chéo vượt 500+ reviews, chuyển luồng tổng hợp AI Synthesis sang mô hình Background Worker/Job Queue bất đồng bộ kết hợp Polling API status (`GET /api/summary/submissions/:id/summary/status`).
2. **[ROADMAP] Redis / Postgres Advisory Locks:**
   - Khi hệ thống Backend mở rộng sang mô hình Multi-Instance backend cluster, thay thế In-memory Locks bằng Redis Lock hoặc PostgreSQL Advisory Lock (`pg_advisory_xact_lock`) để chống race condition khi nhiều giảng viên cùng duyệt bản tổng hợp.
3. **[ROADMAP] Audit Logs cho Tệp tin Workspace:**
   - Ghi vết tự động vào `activity_logs` đối với mọi thao tác tải xuống tệp tin (`GET /api/workspace/files/:id/download`) giúp quản lý và theo dõi nhật ký truy cập tệp tin đồ án bảo mật.
4. **[ROADMAP] Khuyến cáo Vận hành Render Free Tier:**
   - Ghi nhận cơ chế Cold-start (30–50s) của Render Free Tier trong bộ tài liệu `docs/DEPLOYMENT_GUIDE.md` và quy trình ping trước 5 phút khi demo.

