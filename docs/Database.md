## Code SQL
```
-- ==============================================================================
-- KHỞI TẠO EXTENSION
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. NHÓM TÀI KHOẢN VÀ PHÂN QUYỀN (Users & Roles)
-- ==============================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- Ví dụ: STUDENT, TEACHER, ADMIN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    student_id VARCHAR(50) UNIQUE, -- Chỉ dành cho Student
    password_hash VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 2. NHÓM LỚP HỌC VÀ MÔN HỌC (Courses & Classes)
-- ==============================================================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    semester VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. NHÓM BÀI TẬP VÀ TIÊU CHÍ CHẤM (Assignments & Rubrics)
-- ==============================================================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID UNIQUE REFERENCES assignments(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE assignment_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rubric_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight DECIMAL(5,2) NOT NULL, -- Trọng số (%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 4. NHÓM HOẠT ĐỘNG NHÓM (Groups, Members, Activities & Contributions)
-- ==============================================================================

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_leader BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);


CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- VD: CREATE, EDIT, COMMENT, SUBMIT
    target_id VARCHAR(255), -- ID đối tượng (VD: submissionId, reviewId) hoặc '{actionType}_time' để tránh NULL
    metadata JSONB, -- Context thêm (VD: {isLate, version})
    content_summary TEXT,
    event_version INT DEFAULT 1, -- Đánh dấu schema version của event
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- activity logs
CREATE INDEX idx_activity_logs_group_created ON activity_logs(group_id, created_at DESC);
CREATE INDEX idx_activity_group_user ON activity_logs(group_id, user_id);
CREATE INDEX idx_activity_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_group_time ON activity_logs(group_id, created_at);
CREATE INDEX idx_activity_group_action_time ON activity_logs(group_id, action_type, created_at);

-- tasks
CREATE INDEX idx_tasks_group_created ON tasks(group_id, created_at DESC);

-- discussions
CREATE INDEX idx_discussions_group_created ON group_discussions(group_id, created_at);

-- files
CREATE INDEX idx_files_group_created ON group_files(group_id, created_at DESC);

CREATE TABLE contribution_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contribution_score DECIMAL(5,2), -- % Đóng góp
    classification VARCHAR(50), -- VD: High Contributor, Potential Free-rider
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ==============================================================================
-- BỔ SUNG VÀO NHÓM 4: HOẠT ĐỘNG NHÓM (Workspace)
-- ==============================================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'TODO', -- TODO, IN_PROGRESS, DONE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE group_discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE group_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. NHÓM NỘP BÀI (Submissions & Versions)
-- ==============================================================================

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE submission_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- submission versions
CREATE INDEX idx_submission_versions_submission_version ON submission_versions(submission_id, version_number DESC);

-- ==============================================================================
-- 6. NHÓM ĐÁNH GIÁ ĐỒNG ĐẲNG (Review Assignment & Reviews)
-- ==============================================================================

CREATE TABLE review_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id, reviewer_group_id)
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_assignment_id UUID UNIQUE REFERENCES review_assignments(id) ON DELETE CASCADE,
    overall_comment TEXT,
    total_score DECIMAL(5,2),
    submitted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE review_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    rubric_criteria_id UUID REFERENCES rubric_criteria(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 7. NHÓM TÍCH HỢP AI (AI Mentor & Summarization)
-- ==============================================================================


CREATE TABLE ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_assignment_id UUID REFERENCES review_assignments(id) ON DELETE CASCADE,
    student_text TEXT NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ai_feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_request_id UUID UNIQUE REFERENCES ai_requests(id) ON DELETE CASCADE,
    suggested_text TEXT,
    toxicity_score DECIMAL(5,2),
    constructiveness_score DECIMAL(5,2),
    status VARCHAR(50),
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE review_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
    teacher_approved BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE review_summary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id UUID REFERENCES review_summaries(id) ON DELETE CASCADE,
    topic_category VARCHAR(100) NOT NULL, -- VD: STRENGTHS, WEAKNESSES
    content TEXT NOT NULL,
    frequency_count INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 8. NHÓM CẢNH BÁO VÀ THÔNG BÁO (Early Warnings & Notifications)
-- ==============================================================================

CREATE TABLE early_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Có thể NULL nếu cảnh báo toàn nhóm
    risk_type VARCHAR(100) NOT NULL, -- VD: Low Activity, Unbalanced Contribution
    description TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50), -- VD: SYSTEM, REVIEW_ASSIGNED, WARNING
    related_link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
## 🛠 KHỞI TẠO EXTENSION

SQL

```
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

