export const submissionMessages = {
  title: 'Nộp Bài Tập Học Phần',
  subtitle: 'Tải bài nộp, quản lý danh sách phiên bản v1, v2... và xem phản hồi đánh giá chấm chéo.',

  countdown: {
    title: 'Hạn Nộp Bài Tập',
    days: 'ngày',
    hours: 'giờ',
    minutes: 'phút',
    seconds: 'giây',
    statusOpen: 'Đang mở nộp bài',
    statusUrgent: 'Sắp hết hạn (Dưới 24h)',
    statusExpired: 'Đã quá hạn nộp',
    lateWarning: 'Bạn đang nộp bài muộn so với thời hạn quy định.',
  },

  form: {
    title: 'Tải Bài Nộp Mới',
    selectFileLabel: 'Chọn tệp bài nộp (.pdf, .docx, .zip, .rar) *',
    uploadProgress: 'Đang tải file lên...',
    submitBtn: 'Gửi bài nộp',
    retryBtn: 'Thử lại',
    cancelBtn: 'Hủy',
    uploadSuccess: 'Đã nộp bài tập thành công!',
    isUploadingWarning: 'Đang tiến hành tải file nộp bài. Bạn có chắc muốn rời khỏi trang?',
  },

  history: {
    title: 'Lịch Sử Các Phiên Bản Đã Nộp',
    versionColumn: 'Phiên bản',
    fileNameColumn: 'Tên tệp bài nộp',
    submittedAtColumn: 'Thời gian nộp',
    downloadColumn: 'Tải về',
    currentBadge: 'Phiên bản hiện tại',
    lateBadge: 'Nộp muộn',
    emptyTitle: 'Chưa có phiên bản bài nộp nào',
    emptyDesc: 'Bạn chưa nộp bài tập nào cho bài tập này. Hãy tải bài nộp đầu tiên!',
  },

  feedback: {
    title: 'Phản Hồi & Đánh Giá Bài Nộp',
    scoreTitle: 'Điểm Số Tổng Hợp',
    teacherFeedbackTitle: 'Nhận Xét Từ Giáo Viên',
    peerReviewsTitle: 'Đánh Giá Từ Các Bạn Trong Lớp',
    reviewerName: 'Người chấm #{id}',
    emptyTitle: 'Chưa có phản hồi đánh giá',
    emptyDesc: 'Bài nộp hiện đang trong quá trình chấm chéo hoặc giáo viên chưa công bố kết quả.',
  },

  offline: {
    bannerMessage: 'Kết nối Internet bị ngắt. Nút nộp bài tạm thời bị khóa để tránh mất dữ liệu.',
    restoredMessage: 'Kết nối Internet đã được phục hồi! Bạn có thể tiếp tục nộp bài.',
  },

  error: {
    fetchFailed: 'Không thể tải thông tin nộp bài. Vui lòng thử lại sau.',
    submitFailed: 'Không thể nộp bài tập. Vui lòng kiểm tra file và thử lại.',
    offlineSubmitError: 'Không thể nộp bài khi mất mạng. Vui lòng kết nối Internet.',
  },
};
