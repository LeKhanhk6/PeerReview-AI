export interface Class {
  id: string;
  teacher_id: string;
  course_code: string;
  course_name: string;
  name: string;
  invite_code: string;
  semester?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface ClassMember {
  id: string;
  full_name: string;
  email: string;
  student_id?: string;
  joined_at: string;
  role: string;
}

export interface CreateClassDTO {
  course_code: string;
  course_name: string;
  name: string;
  semester?: string;
}

export interface UpdateClassDTO {
  course_code?: string;
  course_name?: string;
  name?: string;
  semester?: string;
}
