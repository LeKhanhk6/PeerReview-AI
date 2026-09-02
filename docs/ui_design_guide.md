# 🎨 PeerReview-AI — Hướng dẫn Thiết kế Giao diện Chi tiết
> Version: 2.0 | Cập nhật: 2026-09-02 | Dựa trên audit toàn bộ source code thực tế

---

## 📐 Design System Nền tảng

### Token màu sắc
```css
/* Màu thương hiệu (BRAND) */
--brand-primary:    #0B57D0   /* Dùng cho nút CTA chính, active nav, link */
--brand-hover:      #0945A5   /* Hover state của brand-primary */
--brand-soft-bg:    #E8F0FE   /* Nền badge, background icon soft */

/* Màu ngữ nghĩa (SEMANTIC) */
--success:   emerald (50/100/600/700)
--warning:   amber   (50/100/600/700)
--danger:    rose    (50/100/600/700)
--neutral:   slate   (50/100/200/500/700/900)

/* TUYỆT ĐỐI CẤM */
❌ indigo-*
❌ violet-*
❌ blue-600 / blue-700 / blue-800 (dùng brand-primary thay thế)
```

### Typography
```
Font: Inter (Google Fonts) — import qua index.html
Heading:   font-bold / font-extrabold
Body:      text-sm / text-xs, font-medium
Label:     text-xs font-bold uppercase tracking-wider
Mono:      font-mono (dùng cho code, invite code, metadata)
```

### Spacing & Radius
```
Card radius:   rounded-2xl (16px)  — chuẩn cho các card chính
Small radius:  rounded-xl  (12px)  — component nhỏ bên trong card
Button radius: rounded-lg  (8px)
Large radius:  rounded-3xl (24px)  — nếu cần góc bo tròn lớn (ví dụ: modal)
Gap grid:      gap-4 / gap-5
Padding card:  p-5 / p-6
Border:        border border-slate-100 (nhẹ) hoặc border-slate-200 (rõ hơn)
Shadow:        shadow-sm (mặc định), shadow-md (chỉ dùng cho hover/interactive elevation)
```

### Layout Rules
| Loại trang | Pattern | Class ngoài cùng |
|---|---|---|
| Dashboard | Layout phụ thuộc nội dung | Tùy biến |
| Form, detail, trang dài | Page-level scroll | `space-y-6 max-w-5xl mx-auto pb-12` |
| Danh sách, bảng (List/Table) | Page-level scroll + Pagination | `h-full w-full min-w-0 overflow-y-auto space-y-6 max-w-7xl mx-auto pb-12 pr-1` |

### Quy tắc Pagination & Scroll
- **Cơ chế phân trang chính**: Pagination làm cơ chế phân trang chính cho tất cả các trang danh sách/bảng. Nội dung trang sử dụng page-level vertical scroll tự nhiên; Table Wrapper chỉ sử dụng horizontal scroll khi tổng chiều rộng các cột vượt viewport.
- **Không sử dụng internal vertical scroll**: Tuyệt đối không sử dụng `overflow-y-auto` bên trong Table/List. Bảng chỉ giới hạn cuộn ngang bằng `overflow-x-auto`.

### Chuẩn hóa Các Trạng thái (States)
Không được dùng text thuần (ví dụ `<div>Loading...</div>` hay `Lỗi hệ thống`). Phải dùng các component chuẩn:
- **Loading**: Dùng `<SkeletonCard />` hoặc `<Skeleton />`.
- **Empty**: Dùng `<EmptyState type="no_data" />`.
- **Error**: Dùng `<EmptyState type="error" />` kèm nút thử lại.
- **Success/Data**: Render dữ liệu bình thường.

### Form & Button States
Các thao tác form (Tạo, Sửa, Submit) cần có đủ trạng thái:
- **Default**: Bình thường.
- **Focus**: `focus:ring-2 focus:ring-brand-primary`
- **Error**: `border-rose-300 text-rose-900 focus:ring-rose-500`
- **Submitting**: `[⟳ Đang lưu...]` (vô hiệu hóa nút để tránh double-click).

### Confirm Dialog cho Thao tác Xóa/Nguy hiểm
Mọi thao tác destructive (Xóa lớp, Xóa thành viên, Hủy chấm) đều KHÔNG ĐƯỢC dùng `window.confirm()`. Bắt buộc dùng `<ConfirmDialog />` và phải bao gồm:
- Title rõ ràng.
- Consequence (hệ quả khi xóa).
- Loading state khi đang gọi API.
- Error state nếu API thất bại.
- Disable double-click.

