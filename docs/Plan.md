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
- Course.
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

- [ ]  Content creation.
- [ ]  Content editing.
- [ ]  Content deletion.
- [ ]  Task assignment.
- [ ]  Task completion.
- [ ]  Discussion.
- [ ]  Comment.
- [ ]  Timestamp.
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

- [ ]  Title.
- [ ]  Description.
- [ ]  Requirements.
- [ ]  Deadline.
- [ ]  Rubric.
- [ ]  Attachment.

## TASK 06.3 — Submit Assignment

- [ ]  Upload.
- [ ]  Validate.
- [ ]  Submit.
- [ ]  Deadline validation.
- [ ]  Save Submission.
- [ ]  Save Version.

## TASK 06.4 — Submission History

- [ ]  Previous submissions.
- [ ]  Submission time.
- [ ]  Status.
- [ ]  Feedback status.

---

# 7. PHASE 6 — Double-Blind Peer Assignment

## TASK 07.1 — Submission Pool
```
Submitted Assignments
        ↓
Submission Pool
```
## TASK 07.2 — Assignment Algorithm

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
## TASK 07.3 — Anonymous Identity

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

## TASK 08.2 — Review Screen
```
Anonymous Submission
        ↓
Rubric
        ↓
Score
        ↓
Comment
        ↓
AI Mentor
        ↓
Submit
```
## TASK 08.3 — Validation

- [ ]  Score validation.
- [ ]  Required criteria.
- [ ]  Required comment.
- [ ]  No self-review.
- [ ]  No duplicate review.
- [ ]  Deadline validation.

---

# 9. PHASE 8 — AI Peer-Review Mentor

## TASK 09.1 — AI Integration
```
React
 ↓
Node.js / Express
 ↓
AI Service
 ↓
AI API
```
## TASK 09.2 — Real-time Analysis

AI kiểm tra:

- Constructiveness.
- Relevance.
- Tone.
- Rubric Alignment.
- Specificity.
- Toxicity/Negative language.
*Lưu ý kỹ thuật:* Frontend bắt buộc phải áp dụng kỹ thuật Debounce (chờ người dùng ngừng gõ khoảng 1-1.5 giây mới gọi API) để tránh gọi API liên tục làm sập server Backend.
## TASK 09.3 — AI Response
```
Status
Suggestion
Reason
Improvement
```
## TASK 09.4 — AI Principles

- [ ]  Human-in-the-loop.
- [ ]  AI không tự chấm cuối.
- [ ]  AI không tự Submit.
- [ ]  AI không thay Teacher.
- [ ]  API Key không expose.

---

# 10. PHASE 9 — Contribution Analytics

## TASK 10.1 — Collect Contribution Data
```
ActivityLog
Editing History
Task Assignment
Task Completion
Discussion
Interaction
```
## TASK 10.2 — Contribution Calculation
```
Activity Data
      ↓
Contribution Engine
      ↓
Contribution Score
```
## TASK 10.3 — Contribution Classification
```
High Contributor
Normal Contributor
Low Contributor
Potential Free-rider
```
## TASK 10.4 — Teacher Analytics

Teacher xem:

- Contribution Score.
- Activity count.
- Editing history.
- Task completion.
- Member comparison.
- Potential Free-rider.

### MVP
Sử dụng:
```
Rule-based / Weighted Algorithm
+
AI Analysis
```
### Post-MVP

Có thể nghiên cứu:
```
SNA
GNN
Advanced Behavioral Modeling
```
# 11. PHASE 10 — Review Synthesis

## TASK 11.1 — Collect Reviews
```
Review 1
Review 2
...
Review N
```
## TASK 11.2 — Topic / Clustering
```
Reviews
   ↓
Embeddings
   ↓
Topic Analysis
   ↓
Clustering
```
Có thể sử dụng:

- Vietnamese-SBERT.
- Sentence Transformers.
- BERTopic.

Đây là implementation option của AI Service, không phải requirement bắt buộc của Node.js Backend.

## TASK 11.3 — Summarization
Output:
```
Strengths
Weaknesses
Common Suggestions
Important Questions
```
## TASK 11.4 — Teacher Validation

Teacher có thể:

- [ ]  View Summary.
- [ ]  View source Reviews.
- [ ]  Approve Summary.
- [ ]  Correct/annotate Summary.

AI Summary **không tự động quyết định điểm cuối cùng**.
# 12. PHASE 11 — Teacher Analytics + Early Warning

## TASK 12.1 — Dashboard Overview
```
Total Classes
Total Students
Assignments
Submission Rate
Review Completion
Average Score
```
## TASK 12.2 — Contribution Analytics
```
Contribution Score
Member Activity
Task Completion
Potential Free-rider
```
## TASK 12.3 — Review Analytics

```
Review Completion
Average Score
Review Quality
```
## TASK 12.4 — Review Synthesis
```
Strengths
Weaknesses
Common Suggestions
Important Questions
```
## TASK 12.5 — Collaboration Risk
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

- [ ]  Auth API.
- [ ]  User API.
- [ ]  Class API.
- [ ]  Assignment API.
- [ ]  Rubric API.
- [ ]  Group API.
- [ ]  Activity API.
- [ ]  Submission API.
- [ ]  Review API.
- [ ]  Contribution API.
- [ ]  AI API.
- [ ]  Summary API.
- [ ]  Analytics API.

## TASK 13.2 — Frontend Testing

- [ ]  Login.
- [ ]  Student Dashboard.
- [ ]  Assignment.
- [ ]  Group Workspace.
- [ ]  Submission.
- [ ]  Peer Review.
- [ ]  AI Mentor.
- [ ]  Contribution Analytics.
- [ ]  Review Summary.
- [ ]  Teacher Dashboard.

## TASK 13.3 — Security Testing

- [ ]  JWT.
- [ ]  Authorization.
- [ ]  Input validation.
- [ ]  File validation.
- [ ]  API Key protection.
- [ ]  Double-Blind privacy.
- [ ]  PII detection/sanitization.
- [ ]  Rate limiting.

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
│       └── Courses.jsx
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

- [ ]  Frontend hoàn thành.
- [ ]  Backend API hoàn thành.
- [ ]  Database integration hoàn thành.
- [ ]  Validation hoàn thành.
- [ ]  Error handling hoàn thành.
- [ ]  Authorization hoàn thành.
- [ ]  Tested.
- [ ]  Git commit.
- [ ]  Pull Request/Merge.
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