- **Giải thích:** Lệnh này kích hoạt extension `uuid-ossp` trong PostgreSQL để hỗ trợ hàm `uuid_generate_v4()`. Hàm này dùng để tự động tạo ra các chuỗi mã định danh dạng UUID (Universally Unique Identifier) ngẫu nhiên, giúp tăng tính bảo mật và độc nhất so với việc dùng số thứ tự tự tăng (SERIAL) thông thường.
    

## 1. NHÓM TÀI KHOẢN VÀ PHÂN QUYỀN (Users & Roles)

Nhóm bảng này quản lý danh tính người dùng trong hệ thống và các vai trò phân quyền của họ.

### 🔹 Bảng `roles` (Quản lý các vai trò)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính của bảng, tự động sinh mã UUID.
    
- `name VARCHAR(50) UNIQUE NOT NULL`: Tên vai trò, không được trùng lặp và bắt buộc có. (Ví dụ: `STUDENT`, `TEACHER`, `ADMIN`).
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm bản ghi được tạo.
    

### 🔹 Bảng `users` (Quản lý thông tin người dùng)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính của bảng.
    
- `role_id UUID REFERENCES roles(id) ON DELETE SET NULL`: Khóa ngoại trỏ đến bảng `roles`. Khi một role bị xóa, `role_id` của user sẽ được chuyển thành `NULL` thay vì xóa user.
    
- `full_name VARCHAR(255) NOT NULL`: Họ và tên đầy đủ của người dùng.
    
- `email VARCHAR(255) UNIQUE NOT NULL`: Địa chỉ email đăng nhập, duy nhất và bắt buộc.
    
- `student_id VARCHAR(50) UNIQUE`: Mã số sinh viên, chỉ dành riêng cho sinh viên (`STUDENT`), có thể để trống với giáo viên hoặc admin.
    
- `password_hash VARCHAR(255)`: Mật khẩu đã được mã hóa (băm) để bảo mật.
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tạo tài khoản.
    
- `updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm thông tin tài khoản được cập nhật gần nhất.
    

## 2. NHÓM LỚP HỌC VÀ MÔN HỌC (Courses & Classes)

Quản lý danh mục học phần (khóa học) và các lớp học cụ thể mở theo học kỳ.

### 🔹 Bảng `courses` (Danh mục môn học/khóa học gốc)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `code VARCHAR(50) UNIQUE NOT NULL`: Mã môn học (Ví dụ: `CSC10001`, `INT2204`).
    
- `name VARCHAR(255) NOT NULL`: Tên môn học (Ví dụ: `Cấu trúc dữ liệu và giải thuật`).
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tạo môn học.
    

### 🔹 Bảng `classes` (Các lớp học phần cụ thể)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `course_id UUID REFERENCES courses(id) ON DELETE CASCADE`: Khóa ngoại liên kết với môn học gốc. Nếu môn học bị xóa, các lớp học thuộc môn đó cũng bị xóa theo (`CASCADE`).
    
- `teacher_id UUID REFERENCES users(id) ON DELETE SET NULL`: Giảng viên phụ trách lớp. Nếu tài khoản giảng viên bị xóa, trường này sẽ thành `NULL`.
    
- `name VARCHAR(255) NOT NULL`: Tên lớp học phần (Ví dụ: `Lớp 01 - Nhóm 2`).
    
- `semester VARCHAR(50)`: Học kỳ diễn ra lớp học (Ví dụ: `HK2025-2026`).
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tạo lớp học.
    

## 3. NHÓM BÀI TẬP VÀ TIÊU CHÍ CHẤM (Assignments & Rubrics)

Quản lý bài tập về nhà/đồ án và các tiêu chí đánh giá (Rubric).

### 🔹 Bảng `assignments` (Bài tập/Đồ án)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `class_id UUID REFERENCES classes(id) ON DELETE CASCADE`: Lớp học nhận bài tập này.
    
- `title VARCHAR(255) NOT NULL`: Tiêu đề bài tập.
    
- `description TEXT`: Mô tả chi tiết về bài tập.
    
- `requirements TEXT`: Các yêu cầu kỹ thuật hoặc nội dung cần đạt.
    
- `deadline TIMESTAMP WITH TIME ZONE NOT NULL`: Thời hạn cuối cùng nộp bài (có kèm mốc thời gian và múi giờ).
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tạo bài tập.
    

### 🔹 Bảng `rubrics` (Khung điểm chuẩn cho bài tập)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `assignment_id UUID UNIQUE REFERENCES assignments(id) ON DELETE CASCADE`: Mỗi bài tập chỉ có duy nhất một bảng Rubric (`UNIQUE`). Xóa bài tập sẽ xóa rubric tương ứng.
    
- `description TEXT`: Mô tả tổng quan về khung chấm điểm.
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tạo rubric.
    

### 🔹 Bảng `assignment_attachments` (Tệp đính kèm của bài tập)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE`: File đính kèm thuộc bài tập nào.
    
