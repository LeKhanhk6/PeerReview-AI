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

### Task 03.2 — Early Warning Panel

- [ ]  Danh sách cảnh báo (inactivity, negative interaction, unbalanced contribution)
- [ ]  🆕 Trạng thái resolution: acknowledge/dismiss warning (sync với bảng `early_warnings` — vá mismatch DB-screen đã phát hiện)
- [ ]  Link sâu tới group/submission liên quan

---

## ⚙️ PHASE 4 — STUDENT: GROUP WORKSPACE

### Task 04.1 — Group Workspace Home

- [ ]  Tasks board, discussions feed, activity timeline

### Task 04.2 — Submission Flow

- [ ]  Upload với version history, deadline countdown
- [ ]  Disable submit khi uploading, progress bar, retry upload
- [ ]  🆕 Offline-safe: chặn submit khi mất mạng, hiện banner thay vì silent fail

---

## ⚙️ PHASE 5 — PEER REVIEW (DOUBLE-BLIND)

### Task 05.1 — Review Inbox

- [ ]  Danh sách review assignments ẩn danh (Anonymous Identity display)
- [ ]  Deadline badge, trạng thái draft/submitted

### Task 05.2 — Review Writing Screen (Split-screen)

- [ ]  Submission view | Rubric scoring form
- [ ]  Draft persistence (autosave local + 🆕 API draft endpoint — cần confirm với backend, hiện đang thiếu trong API contract)
- [ ]  Keyboard navigation giữa 2 panel (a11y)

### Task 05.3 — AI Mentor Integration

- [ ]  Real-time NLP feedback khi viết review (debounce 1–2s)
- [ ]  🆕 **Ma trận Retry/Timeout thống nhất** (viết rõ, dev không tự quyết):

|Loại lỗi|Hành vi|
|---|---|
|Network timeout (AI mentor)|Auto-retry 1 lần (RQ `retry: 1`) → fallback UI "AI tạm thời không khả dụng", **vẫn cho viết review bình thường**|
|AI service 5xx|Hiện inline notice, không block submit|
|Mutation thất bại (submit review/upload)|Toast error + nút Retry thủ công (disable 1–2s chống spam)|
|Auth 401|Interceptor xử lý global, không retry|

- [ ]  Circuit-breaker UX: nếu AI fail liên tục >N lần trong session → tắt auto-call, chỉ gọi manual

---

## ⚙️ PHASE 6 — AI SYNTHESIS DASHBOARD _(tách chi tiết — trước đây quá mỏng)_

### Task 06.1 — Long-running Job UX

- [ ]  Trigger synthesis → job status polling (hoặc SSE nếu backend hỗ trợ)
- [ ]  Progress indicator + cancel option
- [ ]  Xử lý job failure: retry từ UI, giữ trạng thái cũ an toàn

### Task 06.2 — Summary Report Rendering

- [ ]  Render `review_summary_items`: topic clusters, frequency_count, sentiment
- [ ]  Traceability UI: click item → expand xem `source_review_ids` (reviews gốc, vẫn ẩn danh)
- [ ]  Pagination/lazy-load nếu summary lớn

### Task 06.3 — Human-in-the-loop Editing

- [ ]  Teacher edit summary items → đánh dấu `is_teacher_edited`, **không bị AI overwrite**
- [ ]  Confirm điểm cuối cùng flow + confirm dialog đỏ
- [ ]  Audit trail hiển thị ai sửa gì, khi nào

---

## ⚙️ PHASE 7 — ADMIN PANEL

- [ ]  User management, class/course oversight
- [ ]  🆕 Audit log viewer (read-only) — khớp audit requirement ở Phase 1
- [ ]  System config screens

---

## ⚙️ PHASE 8 — POLISH, E2E & RELEASE _(mới — thay cho "100% bug-free" mơ hồ)_

### Task 08.1 — E2E Testing (Playwright)

- [ ]  Critical flows bắt buộc cover:
    1. Login → hydration → dashboard
    2. Student submit assignment (upload + versioning)
    3. Double-blind review flow (allocate → write → submit)
    4. Teacher synthesis (trigger → edit → confirm)
- [ ]  Chạy trên CI mỗi PR

### 🆕 Task 08.2 — Measurable Quality Gate

_(Thay thế target "100% Bug-free environment" — tiêu chí đo được:)_

- [ ]  0 known P1 bugs (crash, data loss, security)
- [ ]  E2E coverage: 4 critical flows pass
- [ ]  MSW coverage: mọi endpoint có ít nhất 1 error-state test
- [ ]  a11y checklist pass cho tất cả screens
- [ ]  Lighthouse: Performance ≥ 80, Accessibility ≥ 90 trên 5 màn hình chính

### Task 08.3 — Deployment Prep

- [ ]  Environment configs (.env staging/prod)
- [ ]  Error reporting verify end-to-end (frontend → `/api/client-errors` → log)
- [ ]  Smoke test script post-deploy (kiểm tra chunk loading, auth flow)

---

## 📌 POST-MVP BACKLOG (ghi rõ — tránh hiểu nhầm là bỏ quên)

- Notification center UI (bảng DB đã có, UI chưa trong MVP scope)
- Đa ngôn ngữ đầy đủ (i18n-lite hiện tại là nền)
- Optimistic updates cho UX nhanh hơn
- Real-time notifications (WebSocket/SSE)

---

## 📊 Timeline tóm tắt

|Phase|Nội dung|Ghi chú thay đổi|
|---|---|---|
|0|Foundation + Rules enforced + i18n + Telemetry + Offline|🆕 mở rộng ~30%|
|1|Auth & Shell|Nhỏ, activate 401|
|2–3|Teacher flows|+ a11y checklist, export CSV|
|4–5|Student & Review|+ Ma trận retry, draft API confirm|
|6|AI Synthesis|🆕 tách 3 tasks chi tiết|
|7|Admin|+ audit viewer|
|8|E2E + Quality gates + Deploy|🆕 measurable DoD|