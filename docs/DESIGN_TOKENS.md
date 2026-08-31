# 🎨 PEERREVIEW-AI — DESIGN TOKENS & CHUẨN TÔNG MÀU GIAO DIỆN

Tài liệu này định nghĩa hệ thống **Design Tokens** và bảng mã màu chuẩn được áp dụng thống nhất cho toàn bộ các màn hình giao diện (Screens), thành phần UI (Components) và trạng thái hệ thống trong dự án **PeerReview-AI**.

---

## 📌 1. BẢNG MÀU THƯƠNG HIỆU & CHÍNH (PRIMARY BRAND TOKENS)

Sử dụng dải màu Indigo/Blue làm màu chủ đạo cho các hành động chính, nút bấm, tiêu đề trọng tâm và các trạng thái đang hoạt động (Active).

| Tên Token | Mã Hex / Class Tailwind | Vị trí / Mục đích sử dụng | Tiêu chuẩn WCAG AA |
| :--- | :--- | :--- | :---: |
| **Primary Main** | `indigo-600` (`#4F46E5`) / `blue-600` (`#2563EB`) | Nút bấm chính (Primary Button), Icon chủ đạo, Tab đang chọn | ✅ Compliant (4.8:1) |
| **Primary Hover** | `indigo-700` (`#4338CA`) / `blue-700` (`#1D4ED8`) | Trạng thái di chuột (Hover) của nút chính | ✅ Compliant (6.2:1) |
| **Primary Soft BG** | `indigo-50` (`#EEF2FF`) / `blue-50` (`#EFF6FF`) | Nền thẻ làm nổi bật, Nền Badge thông báo nhẹ | ✅ Compliant |
| **Primary Soft Border** | `indigo-100` (`#E0E7FF`) / `blue-100` (`#DBEAFE`) | Viền thẻ mềm, viền hộp thoại phụ | ✅ Compliant |
| **Primary Heavy Text** | `indigo-900` (`#312E81`) / `blue-900` (`#1E3A8A`) | Chữ tiêu đề trên nền Soft BG | ✅ Compliant (11.5:1) |

---

## 🏙️ 2. BẢNG MÀU NỀN & KHUNG CHỨA (BACKGROUND & SURFACE TOKENS)

Đảm bảo bố cục giao diện nhất quán với thiết kế phẳng hiện đại, tương phản rõ rệt giữa nền ứng dụng và các thẻ nội dung.

| Tên Token | Class Tailwind | Vị trí / Mục đích sử dụng |
| :--- | :--- | :--- |
| **App Background** | `bg-slate-50` (`#F8FAFC`) | Nền toàn bộ màn hình ứng dụng (App Layout Page Body) |
| **Card Surface** | `bg-white` (`#FFFFFF`) | Nền các thẻ Card nội dung, Hộp thoại Modal, Form nhập liệu |
| **Card Border** | `border-slate-100` / `border-slate-200` | Đường viền các thẻ Card, đường kẻ phân cách nội dung |
| **Sub-Card Background** | `bg-slate-50/80` / `bg-slate-100/60` | Nền các ô thông tin con bên trong Card chính |
| **Input Background** | `bg-white` (Active) / `bg-slate-100` (Disabled) | Ô nhập văn bản (Input / Textarea / Select) |

---

## 🔤 3. BẢNG MÀU CHỮ & TYPOGRAPHY (NEUTRAL TEXT TOKENS)

Quy định các màu chữ từ đậm đến nhạt để tạo phân cấp thị giác (Hierarchy) rõ ràng.

| Tên Token | Class Tailwind | Độ đậm (Font Weight) | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Heading 1 / Title** | `text-slate-900` (`#0F172A`) | `font-bold` / `font-black` | Tiêu đề chính màn hình, Tiêu đề Card chính |
| **Body Text** | `text-slate-700` (`#334155`) | `font-semibold` / `font-medium` | Nội dung văn bản chính, Nhãn input (Label) |
| **Secondary Text** | `text-slate-600` (`#475569`) | `font-normal` | Mô tả phụ, Subtitle, Đoạn văn bản hướng dẫn |
| **Muted Meta Text** | `text-slate-500` (`#64748B`) | `font-normal` / `font-medium` | Thời gian, Mốc ngày hết hạn, Ghi chú nhỏ |
| **Disabled Text** | `text-slate-400` (`#94A3B8`) | `font-normal` | Chữ bị vô hiệu hóa, Chữ giữ chỗ (Placeholder) |

---

## 🚥 4. BẢNG MÀU TRẠNG THÁI NGHIỆP VỤ (SEMANTIC STATUS TOKENS)

Dành riêng cho các Badge, Alert, Card Highlight thể hiện trạng thái bài nộp, tiến độ và rủi ro.

### 🟢 Thành công / Đã nộp / Đạt chuẩn (Success / Completed):
- **Text**: `text-emerald-800` / `text-emerald-700`
- **Background**: `bg-emerald-50` / `bg-emerald-100`
- **Border**: `border-emerald-200` / `border-emerald-300`

### 🟡 Cảnh báo / Chờ xử lý / Sắp hết hạn / Chưa vào nhóm (Warning / Pending / Urgent):
- **Text**: `text-amber-900` / `text-amber-800`
- **Background**: `bg-amber-50` / `bg-amber-100`
- **Border**: `border-amber-200` / `border-amber-300`

### 🔴 Quá hạn / Thất bại / Rủi ro cao / Khóa tài khoản (Danger / Late / Error / High Risk):
- **Text**: `text-rose-800` / `text-red-800`
- **Background**: `bg-rose-50` / `bg-red-50`
- **Border**: `border-rose-200` / `border-red-200`

### ⚪ Trung tính / Chưa bắt đầu / Bản nháp (Neutral / Draft / Not Started):
- **Text**: `text-slate-700` / `text-gray-700`
- **Background**: `bg-slate-100` / `bg-gray-100`
- **Border**: `border-slate-200` / `border-gray-200`

---

## 📐 5. BO GÓC & NỔI BẬT (BO-GÓC & SHADOW TOKENS)

| Thuộc tính | Class Tailwind | Áp dụng cho |
| :--- | :--- | :--- |
| **Card Bo Góc** | `rounded-xl` (12px) / `rounded-2xl` (16px) | Thẻ nội dung, Bảng tổng quan, Hộp thoại Modal |
| **Button Bo Góc** | `rounded-lg` (8px) / `rounded-xl` (12px) | Nút bấm, Ô nhập văn bản, Badge trạng thái |
| **Độ Nổi Card** | `shadow-sm` $\to$ `hover:shadow-md` | Thẻ danh sách bài tập, Thẻ nhóm |

---

## ♿ 6. ĐẢM BẢO TIÊU CHUẨN TRUY CẬP (ACCESSIBILITY WCAG AA)
- Tất cả các vùng văn bản hiển thị phải đạt độ tương phản tối thiểu **$\ge 4.5:1$** so với màu nền.
- Tuyệt đối không dùng duy nhất màu sắc để phân biệt trạng thái, luôn đi kèm **Icon / Emoji** hoặc **Chữ nhãn rõ ràng** (VD: `🟢 Đã nộp`, `🟡 Chưa có nhóm`, `🔴 Trễ hạn`).
