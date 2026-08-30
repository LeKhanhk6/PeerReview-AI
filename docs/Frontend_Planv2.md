# 📋 FRONTEND DEVELOPMENT PLAN v2.0 — PeerReview-AI

_(Bản đã chỉnh sửa theo Technical Review — các thay đổi so với v1 được đánh dấu 🆕)_

---

## ⚙️ PHASE 0 — FOUNDATION & GLOBAL RULES

> **Nguyên tắc: Không bắt đầu Phase 1 cho đến khi toàn bộ rules dưới đây được ENFORCE BẰNG CODE (util/hook thật), không chỉ trên giấy.**

### Task 00.1 — Project Setup ✅

- [x]  Vite + React + TypeScript strict mode
- [x]  Tailwind CSS + shadcn/ui + design tokens
- [x]  ESLint + Prettier
- [x]  Path aliases (`@/components`, `@/lib`, `@/hooks`...)

### Task 00.2 — Core Infrastructure ✅

- [x]  TanStack Query v5 setup + QueryClient config
- [x]  Axios instance + interceptors
    - 🆕 **Ghi chú rõ:** Phase 0 interceptor chỉ log lỗi. **Full 401 handling (logout + redirect login) activate ở Phase 1** khi auth store sẵn sàng.
- [x]  Zustand stores (auth, ui)
- [x]  Zod validation schemas
- [x]  React Router + ProtectedRoute

**🆕 Rule Thép API (enforced bằng code):**

- [x]  Wrapper hook `useApiQuery` / `useApiMutation` — mọi call API **bắt buộc đi qua wrapper này**, chặn việc gọi axios trực tiếp trong component
- [x]  Response interceptor chuẩn hóa: unwrap `{ success, data }`, normalize error thành `{ code, message, status }`

**🆕 Rule Phân Trang (enforced bằng code):**

- [x]  Hook `usePaginatedQuery(queryKey, fetchFn)` — tự áp `keepPreviousData` + sync page/filter vào URL searchParams
- [x]  🆕 Generalize rule: **mọi bảng có filter/pagination đều sync URL** (shareable link), không riêng Assignment list

### Task 00.3 — Global UI Components ✅ _(đã review Phase 0.3)_

- [x]  Button, EmptyState (+ strict wrappers), ErrorBoundary, FullScreenLoader, Skeleton, Toaster

**🆕 Fix-back từ Code Review Phase 0.3 (bắt buộc trước Phase 1):**

- [x]  🔴 Toaster: đổi error style → nền neutral + icon/border destructive; thêm token `--success`
- [x]  🔴 ErrorBoundary: tích hợp client error reporting thực tế (`POST /api/client-errors`), không hiển thị raw `error.message`, xử lý riêng ChunkLoadError (auto-reload 1 lần có guard)
- [x]  🔴 FullScreenLoader: thêm secondary action "Về trang đăng nhập"; emit `loading_timeout` event lên telemetry
- [x]  🟠 Thống nhất **Recovery Strategy chung**: reset query cache → redirect safe route → reload last resort (áp dụng cho cả 3 component)

### 🆕 Task 00.4 — i18n & Copy Management _(mới)_

- [x]  Tạo `constants/messages.ts` chứa TOÀN BỘ user-facing copy (EmptyState, Loader, Toaster, form errors)
- [x]  Quy tắc: cấm hard-coded string trong JSX — ESLint rule cảnh báo
- [x]  Cấu trúc sẵn để nâng cấp i18n library sau nếu cần đa ngôn ngữ

### 🆕 Task 00.5 — Client Observability ✅

- [x]  Telemetry module: `reportError(error, context)` → POST `/api/client-errors` (backend cần endpoint tương ứng)
- [x]  Event tracking: loading timeouts, API failures, AI retry occurrences
- [x]  Wire vào ErrorBoundary + FullScreenLoader + global query `onError`

### 🆕 Task 00.6 — Offline/Network Handling ✅