### Phân quyền Định danh (Identity Privacy)
- **Teacher Submissions & Analytics**: ✅ ĐƯỢC PHÉP xem danh tính thật (Tên, MSSV, Email).
- **Student Review Inbox & Review Detail**: ❌ CẤM TUYỆT ĐỐI. Sinh viên không được xem danh tính của bạn học khi chấm chéo.
- **Student Submission**: Chỉ xem danh tính của chính mình.
- Dùng ID ngẫu nhiên cho bài chấm ẩn danh (ví dụ: `Bài chấm #A7K2`). Không dùng ID database (như ID tự tăng).

---

## 🗂️ Layout Shell (Sidebar + Topbar)

### Sidebar — Thiết kế đề xuất

**Hiện trạng vấn đề:**
- User info (avatar + tên) để ở Topbar, gây layout "đầu to chân nhỏ"
- Sidebar footer chỉ có "Hệ thống ổn định" — thiếu context người dùng
- Không có role badge trực quan để user biết mình đang ở role nào

**Thiết kế lại:**

```
┌────────────────────────────────┐
│  [logo 48px]  PeerReview AI    │ ← Logo row h-16 (không đổi)
│               [TEACHER badge]  │ ← Thêm role badge nhỏ góc phải logo
├────────────────────────────────┤
│ Điều hướng chính               │
│  ○ Tổng quan          ← icon  │
│  ● Lớp học  ←────── active   │ ← pill active: bg-brand-soft-bg text-brand-primary
│  ○ Bài tập                    │ ← hover: slate-50/slate-900
│  ○ Phân tích AI               │
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ [avatar 32px] Văn A      │  │ ← Dời user info XUỐNG footer sidebar
│  │ Giảng viên               │  │ ← KHÔNG ĐỂ status "Online" nếu chưa làm chức năng presence
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

**Code pattern mục tiêu:**
```tsx
{/* Footer: User Info Card thay thế cho "Hệ thống ổn định" */}
<div className="shrink-0 p-3 border-t border-slate-100">
  <Link to={`/${rolePath}/profile`} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
    <div className="w-8 h-8 rounded-full bg-brand-soft-bg text-brand-primary flex items-center justify-center text-sm font-bold shrink-0 border border-brand-primary/20">
      {user?.full_name?.charAt(0)}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
      <p className="text-[10px] text-slate-500 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
        {roleLabel[user?.role]}
      </p>
    </div>
    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
  </Link>
</div>
```

### Topbar — Thiết kế đề xuất

**Hiện trạng vấn đề:**
- Sau khi user info chuyển xuống sidebar footer, Topbar sẽ trống bên phải
- Focus ring của hamburger đang `focus:ring-blue-500` → cần đổi về `focus:ring-brand-primary`

**Thiết kế lại:**
```
[☰ mobile]  |  [Breadcrumb tự động]  |  [⚙️ Settings]  [Logout]
```

```tsx
{/* Bên phải Topbar: chỉ còn action nhỏ */}
<div className="flex items-center gap-2">
  {/* Logout */}
  <Button variant="ghost" size="sm" onClick={logout}>
    <LogOut className="w-4 h-4 text-slate-500 hover:text-rose-600" />
  </Button>
</div>
```

---

## 👩‍🏫 Nhóm TEACHER

### 1. Teacher Dashboard (`/teacher/dashboard`) — Template tham chiếu ✅
**Trạng thái:** Đã chuẩn — dùng làm mẫu cho các màn còn lại.

**Pattern layout:**
```
Page-level scroll
├── Header + Class Selector (shrink-0, bg-white, rounded-2xl)
├── 5 Stat Cards (shrink-0, grid)
└── Bottom Row: Assignments List | Early Warning (flex-1, min-h-0, grid)
    ├── Left: list
    └── Right: risk panel
