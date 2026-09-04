export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type GroupRole = 'LEADER' | 'MEMBER';

export interface TaskItem {
  id: number | string;
  group_id: string;
  title: string;
  status: TaskStatus;
  assignee_id: string | null;
  assignee_name?: string;
  created_by?: string;
  created_at?: string;
  completed_at?: string | null;
}

export interface DiscussionMessage {
  id: number | string;
  group_id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  message: string;
  created_at: string;
}

export interface ActivityLog {
  id: number | string;
  group_id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  action_type: string;
  metadata?: any;
  content_summary?: string;
  created_at: string;
}

export interface GroupFileItem {
  id: number | string;
  group_id: string;
  uploaded_by?: string;
  uploader_name?: string;
  uploader_role?: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export interface GroupWorkspaceInfo {
  groupId: string;
  groupName: string;
  classId: string;
  className: string;
  userRole: GroupRole;
  members: Array<{ id: string; name: string }>;
}
