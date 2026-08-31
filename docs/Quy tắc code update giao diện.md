# 🎨 TASK: CHUYỂN ĐỔI SCREEN DESIGN → CODE PHÙ HỢP DỰ ÁN PEER-REVIEW

## VAI TRÒ
Bạn là Senior Frontend Engineer của dự án Peer-Review (chấm chéo ẩn danh + AI Synthesis).
Nhiệm vụ: phân tích ảnh screen design đính kèm, THIẾT KẾ LẠI phù hợp với dự án hiện tại
(không copy nguyên xi), rồi viết kế hoạch vào 1 file markdown chia task nhỏ, sau đó
triển khai TỪNG TASK một — mỗi task xong phải có evidence và chờ xác nhận mới sang task kế.

## NGUYÊN TẮC THIẾT KẾ LẠI (bắt buộc, ưu tiên hơn design gốc)
1. DESIGN TOKENS — chỉ dùng token đã chốt trong tailwind.config.js:
   Primary indigo-600 (#2563EB) · nền slate-50 · card trắng rounded-xl border-slate-100 ·
   Semantic badges: emerald (success/đã nộp) · amber (warning/chờ) · rose (danger/trễ) ·
   slate (neutral). KHÔNG tự chế màu mới từ ảnh. Contrast phải đạt WCAG AA ≥ 4.5:1.
2. DATA THẬT TRƯỚC — với mỗi vùng dữ liệu trong ảnh, phải map đúng endpoint BE có sẵn.
   Nếu BE chưa có endpoint/field nào → đánh dấu [BE-GAP] trong kế hoạch và thay bằng
   dữ liệu có sẵn (hoặc để Post-MVP). TUYỆT ĐỐI không code UI gọi API không tồn tại.
3. TRẠNG THÁI BIÊN — mọi màn hình phải xử lý đủ 3 states: Loading Skeleton ·
   Empty State (copy i18n) · Live Data. Cộng thêm trạng thái nghiệp vụ đặc thù nếu có
   (ví dụ: SV chưa có nhóm → disabled + tooltip, không được để bấm rồi fail).
4. COPY 100% trong file messages (constants/i18n) — không hard-code string nào trong component.
5. BỎ phần không thuộc MVP: phản biện nhiều vòng · config API Key/LMS trên UI ·
   công thức điểm % phức tạp — nếu ảnh có các phần này → liệt kê vào "Out-of-Scope" kèm lý do.
6. UTIL DÙNG CHUNG: countdown dùng calculateDaysLeftStatus (date.utils.ts) ·
   format % dùng util chung — không viết lại logic đã có.
7. ĐIỀU HƯỚNG: nút trên màn phải link được đến route thật đã tồn tại — không để nút chết.

## QUY TRÌNH THỰC HIỆN (2 bước)

### BƯỚC 1 — Tạo file `design-tasks/<screen-name>.md` gồm:
| Mục | Nội dung |
|---|---|
| **Phân tích ảnh** | Vùng nào giữ nguyên, vùng nào thiết kế lại + lý do (map token/dữ liệu thật) |
| **Mapping dữ liệu** | Bảng: vùng UI → endpoint BE → shape dữ liệu (hoặc [BE-GAP]) |
| **Out-of-Scope** | Phần trong ảnh bị bỏ, kèm lý do |
| **Danh sách task** | Chia nhỏ: mỗi task = 1 khối UI hoặc 1 nhóm thay đổi, đánh thứ tự 01, 02... |
| **Files tạo/sửa** | Liệt kê cho từng task |
| **DoD từng task** | tsc 0 lỗi · build pass · copy 100% messages · đủ 3 states |
| **DoD tổng** | Screenshot side-by-side (design vs app) · MSW handlers mới (nếu có) · E2E luồng chính |
| **Trạng thái** | Checkbox từng task: [ ] → [x] khi xong — cập nhật sau MỖI task |

⏸ DỪNG tại đây — gửi file markdown chờ tôi duyệt trước khi code.

### BƯỚC 2 — Sau khi được duyệt, triển khai TỪNG TASK:
- Mỗi task: 1 commit riêng, convention `feat(<scope>): <mô tả ngắn>`
- Cuối mỗi task: báo cáo ngắn (files changed + evidence + checkbox chuyển [x])
  → CHỜ XÁC NHẬN trước khi sang task kế
- Nếu phát hiện BE-GAP khi code → DỪNG, báo cáo, đề xuất phương án — không tự xử tùy tiện

## NGỮ CẢNH DỰ ÁN (dùng khi thiết kế lại)
- Stack: React + TypeScript + Vite · Tailwind CSS · Zustand · React Router · MSW · Playwright
- Roles: STUDENT / TEACHER / ADMIN — route có layout riêng cho từng role
- Màn Student Dashboard đã có: 3 stats cards + assignments (badge 3 màu + countdown)
  + Group Workspace Widget (dual-state hasGroup) — màn mới phải đồng bộ phong cách
- Luồng nghiệp vụ nhạy cảm: SV chưa có nhóm (nộp bài disabled + tooltip),
  SV thuộc nhiều nhóm (map theo group_id từng bài tập — không dùng groups[0] ngầm)
- Route đích thường dùng: /student/dashboard · /teacher/assignments/:id/submissions ·
  /teacher/assignments/:id/synthesis · /profile

## ẢNH SCREEN DESIGN
[Dán ảnh screen design vào đây]

## THÔNG TIN BỔ SUNG (điền trước khi chạy)
- Màn đích: <tên màn + route sẽ gắn>
- Ảnh design là: [x] tham khảo ý tưởng (được tự do điều chỉnh) / [ ] bắt buộc bám sát
- Endpoint BE sẵn có liên quan: <liệt kê, nếu biết>
