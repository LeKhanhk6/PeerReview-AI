# KẾ HOẠCH CẢI THIỆN & CHUẨN HÓA FRONTEND UI/UX — BẢN CHỐT

## Mục tiêu
Chuẩn hóa toàn bộ Frontend PeerReview-AI theo hướng:
- Production-ready cho pilot 500–1.000 users
- UI thống nhất giữa Admin / Teacher / Student
- Không còn lỗi horizontal overflow
- Không nested vertical scroll không cần thiết
- Các trang List/Table sử dụng Pagination
- Visual hierarchy rõ ràng
- Design System nhất quán
- Double-Blind không làm lộ danh tính
- Không over-design
- Không tự ý thay đổi Backend/Database/Business Logic trong task UI

---

## PHẦN I — P0: FOUNDATION

### 1. Audit Root Layout
Kiểm tra trước khi sửa từng Page.

**Files / Components**
- AppLayout
- Sidebar
- Topbar
- Main Content / Page Wrapper
- Các layout wrapper dùng chung

**Kiểm tra**
Đảm bảo các tầng Flex sử dụng đúng: `min-w-0`, `min-h-0`, `flex-1`, `shrink-0`.
Kiểm tra: `overflow-hidden`, `overflow-auto`, `overflow-x-auto`, `overflow-y-auto`, `w-full`, `max-w-*`, `flex-shrink`, `min-width`, `min-height`.

**Mục tiêu**
- Không dùng `overflow-hidden` chỉ để che lỗi overflow.
- Phải xác định đúng nguyên nhân gây tràn.

### 2. Chuẩn hóa Layout Strategy
Phân loại Page trước khi chọn layout.

**A. List / Table**
- Ví dụ: Admin Users, Audit Logs, Teacher Assignments, Teacher Submissions, Student Review Inbox
- → Pagination làm cơ chế phân trang chính cho tất cả các trang danh sách/bảng. Nội dung trang sử dụng page-level vertical scroll tự nhiên; Table Wrapper chỉ sử dụng horizontal scroll khi tổng chiều rộng các cột vượt viewport. Không sử dụng internal vertical scroll cho Table/List.
- Cấu trúc: Page ├── Header ├── Toolbar / Filter ├── Content │ └── Table / List └── Pagination
- Không dùng: `Table └── overflow-y-auto ❌`

**B. Form**
- Ví dụ: Create Assignment, Edit Assignment, Settings
- → Form-scroll / Page-level scroll tùy chiều dài.

**C. Dashboard**
- Ví dụ: Admin Dashboard, Teacher Analytics, Student Dashboard
- → Layout phụ thuộc nội dung. Không ép tất cả Dashboard thành cùng một layout.

### 3. Pagination — nguyên tắc bắt buộc cho List
Các danh sách có khả năng tăng trưởng dữ liệu phải dùng Pagination.
- Default: 15–20 records/page
- Không sử dụng trong MVP: Infinite Scroll ❌, Render toàn bộ dataset ❌, Nested vertical scroll ❌.

### 4. Search / Filter phải kết hợp Pagination
Khi thay đổi Search, Role, Status, Action, Date filter → reset: `page = 1`.
Nếu project đã có cơ chế sync query với URL thì Pagination/Search/Filter phải giữ đúng nguyên tắc đó.

### 5. Scroll Rule
- **Vertical scroll**: List/Table dùng Page-level vertical scroll.
- **Horizontal scroll**: Chỉ cho phép tại Table Wrapper (ví dụ: `<div className="w-full overflow-x-auto"><table>...</table></div>`).
- Không được: `Page └── Table └── overflow-y-auto ❌`.
- **Mục tiêu**: Không xuất hiện tình trạng Browser scrollbar + Table scrollbar + Page scrollbar một cách không cần thiết.

### 6. Responsive
- Kiểm tra tối thiểu: 1792px, 1440px, 1024px, 768px.
- Kiểm tra: Sidebar, Topbar, Page Header, Search, Filter, Table, Pagination, Cards, Buttons, Modal, Drawer.
- Không để: horizontal browser overflow.

---

## PHẦN II — P0: DESIGN SYSTEM

### 7. Chuẩn hóa Card
- **Default**: `bg-white border border-slate-100 rounded-2xl shadow-sm`.
- **Primary card**: có thể `p-6` (không ép mọi card phải `p-6`).
- Tuân thủ DESIGN_TOKENS.md.

