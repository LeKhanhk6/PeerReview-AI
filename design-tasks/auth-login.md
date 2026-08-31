# 🎨 DESIGN TASK: CHUYỂN ĐỔI GIAO DIỆN AUTH LOGIN / REGISTER SCREEN → CODE DESIGN SYSTEM V2

## 1. PHÂN TÍCH ẢNH THIẾT KẾ MOCKUP (`Login_Screen.png` & `Register_Screen.png`)

| Vùng Giao Diện trong Ảnh | Thiết kế gốc (Mockup) | Tái thiết kế phù hợp dự án (Design System v2) | Lý do điều chỉnh |
| :--- | :--- | :--- | :--- |
| **Bố cục tổng thể (Layout)** | Card Đăng nhập nằm giữa màn hình nền nhạt 2 cột | Giữ nguyên dạng Card nổi `bg-white rounded-2xl border-slate-100 shadow-md` nằm giữa nền `bg-slate-50` | Tạo sự nhất quán với toàn bộ hệ thống |
| **Màu thương hiệu & Nút chính** | Xanh lam thương hiệu | Dùng `bg-brand-primary` (`#0B57D0`) & `hover:bg-brand-hover` (`#0B4EB5`) | Đúng token chốt tại Design System v2 |
| **Form Inputs** | Ô nhập Email/Password có icon | Dùng `bg-white border-slate-200 focus:ring-2 focus:ring-brand-primary rounded-xl` | Chuẩn hóa accessibility WCAG AA |
| **Chuyển vai trò (Role Tab)** | Dropdown / Tabs chọn role | Giữ nguyên role selection hoặc auto detect role từ thông tin User trả về sau Login | Đảm bảo tính tiện dụng & đúng API BE |
| **Quên Mật Khẩu (Forgot Password)** | Modal / Form nhập Email nhận link | Giữ nguyên Form Quên mật khẩu gọi `POST /api/auth/forgot-password` | Tối ưu trải nghiệm khôi phục tài khoản |

---

## 2. MAPPING DỮ LIỆU FRONTEND ↔ BACKEND ENDPOINTS

| Vùng UI | Endpoint Backend | Shape Dữ liệu / Parameters | Trạng thái / Xử lý Lỗi |
| :--- | :--- | :--- | :--- |
| **Form Đăng Nhập** | `POST /api/auth/login` | `{ email: string, password: string }` | 401: *"Email hoặc mật khẩu không chính xác"*, Account locked: *"Tài khoản bị khóa"* |
| **Form Đăng Ký** | `POST /api/auth/register` | `{ full_name: string, email: string, password: string, role: string, student_id?: string }` | 400: *"Email đã tồn tại"*, Success: Toast & chuyển sang Login |
| **Form Quên Mật Khẩu** | `POST /api/auth/forgot-password` | `{ email: string }` | 200: Toast *"Đã gửi link khôi phục mật khẩu vào Email"* |
| **User Profile Sync** | `GET /api/auth/me` | Ret: `{ user: User }` | Sync Zustand `authStore` và lưu token |

---

## 3. OUT-OF-SCOPE (CÁC PHẦN BỎ KHỎI MVP)
1. **Đăng nhập bằng Mạng xã hội (Google / OAuth2 / LMS SSO)**: Lý do: Post-MVP (đã nêu trong Plan.md).
2. **Xác thực 2 yếu tố (2FA / OTP SMS)**: Lý do: Post-MVP (đã nêu trong Plan.md).

---

## 4. DANH SÁCH TASK CHI TIẾT (TASK LIST)

### 🟢 Task 01: Chuẩn hóa `LoginPage.tsx` theo Design System v2 Token
- [x] **Nội dung**: Cập nhật `LoginPage.tsx` sử dụng 100% token `bg-brand-primary`, `text-brand-primary`, `rounded-2xl border-slate-100 shadow-md`, copy 100% i18n messages từ `authMessages`.
- [x] **Files sửa**: `frontend/src/features/auth/pages/LoginPage.tsx`
- [x] **DoD Task 01**: `npx tsc --noEmit` pass · `npm run build` pass (429ms) · Đủ 3 states (Normal/Loading/Error Toast). (Commit: `800af63`)

### 🟢 Task 02: Chuẩn hóa `RegisterPage.tsx` theo Design System v2 Token
- [x] **Nội dung**: Cập nhật `RegisterPage.tsx` chuẩn hóa Form đăng ký tài khoản Sinh viên kèm MSSV, hiển thị thông báo "Tài khoản Giảng viên do Quản trị viên cấp", dùng token màu chuẩn `bg-brand-primary`.
- [x] **Files sửa**: `frontend/src/features/auth/pages/RegisterPage.tsx`
- [x] **DoD Task 02**: `npx tsc --noEmit` pass · `npm run build` pass (462ms) · Đủ 3 states (Normal/Loading/Error Toast). (Commit: `a3e1798`)

