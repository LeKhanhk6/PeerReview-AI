export const workspaceMessages = {
  title: 'Không Gian Làm Việc Nhóm',
  subtitle: 'Quản lý danh sách công việc Kanban, thảo luận nội bộ nhóm và theo dõi lịch sử hoạt động.',

  tabs: {
    kanban: '📋 Bảng Công Việc',
    discussions: '💬 Thảo Luận Nhóm',
    timeline: '📜 Nhật Ký Hoạt Động',
    files: '📁 Tài Liệu Nhóm',
  },

  autoRefreshInfo: '🔄 Dữ liệu được tự động làm mới',

  kanban: {
    title: 'Bảng Công Việc Kanban',
    createTaskBtn: '+ Thêm công việc',
    columnTodo: '📋 Cần làm (TODO)',
    columnInProgress: '🚧 Đang làm (IN PROGRESS)',
    columnDone: '✅ Hoàn thành (DONE)',
    unassigned: 'Chưa phân công',
    assignedTo: 'Người làm:',
    moveRight: 'Chuyển tiếp',
    moveLeft: 'Lùi lại',
    deleteTask: 'Xóa task',
    confirmDelete: 'Bạn có chắc chắn muốn xóa công việc này?',
    deleteSuccess: 'Đã xóa công việc.',
    createSuccess: 'Đã tạo công việc mới.',
    updateSuccess: 'Đã cập nhật trạng thái công việc.',
    modalTitle: 'Tạo Công Việc Mới',
    taskTitleLabel: 'Tên công việc *',
    taskTitlePlaceholder: 'Nhập tên hoặc mô tả ngắn gọn công việc...',
    assigneeLabel: 'Gán người thực hiện',
    selectAssignee: '-- Chọn thành viên --',
  },

  discussions: {
    title: 'Kênh Thảo Luận Nhóm',
    placeholder: 'Nhập tin nhắn thảo luận nhóm...',
    sendBtn: 'Gửi tin nhắn',
    emptyTitle: 'Chưa có thảo luận nào',
    emptyDesc: 'Hãy khởi xướng cuộc trò chuyện đầu tiên với các thành viên trong nhóm!',
    sendSuccess: 'Đã gửi tin nhắn.',
  },

  timeline: {
    title: 'Lịch Sử Hoạt Động Nhóm',
    emptyTitle: 'Chưa có nhật ký hoạt động',
    emptyDesc: 'Mọi hoạt động tạo công việc, thảo luận và tải file sẽ tự động lưu tại đây.',
    loadMore: 'Tải thêm hoạt động cũ hơn',
  },

  files: {
    title: 'Tài Liệu & Tệp Nhóm',
    uploadBtn: '+ Tải file lên',
    fileName: 'Tên tệp',
    uploadedBy: 'Người tải lên',
    createdAt: 'Ngày tải',
    downloadBtn: 'Tải xuống',
    deleteBtn: 'Xóa file',
    emptyTitle: 'Chưa có tài liệu nào',
    emptyDesc: 'Tải lên các tệp mã nguồn, tài liệu thiết kế hoặc báo cáo nhóm tại đây.',
    uploadSuccess: 'Đã tải file lên nhóm thành công.',
  },

  empty: {
    noTasksTitle: 'Chưa có công việc nào',
    noTasksDesc: 'Nhóm của bạn chưa có công việc trong danh sách này.',
    noGroupTitle: 'Không tìm thấy nhóm học phần',
    noGroupDesc: 'Bạn chưa gia nhập nhóm hoặc nhóm không tồn tại.',
  },

  error: {
    fetchFailed: 'Không thể tải dữ liệu không gian nhóm. Vui lòng thử lại sau.',
    createTaskFailed: 'Không thể tạo công việc.',
    updateTaskFailed: 'Không thể cập nhật công việc.',
    deleteTaskFailed: 'Không thể xóa công việc.',
    sendMessageFailed: 'Không thể gửi tin nhắn.',
  },

  deadline: {
    unspecified: 'Không xác định',
    expiredToday: 'Quá hạn nộp bài',
    expiredDaysAgo: 'Đã quá hạn {days} ngày',
    dueToday: 'Hạn nộp hôm nay',
    daysLeft: 'Còn {days} ngày',
  },
};