- `file_name TEXT NOT NULL`: Tên file gốc.
    
- `file_url TEXT NOT NULL`: Đường dẫn tới file.
    
- `file_type VARCHAR(50)`: Loại định dạng file (vd: pdf, docx).
    
- `file_size INT`: Kích thước file (bytes).
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm upload file đính kèm.
    

### 🔹 Bảng `rubric_criteria` (Các tiêu chí chi tiết trong Rubric)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE`: Thuộc về Rubric nào.
    
- `name VARCHAR(255) NOT NULL`: Tên tiêu chí (Ví dụ: `Tính đúng đắn của thuật toán`, `Giao diện UI/UX`).
    
- `description TEXT`: Mô tả chi tiết mức độ đạt được của tiêu chí.
    
- `weight DECIMAL(5,2) NOT NULL`: Trọng số của tiêu chí (tính theo %, ví dụ: `30.00`).
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tạo tiêu chí.
    

## 4. NHÓM HOẠT ĐỘNG NHÓM (Groups, Members, Activities & Contributions)

Quản lý việc chia nhóm sinh viên, nhật ký hoạt động và tính toán mức độ đóng góp cá nhân.

### 🔹 Bảng `groups` (Nhóm sinh viên làm việc chung)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `class_id UUID REFERENCES classes(id) ON DELETE CASCADE`: Nhóm thuộc lớp học nào.
    
- `name VARCHAR(100) NOT NULL`: Tên nhóm (Ví dụ: `Nhóm 01`, `Team Alpha`).
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tạo nhóm.
    

### 🔹 Bảng `group_members` (Thành viên trong nhóm)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `group_id UUID REFERENCES groups(id) ON DELETE CASCADE`: Nhóm liên kết.
    
- `user_id UUID REFERENCES users(id) ON DELETE CASCADE`: Sinh viên tham gia nhóm.
    
- `is_leader BOOLEAN DEFAULT FALSE`: Đánh dấu sinh viên đó có phải là nhóm trưởng hay không (`TRUE`/`FALSE`).
    
- `joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm gia nhập nhóm.
    
- `UNIQUE(group_id, user_id)`: Ràng buộc đảm bảo một sinh viên không thể xuất hiện 2 lần trong cùng một nhóm.
    

### 🔹 Bảng `activity_logs` (Nhật ký hoạt động của thành viên)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `group_id UUID REFERENCES groups(id) ON DELETE CASCADE`: Nhóm diễn ra hoạt động.
    
- `user_id UUID REFERENCES users(id) ON DELETE CASCADE`: Thành viên thực hiện hành động.
    
- `action_type VARCHAR(100) NOT NULL`: Loại hành động (Ví dụ: `CREATE`, `EDIT`, `COMMENT`, `SUBMIT`).

- `target_id VARCHAR(255)`: Định danh đối tượng bị tác động để đếm unique actions (ví dụ: `submission_id`, `review_id`). Tránh NULL bằng cách dùng format `actionType_...`.

- `metadata JSONB`: Lưu trữ context bổ sung cho analytics (Ví dụ: `{"isLate": false, "version": 2}`).
    
- `content_summary TEXT`: Tóm tắt nội dung hành động đã làm.
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời gian diễn ra hoạt động.
    

### 🔹 Bảng `contribution_metrics` (Đánh giá mức độ đóng góp)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `group_id UUID REFERENCES groups(id) ON DELETE CASCADE`: Nhóm được đánh giá.
    
- `user_id UUID REFERENCES users(id) ON DELETE CASCADE`: Thành viên được đánh giá.
    
- `contribution_score DECIMAL(5,2)`: Điểm hoặc phần trăm đóng góp của cá nhân đó (Ví dụ: `25.50`).
    
- `classification VARCHAR(50)`: Phân loại mức độ đóng góp (Ví dụ: `High Contributor` - Đóng góp cao, `Potential Free-rider` - Nguy cơ ăn bám/không làm việc).
    
- `calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm hệ thống tính toán chỉ số này.
    