```

**Cải tiến nhỏ còn lại:**
- Stat cards hiện chỉ có số — thêm icon Lucide nhỏ bên trái số để tăng scannability
- Deadline badge nên căn lề phải nhất quán với các màn khác

---

### 2. Danh sách Lớp học (`/teacher/classes`) — 🔴 Cần redesign toàn bộ

**Hiện trạng vấn đề:**
- Tiếng Anh thuần: "My Classes", "Create Class", "Delete", "No Semester", "Invite Code"
- Style cũ: `rounded-lg shadow border-gray-200` (không phải `rounded-2xl shadow-sm border-slate-100`)
- Loading: `<div>Loading...</div>` — không có Skeleton
- Không có icon Lucide
- Delete dùng `window.confirm()` (browser native dialog) — không đồng nhất

**Thiết kế đề xuất:**

```
Layout: Page-level scroll

┌─────────────────────────────────────────────────────┐
│  Header (shrink-0, bg-white, rounded-2xl)           │
│  [BookOpen] Danh sách Lớp học         [+ Tạo lớp]  │
│  Quản lý và theo dõi các lớp học của bạn            │
├─────────────────────────────────────────────────────┤
│  Cards Grid (flex-1, overflow-y-auto)               │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ CS101            │  │ CS102            │         │
│  │ Lập trình C cơ bản│  │ Cơ sở dữ liệu   │         │
│  │ ─────────────── │  │                  │         │
│  │ 👥24  📝3  HK1  │  │ 👥18  📝2  HK2  │         │
│  │ Code: ABC123     │  │ Code: XYZ789     │         │
│  │ [Xem chi tiết →] │  │ [Xem chi tiết →] │         │
│  └──────────────────┘  └──────────────────┘         │
└─────────────────────────────────────────────────────┘
```

**Class Card redesign:**
```tsx
<div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-brand-primary/20 transition-all group">
  {/* Top: Course code + Semester badge */}
  <div className="flex items-start justify-between gap-2">
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{cls.course_code}</p>
      <h3 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-2 group-hover:text-brand-primary transition-colors">
        {cls.name}
      </h3>
    </div>
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-soft-bg text-brand-primary border border-brand-primary/20 shrink-0">
      {cls.semester || 'N/A'}
    </span>
  </div>

  {/* Stats Row */}
  <div className="flex items-center gap-3 text-xs text-slate-500 border-y border-slate-100 py-2.5">
    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {membersCount} SV</span>
    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {assignmentsCount} bài</span>
  </div>

  {/* Invite Code */}
  <div className="flex items-center justify-between text-xs">
    <span className="text-slate-500">Mã mời:</span>
    <code className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded select-all">{cls.invite_code}</code>
  </div>

  {/* Action */}
  <Link to={`/teacher/classes/${cls.id}`}>
    <Button variant="default" size="sm" className="w-full text-xs gap-1.5">
      Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
    </Button>
  </Link>
</div>
```

---

### 3. Chi tiết Lớp học (`/teacher/classes/:id`) — 🔴 Cần redesign toàn bộ

**Hiện trạng vấn đề:**
- Breadcrumb "← Back to Classes" (tiếng Anh)
- Tab active: `border-blue-600 text-blue-600` → cần `border-brand-primary text-brand-primary`
- Table headers: "Name", "Email", "Student ID", "Joined At" (tiếng Anh)
- Tab "Study Groups" (tiếng Anh)
- Loading: `<div>Loading class details...</div>` và `<div>Class not found</div>` không có UI

**Thiết kế đề xuất:**

```
Layout: Full-viewport flex-col

┌──────────────────────────────────────────────────────┐
│  Header Card (shrink-0, rounded-2xl)                 │
│  ← Danh sách lớp  [CS101 - Lập trình C]  [HK1 2024] │
│                    Lập trình C cơ bản               │
│                    Mã mời: ABC123  [📋 Sao chép]     │
├──────────────────────────────────────────────────────┤
│  Tab Bar (shrink-0): [Sinh viên (24)] [Nhóm học (6)] │
├──────────────────────────────────────────────────────┤
│  Tab Content (flex-1, min-h-0, overflow-y-auto)     │
│  Tab "Sinh viên": bảng sticky header, scroll nội bộ │
│  Tab "Nhóm":      grid card, scroll nội bộ          │
└──────────────────────────────────────────────────────┘
```

**Tab pattern chuẩn:**
```tsx
{/* Tab bar */}
<div className="shrink-0 flex border-b border-slate-100 gap-1 px-1">
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={cn(
        "py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 -mb-px",
        activeTab === tab.id
          ? "border-brand-primary text-brand-primary"
          : "border-transparent text-slate-500 hover:text-slate-700"
      )}
    >
      <tab.icon className="w-4 h-4" />
      {tab.label}
      <span className={cn(
        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
        activeTab === tab.id ? "bg-brand-soft-bg text-brand-primary" : "bg-slate-100 text-slate-500"
      )}>{tab.count}</span>
    </button>
  ))}
