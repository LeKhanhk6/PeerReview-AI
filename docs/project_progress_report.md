# BÁO CÁO TIẾN ĐỘ PHÁT TRIỂN DỰ ÁN PEERREVIEW-AI

## 1. Giới thiệu dự án

### Tên dự án
**PeerReview-AI — Hệ thống AI hỗ trợ Chấm chéo, Phản biện và Đánh giá Tương tác Nhóm trong Lớp học**

### Bài toán thực tế
Trong môi trường học tập theo nhóm hiện nay, giáo viên và sinh viên thường gặp phải một số thách thức đáng kể:
1. **Đánh giá mức độ đóng góp (Contribution):** Rất khó để giáo viên xác định và đánh giá chính xác mức độ đóng góp thực tế của từng cá nhân trong một nhóm, dẫn đến tình trạng "dựa dẫm" (free-rider).
2. **Chất lượng đánh giá chéo (Peer Review):** Các nhận xét từ sinh viên trong quá trình chấm chéo thường hời hợt, thiếu tính xây dựng, hoặc đôi khi mang tính chất tiêu cực, không giúp ích cho quá trình cải thiện bài làm.
3. **Quá tải trong việc quản lý:** Giáo viên mất rất nhiều thời gian để đọc, phân tích và tổng hợp số lượng lớn các phiếu phản biện từ sinh viên để đưa ra đánh giá cuối cùng.

### Mục tiêu của hệ thống
Dự án **PeerReview-AI** được xây dựng nhằm giải quyết các vấn đề trên bằng cách cung cấp một nền tảng Web toàn diện tích hợp Trí tuệ Nhân tạo (AI). Hệ thống số hóa và tự động hóa toàn bộ quy trình từ lúc tạo bài tập, sinh viên làm việc nhóm, nộp bài, cho đến khi thực hiện đánh giá chéo. 

Mục tiêu cốt lõi của AI trong hệ thống là **hỗ trợ**, đóng vai trò như một người hướng dẫn (Mentor) để cải thiện chất lượng nhận xét của sinh viên, theo dõi tiến độ đóng góp và tổng hợp thông tin cho giáo viên. Hệ thống tuân thủ nghiêm ngặt nguyên tắc: AI không thay thế con người, không tự chấm điểm và giáo viên luôn là người ra quyết định cuối cùng.

### Đối tượng người dùng
Hệ thống phục vụ 3 nhóm người dùng chính:
* **Sinh viên (STUDENT):** Tham gia nhóm, làm bài tập, nhận phản hồi AI và thực hiện đánh giá chéo các nhóm khác.
* **Giáo viên (TEACHER):** Tạo bài tập, xây dựng tiêu chí chấm điểm (Rubric), theo dõi tiến độ, xem báo cáo phân tích từ AI và đưa ra điểm số cuối cùng.
* **Quản trị viên (ADMIN):** Quản lý toàn hệ thống, người dùng, khóa học và các thiết lập chung.

---

## 2. Tổng quan kiến trúc hệ thống

Hệ thống được thiết kế theo kiến trúc Client-Server hiện đại, chia thành các thành phần độc lập nhằm đảm bảo tính mở rộng và dễ dàng bảo trì:

```text
Frontend (Giao diện người dùng)
    ↓
Backend API (Xử lý nghiệp vụ & Bảo mật)
    ↓
PostgreSQL Database (Lưu trữ dữ liệu quan hệ)
    ↓
AI Service (Phân tích & Xử lý ngôn ngữ tự nhiên)
```

* **Frontend:** Cung cấp giao diện tương tác (UI) cho Student, Teacher và Admin. Nơi người dùng thực hiện các thao tác quản lý, làm việc nhóm và chấm chéo.
* **Backend API:** Đóng vai trò là trung tâm xử lý logic nghiệp vụ, xác thực quyền truy cập, bảo vệ dữ liệu và giao tiếp với các dịch vụ khác.
* **PostgreSQL Database:** Lưu trữ toàn bộ dữ liệu có cấu trúc của hệ thống, bao gồm thông tin người dùng, bài tập, rubric, kết quả review và lịch sử hoạt động, đảm bảo tính toàn vẹn thông qua các ràng buộc (Constraints).
* **AI Service:** Tích hợp với Backend thông qua các API Contract đã được định nghĩa. Đảm nhiệm các tác vụ như phân tích Activity Log, đóng vai trò Peer-Review Mentor và tổng hợp các bản đánh giá (Review Synthesis).

---

## 3. Công nghệ sử dụng

