export interface GroupMember {
  id: string;
  full_name: string;
  email: string;
  student_id?: string | null;
  is_leader: boolean;
  joined_at: string;
}

export interface Group {
  id: string;
  name: string;
  class_id?: string;
  teacherId?: string;
  created_at: string;
  member_count?: number;
  members: GroupMember[];
}

export interface CreateGroupPayload {
  class_id: string;
  name: string;
}

export interface AddMemberPayload {
  groupId: string;
  user_id: string;
}

export interface RemoveMemberPayload {
  groupId: string;
  userId: string;
}

export interface AssignLeaderPayload {
  groupId: string;
  user_id: string;
}