</div>
```

---

### 4. Danh sách Bài tập (`/teacher/assignments`) — 🟡 Cần chuẩn hóa

**Hiện trạng vấn đề:**
- Page wrapper đơn giản `space-y-6`, chưa có full-viewport layout
- Header không có icon, không có background white card
- AssignmentList component (cần kiểm tra riêng)

**Thiết kế đề xuất:**
```
Layout: Full-viewport flex-col

┌──────────────────────────────────────────────────────┐
│  Header (shrink-0, rounded-2xl, bg-white)           │
│  [FileText] Bài tập & Đợt chấm chéo   [+ Tạo mới] │
│  Quản lý và theo dõi tiến độ nộp bài                │
├──────────────────────────────────────────────────────┤
│  AssignmentList (flex-1, min-h-0, scroll nội bộ)   │
│  Bảng với sticky header hoặc List Cards             │
└──────────────────────────────────────────────────────┘
```

---

### 5. Tạo/Sửa bài tập (`/teacher/assignments/new` | `/:id/edit`) — Form-cuộn

**Layout:** Natural scroll (không ép full-viewport)

**Thiết kế đề xuất:**
```
max-w-3xl mx-auto pb-16 space-y-6

┌──────────────────────────────────────┐
│  [← Quay lại]  Tạo Bài Tập Mới      │  ← shrink-0 header
│  ────────────────────────────────    │
│  Form Section 1: Thông tin chung     │  ← Card rounded-2xl
│  · Tên bài tập                       │
│  · Mô tả bài tập                     │
│  · Hạn nộp bài                       │
│  Form Section 2: Cài đặt chấm chéo  │  ← Card rounded-2xl  
│  · Số lượt chấm/sinh viên           │
│  · Deadline chấm chéo               │
│  Form Section 3: Rubric             │  ← Card rounded-2xl
│  · [Thêm tiêu chí]                  │
│  [Hủy]                  [Lưu bài tập]│
└──────────────────────────────────────┘
```

**Form input pattern chuẩn:**
```tsx
<div className="space-y-1.5">
  <label className="block text-xs font-bold text-slate-900">{label}</label>
  <input
    className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm bg-white
               focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary
               placeholder:text-slate-400 transition-colors"
  />
  {error && <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
    <AlertCircle className="w-3.5 h-3.5" /> {error.message}
  </p>}
</div>
```

---

### 6. Theo dõi Bài nộp (`/teacher/assignments/:id/submissions`) — Full-viewport

**Thiết kế đề xuất:**
```
Layout: Full-viewport flex-col

┌──────────────────────────────────────────────────────┐
│  Header (shrink-0): Tên bài tập + % nộp bài         │
│  Search bar + Filter (trạng thái nộp)               │
├──────────────────────────────────────────────────────┤
│  Table (flex-1, sticky thead, scroll nội bộ)        │
│  Tên SV | Nhóm | Ngày nộp | Trạng thái | Xem bài  │
└──────────────────────────────────────────────────────┘
```

**Progress summary mini-card trong header:**
```tsx
<div className="flex items-center gap-4 text-xs">
  <span className="flex items-center gap-1.5">
    <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
      <div className="h-full bg-brand-primary rounded-full" style={{ width: `${submissionRate}%` }} />
    </div>
    <span className="font-bold text-brand-primary">{submissionRate}%</span>
  </span>
  <span className="text-slate-500">{submittedCount}/{totalCount} đã nộp</span>
</div>
```

---

### 7. Tổng hợp AI (`/teacher/assignments/:id/synthesis`) — Full-viewport

**Thiết kế đề xuất:**
```
Layout: Full-viewport flex-col với panel trái/phải

