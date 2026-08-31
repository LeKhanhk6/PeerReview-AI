# 🎨 PEERREVIEW-AI — DESIGN TOKENS & BẢNG MÀU TỪ THIẾT KẾ UI (UI MOCKUP COLOR PALETTE)

Tài liệu này tổng hợp **Bảng mã màu thực tế được trích xuất từ 17 ảnh thiết kế giao diện (UI Mockups trong `frontend/image UI`)**, kết hợp với hệ thống **Design Tokens Tailwind CSS** được áp dụng cho toàn bộ dự án **PeerReview-AI**.

---

## 📌 1. BẢNG MÀU CHỦ ĐẠO & THƯƠNG HIỆU (PRIMARY BRAND PALETTE)

Dựa trên các màn hình Đăng nhập, Student Dashboard, Admin Overview và Peer Review Workspace:

| Tên Token / Thành phần | Mã Hex thực tế (UI Image) | Class Tailwind CSS tương ứng | Mục đích sử dụng trong Giao diện | Standard WCAG AA |
| :--- | :--- | :--- | :--- | :---: |
| **Brand Primary Main** | `#0B57D0` / `#1A73E8` / `#2563EB` | `blue-600` / `indigo-600` | Nút bấm hành động chính (Primary Button), Tab Navigation đang được chọn, Icon chính | ✅ Pass (4.8:1) |
| **Primary Hover / Active** | `#0B4EB5` / `#1D4ED8` | `blue-700` / `indigo-700` | Trạng thái di chuột (Hover) & bấm giữ nút chính | ✅ Pass (6.2:1) |
| **Primary Soft BG** | `#E8F0FE` / `#EFF6FF` | `blue-50` / `indigo-50` | Nền thẻ Active, Thẻ thông báo nổi bật nhẹ, Thẻ AI Mentor | ✅ Pass |
| **Primary Soft Border** | `#AECBFA` / `#DBEAFE` | `blue-200` / `indigo-200` | Viền ô lựa chọn active, viền khung AI gợi ý | ✅ Pass |
| **Primary Heavy Text** | `#041E49` / `#1E3A8A` | `blue-950` / `indigo-950` | Chữ tiêu đề nổi bật trên nền Soft BG | ✅ Pass (11.5:1) |

---

## 🏙️ 2. BẢNG MÀU NỀN & KHUNG CHỨA (BACKGROUND & SURFACE SHADES)

Dựa trên các màn hình Dashboard, Lớp học và Workspace:

| Tên Token / Thành phần | Mã Hex thực tế (UI Image) | Class Tailwind CSS tương ứng | Mục đích sử dụng trong Giao diện |
| :--- | :--- | :--- | :--- |
| **App Body Background** | `#F8FAFC` / `#F0F4F9` | `bg-slate-50` / `bg-slate-100/50` | Nền toàn bộ ứng dụng (Main Page Background) |
| **Card Surface (White)** | `#FFFFFF` | `bg-white` | Nền các thẻ Card nội dung, Modal Dialog, Form |
| **Sub-Widget Background** | `#F8FAFC` / `#F1F5F9` | `bg-slate-50` / `bg-slate-100/70` | Nền các khối thông tin con bên trong Card chính (Kanban, Progress) |
| **Card Border (Default)** | `#E2E8F0` / `#F1F5F9` | `border-slate-200` / `border-slate-100` | Viền thẻ nội dung, viền bảng dữ liệu |
| **Input Active / Disabled** | `#FFFFFF` (Active) / `#F1F5F9` (Disabled) | `bg-white` / `bg-slate-100` | Nền ô nhập liệu văn bản |

---

## 🔤 3. BẢNG MÀU CHỮ & TYPOGRAPHY (NEUTRAL TEXT SHADES)

| Tên Token / Thành phần | Mã Hex thực tế (UI Image) | Class Tailwind CSS tương ứng | Độ đậm / Áp dụng |
| :--- | :--- | :--- | :--- |
| **Heading 1 / Title** | `#0F172A` / `#1E293B` | `text-slate-900` / `text-slate-800` | `font-bold` — Tiêu đề trang, Tên bài tập, Tên lớp |
| **Body Text** | `#334155` | `text-slate-700` | `font-semibold` / `font-medium` — Văn bản chính |
| **Secondary Description** | `#475569` / `#5F6368` | `text-slate-600` | `font-normal` — Đoạn hướng dẫn, Mô tả phụ |
| **Muted Meta / Time** | `#64748B` | `text-slate-500` | `font-normal` — Thời gian, Ngày hết hạn, Meta badge |
| **Disabled Placeholder** | `#94A3B8` | `text-slate-400` | `font-normal` — Placeholder input, Chữ vô hiệu hóa |

---

## 🚥 4. BẢNG MÀU TRẠNG THÁI NGHIỆP VỤ (FUNCTIONAL SEMANTIC BADGES)

Dựa trên các Badge hiển thị bài nộp, trạng thái chấm chéo và rủi ro nhóm:

### 🟢 Thành công / Đã hoàn thành / Đã nộp bài (Success / Submitted / Done):
- **Background**: `#E6F4EA` (`bg-emerald-50`)
- **Text**: `#137333` (`text-emerald-800`)
- **Border**: `#CEEAD6` (`border-emerald-200`)

### 🟡 Cảnh báo / Đang chấm chéo / Sắp hết hạn / Chưa vào nhóm (Warning / Urgent / Pending):
- **Background**: `#FEF7E0` (`bg-amber-50`)
- **Text**: `#B06000` (`text-amber-800`)
- **Border**: `#FDE293` (`border-amber-200`)

### 🔴 Quá hạn nộp / Thất bại / Rủi ro cao / Khóa tài khoản (Danger / Late / High Risk):
- **Background**: `#FCE8E6` (`bg-rose-50`)
- **Text**: `#C5221F` (`text-rose-800`)
- **Border**: `#FAD2CF` (`border-rose-200`)

### ⚪ Neutral / Bản nháp / Chưa mở chấm (Neutral / Draft / Inactive):
- **Background**: `#F1F3F4` (`bg-slate-100`)
- **Text**: `#5F6368` (`text-slate-700`)
- **Border**: `#E8EAED` (`border-slate-200`)

---

## 🤖 5. BẢNG MÀU ĐẶC THÙ CHO TÍNH NĂNG AI MENTOR & SYNTHESIS

Dựa trên các khối hiển thị gợi ý AI và biểu đồ phân tích:

| Tính năng | Background | Text Color | Border Color | Tailwind Token |
| :--- | :--- | :--- | :--- | :--- |
| **AI Peer-Review Mentor** | `#EFF6FF` (Soft Blue) | `#1E40AF` | `#BFDBFE` | `bg-blue-50 text-blue-800 border-blue-200` |
| **AI Badge Highlight** | `#F3E8FF` (Soft Purple) | `#6B21A8` | `#E9D5FF` | `bg-purple-50 text-purple-800 border-purple-200` |
| **Radar Chart Accent** | `#7C3AED` (Purple) & `#2563EB` (Blue) | N/A | N/A | `stroke-purple-600 stroke-blue-600` |

---

## 📐 6. QUY ĐỊNH BO GÓC & BÓNG NỔI (RADIUS & SHADOW TOKENS)
- **Main Container Card**: `rounded-2xl` (16px) với `border border-slate-100 shadow-sm`.
- **Sub-Widgets & Buttons**: `rounded-xl` (12px) hoặc `rounded-lg` (8px).
- **Status Badges**: `rounded-full` (Pill style) hoặc `rounded-md` (6px).
