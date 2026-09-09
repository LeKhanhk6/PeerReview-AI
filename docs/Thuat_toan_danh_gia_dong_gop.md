# 5.3 Thuật toán đánh giá đóng góp nội bộ nhóm

Để phân hóa số điểm công bằng trong bài tập nhóm, hệ thống xây dựng mô hình định lượng đa chiều thể hiện qua Biểu đồ Ra-đa và Hệ số đóng góp cá nhân.

### a) Cấu trúc Vecto đánh giá đa chiều

Mỗi thành viên $m_i$ trong nhóm gồm $M$ thành viên ($M \ge 2$) được các thành viên còn lại đánh giá ẩn danh dựa trên 4 chiều tiêu chí độc lập:

$$
V_i = \left[ C_1^{(i)}, C_2^{(i)}, C_3^{(i)}, C_4^{(i)} \right]
$$

Giao việc -> User thực hiện task -> Tính % hoàn thành nhiệm vụ + Hoạt động trong nền tảng
- $C_1$ (Workload Completion): Tỷ lệ phần trăm hoàn thành khối lượng công việc được giao ($0\% \le C_1 \le 100\%$)
- $C_2$ (Artifact Quality): Điểm chất lượng đầu ra của phần việc cá nhân (thang điểm chuẩn hóa 1-5)
- $C_3$ (Timeliness & Commitment): Mức độ tuân thủ hạn chót và trách nhiệm công việc (Thang điểm 1-5)
- $C_4$ (Teamwork & Communication): Khả năng phối hợp, tinh thần hỗ trợ và giao tiếp nhóm (thang điểm 1-5)

### b) Mô hình tính toán điểm đóng góp tổng hợp

Điểm trung bình tiêu chí thứ $k$ của thành viên $m_i$ do $M - 1$ đồng đội chấm được tính theo công thức:

$$
\bar{C}_k^{(i)} = \frac{1}{M - 1} \sum_{p=1, p \neq i}^{M} C_k^{(p \rightarrow i)}
$$

Điểm đóng góp toàn diện (Overall Contribution Score - $S_i$) của thành viên $m_i$ là tổ hợp tuyến tính có trọng số:

$$
S_i = w_1 \cdot \left( \frac{\bar{C}_1^{(i)}}{100} \right) + w_2 \cdot \left( \frac{\bar{C}_2^{(i)}}{5} \right) + w_3 \cdot \left( \frac{\bar{C}_3^{(i)}}{5} \right) + w_4 \cdot \left( \frac{\bar{C}_4^{(i)}}{5} \right)
$$

(Trong đó $\sum_{t=1}^{4} w_t = 1.0$; mặc định thiết lập trọng số đồng đều $w_1 = 0.35, w_2 = 0.30, w_3 = 0.20, w_4 = 0.15$).

### c) Trực quan hóa và Quy đổi điểm cá nhân

- **Biểu đồ Ra-đa:** Trực quan hóa đa giác 4 đỉnh $[\bar{C}_1, \bar{C}_2, \bar{C}_3, \bar{C}_4]$ giúp giảng viên nhận diện tức thì điểm mạnh, điểm yếu và mức độ tham gia thực tế của từng sinh viên.
- **Quy đổi điểm cá nhân từ điểm tổng kết nhóm:**

$$
G_{\text{individual}}^{(i)} = G_{\text{group}} \times \left( \frac{S_i}{\frac{1}{M} \sum_{j=1}^{M} S_j} \right)
$$
