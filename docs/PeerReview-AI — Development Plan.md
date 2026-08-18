## 0. Tổng quan dự án

**PeerReview-AI** là hệ thống Web hỗ trợ **chấm chéo, phản biện, đánh giá đóng góp nhóm và phân tích phản hồi bằng AI** trong môi trường lớp học.

Hệ thống giải quyết 3 vấn đề chính:

1. **Thiếu công bằng trong làm việc nhóm:** Giáo viên khó xác định mức độ đóng góp thực tế của từng thành viên.
2. **Chất lượng Peer Review thấp:** Học sinh/sinh viên thường viết nhận xét hời hợt, thiếu tính xây dựng hoặc mang tính tiêu cực.
3. **Giáo viên quá tải:** Giáo viên phải đọc và tổng hợp số lượng lớn phản biện.
# 1. Mục tiêu hệ thống

PeerReview-AI cho phép:

- Giáo viên tạo Assignment.
- Giáo viên thiết lập Rubric.
- Học sinh tham gia Group.
- Các thành viên làm bài trên Group Workspace.
- Hệ thống ghi nhận Activity Log.
- Học sinh nộp bài.
- Hệ thống tự động phân công Peer Review.
- Peer Review được thực hiện theo cơ chế Double-Blind.
- AI hỗ trợ học sinh viết Review theo thời gian thực.
- AI phân tích Contribution của từng thành viên.
- AI tổng hợp các Peer Review.
- AI phát hiện Collaboration Risk.
- Giáo viên xem Analytics.
- Giáo viên kiểm tra và quyết định kết quả cuối cùng.

---

# 2. User Roles

## 2.1. Student

Student có thể:

- Login.
- Xem Assignment.
- Tham gia Group.
- Truy cập Group Workspace.
- Phân công Task.
- Làm và chỉnh sửa nội dung.
- Thảo luận.
- Nộp bài.
- Nhận bài Review.
- Đánh giá theo Rubric.
- Viết Peer Review.
- Nhận AI Suggestion realtime.
- Submit Review.
- Xem Feedback.

---

## 2.2. Teacher

Teacher có thể:

- Login.
- Quản lý Class.
- Tạo Assignment.
- Thiết lập Rubric.
- Theo dõi Submission.
- Theo dõi Group.
- Xem Contribution Analytics.
- Xem Peer Review.
- Xem AI Review Summary.
- Xem Collaboration Risk.
- Xác nhận/chỉnh sửa kết quả cuối cùng.

---

## 2.3. Admin

Admin có thể:

- Quản lý User.
- Quản lý Student.
- Quản lý Teacher.
- Quản lý Class.
- Quản lý Course.
- Quản lý dữ liệu hệ thống.
- Theo dõi hệ thống.

> Admin Dashboard có thể triển khai ở mức cơ bản trong MVP; các chức năng quản trị nâng cao thuộc Post-MVP.

---

# 3. Core Features

## 3.1. AI Group-Contribution Tracker

Mục tiêu:

> Phân tích mức độ đóng góp của từng thành viên trong nhóm.

AI/Algorithm phân tích:

- Content creation.
- Content editing.
- Content deletion.
- Editing history.
- Task assignment.
- Task completion.
- Discussion activity.
- Comment activity.
- Activity duration/timestamp.

Output:
```
Student A — 65%
Student B — 30%
Student C — 5%
```
Có thể phân loại:
```
High Contributor
Normal Contributor
Low Contributor
Potential Free-rider
```
### Nguyên tắc

**Contribution Score là chỉ số ước lượng/hỗ trợ giáo viên**, không phải bằng chứng tuyệt đối và không được sử dụng làm căn cứ duy nhất để quyết định điểm cá nhân.

Ý tưởng gốc cũng định hướng sử dụng log chỉnh sửa, thời gian hoạt động và tương tác để đánh giá đóng góp.
# 3.2. AI Peer-Review Mentor

AI hỗ trợ Student khi viết Review.

### Workflow
```
Student nhập Comment
        ↓
Frontend
        ↓
Backend
        ↓
AI Service
        ↓
AI Analysis
        ↓
Suggestion
        ↓
Student chỉnh sửa
        ↓
Submit Review
```
AI phân tích:

- Constructiveness.
- Relevance.
- Tone.
- Rubric Alignment.
- Specificity.
- Negative/Toxic language.