┌────────────────┬────────────────────────────────────┐
│  LEFT PANEL    │  RIGHT PANEL                       │
│  (w-64, list)  │  (flex-1, scrollable content)      │
│                │                                    │
│  [bài nộp 1]● │  ┌───── AI Analysis ─────────────┐ │
│  [bài nộp 2]  │  │ Mức độ phù hợp rubric: 80%    │ │
│  [bài nộp 3]  │  │ Điểm nổi bật:                 │ │
│               │  │ ...                            │ │
│               │  │ Điểm cần cải thiện:           │ │
│               │  │ ...                            │ │
│               │  └────────────────────────────────┘ │
│               │  ┌───── Rubric Alignment ────────┐  │
│               │  │ Tiêu chí 1: Khá tốt            │  │
└────────────────┴────────────────────────────────────┘
*(Ghi chú: TUYỆT ĐỐI không để AI hiển thị "Điểm: 8.5/10" để tránh việc Teacher hiểu lầm AI là người ra quyết định cuối cùng).*
```

---

### 8. Phân tích & Cảnh báo AI (`/teacher/analytics`) — Form-cuộn (trang dài)

**Hiện trạng vấn đề:**
- `📊` emoji trong header (cần đổi `BarChart3` icon)
- `border-gray-200`, `focus:ring-blue-500` cần chuẩn hóa
- `👥 Danh Sách Đóng Góp Theo Nhóm` (emoji)
- `💡` hint text, `bg-blue-50 border-blue-200` (màu cấm)

**Thiết kế đề xuất:**
```
Layout: Natural scroll, max-w-7xl mx-auto

[Header: BarChart3 icon] Phân tích & Cảnh báo AI
  [Class Selector dropdown]
  ─────────────────────────
  [Tab: Đóng góp nhóm] [Tab: Cảnh báo sớm 🔴 3]
  ─────────────────────────
  Nếu tab Đóng góp:
    [4 Stat Cards: SV / Tỷ lệ nộp / Hoàn thành chấm / Điểm TB]
    [Grid nhóm học Cards]
  Nếu tab Cảnh báo:
    [EarlyWarningPanel - list cảnh báo có thể dismiss]
```

**Hint box không dùng màu cấm:**
```tsx
{/* Thay blue-50/blue-200 bằng slate */}
<div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
  <Info className="w-5 h-5 text-slate-400 mx-auto mb-2" />
  <p className="text-sm text-slate-600">Vui lòng chọn một lớp học để xem chi tiết</p>
</div>
```

---

## 👨‍🎓 Nhóm STUDENT

### 9. Student Dashboard (`/student/dashboard`) — 🟡 Dọn emoji + chuẩn layout

**Hiện trạng vấn đề:**
- Emoji: `🟡`, `⚠️`, `🚀`, `🔒` (cần thay Lucide)
- Alert banner "Chưa có nhóm" dùng `<span className="text-xl">🟡</span>` → thay `AlertTriangle`
- Groupless card dùng `⚠️`, `🚀`, `🔒` emoji
- SVG icons tự viết trong stat cards → nên dùng Lucide

**Thiết kế đề xuất:**

```
Layout: Natural scroll (content list có thể dài)

┌──────────────────────────────────────────────────────┐
│  Welcome header (bg-white, rounded-2xl)             │
│  Chào buổi sáng, {user.name} 👋                    │ ← giữ 👋 (đã được approve)
├──────────────────────────────────────────────────────┤
│  [WARN] Alert Banner nếu có lớp chưa có nhóm        │  ← dùng AlertTriangle icon
├──────────────────────────────────────────────────────┤
│  3 Stats Cards (grid 3 cols)                         │
│  [BookOpen] Lớp học  |  [Clock] Sắp hết hạn  |  [CheckSquare] Cần chấm
├──────────────────────────────────────────────────────┤
│  Filter tabs: [Tất cả (N)] [Sắp hết hạn] [Cần chấm chéo]
├──────────────────────────────────────────────────────┤
│  Assignment Cards Grid (2 cols lg)                   │
│  ┌──────────────────────────────────────────┐        │
│  │ Tên bài tập              [Badge: 2 ngày] │        │
│  │ Nhóm: [Nhóm A]                          │        │
│  │ ▔▔▔▔▔▔▔▔▔▔▔▔░░░░░  68% tasks         │        │
│  │ Bài nộp: [Đã nộp] Chấm chéo: [Pending] │        │
│  │ [Workspace]        [Nộp bài]            │        │
│  └──────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────┘
```

**Emoji thay thế bắt buộc:**
| Emoji | Lucide Icon | Class |
|---|---|---|
| `🟡` (alert) | `AlertTriangle` | `text-amber-500` |
| `⚠️` | `AlertTriangle` | `text-amber-500` |
| `🚀` (tham gia nhóm) | `UserPlus` | |
| `🔒` (disabled submit) | `Lock` | `text-slate-400` |

---

### 10. Danh sách Lớp học Student (`/student/classes`) — Cần kiểm tra riêng

**Thiết kế đề xuất (dựa trên pattern chung):**
```
Layout: Full-viewport