## 5. NHÓM NỘP BÀI (Submissions & Versions)

Quản lý thông tin nộp bài tập của nhóm và lịch sử các phiên bản tệp nộp.

### 🔹 Bảng `submissions` (Bài nộp chính)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE`: Bài tập nào được nộp.
    
- `group_id UUID REFERENCES groups(id) ON DELETE CASCADE`: Nhóm nào thực hiện nộp bài.
    
- `status VARCHAR(50) DEFAULT 'SUBMITTED'`: Trạng thái bài nộp (Ví dụ: `SUBMITTED`, `LATE`, `GRADED`).
    
- `submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm nộp bài.
    

### 🔹 Bảng `submission_versions` (Lịch sử các phiên bản tệp nộp)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE`: Thuộc bài nộp nào.
    
- `version_number INT NOT NULL`: Số thứ tự phiên bản (Ví dụ: `1`, `2`, `3` khi nhóm nộp lại bài sửa).
    
- `file_url TEXT NOT NULL`: Đường dẫn liên kết (URL) tới tệp tin được lưu trữ trên cloud/server.
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tải lên phiên bản đó.
    

## 6. NHÓM ĐÁNH GIÁ ĐỒNG ĐẲNG (Review Assignment & Reviews)

Quản lý quy trình sinh viên/nhóm chấm bài cho nhau (Peer Review).

### 🔹 Bảng `review_assignments` (Phân công chấm bài)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE`: Bài nộp nào cần được chấm.
    
- `reviewer_group_id UUID REFERENCES groups(id) ON DELETE CASCADE`: Nhóm nào được phân công làm người chấm (`reviewer`).
    
- `status VARCHAR(50) DEFAULT 'PENDING'`: Trạng thái thực hiện chấm (`PENDING` - Chưa chấm, `COMPLETED` - Đã hoàn thành).
    
- `assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm phân công nhiệm vụ chấm bài.
    

### 🔹 Bảng `reviews` (Kết quả đánh giá tổng quan)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `review_assignment_id UUID UNIQUE REFERENCES review_assignments(id) ON DELETE CASCADE`: Liên kết 1-1 với phân công chấm bài.
    
- `overall_comment TEXT`: Nhận xét tổng quan chung cho bài làm.
    
- `total_score DECIMAL(5,2)`: Tổng điểm số của bài đánh giá.
    
- `submitted_at TIMESTAMP WITH TIME ZONE`: Thời điểm bài đánh giá được gửi đi hoàn tất.
    

### 🔹 Bảng `review_criteria` (Điểm chi tiết theo từng tiêu chí Rubric)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `review_id UUID REFERENCES reviews(id) ON DELETE CASCADE`: Thuộc bản đánh giá nào.
    
- `rubric_criteria_id UUID REFERENCES rubric_criteria(id) ON DELETE CASCADE`: Tiêu chí rubric nào đang được dùng để chấm.
    
- `score DECIMAL(5,2) NOT NULL`: Điểm số đạt được cho tiêu chí này.
    
- `comment TEXT`: Lời nhận xét chi tiết riêng cho tiêu chí đó.
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tạo bản ghi điểm tiêu chí.
    

## 7. NHÓM TÍCH HỢP AI (AI Mentor & Summarization)

Quản lý việc tương tác với trợ lý AI để phân tích, hỗ trợ góp ý văn phong (độ độc hại, tính xây dựng) và tổng hợp kết quả đánh giá.

### 🔹 Bảng `ai_requests` (Yêu cầu gửi lên AI)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `review_id UUID REFERENCES reviews(id) ON DELETE CASCADE`: Gắn liền với đánh giá đồng đẳng nào.
    
- `student_text TEXT NOT NULL`: Nội dung nhận xét do sinh viên viết ban đầu cần AI hỗ trợ.
    
- `requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời gian gửi yêu cầu tới AI.
    