### 8. Chuẩn hóa Button
- Các loại: Primary, Primary action, Secondary, Outline / secondary action, Ghost, Low emphasis, Danger, Delete / destructive action.
- Chuẩn hóa: Radius, Padding, Font, Icon, Hover, Disabled, Focus.

### 9. Chuẩn hóa Badge
Sử dụng Semantic colors (Không tự tạo màu tùy ý).
- Success → green
- Warning → amber
- Danger → red
- Info → blue
- Neutral → slate

### 10. Visual Hierarchy
Áp dụng: `Primary ↓ Secondary ↓ Tertiary`.
Page: `Page Title ↓ Primary Section ↓ Secondary Section ↓ Detail`.
Typography:
- Title: `font-bold`
- Body: `text-slate-600`
- Secondary: `text-slate-500`
- Muted: `text-slate-400`
- Không để tất cả text có cùng visual weight.

### 11. Spacing Consistency
Enforce spacing token (Không dùng spacing ngẫu nhiên chỉ để "căn cho vừa mắt").
- Section: `space-y-6`
- Card: `p-6`
- Form/content: `gap-4`
- Related elements: `gap-2`

---

## PHẦN III — P0: LOADING / EMPTY / ERROR

### 12. Skeleton Loading
- Không dùng `Loading...` thay cho toàn bộ UI.
- Skeleton phải match layout thực tế (KPI → KPI Skeleton, User Table → Skeleton rows, Audit Logs → Skeleton log rows/cards).

### 13. Empty State
- Phải giải thích: Không có dữ liệu, Tại sao, Người dùng nên làm gì tiếp theo (vd: Xóa bộ lọc).

### 14. Error State
- Đảm bảo các Page/List có Error state, Retry, Toast khi mutation thất bại.
- Không làm toàn bộ page trắng khi một API nhỏ bị lỗi.
- Tuân thủ ErrorBoundary / API error handling hiện có.

---

## PHẦN IV — ADMIN SIDEBAR

### 15. Sidebar Grouping
Thay vì menu phẳng, nên chia nhóm:
```
Dashboard
MANAGEMENT
  Users
  Classes
SYSTEM
  Audit Logs
  Settings
```

### 16. Sidebar Active State
- Active item: `bg-brand-soft-bg text-brand-primary font-medium`.
- Có thể thêm left border 3–4px nếu phù hợp.

### 17. User Information
- Di chuyển Avatar, Admin User, Role từ Topbar xuống cuối Sidebar.
- Topbar chỉ giữ ADMIN MODE và Logout.

---

## PHẦN V — ADMIN USERS

### 18. AdminUsersPage Layout
Không dùng internal vertical scroll. Page-level vertical scroll.

### 19. User Table
- Thêm `hover:bg-slate-50` cho row.
- Chuẩn hóa Column spacing, Header, Badge, Typography, Action buttons, Row height.

### 20. User Actions
- Nút phải nhỏ gọn, dễ nhận biết, có icon phù hợp, hover/focus/disabled state.

### 21. ConfirmDialog
- Các thao tác nhạy cảm (Change Role, Lock, Unlock) bắt buộc dùng ConfirmDialog.

### 22. User Detail Drawer — OPTIONAL (P2)
- Có thể click row → mở User Detail Drawer.
- CHỈ làm nếu Backend/API hiện tại đã cung cấp dữ liệu.

---

## PHẦN VI — ADMIN AUDIT LOGS

### 23. Audit Logs Pagination
- Bắt buộc: 15–20 logs/page.

### 24. Action Filter
- Dropdown (All Actions, CREATE, UPDATE, DELETE, LOGIN...). Theo API enum thực tế.

### 25. Date Filter (P2)
- Chỉ thêm nếu API hỗ trợ.

### 26. Action Badge
- Dùng semantic token (CREATE → green, UPDATE → amber, DELETE → red).

### 27. Metadata Collapse
- Mặc định collapsed. Tránh hiển thị JSON dài mặc định.

### 28. Copy JSON
- Thêm tính năng Copy JSON. Chỉ copy JSON PII-masked và sanitized.

### 29. Audit Timestamp
- `text-right text-sm text-slate-400 whitespace-nowrap`. Align bên phải để dễ scan.

### 30. Audit Log Layout
- Hierarchy: `ACTION ACTOR TIME ↓ Description ↓ Target ID Metadata JSON`.