Ví dụ:
```
Student:
"Bài này dở quá, slide xấu."

AI:
⚠ Needs Improvement

Nhận xét chưa mang tính xây dựng.
Hãy chỉ rõ phần nào cần cải thiện
và đề xuất hướng sửa theo Rubric.
```
Sau khi sửa:
```
"Phần 2 còn thiếu số liệu thực tế.
Nhóm nên bổ sung biểu đồ để thuyết phục hơn."

AI:
✓ Good Feedback
```
### Nguyên tắc

AI:
- Không tự chấm điểm.
- Không tự Submit Review.
- Không thay thế Student.
- Không thay thế Teacher.
- Chỉ đưa ra Recommendation.
Ý tưởng gốc xác định đây là mô-đun cốt lõi sử dụng NLP để đánh giá tính xây dựng, mức độ phù hợp Rubric và ngôn ngữ tiêu cực.
# 3.3. Double-Blind Peer Review

Hệ thống đảm bảo:
```
Reviewer
   ↕
Không biết danh tính
   ↕
Submitter
```
Không hiển thị:

- Name.
- Student ID.
- Class.
- Group identity.

Ví dụ:
```
Anonymous Group #07
```
thay vì:
```
Nguyễn Văn A
MSSV: ...
Class: ...
Group: ...
```
### Kiến trúc Privacy
Double-Blind phải được đảm bảo chủ yếu bởi:
```
Backend
+
Database
+
Authorization
+
Anonymous UI
```
AI chỉ có thể hỗ trợ:
```
PII Detection / Sanitization
```
AI **không phải thành phần duy nhất chịu trách nhiệm bảo vệ danh tính**.
Điều này vẫn giữ nguyên tinh thần Double-Blind/Anonymization trong ý tưởng gốc.
# 3.4. AI Review Synthesis

Tự động tổng hợp hàng chục/hàng trăm Peer Review.

### Input
```
Review 1
Review 2
Review 3
...
Review N
```
### Processing
```
Reviews
   ↓
Embedding / Topic Analysis
   ↓
Clustering
   ↓
Summarization
```
### Output
```
Strengths
Weaknesses
Common Suggestions
Important Questions
```
Ví dụ:
**Điểm mạnh**
- Slide thiết kế rõ ràng, phần nội dung chính dễ hiểu.
**Điểm cần cải thiện**
- Nhiều nhóm nhận xét bài thiếu nguồn tài liệu và số liệu thực tế.
**Câu hỏi nổi bật**
- Phương pháp lựa chọn dữ liệu chưa được giải thích rõ.
Ý tưởng gốc đề xuất clustering và summarization để tổng hợp các ý kiến phản biện.
# 3.5. Teacher Analytics & Early Warning

Teacher Dashboard cung cấp:

### Contribution Analytics

- Contribution Score.
- Activity.
- Task Completion.
- Member Comparison.
- Potential Free-rider.

### Collaboration Risk

Hệ thống phát hiện các tín hiệu:

- Low Activity.
- Low Contribution.
- Unbalanced Contribution.
- Incomplete Tasks.
- Review Inactivity.
- Negative/Toxic Interaction.
- Abnormal Collaboration Pattern.

Không nên tuyên bố AI "phát hiện chính xác xung đột". Trong MVP nên sử dụng khái niệm:

> **Potential Collaboration Risk**
# 4. Rubric — Core Domain

Rubric là thành phần quan trọng xuyên suốt hệ thống.
```
Teacher
   ↓
Assignment
   ↓
Rubric
   ↓
Rubric Criteria
   ↓
Student Submission
   ↓
Peer Review
   ↓
AI Peer-Review Mentor
   ↓
Review Analytics
```
Rubric được sử dụng cho:

- Peer Review.
- AI Mentor.
- Review Analytics.
- Review Summary.
- Teacher Evaluation.

### Ví dụ
```
Content Quality       30%
Research              30%
Presentation          20%
Creativity            20%
```
# 5. User Workflow

