# PEERREVIEW-AI — SYSTEM WALKTHROUGH & RULE CONVENTIONS

## 1. Submissions & Late Rule Convention (Quy Ước Nộp Bài & Trạng Thái LATE)

### Single Source of Truth for Submission Status:
- **Thời điểm xác định đúng/trễ hạn**: Trạng thái `LATE` được tính toán trực tiếp tại Backend Service Layer dựa trên mốc thời gian **nộp bài lần đầu tiên** (`initial_submitted_at` trong bảng `submissions`) so sánh với thời hạn của bài tập (`assignment.deadline`).
- **Quy tắc nộp lại (Resubmission Rule)**:
  > *"Phiên nộp đầu tiên quyết định trạng thái Đúng hạn (SUBMITTED) hoặc Trễ hạn (LATE). Nếu bài nộp đầu tiên diễn ra sau deadline (`initial_submitted_at > deadline`), toàn bộ quá trình nộp sau đó giữ trạng thái LATE. Các lần nộp lại về sau (resubmissions) cập nhật phiên bản file nộp mới nhất nhưng không thể thay đổi hay sửa lại trạng thái quá khứ."*
- **Kiến trúc dữ liệu & Query**:
  - Endpoint `GET /api/submissions/assignments/:assignmentId/monitor` sử dụng `LEFT JOIN LATERAL` lấy phiên bản file nộp mới nhất mà không gây ra lỗi N+1 query.
  - Phân quyền: Đảm bảo chỉ `TEACHER` quản lý lớp học đó và `ADMIN` mới có quyền xem màn hình Theo dõi bài nộp (trả `403 Forbidden` nếu là Giảng viên lớp khác).

---

## 2. User Profile & Security Rule Conventions (Quy Ước Hồ Sơ & Bảo Mật)

### Multi-device Session Revocation & Password Updates:
- **Cập nhật thông tin (`PATCH /api/auth/profile`)**:
  - Chỉ cho phép sửa danh sách whitelist (`full_name`, `avatar_url`).
  - Validation `avatar_url`: Bắt buộc giao thức `https://` và tối đa 500 ký tự.
  - Nghiêm cấm thay đổi `email`, `role` hoặc `student_id` qua API profile.
- **Đổi mật khẩu (`POST /api/auth/change-password`)**:
  - Bắt buộc kiểm tra `current_password` bằng `bcrypt.compare`.
  - Mật khẩu sai -> Trả về lỗi `401 Unauthorized` với message cụ thể (`Mật khẩu hiện tại không đúng`).
  - Mật khẩu mới -> Tối thiểu 8 ký tự, băm bcrypt trước khi lưu DB.
  - Sau khi đổi thành công -> Ghi nhật ký vết hoạt động (Audit log) và đăng xuất khỏi ứng dụng để yêu cầu đăng nhập lại với mật khẩu mới.