Dự án ưu tiên sử dụng các công nghệ hiện đại, ổn định và phổ biến trong ngành phát triển phần mềm hiện nay.

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | ReactJS, Vite, React Router, Axios, TailwindCSS |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Sử dụng UUID, Primary/Foreign Keys, Indexes) |
| **Authentication/Authorization** | JWT (JSON Web Tokens), Role-based Access Control (RBAC), Password Hashing |
| **AI Integration** | AI API Contracts, Request/Response Schemas |
| **Testing** | Service Unit Testing (Mock Database, Fake Timers), Test Isolation |
| **Quản lý mã nguồn** | Git, GitHub, Branch Strategy (main, develop, feature/*, fix/*) |

---

## 4. Tiến độ triển khai theo Phase

Dự án được chia thành 14 Phase (Giai đoạn). Dưới đây là bảng tổng hợp tiến độ hiện tại dựa trên tài liệu dự án (Plan.md) và lịch sử Git:

| Phase | Nội dung | Trạng thái | Kết quả / Ghi chú |
| :--- | :--- | :--- | :--- |
| **PHASE 0** | Project Setup | **Đã hoàn thành** | Khởi tạo cấu trúc Frontend/Backend, CI/CD cơ bản (Git workflow), AI API Contract. |
| **PHASE 1** | Database + Backend Foundation | **Đã hoàn thành** | Thiết kế ERD, triển khai PostgreSQL schemas với đầy đủ constraints và seed data. |
| **PHASE 2** | Authentication + Authorization | **Đã hoàn thành** | Đăng ký, đăng nhập, JWT, Role-based Authorization cho hệ thống. |
| **PHASE 3** | Teacher Assignment + Rubric | **Đã hoàn thành** | API quản lý Assignment và Rubric cho Role TEACHER/ADMIN. |
| **PHASE 4** | Group Workspace + Activity Tracking | **Đang triển khai** | Hoàn thành Backend Core, Tasks, Discussions và Activity Tracking. Frontend đang triển khai. |
| **PHASE 5** | Student Submission | **Đang triển khai** | Hoàn thành Backend API cho Submit, Versioning. Frontend chưa xong. |
| **PHASE 6** | Double-Blind Peer Assignment | **Đã hoàn thành** | Backend Algorithm, Submission Pool và Anonymous Identity đã được thực thi. |
| **PHASE 7** | Peer Review | **Đang triển khai** | Hoàn thành Backend API (Review Assignment, Validation). |
| **PHASE 8** | AI Peer-Review Mentor | **Đang triển khai** | Hoàn thành tích hợp AI Service Backend. Frontend React chưa xong. |
| **PHASE 9** | Contribution Analytics | **Đang triển khai mở rộng** | Mở rộng MVP ban đầu theo `Thuat_toan_danh_gia_dong_gop.md` (Thêm C2-C4). Đang chờ DB và API. |
| **PHASE 10**| Review Synthesis | **Đã hoàn thành (Backend)** | AI Synthesis và Teacher Validation APIs đã hoàn tất. |
| **PHASE 11**| Teacher Analytics + Early Warning | **Đã hoàn thành (Backend)** | Dashboard Analytics, Collaboration Risk, Early Warnings API đã sẵn sàng. |
| **PHASE 12**| Integration + Testing | **Đang triển khai** | Hoàn thành Backend Unit Tests, Health Check Diagnostics (B7.3), File Upload Capping 10MB (B7.4) và Deployment Hardening Vercel/Render (B7.5). Đang chờ Load Test k6 & E2E. |
| **PHASE 13**| Deploy + Documentation | **Đang triển khai** | Tài liệu thiết kế Screen Flow, UI Architecture và các Use Cases chi tiết đang được cập nhật liên tục. |

---

## 5. Các chức năng Backend đã hoàn thành

Phần Backend đã được triển khai gần như hoàn thiện cho toàn bộ hệ thống, với các tiêu chuẩn vững chắc về kiến trúc và bảo mật:

### Authentication & Authorization, Assignment, Rubric, Group (Phase 1-4)
* **Auth, Assignment, Rubric:** Hoàn thiện với Role-based access control (RBAC), JWT, Resource Ownership.
* **Group Management & Workspace:** Hoàn tất tính năng tạo nhóm, phân quyền nhóm (Join/Leave/Leader), Task Management, Discussions, Activity Tracking.
* **Backend Hardening:** Triển khai Zod validation, Pagination, Transaction layer, và System Resilience (Batch 3, 4, 5).

### Review Engine & Double-Blind Allocation (Phase 5-7)
* Đã hoàn thiện toàn bộ luồng Submission, tạo thuật toán tự động phân công chéo (Double-Blind Peer Assignment) ngăn chặn duplicate, tự chấm và ẩn danh an toàn.
* API nộp bài (Submission) và đánh giá chéo (Review) với hệ thống xác thực chặt chẽ: Deadline validation, Required criteria, Score validation.

### Hệ thống AI & Analytics nâng cao (Phase 8-11)
* **AI Mentor & Synthesis:** Xây dựng xong luồng giao tiếp với AI (Real-time Analysis: Constructiveness, Tone, Rubric Alignment...). Hỗ trợ Tổng hợp đánh giá bằng AI (AI Synthesis) cho giáo viên.
* **Contribution Analytics:** Engine cũ đã xong (Phase 9 MVP). Hiện đang **mở rộng** thêm luồng Chấm nội bộ (Internal Evaluation) theo `Thuat_toan_danh_gia_dong_gop.md` (chấm chéo C2-C4, snapshot, guard).
* **Collaboration Risk & Early Warning:** Tự động phát hiện Inactivity, Negative Interaction, Unbalanced Contribution để cảnh báo sớm cho giáo viên. Sắp tới sẽ nối thêm cảnh báo "Không chấm nội bộ".

---

## 6. Database và Data Model

Cơ sở dữ liệu PostgreSQL đã được thiết kế hoàn chỉnh (ERD) và triển khai (Schema, Constraints, Indexes). Cấu trúc dữ liệu sử dụng UUID làm Primary Keys và đã hỗ trợ đầy đủ cho mọi Phase:
* **User, Class, Course, Assignment, Rubric:** Định nghĩa cấu trúc học tập và đánh giá.
* **Group & Activity:** `groups`, `tasks`, `group_discussions`, `activity_logs` lưu trữ nhật ký hoạt động chi tiết.
* **Submission & Review:** Lưu trữ version history bài nộp, và thông tin phân công chấm chéo ẩn danh.
* **AI & Analytics:** Tối ưu lưu trữ `AI Request`, `AI Feedback`, `Review Summary`, và `Early Warning`.

---

## 7. Testing và đảm bảo chất lượng

Dự án áp dụng mô hình Test Pyramid hướng tới tiêu chuẩn Production-grade:
* **Backend Service Unit Testing:** Đã hoàn thành bộ test cho TOÀN BỘ API (Auth, User, Class, Assignment, Rubric, Group, Activity, Submission, Review, Contribution, AI, Summary, Analytics).
* **Behavior-first & Security Testing:** Các Service cốt lõi (Rubric, Workspace, Activity) đã được harden để đạt chuẩn MVP Production-safe.
* **Testing Resilience:** Bổ sung các bộ test xử lý rủi ro nhóm (Collaboration Risks) và bảo vệ hệ thống trước sự cố.

---

## 8. Những kết quả đạt được

Đến thời điểm hiện tại, dự án PeerReview-AI đã đạt được những tiến độ vượt bậc:
1. **Hoàn thiện Cốt lõi Backend & System Resilience:** Backend đã đi qua tất cả các Phase nghiệp vụ (từ Phase 1 đến 11). Hệ thống được củng cố (hardening) với Transaction Layer, Data Validation chuẩn và xử lý lỗi đồng bộ.
2. **Review Engine & AI Integrated:** Luồng Review ẩn danh, tính toán Contribution, và AI Synthesis (Tổng hợp bằng AI) đã sẵn sàng phía server.
3. **Mã nguồn an toàn (Test Coverage):** Bộ API Backend đã được Unit test kỹ lưỡng, đảm bảo tính đúng đắn trước khi ráp vào Frontend.
4. **Tài liệu & Specs rõ ràng:** Các tài liệu thiết kế giao diện (Frontend_Screens.md), Use Cases và API Mapping được định nghĩa vô cùng chi tiết.

---

## 9. Công việc tiếp theo

Dựa trên khối lượng Backend đã hoàn thành, hệ thống sẽ chuyển trọng tâm sang Frontend và Testing E2E:
* **Triển khai Giao diện (Frontend):** Bắt đầu kết nối các màn hình React.js (Dashboard, Group Workspace, Submission, Review, Analytics) với các API Backend đã hoàn thành.
* **Tích hợp AI Mentor lên UI:** Áp dụng kỹ thuật Debounce và hiển thị Feedback trực tiếp từ AI trong màn hình Review của sinh viên.
* **Testing Mở rộng (Phase 12):** Bổ sung Frontend Testing, Security Testing toàn diện (rate limiting, PII sanitization) và End-to-End (E2E) Testing cho toàn bộ luồng nghiệp vụ.
* **Hoàn thiện Phase 13 (Deployment):** Triển khai ứng dụng lên môi trường Production (Vercel/Render/Supabase) và hoàn thiện các tài liệu User Guide, API Documentation.

---

## 10. Đánh giá hiện trạng dự án

Dự án **PeerReview-AI** đang đi rất nhanh và vượt kỳ vọng ban đầu. Phần khó khăn nhất là **Backend Logic, Thuật toán phân công (Double-Blind), System Resilience và Tích hợp AI** đã được giải quyết hoàn toàn.

* **Sức mạnh nền tảng:** Với việc áp dụng các tiêu chuẩn Production-safe sớm (Transaction, Validation, Test Isolation), rủi ro kỹ thuật trong tương lai đã giảm đáng kể.
* **Thách thức còn lại:** Khối lượng công việc tích hợp Frontend hiện rất lớn. Quá trình kết nối UI với hàng loạt API có thể phát sinh các vấn đề về state management và luồng trải nghiệm người dùng (UX). 

Nhìn chung, Backend đã ở tư thế "sẵn sàng chiến đấu", dự án hiện tập trung dồn lực lượng vào Frontend để sớm đưa sản phẩm vào kiểm thử thực tế.
