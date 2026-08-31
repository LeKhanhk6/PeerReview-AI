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
- [ ] **Nội dung**: Cập nhật `RegisterPage.tsx` chọn vai trò Sinh viên / Giảng viên, validate MSSV nếu là Sinh viên, dùng token màu chuẩn `bg-brand-primary`.
- [ ] **Files sửa**: `frontend/src/features/auth/pages/RegisterPage.tsx`
- [ ] **DoD Task 02**: `npx tsc --noEmit` pass · `npm run build` pass.

### 🟢 Task 03: Tích hợp Hộp thoại Quên Mật Khẩu (ForgotPasswordModal)
- [ ] **Nội dung**: Bổ sung Modal Quên mật khẩu gọi API `POST /api/auth/forgot-password` với 3 trạng thái đầy đủ.
- [ ] **Files sửa/tạo**: `frontend/src/features/auth/components/ForgotPasswordModal.tsx`
- [ ] **DoD Task 03**: `npx tsc --noEmit` pass · `npm run build` pass.

---

## 5. DoD TỔNG THỂ (DEFINITION OF DONE MÀN AUTH LOGIN)
- [ ] `npx tsc --noEmit` 0 lỗi.
- [ ] `npm run build` thành công dưới 1s.
- [ ] 100% chuỗi hiển thị sử dụng `authMessages` (không hardcode string).
- [ ] Đủ 3 trạng thái biên: Normal / Loading Spinner / Error Alert & Toast.
- [ ] Sử dụng 100% `brand-primary` (#0B57D0) — tuyệt đối không dùng alias cũ.