### 🔹 Bảng `ai_feedbacks` (Phản hồi từ AI)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `ai_request_id UUID UNIQUE REFERENCES ai_requests(id) ON DELETE CASCADE`: Liên kết 1-1 với yêu cầu AI.
    
- `suggested_text TEXT`: Nội dung văn bản được AI gợi ý viết lại (lịch sự, mang tính xây dựng hơn).
    
- `toxicity_score DECIMAL(5,2)`: Điểm đánh giá mức độ độc hại/gây tổn thương của ngôn từ (`toxicity`).
    
- `constructiveness_score DECIMAL(5,2)`: Điểm đánh giá tính xây dựng của lời nhận xét (`constructiveness`).
    
- `status VARCHAR(50)`: Trạng thái xử lý của AI (Ví dụ: `SUCCESS`, `FAILED`).
    
- `responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm AI trả về kết quả.
    

### 🔹 Bảng `review_summaries` (Tổng hợp kết quả đánh giá cho bài nộp)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `submission_id UUID UNIQUE REFERENCES submissions(id) ON DELETE CASCADE`: Bản tổng hợp dành riêng cho bài nộp nào.
    
- `teacher_approved BOOLEAN DEFAULT FALSE`: Giáo viên đã duyệt bảng tổng hợp này chưa (`TRUE`/`FALSE`).
    
- `generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời gian hệ thống tạo bản tổng hợp.
    

### 🔹 Bảng `review_summary_items` (Các mục chi tiết trong bản tổng hợp)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `summary_id UUID REFERENCES review_summaries(id) ON DELETE CASCADE`: Thuộc bản tổng hợp nào.
    
- `topic_category VARCHAR(100) NOT NULL`: Phân loại chủ đề ý kiến (Ví dụ: `STRENGTHS` - Điểm mạnh, `WEAKNESSES` - Điểm yếu/cần cải thiện).
    
- `content TEXT NOT NULL`: Nội dung tóm tắt ý kiến.
    
- `frequency_count INT DEFAULT 1`: Số lần ý kiến này xuất hiện lặp lại từ nhiều reviewer khác nhau.
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tạo mục tổng hợp.
    

## 8. NHÓM CẢNH BÁO VÀ THÔNG BÁO (Early Warnings & Notifications)

Quản lý việc phát hiện rủi ro học tập/hoạt động nhóm sớm và gửi thông báo đến người dùng.

### 🔹 Bảng `early_warnings` (Cảnh báo sớm rủi ro)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `class_id UUID REFERENCES classes(id) ON DELETE CASCADE`: Lớp học liên quan.
    
- `group_id UUID REFERENCES groups(id) ON DELETE CASCADE`: Nhóm liên quan (nếu có).
    
- `user_id UUID REFERENCES users(id) ON DELETE CASCADE`: Sinh viên bị cảnh báo cá nhân. Có thể để `NULL` nếu đây là cảnh báo áp dụng chung cho toàn nhóm.
    
- `risk_type VARCHAR(100) NOT NULL`: Loại rủi ro (Ví dụ: `Low Activity` - Hoạt động kém, `Unbalanced Contribution` - Đóng góp không đồng đều).
    
- `description TEXT`: Mô tả chi tiết lý do gây ra cảnh báo.
    
- `is_resolved BOOLEAN DEFAULT FALSE`: Trạng thái đã được giải quyết hay chưa (`TRUE`/`FALSE`).
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm hệ thống phát sinh cảnh báo.
    

### 🔹 Bảng `notifications` (Hệ thống thông báo tới người dùng)

- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`: Khóa chính.
    
- `user_id UUID REFERENCES users(id) ON DELETE CASCADE`: Người dùng nhận thông báo.
    
- `title VARCHAR(255) NOT NULL`: Tiêu đề thông báo.
    
- `content TEXT NOT NULL`: Nội dung chi tiết thông báo.
    
- `type VARCHAR(50)`: Loại thông báo (Ví dụ: `SYSTEM` - Hệ thống, `REVIEW_ASSIGNED` - Được phân công chấm bài, `WARNING` - Cảnh báo).
    
- `related_link TEXT`: Đường dẫn (URL) chuyển hướng khi người dùng bấm vào thông báo.
    
- `is_read BOOLEAN DEFAULT FALSE`: Trạng thái đã đọc (`TRUE`) hoặc chưa đọc (`FALSE`).
    
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`: Thời điểm tạo thông báo.