Header: [GraduationCap] Các Lớp học của Tôi
Content: Grid card lớp học (tương tự Teacher nhưng ít action hơn)
         Mỗi card: Tên lớp, Giảng viên, Mã lớp, [Xem workspace]
```

---

### 11. Nộp bài (`/student/assignments/:id/submit`) — Form-cuộn

**Hiện trạng vấn đề:**
- Header `📥`, `📌`, `📋` emoji → cần thay Lucide
- `text-blue-700 bg-blue-50 border-blue-200` (màu cấm) → thay `brand-*`
- `text-blue-800 font-semibold` → thay `text-brand-primary`

**Thiết kế đề xuất:**

```
Layout: Natural scroll, max-w-4xl mx-auto pb-12

┌──────────────────────────────────────────────────────┐
│  [← Quay lại]  [Lớp: CS101 badge]                   │
│  [Download] Nộp bài: Tên bài tập                    │ ← icon Upload/Download thay 📥
│  ─────────────────────────────────────────────────── │
│  [Countdown timer card] — dynamic màu theo urgency  │
│  ─────────────────────────────────────────────────── │
│  [Mô tả & Yêu cầu card]  ← [FileText icon]         │
│  [Rubric Criteria grid]                              │
│  ─────────────────────────────────────────────────── │
│  ┌────────────────────┐  ┌────────────────────────┐  │
│  │  Upload Form       │  │  Version History       │  │
│  │  [Upload icon]     │  │  [History icon]        │  │
│  │  Kéo thả file vào │  │  v3 - 02/09 09:30     │  │
│  │  ────────────────  │  │  v2 - 01/09 21:15     │  │
│  │  [Chọn file]       │  │  v1 - 01/09 14:00     │  │
│  └────────────────────┘  └────────────────────────┘  │
│  [Feedback Panel] — kết quả chấm chéo               │
└──────────────────────────────────────────────────────┘
```

**Deadline Countdown card:**
```tsx
{/* OPEN: xanh lam nhạt */}
<div className="bg-brand-soft-bg border border-brand-primary/20 rounded-2xl p-4 flex items-center gap-3">
  <Clock className="w-5 h-5 text-brand-primary" />
  <span className="text-sm font-bold text-brand-primary">Còn 5 ngày 3 giờ</span>
</div>

{/* URGENT (≤ 3 ngày): vàng */}
<div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 ...">
  <AlertTriangle ... />
</div>

{/* EXPIRED: đỏ */}
<div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 ...">
  <XCircle ... />
</div>
```

---

### 12. Chấm chéo — Inbox (`/student/reviews`) — 🔴 Cần redesign bắt buộc

**Hiện trạng vấn đề:**
- `indigo-50 border-indigo-100` (màu BỊ CẤM) ở double-blind notice
- `📝` emoji ở h1
- `🛡️` emoji ở notice
- `📭` emoji ở empty state
- `⚠️` emoji ở error state
- Back link dùng `focus:ring-indigo-500` (màu cấm)

**Thiết kế đề xuất:**

```
Layout: Full-viewport flex-col

┌──────────────────────────────────────────────────────┐
│  [← Quay lại]                                       │
│  [PenLine] Bài chấm chéo cần làm     [Tab filters]  │
│                                                      │
│  ┌── 🛡 Double-Blind Notice (quan trọng!) ──────┐    │
│  │  Shield icon  |  Danh tính được bảo mật...   │    │ ← KHÔNG dùng indigo
│  └───────────────────────────────────────────────┘    │
│  (bg-slate-50, border-slate-200, text-slate-700)     │
├──────────────────────────────────────────────────────┤
│  Grid 2 cols (flex-1, overflow-y-auto)              │
│  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │ Review Card #1      │  │ Review Card #2      │   │
│  │ Mã: Bài chấm #A7K2  │  │ Mã: Bài chấm #Q8M4  │   │ ← Dùng mã random/opaque (KHÔNG dùng ID Database)
│  │ Bài tập: Lập trình C│  │ Bài tập: ...        │   │
│  │ [PENDING] tag       │  │ [COMPLETED] tag     │   │
│  │ [Bắt đầu chấm →]    │  │ [Xem lại ↗]         │   │
│  └─────────────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Double-Blind Notice — KHÔNG dùng indigo:**
```tsx
<div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
  <Shield className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
  <p className="text-xs text-slate-600 leading-relaxed">{anonymousNotice}</p>
</div>
```

