# BẢN KÊ KHAI CÔNG CỤ AI, API, THƯ VIỆN VÀ MÃ NGUỒN MỞ
## DỰ ÁN PEERREVIEW-AI

Tài liệu này kê khai minh bạch và chi tiết các công cụ Trí tuệ Nhân tạo (AI), Giao diện Lập trình Ứng dụng (API), Dịch vụ Nền tảng Đám mây (Cloud Services), cùng hệ thống Thư viện Mã nguồn mở (Open-source Libraries) được sử dụng trong quá trình nghiên cứu, thiết kế, phát triển và vận hành hệ thống **PeerReview-AI**.

---

## 1. 🤖 CÔNG CỤ AI (AI TOOLS & MODELS)

Hệ thống **PeerReview-AI** tích hợp các công cụ Trí tuệ Nhân tạo thế hệ mới đóng vai trò trợ lý hỗ trợ (Human-in-the-loop), tuân thủ nguyên tắc AI không tự đưa ra quyết định điểm số cuối cùng:

| Tên Công cụ / Model | Nhà cung cấp | Vai trò trong Hệ thống | Ghi chú Kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Google Gemini 3.6 Flash** (`gemini-3.6-flash`) | Google DeepMind | Động cơ AI chính đảm nhiệm phân tích phản hồi real-time (**AI Peer-Review Mentor**) và tổng hợp phản biện cho Giáo viên (**AI Review Synthesis**). | Hỗ trợ trích xuất JSON an toàn khỏi khối suy luận (Thought block), tốc độ phản hồi cao. |
| **Google Gemini 3.5 Flash / Lite** (`gemini-3.5-flash-lite`, `gemini-3.5-flash`) | Google DeepMind | Model dự phòng (Fallback Model) trong cơ chế **Multi-Model Auto-Rotation**. | Tự động chuyển đổi khi model chính gặp sự cố giới hạn hạn ngạch (`429 Quota Exhaustion`). |
| **Google Gemini 3.7 Flash** (`gemini-3.7-flash`) | Google DeepMind | Model mở rộng thử nghiệm cho các tác vụ phân tích phản biện phức tạp. | Hỗ trợ xử lý ngữ cảnh dài và phân tích đa tiêu chí nâng cao. |
| **Antigravity AI Assistant** | Google DeepMind | Trợ lý AI hỗ trợ cặp lập trình (Pair Programming), thiết kế kiến trúc phần mềm, xây dựng test suites và tối ưu mã nguồn. | Hỗ trợ quy trình phát triển theo đúng chuẩn Plan và Architecture của dự án. |

---

## 2. 🌐 GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API) & DỊCH VỤ CLOUD

Hệ thống giao tiếp với các dịch vụ nền tảng bên ngoài thông qua các chuẩn kết nối API RESTful bảo mật:

| Tên Dịch vụ / API | Nhà cung cấp | Mục đích Sử dụng | Phương thức Kết nối |
| :--- | :--- | :--- | :--- |
| **Google Gemini REST API** | Google Cloud / AI Studio | Kết nối gửi prompt phân tích phản hồi bài tập, kiểm tra tính xây dựng (Constructiveness), văn phong (Tone), và tạo bản tổng hợp review. | REST API / HTTPS (Xác thực bằng `AI_API_KEY` ở Backend, không expose xuống Client). |
| **Supabase Database API** | Supabase Inc. | Quản trị và truy vấn Cơ sở Dữ liệu Quan hệ PostgreSQL trên Cloud. | PostgreSQL Connection Pooler (`pg` driver) với SSL Mode `require`. |
| **Supabase Storage API** | Supabase Inc. | Lưu trữ và quản lý tệp tin đồ án/bài nộp sinh viên (`submissions`), đề bài (`assignments`) và tài liệu nhóm (`workspace`). | Supabase JS SDK Client, hỗ trợ Signed URL bảo mật và kiểm soát hạn ngạch tệp 10MB. |
| **Render Cloud Web Service API** | Render Inc. | Nền tảng Hosting và triển khai tự động (CI/CD) cho ứng dụng Backend Node.js / Express. | Webhook Auto-deploy từ nhánh `main` / `develop` của GitHub Repository. |
| **Vercel Edge Platform API** | Vercel Inc. | Nền tảng Hosting và triển khai ứng dụng Frontend Single Page Application (React 18 + Vite). | Global CDN Edge Deployment tự động từ GitHub Repository. |

---

## 3. ⚙️ THƯ VIỆN & MÃ NGUỒN MỞ BACKEND (BACKEND TECH STACK)

Toàn bộ hệ thống Backend được xây dựng trên nền tảng **Node.js (ES Modules)** kết hợp với các thư viện mã nguồn mở uy tín:

| Thư viện / Package | Phiên bản | Giấy phép | Mục đích Sử dụng |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>=20.0.0` | MIT | Môi trường thực thi JavaScript server-side. |
| **Express.js** | `^4.19.0` | MIT | Web Framework xử lý định tuyến HTTP Routing, Middleware và Controllers. |
| **pg** (Node-Postgres) | `^8.12.0` | MIT | PostgreSQL Client hỗ trợ Connection Pooling và SQL Query Execution. |
| **jsonwebtoken** (JWT) | `^9.0.0` | MIT | Xây dựng cơ chế xác thực người dùng không trạng thái (Stateless Authentication). |
| **bcryptjs** | `^2.4.3` | MIT | Mã hóa và băm mật khẩu người dùng theo thuật toán Blowfish. |
| **zod** | `^3.23.0` | MIT | Xác thực dữ liệu đầu vào (Input Schema Validation) nghiêm ngặt tại Controller Layer. |
| **cors** | `^2.8.5` | MIT | Cấu hình Cross-Origin Resource Sharing an toàn với Domain Whitelist. |
| **dotenv** | `^16.4.5` | BSD-2-Clause | Quản lý biến môi trường (`.env`) bảo mật cho ứng dụng Backend. |
| **jest** | `^29.7.0` | MIT | Framework kiểm thử đơn vị (Backend Unit Testing) và Service Integration Testing. |
| **supertest** | `^7.0.0` | MIT | Thư viện hỗ trợ mô phỏng HTTP Requests kiểm thử các API Endpoints. |

---

## 4. 💻 THƯ VIỆN & MÃ NGUỒN MỞ FRONTEND (FRONTEND TECH STACK)

Giao diện người dùng được phát triển bằng **React 18** theo kiến trúc Component hóa, đảm bảo hiệu năng cao và trải nghiệm mượt mà:

| Thư viện / Package | Phiên bản | Giấy phép | Mục đích Sử dụng |
| :--- | :--- | :--- | :--- |
| **React** | `^18.3.1` | MIT | Thư viện cốt lõi xây dựng Giao diện Người dùng (User Interface). |
| **React DOM** | `^18.3.1` | MIT | Rendering các linh kiện React vào môi trường Browser DOM. |
| **Vite** | `^5.4.0` | MIT | Build Tool thế hệ mới hỗ trợ Hot Module Replacement (HMR) và đóng gói mã nguồn. |
| **TypeScript** | `^5.5.0` | Apache-2.0 | Hỗ trợ Static Type Checking nâng cao độ an toàn cho mã nguồn Frontend. |
| **TanStack Query** (React Query) | `^5.51.0` | MIT | Quản lý State Server, Caching dữ liệu API, và tự động Refetch thời gian thực. |
| **TailwindCSS** | `^4.0.0` | MIT | Utility-first CSS Framework xây dựng giao diện chuẩn Google Design System. |
| **Zustand** | `^4.5.4` | MIT | Thư viện quản lý Global Client State (User Session, UI Modals, Theme) siêu nhẹ. |
| **Axios** | `^1.7.4` | MIT | HTTP Client thực hiện gửi và nhận API requests với Interceptor xử lý JWT. |
| **Lucide React** | `^0.428.0` | ISC | Bộ Biểu tượng (Icons) đồ họa vector hiện đại. |
| **Sonner** | `^1.5.0` | MIT | Thư viện hiển thị thông báo Toast Notifications mượt mà. |
| **Playwright** | `^1.46.0` | Apache-2.0 | Framework kiểm thử E2E (End-to-End Testing) tự động hóa kịch bản người dùng. |

---

## 5. 📜 CAM KẾT BẢN QUYỀN VÀ TUÂN THỦ (LICENSES & COMPLIANCE)

1. **Mã nguồn mở (Open-Source Compliance):** Tất cả các thư viện và framework phụ thuộc đều nằm trong các giấy phép mã nguồn mở cho phép sử dụng thương mại và phi thương mại (MIT, Apache-2.0, ISC, BSD).
2. **Bảo mật Quyền riêng tư (Double-Blind Privacy):** Hệ thống cam kết không sử dụng API bên ngoài để phân tích thông tin định danh cá nhân (PII). Mọi dữ liệu Họ tên, MSSV, Tên nhóm đều được sanitize loại bỏ ở cấp độ Backend API trước khi hiển thị hoặc gửi tới AI Service.
3. **Bảo vệ API Key:** API Key của AI Service (Google Gemini) chỉ lưu trữ trong biến môi trường phía Server và tuyệt đối không expose dưới phía Client.

---
*Bản kê khai này được cập nhật chính thức đồng bộ theo trạng thái phát triển của dự án PeerReview-AI.*