---

## PHẦN VII — ADMIN DASHBOARD

### 31. KPI Cards
- Không được fake delta. Nếu API có dữ liệu delta, mới hiển thị.

### 32. Không làm KPI Chart
- Không cần Sparkline, Line chart, Bar chart cho MVP.

### 33. System Status
- Nếu Backend có health data, hiển thị status thật. Nếu không, chỉ hiển thị trạng thái cơ bản, KHÔNG fake health.

---

## PHẦN VIII — SETTINGS

### 34. Settings Layout
- Coi Settings là Form / Control Panel, không phải List/Table.

### 35. Boolean Settings → Toggle
- Dùng toggle cho các cài đặt boolean.

### 36. Multi-state Settings → Select
- Dùng dropdown (select) cho enum (STRICT, STANDARD, RELAXED).

### 37. Settings Visual Hierarchy
- Hiển thị rõ Setting Name, Description, Current State, Recommended/Warning.

---

## PHẦN IX — DOUBLE-BLIND STUDENT REVIEW

### 38. Student Review Inbox
- Phải audit Reviewer identity và Reviewee identity. Không được lộ.

### 39. Không hiển thị PII
- Không để Name, Email, MSSV, Class, Group Name, Avatar hiển thị.

### 40. Không leak identity qua URL
- Dùng opaque ID / assignment reference phù hợp.

### 41. API Response Audit
- API Response không được trả identity không cần thiết cho Student.

### 42. File Metadata
- Filename, File metadata, Download URL, Preview không chứa identity.

### 43. Student Review Grading
- Layout Split-screen (Content & Review Form) nếu phù hợp kích thước màn hình.

---

## PHẦN X — ACCESSIBILITY

### 44. Keyboard Navigation
- Hỗ trợ Tab, Shift+Tab, Enter, Escape.

### 45. Focus State
- Đảm bảo `focus-visible` cho button, `focus` cho select/input, và focus trap cho modal.

### 46. Accessible Labels
- Không dùng icon-only button mà không có accessible label (aria-label).

### 47. Contrast
- Tuân thủ Design Tokens / WCAG.

---

## PHẦN XI — SCOPE GUARD

Trong quá trình cải thiện UI/UX **KHÔNG tự ý thay đổi**: Database, API Contract, Authentication, Authorization, Business Logic, Double-Blind Logic, AI Logic, Backend Pagination, Security Policy.

---

## PHẦN XII — VERIFICATION

### 48. TypeScript
- Sau mỗi nhóm thay đổi: `npx tsc -b`.

### 49. Build
- Trươc khi hoàn thành: `npx tsc -b` và `npm run build`.

### 50. Manual UI Test / Browser Overflow Test / Pagination Test / Audit Logs Test / Users Test / Settings Test / Responsive Test / Double-Blind Security Test / Final Regression

---

## PHẦN XIII — NHỮNG THỨ KHÔNG LÀM TRONG MVP

❌ Bulk Actions
❌ Infinite Scroll
❌ KPI Charts
❌ Sparkline
❌ Activity Spike Chart
❌ Advanced Admin Analytics
❌ Over-animation
❌ Enterprise-grade complex dashboard
❌ Advanced User Management Drawer nếu chưa có API
❌ Date Range Filter nếu Backend chưa hỗ trợ
❌ Fake System Health
❌ Fake KPI Delta

---

## THỨ TỰ THỰC HIỆN CUỐI CÙNG

1. **Root Layout Audit**
2. **Design System + Spacing**
3. **Pagination + Scroll + Overflow**
4. **Loading / Empty / Error**
5. **Admin Sidebar**
6. **Admin Users**
7. **Admin Audit Logs**
8. **Admin Dashboard**
9. **Admin Settings**
10. **Teacher Pages**
11. **Student Review + Double-Blind Audit**
12. **Accessibility**
13. **Responsive + Regression**
14. **tsc + Build + Final Verification**

### ⭐ Ưu tiên thực tế cho bản Pilot 500–1.000 users

**P0**
- Root Layout / Overflow
- Pagination
- Responsive
- Design System
- Loading / Empty / Error
- Double-Blind Privacy

**P1**
- Users UX
- Audit Logs UX
- Sidebar
- Settings
- Dashboard KPI context
- Accessibility

**P2**
- User Detail Drawer
- Date Range Filter
- Các enhancement khác