- [x]  Global banner "Mất kết nối" (detect qua `navigator.onLine` + query retry failures)
- [x]  TanStack Query `networkMode` config rõ ràng (pause mutations khi offline, queue lại khi online)

### Task 00.7 — MSW Setup ✅

- [x]  Mock handlers cho tất cả endpoints
- [x]  Simulate error states: 500, timeout, 401, slow network
- [x]  Dùng chính MSW để unit-test EmptyState/ErrorBoundary/Loader

### 🆕 Definition of Done — Phase 0

- [x]  Mọi rule ở 00.2 có util/hook thật + ít nhất 1 usage example
- [x]  Copy 100% nằm trong messages file (không còn hard-coded English trong components)
- [x]  Lỗi runtime đều flow về telemetry endpoint (verify bằng MSW mock)
- [x]  DoD checklist từ "Quy tắc code.md" được tham chiếu và tick đầy đủ

---

## ⚙️ PHASE 1 — AUTHENTICATION & APP SHELL

### Task 01.1 — Auth Store & Flow ✅

- [x]  Zustand auth store + hydration flow (`GET /me` trước khi render app)
- [x]  Activate full 401 handling trong interceptor (logout + redirect, chống loop)
- [x]  ProtectedRoute + RoleRoute (student/teacher/admin)
- [x]  Login/Register screens + Zod validation

### Task 01.2 — Layouts ✅

- [x]  `AppLayout` làm shell gốc, tích hợp lồng lặp với `RoleRoute`
- [x]  `StudentLayout` / `TeacherLayout` / `AdminLayout` với cấu hình nav riêng
- [x]  Responsive Sidebar: Drawer mode cho màn < 768px (có Backdrop, phím Escape)
- [x]  Navigation: Active state đồng bộ hoàn toàn với URL qua `useLocation()`
- [x]  TopBar: Hiển thị Avatar, tên User, Badge "⚡ ADMIN MODE" cho Admin
- [x]  `AuthStore` Logout Flow: Tích hợp logic clear session + `queryClient.clear()`
- [x]  **A11y Dialog & ConfirmDialog**: Chuẩn Focus trap, Shift+Tab lùi, phục hồi focus
- [x]  **AdminActionGuard**: Tự động block actions nguy hiểm hoặc mở popup ConfirmDialog phụ thuộc biến `capabilities.audit_enabled` lấy từ `AuthStore`
- [x]  Loại bỏ 100% hard-coded user strings (chuyển vào `constants/messages/layout.ts`)
- [x]  Ghi nhận TODO API Contract Change Request: Backend `GET /me` chưa trả về `capabilities.audit_enabled`

---

## ⚙️ PHASE 2 — TEACHER: COURSE & ASSIGNMENT MANAGEMENT

### Task 02.1 — Class/Course Management

- [x]  CRUD lớp học, danh sách sinh viên, invite/join flow
- [x]  URL-synced pagination/filtering (theo rule mới 00.2)

### Task 02.2 — Group Management ✅

- [x]  CRUD groups, leader assignment, member overview

### Task 02.3 — Assignment & Rubric Builder ✅

- [x]  Form động tạo rubric criteria (thêm/xóa/sắp xếp dòng ⬆️/⬇️)
- [x]  Validation tổng weight = 100% (tolerance Math.abs(total - 100) < 0.01)
    - 🆕 **Server-side cũng validate** — frontend hiển thị lỗi trả về từ backend (không tin frontend-only check)
- [x]  Deadline picker + timezone handling (UTC ISO contract + past date disabled)
- [x]  File attachment upload (progress bar, cancel, retry UI simulation)

### 🆕 Task 02.4 — Accessibility Checklist ✅

