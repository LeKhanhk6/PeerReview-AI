# 📋 CHECKLIST AUDIT UI — PEERREVIEW-AI

### QUY TẮC 3: CƠ CHẾ ĐIỀU HƯỚNG DANH SÁCH (ĐỘC QUYỀN)
- **Pagination làm chủ**: Bỏ khung cuộn nội bộ. List render đầy đủ các item của trang hiện tại (page size hợp lý, e.g. 15), trang tự cuộn nếu cần.
- **Scroll làm chủ**: Bỏ pagination, cuộn nội bộ vô hạn (infinite scroll).
- **KHÔNG KẾT HỢP CẢ HAI**. Nếu có pagination, ẩn pagination khi tổng số trang ≤ 1.

### PHẠM VI SCREEN CẦN AUDIT UI — PEERREVIEW-AI
*Cách dùng: Cập nhật trạng thái + điền Evidence sau mỗi nhóm. Tick chỉ khi đủ ảnh + grep + build pass.*

## NHÓM 0 — ĐÃ ĐẠT (không audit lại, chỉ giữ làm template)
| # | Màn hình | Route | Role | Layout chuẩn áp dụng | Trạng thái | Evidence |
|---|---|---|---|---|---|---|
| 1 | Login | `/login` | Chung | Form-cuộn | ✅ Đạt (mockup mới) | — |
| 2 | Register | `/register` | Chung | Form-cuộn | ✅ Đạt (mockup mới) | — |
| 3 | Teacher Dashboard | `/teacher/dashboard` | TEACHER | Layout tùy nội dung | ✅ Đạt (lần 3, chờ ảnh chốt) | Commit df00072 + polish pass |
| 4 | Student Dashboard | `/student/dashboard` | STUDENT | Layout tùy nội dung | ⚠️ Đạt logic — chờ screenshot | Commit fix Phương án A |

## NHÓM 1 — ADMIN PAGES (Audit trước)
| # | Màn hình | Route | Layout | Trạng thái | Evidence (grep/build/📸) |
|---|---|---|---|---|---|
| 5 | Admin Dashboard | `/admin/dashboard` | Layout tùy nội dung | ✅ Đạt | 📸 Ảnh + Grep/Build Pass |
| 6 | Quản lý Người dùng | `/admin/users` | Page-level scroll | ✅ Đạt | 📸 Ảnh + Grep/Build Pass |
| 7 | Cài đặt hệ thống | `/admin/settings` | Form-cuộn | ✅ Đạt | 📸 Ảnh + Grep/Build Pass |
| 8 | Nhật ký hệ thống | `/admin/audit-logs` | Page-level scroll | ✅ Đạt | 📸 Ảnh + Grep/Build Pass |

## NHÓM 2 — TEACHER PAGES CÒN LẠI
| # | Màn hình | Route | Layout | Trạng thái | Evidence |
|---|---|---|---|---|---|
| 9 | Danh sách lớp học | `/teacher/classes` | Page-level scroll | ⏳ Chưa | |
| 10 | Chi tiết lớp | `/teacher/classes/:id` | Page-level scroll | ⏳ Chưa | |
| 11 | Danh sách bài tập | `/teacher/assignments` | Page-level scroll | ⏳ Chưa | |
| 12 | Tạo/Sửa bài tập | `/teacher/assignments/new` | Form-cuộn | ⏳ Chưa | |
| 13 | Theo dõi bài nộp | `/teacher/assignments/:assignmentId/submissions` | Page-level scroll | ⏳ Chưa | |
| 14 | Tổng hợp AI | `/teacher/assignments/:assignmentId/synthesis` | Page-level scroll | ⏳ Chưa | |
| 15 | Phân tích & Cảnh báo | `/teacher/analytics` | Form-cuộn (trang dài) | ⏳ Chưa | ⚠️ Đã sửa màu cấm 1 phần |

## NHÓM 3 — STUDENT PAGES CÒN LẠI
| # | Màn hình | Route | Layout | Trạng thái | Evidence |
|---|---|---|---|---|---|
| 16 | Danh sách lớp học | `/student/classes` | Page-level scroll | ⏳ Chưa | |
| 17 | Nộp bài | `/student/assignments/:id/submit` | Form-cuộn | ⏳ Chưa | |
| 18 | Chấm chéo (Inbox) | `/student/reviews` | Page-level scroll | ⏳ Chưa | ⚠️ Trang Double-Blind — KHÔNG hiển thị tên/MSSV |
| 19 | Chấm chéo (Viết) | `/student/reviews/:id` | Form-cuộn | ⏳ Chưa | |

**Double-Blind Audit Checklist (Dành cho Student Review Pages):**
- [ ] KHÔNG hiển thị tên sinh viên
- [ ] KHÔNG hiển thị MSSV / Email / Tên lớp / Tên nhóm / Avatar
- [ ] File metadata / URL / API response không làm lộ danh tính người nộp bài
- [ ] KHÔNG hiển thị ID database cho bài chấm ẩn danh (Dùng mã opaque như `Bài chấm #A7K2`).

## NHÓM 4 — PIPELINE RIÊNG (KHÔNG audit theo prompt tổng)
| # | Màn hình | Route | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 20 | Student Group Workspace | `/student/groups/:groupId/workspace` | 🔄 Task 01 done | Theo `student-group-workspace.md`, DoD riêng. |

## NHÓM 5 — TRANG DÙNG CHUNG (Bonus)
| Màn hình | Trạng thái | Ghi chú |
|---|---|---|
| Profile (`/profile`) | ⏳ Chưa | Form-cuộn |
| 404 NotFound | ⏳ Chưa | Token nhẹ nhàng |
| Sidebar/TopBar | ✅ Đạt | Đã có brand + footer + active state |

---
## TIẾN ĐỘ TỔNG QUAN
- **NHÓM 1 (Admin):**    `[██████████]` 4/4
- **NHÓM 2 (Teacher):**  `[░░░░░░░░░░]` 0/7 (1/7 đã sửa màu cấm 1 phần)
- **NHÓM 3 (Student):**  `[░░░░░░░░░░]` 0/4
- **NHÓM 4 (Pipeline):** `[███░░░░░░░]` 1/4 tasks
- **TỔNG:**              `████░░░░░░░░` ~35% (7/20 màn + pipeline)
