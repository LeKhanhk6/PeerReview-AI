# I. Development Roadmap
```
PHASE 0
Project Setup
        ↓
PHASE 1
Database + Backend Foundation
        ↓
PHASE 2
Authentication + Authorization
        ↓
PHASE 3
Teacher Assignment + Rubric
        ↓
PHASE 4
Group Workspace + Activity Tracking
        ↓
PHASE 5
Student Submission
        ↓
PHASE 6
Double-Blind Peer Assignment
        ↓
PHASE 7
Peer Review
        ↓
PHASE 8
AI Peer-Review Mentor
        ↓
PHASE 9
Contribution Analytics
        ↓
PHASE 10
Review Synthesis
        ↓
PHASE 11
Teacher Analytics + Early Warning
        ↓
PHASE 12
Integration + Testing
        ↓
PHASE 13
Deploy + Documentation
```
# 1. PHASE 0 — Project Setup

## TASK 01.1 — GitHub Repository

- [x]  Create Repository.
- [ ]  README.
- [x]  `.gitignore`.
- [x]  Branch strategy.
- [x]  Commit convention.

## TASK 01.2 — Frontend

- [x]  React + Vite.
- [x]  React Router.
- [x]  Axios.
- [x]  TailwindCSS.
- [x]  Folder structure.
- [x]  Common components.

## TASK 01.3 — Backend

- [x]  Node.js.
- [x]  Express.
- [x]  dotenv.
- [x]  CORS.
- [x]  JWT.
- [x]  API structure.
- [x]  `.env`.

## TASK 01.4 — AI Service

- [x]  Define AI API contract.
- [x]  Define Request schema.
- [x]  Define Response schema.
- [x]  Define authentication between Backend and AI Service.
- [x]  Define AI error handling.

---

# 2. PHASE 1 — Database + Backend Foundation

## TASK 02.1 — Database

- [x]  Create PostgreSQL.
- [x]  Create tables.
- [x]  Primary Keys.
- [x]  Foreign Keys.
- [x]  Constraints.
- [x]  Indexes.
- [x]  Seed data.

## TASK 02.2 — ERD

Thiết kế đầy đủ:

- User.
- Role.
- Class.
- Course (Deferred/Out-of-scope MVP).
- Assignment.
- Rubric.
- RubricCriteria.
- Group.
- GroupMember.
- Submission.
- SubmissionVersion.
- ActivityLog.
- ContributionMetric.
- ReviewAssignment.
- Review.
- ReviewCriteria.
- AIRequest.
- AIFeedback.
- ReviewSummary.
- ReviewSummaryItem.
- EarlyWarning.
- Notification.

---

# 3. PHASE 2 — Authentication & Authorization

## TASK 03.1 — Authentication

- [x]  Register API (Backend only, STUDENT role only).
- [x]  Login.
- [x]  Logout.
- [x]  JWT.
- [x]  Password hashing.
- [x]  Token expiration.
- [x]  Current user.

## TASK 03.2 — Authorization

ADMIN

TEACHER

STUDENT

API phải kiểm tra Role.

---

# 4. PHASE 3 — Teacher Assignment + Rubric

## TASK 04.1 — Assignment

- [x]  Create (Check Teacher Class Ownership).
- [x]  View (Role-based filtering: Admin xem tất cả, Teacher/Student xem theo lớp).
- [x]  Edit (Check Teacher Class Ownership).
- [x]  Delete (Check Teacher Class Ownership).
- [x]  Input Validation (UUID, Title, Deadline).
- [x]  Deadline.
- [x]  Description.
- [x]  Requirements.
- [x]  Attachment.

Reason:
Đảm bảo an toàn dữ liệu và phân quyền nghiệp vụ chính xác. Tránh việc Teacher tạo/sửa/xóa bài tập của lớp người khác, và giới hạn dữ liệu trả về trong API GET theo Role của người dùng.

Impact:
Thay đổi logic bên trong Service và Controller của Assignment API. Không ảnh hưởng đến Database schema hiện tại.

## TASK 04.2 — Rubric

- [x]  Create Rubric.
- [x]  Add Criteria.
- [x]  Edit Criteria.
- [x]  Delete Criteria.
- [x]  Define weight/score.
- [x]  Define description.

---

# 5. PHASE 4 — Group Workspace + Activity Tracking

## TASK 05.1 — Group Management Core

- [x]  Create Group.
- [x]  View Group.
- [x]  Add Member.
- [x]  Remove Member.

## TASK 05.1.1 — Group Membership Self-Service

- [x]  Join Group.
- [x]  Leave Group.

## TASK 05.1.2 — Group Leadership

- [x]  Assign/Change Leader (Role: ADMIN, TEACHER only. STUDENT is not allowed).
- **Business Rule:** Group được phép tồn tại mà không có Leader (Ví dụ: Group mới tạo). Nếu Leader bị remove hoặc tự Leave Group, `is_leader` sẽ không tự động chuyển sang thành viên khác. Teacher/Admin cần gọi API để chỉ định Leader mới.

## TASK 05.2 — Group Workspace API

### Reuse Existing APIs

- Group information.
- Member list.
- Group leader information.

> Sử dụng lại `GET /api/groups/:id` đã triển khai trong TASK 05.1.

### New Features

### New Features