- [x]  Mỗi screen khi Done phải pass checklist a11y cơ bản:
    - Focus trap trong modal/dialog (Tab/Shift+Tab loop, Esc key, focus restore)
    - Keyboard navigation cho form động (Rubric Builder `aria-live="polite"` tổng trọng số)
    - aria-label cho icon buttons, skeleton có `aria-busy="true"` + `role="status"` + `<span className="sr-only">`, toast có `role="status"` & duration hợp lý
    - 📌 _Defer: Tích hợp axe-core tự động (vitest-axe / @axe-core/react) → chuyển sang PHASE 12 Accessibility Audit_

---

## ⚙️ PHASE 3 — TEACHER: ANALYTICS & MONITORING

### Task 03.1 — Contribution Dashboard ✅

- [x]  Contribution % per member, classification badges (High/Low/Free-rider)
- [x]  SkeletonCard variant (🆕 thêm vào Skeleton.tsx lúc build phase này)
- [x]  Export CSV (🆕 bổ sung — teacher cần mang số liệu ra ngoài)

### Task 03.2 — Early Warning Panel ✅

- [x]  Danh sách cảnh báo (inactivity, negative interaction, unbalanced contribution)
- [x]  🆕 Trạng thái resolution: acknowledge/dismiss warning (sync với bảng `early_warnings` — vá mismatch DB-screen đã phát hiện)
- [x]  Link sâu tới group/submission liên quan

---

## ⚙️ PHASE 4 — STUDENT: GROUP WORKSPACE

### Task 04.1 — Group Workspace Home ✅

- [x]  Tasks board, discussions feed, activity timeline

### Task 04.2 — Submission Flow ✅

- [x]  Upload với version history, deadline countdown
- [x]  Disable submit khi uploading, progress bar, retry upload
- [x]  🆕 Offline-safe: chặn submit khi mất mạng, hiện banner thay vì silent fail

---

## ⚙️ PHASE 5 — PEER REVIEW (DOUBLE-BLIND) ✅

### Task 05.1 — Review Inbox ✅

- [x]  Danh sách review assignments ẩn danh (Anonymous Identity display)
- [x]  Deadline badge, trạng thái draft/submitted

### Task 05.2 — Review Writing Screen (Split-screen) ✅

- [x]  Submission view | Rubric scoring form
- [x]  Draft persistence (autosave local)
- [x]  Keyboard navigation giữa 2 panel (a11y)

### Task 05.3 — AI Mentor Integration ✅

- [x]  Real-time NLP feedback khi viết review (debounce 1.5s)
- [x]  Ma trận Retry/Timeout thống nhất (Auto-retry 1 lần, fallback UI "AI tạm thời không khả dụng", không block submit)
- [x]  Circuit-breaker UX (Lỗi >3 lần trong session -> tắt auto-call, chuyển nút gọi manual)
- [x]  Áp dụng câu mẫu từ AI có ConfirmDialog bảo vệ dữ liệu người dùng

---

## ⚙️ PHASE 6 — AI SYNTHESIS DASHBOARD ✅

### Task 06.1 — Long-running Job UX ✅

- [x]  Trigger synthesis → job status polling (hoặc SSE nếu backend hỗ trợ)
- [x]  Progress indicator + cancel option
- [x]  Xử lý job failure: retry từ UI, giữ trạng thái cũ an toàn

### Task 06.2 — Summary Report Rendering ✅

- [x]  Render `review_summary_items`: topic clusters, frequency_count, sentiment
- [x]  Traceability UI: click item → expand xem `source_review_ids` (reviews gốc, vẫn ẩn danh)
- [x]  Pagination/lazy-load nếu summary lớn

### Task 06.3 — Human-in-the-loop Editing ✅

- [x]  Teacher edit summary items → đánh dấu `is_teacher_edited`, **không bị AI overwrite**
- [x]  Confirm điểm cuối cùng flow + confirm dialog đỏ
- [x]  Audit trail hiển thị ai sửa gì, khi nào

---

## ⚙️ PHASE 7 — ADMIN PANEL

### Task 07.1 — Admin Core (Tuần 1–2, Phụ thuộc Backend B1)

