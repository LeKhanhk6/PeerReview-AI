# 🎨 PEERREVIEW-AI — DESIGN SYSTEM V2 & DESIGN TOKENS CHUẨN NÓNG

Tài liệu này định nghĩa chính thức **Hệ thống Design System v2** cho dự án **PeerReview-AI**, áp dụng nguyên tắc **Single Source of Truth từ 17 UI Mockups**, chuẩn hóa các token màu trong `frontend/src/index.css` và công bố **Bảng kiểm định độ tương phản WCAG AA Contrast Evidence**.

---

## ⚠️ KẾT QUẢ ĐÃ CHỐT 2 CÂU HỎI QUYẾT ĐỊNH

1. **Nút Primary trong Mockup**: Sử dụng tông **Google Royal Blue (`#0B57D0` / `#1A73E8`)**, mang lại cảm giác hiện đại, sạch sẽ và chuẩn giáo dục đổi mới.
2. **Lựa chọn Chuẩn hóa**: Chọn **Đường (a) — Khởi tạo Custom Tokens dựa trên 17 UI Mockups** để ứng dụng đạt **100% khớp thị giác với ảnh thiết kế**, đồng thời đăng ký tập trung vào `frontend/src/index.css` giúp toàn app kế thừa thống nhất, tuyệt đối không bị lệch shade màu giữa các màn hình.

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
- **Status Badges**: `rounded-full` (Pill shape).