#### 1. Task Management
  - `GET /api/groups/:id/tasks`
  - `POST /api/groups/:id/tasks`
  - `PATCH /api/tasks/:taskId` (Partial update)
  - `DELETE /api/tasks/:taskId`
  
  **Task Business Rules & Validations:**
  - `title`: required, không empty, max length 255.
  - `status`: Chỉ chấp nhận `TODO`, `IN_PROGRESS`, `DONE`. Áp dụng cho POST và PATCH.
  - `assignee_id`:
    - Có thể NULL.
    - Nếu khác NULL: User phải tồn tại, có role STUDENT, và là member của Group chứa Task.

  **PATCH Task Rules:**
  - Whitelist fields: `title`, `status`, `assignee_id`.
  - Không cho phép update: `id`, `group_id`, `created_at`, `completed_at`, v.v.
  - Phải có ít nhất 1 field hợp lệ để update, nếu rỗng -> `400 Bad Request`.
  - Không dùng trực tiếp `Object.keys(req.body)` để build câu SQL (tránh SQL Injection/Dynamic SQL rủi ro).

  **PATCH/DELETE Task Flow:**
  1. Validate `taskId` UUID.
  2. Tìm Task theo `taskId`. Không tồn tại -> `404`.
  3. Lấy `group_id` từ Task.
  4. Chạy `checkWorkspaceAccess(group_id, currentUser)`.
  5. Không có quyền -> `403`.
  6. (Với PATCH): Validate update data và `assignee_id` nếu có.
  7. Thực hiện Update/Delete -> Trả về `200` (PATCH) / `204` (DELETE).

#### 2. Group Discussions
  - `GET /api/groups/:id/discussions`
  - `POST /api/groups/:id/discussions`
  - **Validation:** `message` (hoặc `content` tuỳ DB) là required, không empty.
  - **Lưu ý:** MVP chỉ hỗ trợ Discussion Level 1 (không Comment/Reply/Nested).

#### 3. Group Files
  - `GET /api/groups/:id/files`
  - `POST /api/groups/:id/files`
  - **File URL Rules:** `file_url` required, absolute URL hợp lệ (http/https).
  - **Technical Limitation (MVP):** Chỉ lưu metadata/URL (`file_name`, `file_url`). KHÔNG triển khai binary file upload/download, Multer, S3.

#### 4. JWT Identity Rules
  - Các trường đại diện tác giả (vd: `user_id`, `uploaded_by`, `created_by`) PHẢI được lấy từ JWT Token (`req.user.userId`).
  - Backend bỏ qua các giá trị User ID được client gửi trong Request Body.

#### 5. Workspace Authorization Rules
  - **STUDENT:** Nếu là thành viên Group, được truy cập và thao tác Workspace của Group đó.
  - **TEACHER:** Nếu quản lý Class chứa Group, được truy cập và thao tác Workspace của Group đó.
  - **ADMIN:** Toàn quyền truy cập và thao tác mọi Workspace.
  - **MVP Permission Rule:** Sau khi vượt qua Workspace Access Check, mọi thành viên hợp lệ của Group đều có quyền CRUD Tasks. Không áp dụng record-level ownership (vd: Student có thể sửa/xóa task của người khác).

#### 6. Database Schema Verification
  - **Bắt buộc trước khi code:** Kiểm tra chính xác schema của `tasks`, `group_discussions`, `group_files`. Xác nhận field names, NULL constraints, Defaults, và Foreign Keys. Không tự ý thay đổi DB schema.

#### 7. Route & Controller Responsibilities
  - `workspace.routes.js`: Chỉ định tuyến endpoint, gắn `verifyToken`, gọi Controller.
  - `workspace.controller.js`: Xử lý Validation UUID, Request body, gọi Service.

#### 8. Empty List Behavior
  - Nếu Group tồn tại nhưng chưa có dữ liệu (Task, Discussion, File): Trả về mảng rỗng `[]` và HTTP `200 OK`. Không trả `404`.

### Derived Progress

- [ ] Progress được tính dựa trên Task Status (`TODO`, `IN_PROGRESS`, `DONE`) (Frontend xử lý).

### Out of Scope

- Comment, Reply, Nested discussion.
- Real file upload, Binary file download, External file storage.
- Progress Tracking module riêng.

## TASK 05.3 — Activity Tracking

Ghi nhận:

- [x]  Content creation.
- [x]  Content editing.
- [x]  Content deletion.
- [x]  Task assignment.
- [x]  Task completion.
- [x]  Discussion.
- [ ]  Comment.
- [x]  Timestamp.
- [ ]  Version history.

Flow:
```
User Action
    ↓
ActivityLog
    ↓
Contribution Engine
```
# 6. PHASE 5 — Student Submission

## TASK 06.1 — Student Dashboard

- [x]  Assignment list.
- [x]  Deadline.
- [x]  Submission status.
- [x]  Review status.

## TASK 06.2 — Assignment Detail

- [x]  Title.
- [x]  Description.
- [x]  Requirements.
- [x]  Deadline.
- [x]  Rubric.
- [x]  Attachment.

## TASK 06.3 — Submit Assignment

- [x]  Upload.
- [x]  Validate.
- [x]  Submit.
- [x]  Deadline validation.
- [x]  Save Submission.
- [x]  Save Version.