- [ ] **Task 07.1a**: `admin.types.ts` + `admin.ts` (messages) + export `constants/messages/index.ts`
- [ ] **Task 07.1b**: `admin.handlers.ts` (MSW) + đăng ký `handlers.ts` — mock data tuyệt đối không chứa PII
- [ ] **Task 07.1c**: `adminApi.ts` + `useAdmin.ts` (TanStack Query + URL searchParams sync cho filter/search)
- [ ] **Task 07.1d**: `UserTable` + `UserRoleModal`:
  - Self-protection (`userId !== currentUser.id`) + tooltip cảnh báo "Không thể tự hạ quyền/tự khóa chính mình"
  - `AdminActionGuard` + `ConfirmDialog` bảo vệ thao tác nhạy cảm
  - Last-Admin protection UI best-effort
  - Confirm khóa tài khoản hiển thị hậu quả tác động
- [ ] **Task 07.1e**: `AuditLogViewer`:
  - 100% read-only
  - PII masking: tự động strip (`password`, `token`, `secret`, `jwt`, `api_key`), mask email (`a***@domain.com`)
  - Filter `action_type`, `user_id`, `from`/`to` + phân trang `limit = 20`
- [ ] **Task 07.1f**: `AdminDashboardPage` + `AdminUsersPage` + `AdminAuditLogsPage` (xử lý EmptyState & 403/404 errors)
- [ ] **Task 07.1g**: `AdminLayout` nav items + `App.tsx` routes (`RoleRoute allowedRoles={['ADMIN']}`)
- **Gate**: `npx tsc --noEmit` pass, MSW verification, manual test 7 bước + test case tìm user không tồn tại.

### Task 07.2 — System Settings (Tuần 3–4, Chờ Backend B4)

- [ ] `SystemConfigPanel` — Read-only status checks trước (audit logging, telemetry flags từ Auth Store), cho phép edit sau khi Backend B4 sẵn sàng `PATCH /api/admin/system-config`.

### Task 07.2-M — Merge Task 07.1 với Backend API Thật (Tuần 3–4)

- [ ] Chuyển đổi từ MSW Mock Handlers sang Backend API thật khi Task B1 hoàn tất.
- [ ] Verify flow 409 Conflict (Last-Admin protection) end-to-end giữa FE & BE.
- [ ] Verify PII masking khớp với Backend (đảm bảo không bị double-mask email).

---

## 📊 MA TRẬN TASK ↔ SCREEN ↔ API BACKEND

| FE Task | Screen / Component | API Backend | Trạng thái API |
| :---: | :--- | :--- | :---: |
| **07.1d** | Screen 19 (Admin Users) | `GET /api/admin/users`, `PATCH /api/admin/users/:id/role`, `status` | ⏳ Chờ BE B1 |
| **07.1e** | Screen 19 (Audit Logs Tab) | `GET /api/admin/audit-logs` | ⏳ Chờ BE B1 |
| **07.1f** | Screen 19 (Dashboard Overview) | `GET /api/admin/dashboard/overview` | ⏳ Chờ BE B1 |
| **07.2** | Screen 19 (System Settings) | `GET /api/admin/system-config`, `PATCH /api/admin/system-config` | ⏳ Chờ BE B4 |
| **08.1.2** | Screen 6 (Submission) | `POST /submissions/assignments/:id` | ✅ API có sẵn |
| **08.1.3** | Screen 7, 8 (Peer Review) | `GET/POST /reviews/...`, `POST /ai/review-feedback` | ✅ API có sẵn |
| **08.1.4** | Screen 15 (Review Synthesis) | `GET/POST /assignments/:id/review-summary` | ✅ API có sẵn |

---

## ⚙️ PHASE 8 — POLISH, E2E & PILOT READINESS (Tuần 5–7)

### Task 08.1 — E2E Testing (Playwright)