---

### 13. Chấm chéo — Viết nhận xét (`/student/reviews/:id`) — Form-cuộn

**Thiết kế đề xuất (Responsive):**
```
Desktop:
┌───────────────────────┬──────────────────────────────┐
│  LEFT (50%): Bài nộp  │  RIGHT (50%): Form chấm điểm │
│  (iframe / viewer)    │  Rubric criteria + scores    │
│                       │  [Submit chấm]               │
└───────────────────────┴──────────────────────────────┘

Tablet: LEFT (40%) | RIGHT (60%)

Mobile:
┌──────────────────────────────┐
│  TOP: Bài nộp (scrollable)   │
├──────────────────────────────┤
│  BOTTOM: Form chấm điểm      │
└──────────────────────────────┘
```

---

## 👨‍💼 Nhóm ADMIN (đã hoàn tất Phase 1)

### 14. Admin Dashboard — ✅ Đạt
### 15. Quản lý Người dùng — ✅ Đạt (sticky header, semantic role colors)
### 16. Cài đặt hệ thống — ✅ Đạt (form-cuộn tự nhiên)
### 17. Nhật ký hệ thống — ✅ Đạt (viewport cuộn nội bộ)

---

## 🔗 Trang dùng chung

### 18. Profile (`/profile`) — Form-cuộn

**Thiết kế đề xuất:**
```
Layout: Natural scroll, max-w-2xl mx-auto

┌──────────────────────────────────────────┐
│  Avatar to (80px) + Tên + Role badge     │
│  ─────────────────────────────────────── │
│  Form 1: Thông tin cá nhân              │
│  · Họ và tên                             │
│  · MSSV / Email (read-only)             │
│  · Avatar URL                            │
│  [Cập nhật thông tin]                   │
│  ─────────────────────────────────────── │
│  Form 2: Đổi mật khẩu                  │
│  · Mật khẩu hiện tại                    │
│  · Mật khẩu mới                         │
│  · Xác nhận mật khẩu mới               │
│  [Đổi mật khẩu]                         │
└──────────────────────────────────────────┘
```

---

## ✅ Checklist Thành phần UI Cần Chuẩn hóa Toàn cục

| Component | Vấn đề hiện tại | Fix |
|---|---|---|
| Loading state | `<div>Loading...</div>` ở nhiều trang | Thay `<SkeletonCard />` hoặc `<Skeleton className="..." />` |
| Error state | Text thuần hoặc plain div | Dùng `<EmptyState type="error" />` nhất quán |
| `window.confirm()` | TeacherClassesPage, nhiều chỗ | Thay bằng `<ConfirmDialog />` từ UI library |
| Ngôn ngữ | Tiếng Anh còn rải rác (Classes, Delete, Name, Email...) | Việt hóa 100% |
| `focus:ring-blue-500` | Topbar, ReviewInboxScreen, form inputs | → `focus:ring-brand-primary` |
| `border-gray-200` header | Nhiều trang cũ | → `border-slate-100` |
| `rounded-lg` card | TeacherClassesPage, TeacherClassDetailPage | → `rounded-2xl` |
| `shadow` / `shadow-md` | Trang cũ | → `shadow-sm` |

---

## 🎯 Thứ tự Ưu tiên Triển khai

```
🔴 NGAY: TeacherClassesPage + TeacherClassDetailPage
          (chênh lệch tệ nhất, tiếng Anh, style cũ hoàn toàn)

🔴 NGAY: ReviewInboxScreen
          (dùng màu BỊ CẤM indigo-* + emoji nhiều nhất)

🟡 SAU:  StudentDashboardPage emoji cleanup (⚠️ 🚀 🟡 🔒)

🟡 SAU:  StudentSubmissionPage icon/color fix

🟢 CUỐI: TeacherAnalyticsDashboardPage (đã sửa 1 phần)

🟢 CUỐI: Profile page (ít được thấy, ít ảnh hưởng nhất)
```