## TASK 06.4 — Submission History

- [x]  Previous submissions.
- [x]  Submission time.
- [x]  Status.
- [x]  Feedback status.

---

# 7. PHASE 6 — Double-Blind Peer Assignment

## TASK 07.1 — Submission Pool [x]
```
Submitted Assignments
        ↓
Submission Pool
```
## TASK 07.2 — Assignment Algorithm [x]

Rules:

- Không Review chính bài của mình.
- Không duplicate assignment.
- Đảm bảo số lượng Review phù hợp.
- Có thể phân công theo Group thay vì Student nếu Assignment yêu cầu.

Ví dụ:
```
Group A → Group B
Group B → Group C
Group C → Group A
```
## TASK 07.3 — Anonymous Identity [x]

Reviewer không biết Submitter.

Submitter không biết Reviewer.

Không hiển thị ở Frontend VÀ bắt buộc phải sanitize (loại bỏ) ở cấp độ API Backend trước khi trả về dữ liệu: 
- Name. 
- Student ID. 
- Class. 
- Group identity.

---

# 8. PHASE 7 — Peer Review

## TASK 08.1 — Review Assignment

Student xem:

- Anonymous Submission.
- Assignment.
- Rubric.
- Deadline.
- Review status.

## TASK 08.2 — Review Screen [x]
```
Anonymous Submission
        +
Rubric
        +
Score
        +
Comment
        +
AI Mentor
        +
Submit
```
## TASK 08.3 — Validation [x]

- [x]  Score validation.
- [x]  Required criteria.
- [x]  Required comment.
- [x]  No self-review.
- [x]  No duplicate review.
- [x]  Deadline validation.

---

# 9. PHASE 8 — AI Peer-Review Mentor

## TASK 09.1 — AI Integration

- [x] React
- [x] Node.js / Express
- [x] AI Service
- [x] AI API
## TASK 09.2 — Real-time Analysis

AI kiểm tra:

- [x] Constructiveness.
- [x] Relevance.
- [x] Tone.
- [x] Rubric Alignment.
- [x] Specificity.
- [x] Toxicity/Negative language.
- [x] *Lưu ý kỹ thuật:* Frontend bắt buộc phải áp dụng kỹ thuật Debounce (chờ người dùng ngừng gõ khoảng 1-1.5 giây mới gọi API) để tránh gọi API liên tục làm sập server Backend.
## TASK 09.3 — AI Response [x]
```
Status
Suggestion
Reason
Improvement
```
## TASK 09.4 — AI Principles [x]

- [x]  Human-in-the-loop.
- [x]  AI không tự chấm cuối.
- [x]  AI không tự Submit.
- [x]  AI không thay Teacher.
- [x]  API Key không expose.

---

# 10. PHASE 9 — Contribution Analytics

## TASK 10.1 — Collect Contribution Data [x]
`activity_logs` (event-driven unified table)

Includes:
- SUBMISSION_CREATED / RESUBMITTED / LATE
- REVIEW_SUBMITTED
- TASK_COMPLETED
- DISCUSSION_CREATED
- FILE_UPLOADED
- CONTENT_EDITED (với metadata: { wordCount })
...

Each event includes:
- target_id (anti-spam)
- metadata (context)
- created_at (time dimension)

## TASK 10.2 — Contribution Calculation [x]
`activity_logs`
   ↓
`getGroupActivityStats(groupId, timeframe)`
   ↓
Aggregation:
  - COUNT(*) → total actions
  - COUNT(DISTINCT target_id) → unique actions
   ↓
Normalization:
  - Normalize by timeframe (per day/week)
  - Optional: normalize by group size
  - Scale to 0–100
   ↓
Apply weights:
  - submission: 5
  - review: 4
  - task: 3
  - discussion: 1
   ↓
Contribution Score

### Anti-spam logic
- Use DISTINCT target_id
- Apply cap per activity type (e.g. max 5 discussions/day)
- Ignore rapid repeated spam actions

## TASK 10.3 — Contribution Classification [x]
Based on Contribution Score:

- High Contributor (> 80)
- Normal Contributor (50–80)
- Low Contributor (20–50)
- Potential Free-rider (< 20)

*(Threshold-based classification)*

## TASK 10.4 — Teacher Analytics [x]
Teacher can view:

- Contribution Score per member
- Contribution Percent (%)
- Activity breakdown (by type, includes weight and effective score)
- Unique vs total actions
- Activity timeline
- Member comparison (ranking)
- Potential Free-rider detection (with automated Alerts)

### MVP
Rule-based / Weighted Algorithm ONLY

### Post-MVP
Rule-based + AI (quality adjustment ONLY)

Future:
- SNA
- GNN
- Behavioral Modeling
# 11. PHASE 10 — Review Synthesis

## TASK 11.1 — AI Synthesis (For Teacher) [x]
Processing flow:
`reviews` -> `hybrid sampling (top 100)` -> `chunking (50/chunk)` -> `summaries` -> `final synthesis`

