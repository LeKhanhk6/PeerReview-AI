export const analyticsMessages = {
  title: 'Bảng Đóng Góp & Giám Sát Lớp Học',
  subtitle: 'Theo dõi chỉ số tham gia, tỷ lệ đóng góp %, phân loại thành viên và cảnh báo rủi ro làm việc nhóm.',

  teacherDashboardTitle: 'Trang tổng quan Giảng viên',
  teacherDashboardSubtitle: 'Tổng quan tình hình học tập, tiến độ nộp bài, chấm chéo và cảnh báo rủi ro nhóm.',

  filter: {
    selectClass: 'Chọn lớp học:',
    allClasses: 'Tất cả các lớp',
  },

  overview: {
    totalClasses: 'Tổng số lớp học',
    totalStudents: 'Tổng số sinh viên',
    totalAssignments: 'Tổng số bài tập',
    submissionRate: 'Tỷ lệ nộp bài',
    reviewCompletionRate: 'Tỷ lệ chấm chéo',
    averageScore: 'Điểm trung bình lớp',
  },

  riskTypes: {
    DEAD_GROUP: 'Nhóm không hoạt động',
    LOW_ACTIVITY: 'Tương tác cá nhân kém',
    LOW_CONTRIBUTION: 'Rủi ro Free-rider (Đóng góp quá thấp)',
    UNBALANCED_CONTRIBUTION: 'Phân chia công việc mất cân bằng',
    INCOMPLETE_TASKS: 'Chậm tiến độ task sát deadline',
    REVIEW_INACTIVITY: 'Trễ hạn chấm chéo bài nộp',
  },

  categories: {
    HIGH: { label: 'Đóng góp cao', emoji: '🌟' },
    NORMAL: { label: 'Bình thường', emoji: '👍' },
    LOW: { label: 'Đóng góp thấp', emoji: '⚠️' },
    FREE_RIDER: { label: 'Cảnh báo Free-rider', emoji: '⚠️' },
    INACTIVE: { label: 'Không hoạt động', emoji: '💤' },
  },

  groupCard: {
    title: 'Nhóm #{groupId}',
    memberCount: '{count} thành viên',
    freeRiderWarning: 'Có thành viên nghi vấn Free-rider',
    normalStatus: 'Hoạt động ổn định',
    viewDetailBtn: 'Xem đóng góp chi tiết',
  },

  modal: {
    title: 'Chi Tiết Đóng Góp Nhóm #{groupId}',
    subtitle: 'Phân tích chi tiết mức độ đóng góp %, số hoạt động và công việc của từng thành viên.',
  },

  table: {
    rank: 'Hạng',
    name: 'Thành viên',
    category: 'Phân loại',
    score: 'Điểm đóng góp',
    activities: 'Số hoạt động',
    tasksAssigned: 'Task được giao',
    tasksCompleted: 'Task hoàn thành',
    tasksCreated: 'Task khởi tạo',
  },

  csv: {
    filenamePrefix: 'bao_cao_dong_gop',
    exportBtn: 'Xuất Báo Cáo CSV',
    headers: {
      groupId: 'Mã nhóm',
      name: 'Họ và tên',
      category: 'Phân loại',
      contributionScore: 'Điểm đóng góp (%)',
      totalActivities: 'Tổng số hoạt động',
      tasksAssigned: 'Task được giao',
      tasksCompleted: 'Task hoàn thành',
      tasksCreated: 'Task khởi tạo',
      isFreeRider: 'Cảnh báo Free-rider',
    },
  },

  empty: {
    noDataTitle: 'Chưa có dữ liệu đóng góp',
    noDataDescription: 'Lớp học hoặc Nhóm hiện chưa phát sinh hoạt động làm việc nhóm nào.',
    noGroupsTitle: 'Chưa có nhóm học phần',
    noGroupsDescription: 'Hãy tạo nhóm học phần cho lớp học để bắt đầu theo dõi đóng góp.',
    noRisksTitle: 'Tất cả các nhóm đang hoạt động tốt! 🛡️',
    noRisksDescription: 'Hệ thống không phát hiện rủi ro hợp tác hoặc nghi vấn free-rider nào trong lớp này.',
  },

  tabs: {
    contribution: '📊 Phân Tích Đóng Góp',
    earlyWarning: '⚠️ Cảnh Báo Sớm',
  },

  severities: {
    HIGH: { label: 'Nghiêm trọng', emoji: '🔴' },
    MEDIUM: { label: 'Cần lưu ý', emoji: '🟡' },
    LOW: { label: 'Mức độ thấp', emoji: '🔵' },
  },

  earlyWarning: {
    title: 'Bảng Cảnh Báo Sớm Rủi Ro',
    subtitle: 'Tự động phát hiện các nhóm hoặc cá nhân gặp rào cản trong quá trình làm việc nhóm.',
    widgetTitle: 'Cảnh báo sớm',
    viewAllBtn: 'Xem tất cả cảnh báo',
    filterSeverity: 'Mức độ rủi ro:',
    allSeverities: 'Tất cả mức độ',
    filterStatus: 'Trạng thái xử lý:',
    activeStatus: 'Đang theo dõi',
    acknowledgedStatus: 'Đã tiếp nhận',
    dismissedStatus: 'Đã bỏ qua',
    actionAcknowledge: 'Tiếp nhận',
    actionDismiss: 'Bỏ qua',
    actionViewGroup: 'Chi tiết Nhóm',
    statusUpdatedToast: 'Đã cập nhật trạng thái cảnh báo.',
  },

  error: {
    fetchFailed: 'Không thể tải dữ liệu phân tích đóng góp. Vui lòng thử lại sau.',
    riskFetchFailed: 'Không thể tải danh sách cảnh báo rủi ro. Vui lòng thử lại sau.',
  },
};
