Bạn là Senior Frontend Engineer chuyên React + TypeScript + TailwindCSS.

Dự án: PeerReview-AI
Route đang cần sửa:

/admin/users

Tôi đã cung cấp screenshot thực tế của giao diện hiện tại. Hãy phân tích screenshot + source code hiện tại và thực hiện UI/UX fix trực tiếp trên frontend.

==================================================
1. MỤC TIÊU
==================================================

Fix toàn bộ vấn đề layout của Admin Users Page.

Mục tiêu quan trọng nhất:

1. Không được xuất hiện horizontal scrollbar của TOÀN BỘ PAGE.
2. Nội dung phải fit đúng viewport desktop.
3. Nếu bảng quá rộng, scrollbar ngang chỉ được nằm TRONG vùng table.
4. Sidebar + Topbar phải cố định, không bị kéo theo table.
5. Không làm thay đổi API, database hoặc business logic.
6. Không phá vỡ responsive layout hiện tại.
7. Giữ nguyên chức năng tìm kiếm, filter, edit role/status và các action hiện có.

==================================================
2. VẤN ĐỀ HIỆN TẠI
==================================================

Screenshot hiện tại cho thấy:

- Page xuất hiện horizontal scrollbar ở đáy browser.
- Bảng Users có width lớn hơn viewport.
- Cột Action bên phải bị cắt.
- Main content có khả năng đang bị child element/table ép width.
- Layout shell chưa xử lý tốt `min-width: 0`.
- Sidebar chiếm width cố định nhưng main content không co đúng.
- User info đang nằm ở Topbar.
- Sidebar footer vẫn hiển thị:
  "Hệ thống ổn định"
  "Phiên bản 2.0.0"

Cần sửa các vấn đề trên.

==================================================
3. LAYOUT SHELL — BẮT BUỘC
==================================================

Đảm bảo root application shell có pattern tương tự:

h-screen flex overflow-hidden

Ví dụ:

<div className="h-screen flex overflow-hidden">
  <Sidebar />
  <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
    <Topbar />
    <main className="flex-1 min-h-0 min-w-0 overflow-hidden">
      ...
    </main>
  </div>
</div>

QUAN TRỌNG:

- Main content phải có `min-w-0`.
- Content wrapper phải có `min-w-0`.
- Không để table hoặc card làm tăng width của toàn page.
- Không dùng `overflow-x-auto` ở `<body>`, root page hoặc toàn bộ application shell để che lỗi layout.

==================================================
4. ADMIN USERS PAGE
==================================================

Route:

/admin/users

Giữ cấu trúc:

Header
↓
Search + Filter
↓
Users Table

Nhưng phải đảm bảo:

- Page không horizontal overflow.
- Table nằm trong một container riêng.
- Nếu table thực sự cần scroll ngang, scrollbar chỉ xuất hiện ở table container.

Pattern đề xuất:

<div className="flex-1 min-h-0 min-w-0 overflow-hidden">
  <div className="h-full min-w-0 overflow-auto">
    <table className="w-full min-w-[...]">
      ...
    </table>
  </div>
</div>

Không được để:

<body>
  horizontal scroll
</body>

==================================================
5. TABLE RESPONSIVE
==================================================

Tối ưu table để ưu tiên fit màn hình desktop.

Các cột hiện tại:

- Họ và tên
- Email
- Vai trò
- Trạng thái
- Ngày tham gia
- Actions

Không để Action column bị cắt.

Ưu tiên:

- Name: width hợp lý
- Email: flex/width lớn nhất
- Role: vừa đủ
- Status: vừa đủ
- Date: vừa đủ
- Actions: fixed/min-width, không wrap

Ví dụ:

Action column:

whitespace-nowrap

Các thông tin quan trọng không được bị clipping.

Nếu viewport nhỏ:

- Table container được phép scroll ngang.
- Nhưng scrollbar phải nằm trong table container.
- Browser viewport tuyệt đối không được xuất hiện horizontal scrollbar.

==================================================
6. HEADER
==================================================

Giữ:

"Quản lý Người Dùng & Phân Quyền"

Subtitle:

"Danh sách tài khoản, cập nhật vai trò (Role) và quản lý trạng thái tài khoản"

Header nên:

- bg-white
- rounded-2xl
- border border-slate-100
- shadow-sm
- padding p-5/p-6
- icon Lucide phù hợp nếu component chưa có icon.

Không dùng:

- rounded-lg cho card chính
- shadow-md
- border-gray-200

==================================================
7. SEARCH + FILTER
==================================================

Search và Role Filter phải nằm trong cùng một toolbar.

Desktop:

[ Search ................................ ]    [Tất cả Vai trò]

Không để search/filter làm tăng width page.

Wrapper:

flex
items-center
justify-between
gap-4
min-w-0

Search:

flex-1
min-w-0
max-w-xl

Filter:

shrink-0

Mobile/tablet:

có thể chuyển thành:

Search
Filter

2 dòng.

==================================================
8. SIDEBAR
==================================================

Giữ Sidebar full height.

Active menu:

Users

Sử dụng:

bg-brand-soft-bg
text-brand-primary

Không dùng:

indigo-*
violet-*
blue-600
blue-700
blue-800

Sidebar phải có:

- Logo
- PeerReview AI
- Admin role badge
- Navigation
- User info ở footer

==================================================
9. USER INFO — CHUYỂN KHỎI TOPBAR
==================================================

Theo Design Guide:

Không để user info lớn ở bên phải Topbar.

Hiện tại Topbar đang có:

Admin User
ADMIN
Avatar
Logout

Hãy chuyển phần:

- Avatar
- Admin User
- ADMIN / role

xuống Sidebar footer.

Sidebar footer nên có User Info Card:

[avatar] Admin User
        Admin

Có hover state.

Ví dụ:

<div className="shrink-0 p-3 border-t border-slate-100">
  ...
</div>

Không cần hiển thị:

"Hệ thống ổn định"
"Phiên bản 2.0.0"

trong footer nếu User Info đã thay thế vị trí đó.

==================================================
10. TOPBAR
==================================================

Sau khi chuyển user info xuống Sidebar:

Topbar bên phải chỉ giữ các action nhỏ cần thiết.

Ví dụ:

[Notification] [Logout]

Nếu Notification chưa được implement thì KHÔNG render icon giả/future.

Logout có thể dùng ghost button.

Không để Topbar bị chiếm quá nhiều diện tích.

==================================================
11. DESIGN SYSTEM
==================================================

Tuân thủ Design Guide hiện tại.

Colors:

Brand primary:
#0B57D0

Brand soft:
#E8F0FE

Success:
emerald

Warning:
amber

Danger:
rose

Neutral:
slate

TUYỆT ĐỐI KHÔNG dùng:

indigo-*
violet-*
blue-600
blue-700
blue-800

Thay:

focus:ring-blue-500

bằng:

focus:ring-brand-primary

Hoặc token tương đương hiện đang được project sử dụng.

==================================================
12. CARD STYLE
==================================================

Card chính:

rounded-2xl
border border-slate-100
shadow-sm

Không dùng:

rounded-lg
shadow
shadow-md

Nếu project đã có component Card dùng chung thì ưu tiên sử dụng component đó.

==================================================
13. TYPOGRAPHY
==================================================

Font:

Inter

Heading:

font-bold / font-extrabold

Body:

text-sm

Label:

text-xs font-bold uppercase tracking-wider

Không thay đổi typography toàn project nếu không cần thiết.

==================================================
14. ICON
==================================================

Không dùng emoji.

Ưu tiên Lucide React.

Ví dụ:

Users
ShieldCheck
Search
Filter
Pencil
MoreHorizontal
LogOut
Settings
LayoutDashboard
FileText
ScrollText

Nếu project đã có icon tương ứng thì reuse.

==================================================
15. LOADING / ERROR / EMPTY
==================================================

Không dùng:

Loading...
Something went wrong

plain text đơn giản.

Tuân thủ component UI hiện có:

Skeleton
EmptyState
ErrorState / EmptyState error
ConfirmDialog

Không thay đổi data fetching logic.

==================================================
16. DELETE / DESTRUCTIVE ACTION
==================================================

Nếu page hiện có:

window.confirm()

thì thay bằng ConfirmDialog component hiện có trong project.

Không sử dụng browser native confirmation dialog.

Dialog phải có:

- title
- description
- Cancel
- Confirm
- loading state
- prevent double submit

==================================================
17. QUAN TRỌNG — KHÔNG SỬA BUSINESS LOGIC
==================================================

KHÔNG được:

- thay đổi API endpoint
- thay đổi request/response
- thay đổi database
- thay đổi authentication
- thay đổi authorization
- thay đổi role logic
- thay đổi pagination logic nếu backend đã có
- thay đổi search/filter behavior
- tạo mock data mới nếu không cần

Chỉ refactor UI/layout/CSS/component structure khi cần thiết.

==================================================
18. KHÔNG OVER-ENGINEER
==================================================

Đây là MVP/Pilot của PeerReview-AI cho khoảng 500–1.000 users.

Không thêm:

- virtualization nếu chưa cần
- complex table library nếu project chưa sử dụng
- infinite scroll mới
- advanced animation
- unnecessary state management
- unnecessary dependencies

Ưu tiên:

CSS/Tailwind
existing components
existing hooks
existing architecture

==================================================
19. RESPONSIVE
==================================================

Kiểm tra ít nhất:

Desktop:
1440px+
1280px

Tablet:
1024px
768px

Mobile:
390px
375px

Yêu cầu:

- Không horizontal overflow toàn page.
- Sidebar responsive theo implementation hiện tại.
- Table scroll nội bộ nếu cần.
- Search/filter stack trên màn hình nhỏ.
- Action buttons không bị cắt.
- Text không overflow bất thường.

==================================================
20. ACCEPTANCE CRITERIA
==================================================

Sau khi sửa phải đảm bảo:

[ ] Không còn horizontal scrollbar ở browser viewport.

[ ] Nếu table quá rộng, scrollbar chỉ nằm trong table container.

[ ] Sidebar không bị kéo ngang.

[ ] Topbar không bị kéo ngang.

[ ] Main content có min-w-0.

[ ] Admin Users table không bị cắt cột Action.

[ ] Search + Filter không gây overflow.

[ ] Sidebar footer hiển thị User Info.

[ ] Topbar không còn User Info lớn.

[ ] Không dùng indigo-*.

[ ] Không dùng violet-*.

[ ] Không dùng blue-600/700/800.

[ ] Không còn emoji trong UI.

[ ] Card sử dụng rounded-2xl + shadow-sm.

[ ] Loading/Error/Empty state sử dụng component chuẩn.

[ ] Không thay đổi backend/business logic.

[ ] Existing functionality vẫn hoạt động.

[ ] npm run build PASS.

==================================================
21. CÁCH THỰC HIỆN
==================================================

Trước tiên:

1. Tìm component/page của:
   /admin/users

2. Tìm Layout/Shell:
   Sidebar
   Topbar
   AdminLayout hoặc AppLayout

3. Xác định element nào đang gây horizontal overflow.

4. Kiểm tra:
   - width
   - min-width
   - flex
   - overflow
   - table width
   - sidebar width
   - main content min-w-0

5. Sau đó mới chỉnh sửa.

Không rewrite toàn bộ page nếu chỉ cần sửa layout.

Sau khi sửa:

- chạy build
- kiểm tra TypeScript
- kiểm tra console error
- kiểm tra responsive
- kiểm tra horizontal overflow
- kiểm tra tất cả existing actions.

==================================================
22. OUTPUT SAU KHI HOÀN THÀNH
==================================================

Báo cáo ngắn:

### Files đã thay đổi
- ...

### UI đã sửa
- ...
- ...
- ...

### Root cause của horizontal overflow
- ...

### Responsive
- Desktop: PASS/FAIL
- Tablet: PASS/FAIL
- Mobile: PASS/FAIL

### Build
- npm run build: PASS/FAIL

### Business logic
- Không thay đổi API/backend/business logic.

Nếu phát hiện vấn đề ngoài phạm vi UI cần thay đổi backend hoặc architecture thì KHÔNG tự ý sửa.
Hãy báo rõ vấn đề và dừng tại đó.