## 5.1. Student Workflow
```
Login
  ↓
Student Dashboard
  ↓
View Assignment
  ↓
Access Group
  ↓
Group Workspace
  ↓
Collaborate
  ↓
Activity Tracking
  ↓
Submit Assignment
  ↓
Double-Blind Peer Assignment
  ↓
Receive Anonymous Submission
  ↓
Read Submission
  ↓
Evaluate Rubric
  ↓
Write Review
  ↓
AI Peer-Review Mentor
  ↓
Improve Review
  ↓
Submit Review
```
## 5.2. Group Workflow
```
Group
  ↓
Members
  ↓
Task Assignment
  ↓
Content Creation
  ↓
Content Editing
  ↓
Discussion
  ↓
Activity Log
  ↓
Contribution Analysis
  ↓
Submit
```
## 5.3. Teacher Workflow
```
Login
  ↓
Teacher Dashboard
  ↓
Create Assignment
  ↓
Create Rubric
  ↓
Students work in Groups
  ↓
Students Submit
  ↓
Double-Blind Peer Assignment
  ↓
Students Review
  ↓
AI Mentor
  ↓
Contribution Analysis
  ↓
Review Synthesis
  ↓
Collaboration Risk
  ↓
Teacher Dashboard
  ↓
Teacher Review
  ↓
Confirm / Adjust Result
```
# 6. Technology Stack

## 6.1. Frontend
```
ReactJS
Vite
React Router
Axios
TailwindCSS
```
### 6.2. Backend chính
```
Node.js
Express.js
REST API
JWT
```
### 6.3. Database
```
PostgreSQL
Supabase
```
### 6.4. AI Service
Kiến trúc ý tưởng sử dụng AI Service có thể triển khai bằng Python/FastAPI.
Trong MVP:
```
React
   ↓
Node.js / Express
   ↓
AI Service / AI API
```
AI Service có thể là:
```
FastAPI / Python
```
hoặc kết nối trực tiếp tới **AI API của Mai Anh** theo kiến trúc nhóm đang triển khai.
#### Quan trọng
```
Node.js / Express
= Backend chính

FastAPI / Python
= AI Service (nếu cần)

AI API Mai Anh
= AI Provider / AI Endpoint
```
- Frontend **không gọi trực tiếp AI API có secret key**.
# 7. AI Architecture

Ý tưởng gốc xác định **3 AI Modules chính**.

Plan thống nhất thành:
```
AI SYSTEM
│
├── Module 1
│   AI Group-Contribution Engine
│   │
│   ├── Contribution Analysis
│   └── Collaboration Risk
│
├── Module 2
│   Real-time Peer-Review Assistant
│   │
│   └── AI Peer-Review Mentor
│
└── Module 3
    AI Synthesis & Analytics Engine
    │
    ├── Review Synthesis
    └── Teacher Analytics
```
# 8. System Architecture
```
                         PEERREVIEW-AI
                              │
             ┌────────────────┴────────────────┐
             │                                 │
          STUDENT                           TEACHER
             │                                 │
             └────────────────┬────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ ReactJS + Vite   │
                    │ TailwindCSS      │
                    └────────┬─────────┘
                             │
                         REST API
                             │
                             ▼
                    ┌──────────────────┐
                    │ Node.js/Express  │
                    │ JWT / REST API   │
                    └──────┬─────┬─────┘
                           │     │
              ┌────────────┘     └─────────────┐
              ▼                                ▼
      ┌──────────────────┐             ┌──────────────────┐
      │ Supabase         │             │ AI Service       │
      │ PostgreSQL       │             │                  │
      │                  │             │ Contribution     │
      │ Users            │             │ Peer Review      │
      │ Classes          │             │ Synthesis        │
      │ Assignments      │             │ Analytics        │
      │ Rubrics          │             └────────┬─────────┘
      │ Groups           │                      │
      │ Activities       │                      ▼
      │ Submissions      │             ┌──────────────────┐
      │ Reviews          │             │ AI API Mai Anh   │
      │ AI Feedback      │             └──────────────────┘
      └──────────────────┘
```
# 9. Database Design

## 9.1. Core Entities
```
User
Role
Class
Course

Assignment
Rubric
RubricCriteria

Group
GroupMember

Submission
SubmissionVersion

ActivityLog
ContributionMetric

ReviewAssignment
Review
ReviewCriteria

AIRequest
AIFeedback

ReviewSummary
ReviewSummaryItem

EarlyWarning

Notification
```
## 9.2. Main Relationships

### Assignment & Rubric
```
Teacher
   ↓
Assignment
   ↓
Rubric
   ↓
RubricCriteria
```
### Group & Activity
```
Group
   ↓
GroupMember
   ↓
User

Group
   ↓
ActivityLog
   ↓
ContributionMetric
```
### Submission & Review
```
Assignment
   ↓
Submission
   ↓
ReviewAssignment
   ↓
Review
   ↓
ReviewCriteria
```
### AI
```
Review
   ↓
AIFeedback
```
```
Reviews
   ↓
ReviewSummary
```