- [ ] Critical flows bắt buộc cover:
    1. Login → hydration → dashboard
    2. Student submit assignment (upload + versioning)
    3. Double-blind review flow (allocate → write → submit)
    4. Teacher synthesis (trigger → edit → confirm)
- [ ] Chạy trên CI mỗi PR

### 🆕 Task 08.2 — Measurable Quality Gate

- [ ] 0 known P1 bugs (crash, data loss, security)
- [ ] E2E coverage: 4 critical flows pass
- [ ] MSW coverage: mọi endpoint có ít nhất 1 error-state test
- [ ] a11y checklist pass cho tất cả screens
- [ ] Lighthouse: Performance ≥ 80, Accessibility ≥ 90 trên 5 màn hình chính

### Task 08.3 — Deployment Prep & Pilot Hardening

- [ ] Environment configs (.env staging/prod)
- [ ] Error reporting verify end-to-end (frontend → `/api/client-errors` → log)
- [ ] Smoke test script post-deploy (kiểm tra chunk loading, auth flow)
- [ ] Giả lập 300 concurrent users load test frontend
- [ ] Chụp ảnh / ghi hình demo các luồng màn hình chính cho báo cáo & dự thi

---

## 📌 POST-MVP BACKLOG

- Notification center UI (bảng DB đã có, UI chưa trong MVP scope)
- Đa ngôn ngữ đầy đủ (i18n-lite hiện tại là nền)
- Optimistic updates cho UX nhanh hơn
- Real-time notifications (WebSocket/SSE)

---

## 📊 Timeline & Kế Hoạch Vận Hành Pilot (500–1.000 Users)

| Tuần | Backend Roadmap | Frontend Roadmap |
|---|---|---|
| **Tuần 1–2** | 🔴 B1.0–B1.4, B2 (Admin APIs + verification) | 🔴 Task 07.1a–07.1g (Admin Core, MSW song song) |
| **Tuần 3–4** | 🟡 B3 (Job queue) + B4 (SysConfig) + B5 rút gọn | 🟡 Task 07.2 System Settings (chờ B4) + Merge 07.1 |
| **Tuần 4–5** | 🟡 B6 AI Cost Control ⬆️ | 🟡 Task 07.2 Merge & E2E Prep |
| **Tuần 5–7** | 🟠 B7.1 Load test ⬆️ → B7.2–B7.6 Ops & Hardening | 🟠 E2E Testing + Pilot Readiness (Task 08.1–08.3) |
| **Tuần 8–10** | 🚀 **PILOT: GĐ1 kín (50–100) → GĐ2 (300–500) → GĐ3 full (800–1.000)** | 🚀 **PILOT: GĐ1 kín (50–100) → GĐ2 (300–500) → GĐ3 full (800–1.000)** |

### 🚀 3 Giai đoạn Vận hành Pilot:
- **Giai đoạn 1 (Tuần 8)**: Kín 50–100 users (Thử nghiệm diện hẹp).
- **Giai đoạn 2 (Tuần 9)**: Mở rộng 300–500 users (Đánh giá tải và độ ổn định).
- **Giai đoạn 3 (Tuần 10)**: Mở tối đa 800–1.000 users (Chấm chéo và tổng hợp AI thực tế).

---

## ⚡ Điểm Nghẽn & Quyết Định Đang Chờ

| # | Vấn đề | Chờ ai | Hệ quả nếu trễ |
|:---:|:---|:---:|:---|
| 1 | Backend Admin APIs (B1) chưa sẵn sàng | BE | Task 07.1 merge PR bị chặn |
| 2 | Cancel synthesis job | BE | FE dùng phương án "job chạy nền, không cancel" |
| 3 | Last-admin check backend | BE | FE chỉ chặn bằng UI best-effort |
| 4 | Field `sentiment` trong SummaryItem | BE | FE ghi nhận deviation khỏi roadmap gốc |
| 5 | Ngân sách LLM API cho Pilot | Đề tài | Pilot không chạy được AI Peer-Review Mentor |