Output JSON cuối cùng (MVP):
```json
{
  "summary": "Overall nhóm làm tốt...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."],
  "totalReviewsAnalyzed": 100,
  "confidence": 0.8
}
```
*(Provides a high-level summary of peer reviews to solve the teacher's pain point. Teacher Validation is built-in.)*

## TASK 11.2 — Teacher Validation (Human-in-the-loop) [x]
Teacher có thể:

- [x] View Summary.
- [x] View source Reviews.
- [x] Approve Summary.
- [x] Correct/annotate Summary.

AI Summary **không tự động quyết định điểm cuối cùng**.
# 12. PHASE 11 — Teacher Analytics + Early Warning

## TASK 12.1 — Dashboard Overview [x]
```
Total Classes
Total Students
Assignments
Submission Rate
Review Completion
Average Score
```
## TASK 12.2 — Contribution Analytics [x]
```
Contribution Score
Member Activity
Task Completion
Potential Free-rider
```
## TASK 12.3 — Review Analytics [x]

```
Review Completion
Average Score
Review Quality
```
## TASK 12.4 — Review Synthesis [x]
```
Strengths
Weaknesses
Common Suggestions
Important Questions
```
## TASK 12.5 — Collaboration Risk [x]
```
Low Activity
Low Contribution
Unbalanced Contribution
Incomplete Tasks
Review Inactivity
Negative Interaction
Abnormal Activity
```
Output:
```
Potential Collaboration Risk
```
# 13. PHASE 12 — Integration + Testing

## TASK 13.1 — Backend Testing

- [x]  Auth API.
- [x]  User API.
- [x]  Class API.
- [x]  Assignment API.
- [x]  Rubric API.
- [x]  Group API.
- [x]  Activity API.
- [x]  Submission API.
- [x]  Review API.
- [x]  Contribution API.
- [x]  AI API.
- [x]  Summary API.
- [x]  Analytics API.

## TASK 13.2 — Frontend Testing

- [x]  Login.
- [x]  Student Dashboard.
- [x]  Assignment.
- [x]  Group Workspace.
- [x]  Submission.
- [x]  Peer Review.
- [x]  AI Mentor.
- [x]  Contribution Analytics.
- [x]  Review Summary.
- [x]  Teacher Dashboard.

## TASK 13.3 — Security Testing

- [x]  JWT.
- [x]  Authorization.
- [x]  Input validation.
- [x]  File validation.
- [x]  API Key protection.
- [x]  Double-Blind privacy.
- [x]  PII detection/sanitization.
- [x]  Rate limiting.

## TASK 13.4 — End-to-End Test
```
Teacher Login
      ↓
Create Assignment
      ↓
Create Rubric
      ↓
Students Join Group
      ↓
Group Collaboration
      ↓
Activity Tracking
      ↓
Submit Assignment
      ↓
Double-Blind Assignment
      ↓
Anonymous Review
      ↓
AI Mentor
      ↓
Submit Review
      ↓
Contribution Analysis
      ↓
Review Synthesis
      ↓
Collaboration Risk
      ↓
Teacher Dashboard
      ↓
Teacher Confirmation
```
# 14. PHASE 13 — Deploy + Documentation

## TASK 14.1 — Frontend
```
React + Vite
      ↓
Vercel
```
## TASK 14.2 — Backend
```
Node.js + Express
      ↓
Render
```
## TASK 14.3 — Database
```
PostgreSQL
      ↓
Supabase
```
## TASK 14.4 — Environment Variables
Frontend:
```
VITE_API_URL
```
Backend:
```
PORT
DATABASE_URL
JWT_SECRET
AI_API_URL
AI_API_KEY
```
## TASK 14.5 — Documentation

- [ ]  README.
- [ ]  Setup Guide.
- [ ]  API Documentation.
- [ ]  ERD.
- [ ]  System Architecture.
- [ ]  Deployment Guide.
- [ ]  User Guide.
- [ ]  Testing Documentation.
# 15. Frontend Structure
```
src/
│
├── components/
│   ├── common/
│   ├── layout/
│   ├── assignment/
│   ├── group/
│   ├── review/
│   ├── ai/
│   └── dashboard/
│
├── pages/
│   │
│   ├── auth/
│   │   └── Login.jsx
│   │
│   ├── student/
│   │   ├── Dashboard.jsx
│   │   ├── Assignments.jsx
│   │   ├── AssignmentDetail.jsx
│   │   ├── Submission.jsx
│   │   ├── GroupWorkspace.jsx
│   │   ├── Activity.jsx
│   │   └── Review.jsx
│   │
│   ├── teacher/
│   │   ├── Dashboard.jsx
│   │   ├── Classes.jsx
│   │   ├── Assignments.jsx
│   │   ├── Submissions.jsx
│   │   ├── Reviews.jsx
│   │   ├── ContributionAnalytics.jsx
│   │   ├── ReviewSummary.jsx
│   │   └── EarlyWarnings.jsx
│   │
│   └── admin/
│       ├── Dashboard.jsx
│       ├── Users.jsx
│       ├── Classes.jsx
│       └── Courses.jsx (Deferred/Out-of-scope MVP)
│
├── services/
│   ├── api.js
│   ├── authApi.js
│   ├── assignmentApi.js
│   ├── rubricApi.js
│   ├── groupApi.js
│   ├── submissionApi.js
│   ├── reviewApi.js
│   ├── contributionApi.js
│   └── aiApi.js
│
├── hooks/
├── context/
├── utils/
├── routes/
└── App.jsx
```
# 16. Backend Structure
```
backend/
│
├── src/
│   │
│   ├── config/
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── classes.routes.js
│   │   ├── assignments.routes.js
│   │   ├── rubric.routes.js
│   │   ├── groups.routes.js
│   │   ├── submissions.routes.js
│   │   ├── reviews.routes.js
│   │   ├── contribution.routes.js
│   │   ├── ai.routes.js
│   │   └── analytics.routes.js
│   │
│   ├── controllers/
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── assignment.service.js
│   │   ├── rubric.service.js
│   │   ├── group.service.js
│   │   ├── submission.service.js
│   │   ├── review.service.js
│   │   ├── contribution.service.js
│   │   ├── ai.service.js
│   │   └── analytics.service.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   └── error.middleware.js
│   │
│   └── utils/
│
└── server.js
```
# 17. API Structure

## Authentication
```
POST /api/auth/register
  - 201 Created: Đăng ký thành công.
  - 400 Bad Request: Lỗi validation hoặc Duplicate Email (email already exists).
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```
## Assignment
```
GET    /api/assignments
GET    /api/assignments/:id
POST   /api/assignments
PUT    /api/assignments/:id
DELETE /api/assignments/:id
```
## Rubric
```
GET    /api/assignments/:id/rubric
POST   /api/assignments/:id/rubric
PUT    /api/rubrics/:id
DELETE /api/rubrics/:id
```
## Group
```
GET    /api/groups
GET    /api/groups/:id
POST   /api/groups
POST   /api/groups/:id/members
DELETE /api/groups/:id/members/:userId
```

## Group Workspace (Mới)
```
GET    /api/groups/:id/tasks
POST   /api/groups/:id/tasks
PATCH  /api/tasks/:taskId
DELETE /api/tasks/:taskId
GET    /api/groups/:id/discussions
POST   /api/groups/:id/discussions
GET    /api/groups/:id/files
POST   /api/groups/:id/files
```
## Activity
```
POST /api/groups/:id/activity
GET  /api/groups/:id/activity
```
## Submission
```
POST /api/assignments/:id/submissions
GET  /api/assignments/:id/submissions
GET  /api/submissions/:id
```
## Peer Review
```
GET  /api/reviews/my-reviews
GET  /api/reviews/:id
POST /api/reviews/:id
```
## AI Mentor
```
POST /api/ai/review-feedback
```
## Contribution
```
GET /api/groups/:id/contribution
GET /api/groups/:id/contribution/:userId
```
## Review Synthesis
```
GET  /api/assignments/:id/review-summary
POST /api/assignments/:id/review-summary/generate
```
## Teacher Analytics
```
GET /api/teacher/dashboard
GET /api/teacher/early-warnings
```
# 18. Contribution Architecture
```
Student Action
      ↓
Activity Logger
      ↓
ActivityLog
      ↓
Contribution Engine
      ↓
Contribution Metrics
      ↓
Contribution Score
      ↓
Teacher Dashboard
```
Không chỉ lưu:
```
contribution_score = 65
```
Mà phải lưu dữ liệu nguồn:
```
ActivityLog
      ↓
Metrics
      ↓
Score
```
để Teacher có thể kiểm tra nguyên nhân.
# 19. AI Service Architecture
```
AI Service
│
├── Module 1
│   AI Group-Contribution Engine
│   ├── Contribution Analysis
│   └── Collaboration Risk
│
├── Module 2
│   Real-time Peer-Review Assistant
│   └── Peer-Review Mentor
│
└── Module 3
    AI Synthesis & Analytics Engine
    ├── Review Clustering
    ├── Review Summarization
    └── Teacher Analytics
```
# 20. AI Request Flow
## 20.1. Peer Review Mentor
```
Reviewer
   ↓
Comment
   ↓
POST /api/ai/review-feedback
   ↓
AI Service
   ↓
NLP / LLM
   ↓
Analysis
   ↓
Suggestion
   ↓
Frontend
```
## 20.2. Contribution
```
ActivityLog
   ↓
Contribution Engine
   ↓
Algorithm / AI
   ↓
Contribution Score
```
## 20.3. Review Synthesis
```
Reviews
   ↓
AI Service
   ↓
Embedding
   ↓
Clustering
   ↓
Summarization
   ↓
Review Summary
```
## 20.4. Collaboration Risk
```
Activity
+
Contribution
+
Task
+
Review Data
        ↓
AI / Analytics
        ↓
Potential Collaboration Risk
```
# 21. Security & Ethics

## Authentication

- JWT.
- Password hashing.
- Token expiration.
- Secure environment variables.

## Authorization
```
STUDENT
TEACHER
ADMIN
```
## AI Security

- Không expose AI API Key.
- AI API chỉ được gọi từ Backend.
- Validate AI input.
- Rate limiting.
- Logging.
- Error handling.

## Privacy

- Double-Blind Review.
- Anonymous UI.
- PII detection.
- PII sanitization.
- Access control.

## Human-in-the-loop

AI:
```
Analyze
+
Suggest
+
Summarize
+
Warn
```
Teacher:
```
Review
+
Decide
+
Confirm
+
Adjust
```
AI **không tự động thay Teacher quyết định điểm cuối cùng**.
Ý tưởng gốc cũng xác định rõ nguyên tắc "AI không làm thay người", AI chỉ phân tích, cảnh báo và đưa ra gợi ý tham khảo.
# 22. MVP Definition

MVP được coi là hoàn thành khi chạy được End-to-End Flow:
```
Teacher Login
      ↓
Create Assignment
      ↓
Create Rubric
      ↓
Student Login
      ↓
Join Group
      ↓
Group Collaboration
      ↓
Activity Tracking
      ↓
Submit Assignment
      ↓
Double-Blind Assignment
      ↓
Anonymous Submission
      ↓
Peer Review
      ↓
AI Real-time Mentor
      ↓
Submit Review
      ↓
Contribution Analysis
      ↓
Review Synthesis
      ↓
Collaboration Risk
      ↓
Teacher Dashboard
      ↓
Teacher Confirmation
```
# 23. Post-MVP

Các công nghệ/tính năng có scope lớn được chuyển sang Post-MVP.

## 23.1. Advanced Contribution
```
Social Network Analysis
GNN
Advanced Behavioral Modeling
```
File ý tưởng đề cập GNN/SNA cho việc mô hình hóa tương tác thành viên. Đây là hướng nghiên cứu mở rộng, không phải requirement bắt buộc của MVP.

## 23.2. Advanced AI

- Fine-tuned Vietnamese LLM.
- Custom Constructive Feedback Dataset.
- Custom Rubric Dataset.
- Advanced Sentiment Model.
- Advanced Toxicity Model.
- Domain-specific LLM.

File ý tưởng đề cập hướng Fine-tuned Vietnamese LLM và các mô hình như PhoGPT/Gemma/Llama-Vietnamese.

## 23.3. Advanced Review Analytics

- BERTopic.
- Vietnamese-SBERT.
- Advanced clustering.
- Historical trend analysis.

## 23.4. LMS Integration

Sau MVP:
```
Moodle
Canvas
Google Classroom
```
Đây cũng là hướng phát triển Giai đoạn 2 trong ý tưởng gốc.

## 23.5. Scale

MVP:
```
Prototype
+
Small-scale Testing
```
Pilot:
```
1–3 Classes
```
Scale:
```
500–1,000 Users
```
Không coi 500–1.000 users là requirement bắt buộc của bản MVP kỹ thuật đầu tiên.
# 24. GitHub Strategy

## Branch
```
main
develop
feature/*
fix/*
```
Ví dụ:
```
feature/authentication
feature/assignment
feature/rubric
feature/group-workspace
feature/activity-tracking
feature/submission
feature/peer-review
feature/ai-mentor
feature/contribution
feature/review-summary
feature/teacher-dashboard
```
## Commit Convention
```
feat:
fix:
refactor:
docs:
test:
chore:
```
Ví dụ:
```
feat: implement student submission API
feat: add peer review screen
feat: integrate AI review mentor
fix: prevent self review assignment
```
# 25. Definition of Done

Một Feature chỉ hoàn thành khi:

- [x]  Frontend hoàn thành.
- [x]  Backend API hoàn thành.
- [x]  Database integration hoàn thành.
- [x]  Validation hoàn thành.
- [x]  Error handling hoàn thành.
- [x]  Authorization hoàn thành.
- [x]  Tested.
- [x]  Git commit.
- [x]  Pull Request/Merge.
- [ ]  Documentation cập nhật.

---

# 26. Thứ tự triển khai thực tế
```
1. Project Setup
        ↓
2. Database / ERD
        ↓
3. Backend Foundation
        ↓
4. Authentication
        ↓
5. Assignment + Rubric
        ↓
6. Group Workspace
        ↓
7. Activity Tracking
        ↓
8. Submission
        ↓
9. Double-Blind Assignment
        ↓
10. Peer Review
        ↓
11. AI Peer-Review Mentor
        ↓
12. Contribution Analytics
        ↓
13. Review Synthesis
        ↓
14. Teacher Analytics
        ↓
15. Collaboration Risk
        ↓
16. Integration Testing
        ↓
17. Deployment
```
# 27. Final Architecture
```
                         PEERREVIEW-AI
                              │
              ┌───────────────┴───────────────┐
              │                               │
           STUDENT                         TEACHER
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ ReactJS + Vite   │
                    │ TailwindCSS      │
                    │ Vercel           │
                    └────────┬─────────┘
                             │
                          REST API
                             │
                             ▼
                    ┌──────────────────┐
                    │ Node.js/Express  │
                    │ JWT              │
                    │ Render           │
                    └──────┬─────┬─────┘
                           │     │
              ┌────────────┘     └──────────────┐
              ▼                                  ▼
       ┌──────────────┐                  ┌──────────────────┐
       │ Supabase     │                  │ AI Service       │
       │ PostgreSQL   │                  │                  │
       │              │                  │ Contribution     │
       │ Users        │                  │ Peer Review      │
       │ Classes      │                  │ Synthesis        │
       │ Assignments  │                  │ Analytics        │
       │ Rubrics      │                  └────────┬─────────┘
       │ Groups       │                           │
       │ Activities   │                           ▼
       │ Submissions  │                  ┌──────────────────┐
       │ Reviews      │                  │ AI API Mai Anh   │
       │ AI Feedback  │                  └──────────────────┘
       └──────────────┘
```

# 28. PILOT PREPARATION & BACKEND DEVELOPMENT ROADMAP (500–1,000 Users — Bản v2)

## 🔴 SPRINT 1 (Tuần 1–2) — Admin APIs & Verification

### TASK B1.0 — Verification First (Kiểm chứng mã nguồn trước khi code) ✅
- [x] Grep mã nguồn kiểm chứng endpoint đã có / còn thiếu:
  - ❌ `GET /api/admin/users` (chưa có — cần triển khai trong B1.1)
  - ❌ `PATCH /api/admin/users/:userId/role` (chưa có — cần triển khai trong B1.1)
  - ❌ `PATCH /api/admin/users/:userId/status` (chưa có — cần triển khai trong B1.1)
  - ❌ `GET /api/admin/audit-logs` (chưa có — cần triển khai trong B1.3)
  - ❌ `GET /api/admin/dashboard/overview` (chưa có — cần triển khai trong B1.4)
- **Quy tắc**: Chỉ xây dựng các endpoint còn thiếu, tuyệt đối không viết trùng lặp.


### TASK B1.1 — User Management API ✅
- [x] `GET /api/admin/users`: Phân trang (`page`, `limit`, `hasNext`) + Filter `?search=` (tên/email) + `?role=` + `?status=`. Authorize `ADMIN`-only via `role.middleware`.
- [x] `PATCH /api/admin/users/:userId/role`: Validate role hợp lệ (`STUDENT`, `TEACHER`, `ADMIN`) → trả 400 nếu sai. Trả 404 nếu user không tồn tại.
- [x] `PATCH /api/admin/users/:userId/status`: Khóa / Mở tài khoản người dùng.

### TASK B1.2 — Business Rules (Backend Enforced — Tuyến chặn chính) ✅
- [x] **Self-protection**: Chặn ADMIN tự hạ quyền / tự khóa tài khoản chính mình → Trả `403 Forbidden`.
- [x] **Last-Admin protection**: Chặn hạ quyền / khóa ADMIN duy nhất của hệ thống → Trả `409 Conflict`.
- [x] **Audit Logging**: Ghi nhật ký vào `activity_logs` cho MỌI thao tác admin (actor, action, target, timestamp).

### TASK B1.3 — Audit Logs API ✅
- [x] `GET /api/admin/audit-logs`: Read-only, phân trang `limit = 20`, filter `action_type`, `user_id`, `from`/`to`.
- [x] Query tận dụng 6 indexes có sẵn của `activity_logs`.
- [x] Mask email phía backend (`a***@domain.com`) trước khi trả response.

### TASK B1.4 — Admin Dashboard Overview API ✅
- [x] `GET /api/admin/dashboard/overview`: Trả về số lượng Users theo role, số lớp học đang hoạt động, tổng số submissions/reviews và số AI requests trong 24h qua.


### TASK B2 — Kiểm chứng APIs Frontend Phase 6 đang gọi ✅
- [x] `PATCH /api/summary/summary-items/:itemId` nhận cả `content` + `note`.
- [x] Logic chuyển trạng thái `DRAFT` → `REVIEWING` (teacher edit lần đầu) → `APPROVED`.
- [x] Trả đúng `409 Conflict` khi `updatedAt` mismatch (optimistic locking).

---

## 🟡 SPRINT 2 (Tuần 3–5) — Pilot Infrastructure & System Config

### TASK B3 — Synthesis Job Infrastructure ✅
- [x] Quyết định chốt: Dùng phương án "Job chạy nền, không cancel" (phù hợp 100% với UI Phase 6, không gây race condition).
- [x] `GET /api/summary/submissions/:submissionId/summary/status` → Trả về `{ status: 'pending' | 'processing' | 'done' | 'failed', errorReason: string | null }` cho FE Polling 5s.
- [x] RBAC Strict Check: Chặn `STUDENT` với `403 Forbidden`, kiểm tra ownership `teacher_id = currentUser.userId` cho Giáo viên.

### TASK B4 — System Config ✅
- [x] Migration DB: Bảng `system_config` (`key` UNIQUE, `value`, `description`, `updated_by`, `updated_at`) với seed idempotent (`ON CONFLICT (key) DO NOTHING`).
- [x] In-Memory Cache `getSystemConfigValue(key, defaultValue)` với 60s TTL cache + instant cache invalidation khi PATCH.
- [x] Whitelist & Type Validation per-key (Key lạ -> `400 Bad Request`, Value sai định dạng -> `400 Bad Request`).
- [x] `GET /api/admin/system-config`: Trả về danh sách cấu hình key-value (Authorize `ADMIN`-only).
- [x] `PATCH /api/admin/system-config`: Hỗ trợ Multi-key batch update trong 1 DB Transaction + ghi unified Audit Log (`ADMIN_UPDATE_SYS_CONFIG`).


### TASK B5 — Email Notifications (Bản rút gọn — ~2 ngày công) ✅
- [x] **B5.1 — Email nhắc deadline trước 24h**: Hourly Cron job (`checkAndSendDeadlineReminders`) quét assignments due in 24h, ghi vết `deadline_reminders_sent` chống trùng lặp (Idempotent 100%).
- [x] **B5.2 — Email reset password**:
  - `POST /api/auth/forgot-password`: Rate limit 5 req/hour, Anti-enumeration protection (Uniform response cho mọi email).
  - SHA-256 token hashing trong DB (`password_reset_tokens`), 15-min expiration, One-time token invalidation (`used_at`).
  - `POST /api/auth/reset-password`: Verify token, bcrypt password hashing, invalidate token và ghi Audit Log.
- *(Đã cắt giảm: Email thông báo khóa/mở tài khoản để ưu tiên B6 & B7.1)*.


### TASK B6 — AI Cost Control & Rate Limiting ⬆️ ✅
- [x] **Dynamic Rate Limit**: Middleware `dynamicAiRateLimiter` đọc `getSystemConfigValue('rate_limit_ai_mentor')` động tại runtime (hiệu lực tức thì khi Admin `PATCH /api/admin/system-config` mà không cần restart server). Trả về `429 Too Many Requests`.
- [x] **Toxicity / Comment Analysis Cache**: Cache theo SHA-256 hash của comment (`ai_comment_tox_${hash}`), TTL 7 ngày (7 * 86400s). Trả kết quả tức thì < 5ms.
- [x] **Chi tiết Metric `ai_requests`**: Ghi log đầy đủ `user_id`, `request_type`, `prompt_hash`, `prompt_tokens`, `candidates_tokens`, `total_tokens`, `status` (`success`, `cache_hit`, `rate_limited`), và `cost_estimate` (đơn giá `$0.00015 / 1k tokens`).


---

## 🟠 SPRINT 3 (Tuần 6–7) — Ops, Hardening & E2E Support

### TASK B7.1 — Load Testing ⬆️ (Bắt đầu sớm nếu B6 xong sớm)
- k6/Locust giả lập 300 concurrent users (mục tiêu: p95 < 500ms đọc, < 1s ghi). Kịch bản đặc biệt: "Đề nộp phút chót" (spike upload trong 5 phút).

### TASK B7.2 — Database Resilience
- Backup hàng ngày + Point-in-time Recovery (PITR với WAL), retention 14 ngày.
- Giám sát / phân vùng `activity_logs` khi vượt 5 triệu bản ghi.

### TASK B7.3 — Health Check
- Endpoint `GET /health` (kiểm tra DB, AI Service connectivity) phục vụ Admin Dashboard & Monitoring.

### TASK B7.4 — Object Storage
- Lưu trữ file bài nộp (S3/Firebase/GCS, 5–50GB), giới hạn dung lượng / file nộp.

### TASK B7.5 — Environment & Staging
- Tách Production / Staging + env variables riêng.
- Verify error reporting: `POST /api/client-errors` nhận + log được lỗi từ FE.

### TASK B7.6 — E2E Support
- Chạy Playwright 4 critical flows trên môi trường Staging (khớp FE Task 08.1).

---

## 📋 Definition of Done (DoD Backend)
1. **Validation & Error Handling**: Validation đầy đủ với định dạng chuẩn `{ code, message, status }`.
2. **Authorization**: Kiểm thử phân quyền theo role (`STUDENT`, `TEACHER`, `ADMIN`).
3. **Git & Commit**: Test kỹ lưỡng + commit theo convention (`feat:`, `fix:`).
4. **Documentation**: Cập nhật tài liệu API.

---

## 📅 TIMELINE TỔNG HỢP & PHÂN CÔNG

| Thời gian | Backend Roadmap | Frontend Roadmap |
| :--- | :--- | :--- |
| **Tuần 1–2** | 🔴 B1.0–B1.4, B2 (Admin APIs + verification) | 🔴 Task 07.1a–07.1g (Admin Core, MSW song song) |
| **Tuần 3–4** | 🟡 B3 (Job queue) + B4 (SysConfig) + B5 rút gọn | 🟡 Task 07.2 System Settings (chờ B4) + Merge 07.1 |
| **Tuần 4–5** | 🟡 B6 AI Cost Control ⬆️ | 🟡 Task 07.2 Merge & E2E Prep |
| **Tuần 5–7** | 🟠 B7.1 Load test ⬆️ → B7.2–B7.6 Ops & Hardening | 🟠 E2E Testing + Pilot Readiness (Task 08.1–08.3) |
| **Tuần 8–10** | 🚀 **PILOT: GĐ1 kín (50–100) → GĐ2 (300–500) → GĐ3 full (800–1.000)** | 🚀 **PILOT: GĐ1 kín (50–100) → GĐ2 (300–500) → GĐ3 full (800–1.000)** |

---

## ⚡ BẢNG QUẢN LÝ RỦI RO & ĐIỂM NGHỄN

| # | Vấn đề | Chờ ai | Hệ quả nếu trễ |
|:---:|:---|:---:|:---|
| 1 | Backend Admin APIs (B1) chưa sẵn sàng | BE | Task 07.1 FE merge PR bị chặn |
| 2 | Cancel synthesis job | BE | FE dùng phương án "Job chạy nền, không cancel" |
| 3 | Last-admin check backend | BE | FE chỉ chặn bằng UI best-effort → rủi ro bảo mật |
| 4 | Field `sentiment` trong SummaryItem DTO | BE/FE | FE ghi nhận deviation khỏi roadmap gốc |
| 5 | LLM API + Ngân sách cho Pilot | Đề tài | Pilot không chạy được AI Mentor |
| 6 | Email service provider chọn gì | BE | ✅ SMTP free tier (Resend / Mailgun), chỉ deadline + reset password |