### 🟢 Task 01b: Nâng cấp Bố cục `LoginPage.tsx` sang dạng 2 Cột Split-Screen (Modern UI)
- [x] **Phân tích điều chỉnh theo dự án**:
  - **Bố cục tổng thể**: Container `bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl` căn giữa trên nền `bg-slate-50 min-h-screen`. Responsive: Mobile tự ẩn panel trái, tập trung 100% vào Form Đăng nhập.
  - **Cột TRÁI (~50%, chỉ hiển thị screen $\ge$ md)**: Panel thương hiệu với background gradient `bg-gradient-to-br from-brand-primary via-brand-gradient-mid to-brand-gradient-deep`, vẽ SVG Pattern inline minh họa học thuật & peer-review (tài liệu, tương tác nhóm, AI mentor). Overlay tiêu đề tiếng Việt: *"Đánh giá Học thuật Thông minh & Đổi mới"* + 2 dòng mô tả đại học/cao đẳng từ `authMessages`.
  - **Cột PHẢI (~50%)**:
    - Header: *"Chào mừng trở lại"*, Subtext: *"Đăng nhập để tiếp tục công việc của bạn."*
    - Inputs: Icon `Mail` (trái ô email), Icon `Lock` (trái ô mật khẩu) & Nút `Eye / EyeOff` toggle ẩn/hiện mật khẩu (phải ô password) từ `lucide-react`.
    - Controls: Checkbox *"Ghi nhớ đăng nhập"* (Lưu email an toàn vào `localStorage`) + Liên kết *"Quên mật khẩu?"* (Mở `ForgotPasswordModal`).
    - Nút Đăng nhập Full-width: `bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl py-3`.
    - Bỏ khối nút Google/Facebook (Out-of-Scope SSO Post-MVP), thay bằng đường kẻ phân cách nhẹ + Liên kết *"Chưa có tài khoản? Đăng ký ngay"*.
- [x] **Files sửa**: `frontend/src/features/auth/pages/LoginPage.tsx`, `frontend/src/constants/messages/auth.ts`, `frontend/src/index.css`
- [x] **DoD Task 01b**: `npx tsc --noEmit` 0 lỗi · `npm run build` pass (545ms) · 100% token Design System v2 · Đủ 3 states biên (Normal/Loading/Error Toast) · Ghi nhớ email & eye-toggle hoạt động chuẩn. (Commit: `48d6ea4`)

### 🟢 Task 02b: Tái thiết kế `RegisterPage.tsx` sang dạng 2 Cột Split-Screen (Đồng bộ với LoginPage)
- [x] **Phân tích điều chỉnh theo dự án & Xử lý 2 bẫy từ Mockup**:
  - **Tách Component Khung Thương Hiệu (`AuthIllustrationPanel.tsx`)**: Tách panel cột trái dùng chung cho cả `LoginPage.tsx` và `RegisterPage.tsx` để đảm bảo DRY, tái sử dụng SVG Pattern & Gradient.
  - **Cột TRÁI (~50%, chỉ hiển thị screen $\ge$ md)**: Panel thương hiệu đồng bộ với Login. H1: *"Tạo tài khoản mới"*, Subtitle: *"Tham gia nền tảng đánh giá đồng cấp thông minh bằng AI cho các khóa học đại học."*
  - **Cột PHẢI (~50%)**: Form Đăng ký tài khoản Sinh viên:
    - Input Họ và tên: Icon `User` (trái), Placeholder `Trần Hữu P.`.
    - Input Email: Icon `Mail` (trái), Placeholder `tranhuup@truong.edu.vn`.
    - Input MSSV: Icon `GraduationCap` (trái), Placeholder `2026123456`.
    - Input Mật khẩu: Icon `Lock` (trái) + Nút toggle `Eye / EyeOff` (phải).
    - Input Xác nhận mật khẩu: Icon `KeyRound` (trái) + Nút toggle `Eye / EyeOff` (phải).
  - **Bẫy 1 — Bỏ Radio 3 vai trò**: API `POST /api/auth/register` công khai CHỈ gán vai trò `STUDENT` và yêu cầu `student_id` (MSSV). Bỏ radio chọn role, giữ nguyên field MSSV bắt buộc và hiển thị ghi chú: *"💡 Lưu ý: Tài khoản Giảng viên do Quản trị viên cấp. Trang này dành cho Sinh viên đăng ký tài khoản."*
  - **Bẫy 2 — Bỏ Nút SSO Google/Facebook**: Loại bỏ hoàn toàn khối nút SSO (Post-MVP), thay bằng liên kết *"Đã có tài khoản? Đăng nhập ngay"* sang `/login`.
- [x] **Files sửa/tạo**: `frontend/src/features/auth/pages/RegisterPage.tsx`, `frontend/src/features/auth/components/AuthIllustrationPanel.tsx`, `frontend/src/features/auth/pages/LoginPage.tsx`, `frontend/src/constants/messages/auth.ts`
- [x] **DoD Task 02b**: `npx tsc --noEmit` 0 lỗi · `npm run build` pass (492ms) · 100% token Design System v2 · Đủ 3 states biên (Normal/Loading/Error Toast) · Eye-toggles & Validation match password hoạt động chuẩn. (Commit: `3fd3b62`)

---

## 5. DoD TỔNG THỂ (DEFINITION OF DONE MÀN AUTH LOGIN)
- [x] `npx tsc --noEmit` 0 lỗi.
- [x] `npm run build` thành công dưới 1s (414ms).
- [x] 100% chuỗi hiển thị sử dụng `authMessages` (không hardcode string).
- [x] Đủ 3 trạng thái biên: Normal / Loading Spinner / Error Alert & Toast.
- [x] Sử dụng 100% `brand-primary` (#0B57D0) — tuyệt đối không dùng alias cũ.

