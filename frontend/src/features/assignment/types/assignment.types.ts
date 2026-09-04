export interface AssignmentAttachment {
  id: string;
  assignment_id?: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at?: string;
  status?: 'uploading' | 'success' | 'error';
  progress?: number;
}

export interface RubricCriteria {
  id?: string;
  rubric_id?: string;
  name: string;
  description?: string | null;
  weight: number;
  created_at?: string;
}

export interface Rubric {
  id?: string;
  assignment_id: string;
  description?: string | null;
  criteria: RubricCriteria[];
  created_at?: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  class_name?: string;
  title: string;
  description?: string | null;
  requirements?: string | null;
  deadline: string;
  created_at: string;
  rubric?: Rubric | null;
  has_rubric?: boolean;
  attachments?: AssignmentAttachment[];
}

export interface CreateAssignmentInput {
  class_id: string;
  title: string;
  description?: string | null;
  requirements?: string | null;
  deadline: string;
  attachments?: Omit<AssignmentAttachment, 'id' | 'status' | 'progress'>[];
}

export interface UpdateAssignmentInput {
  title: string;
  description?: string | null;
  requirements?: string | null;
  deadline: string;
  attachments?: Omit<AssignmentAttachment, 'id' | 'status' | 'progress'>[];
}

export interface SaveRubricInput {
  description?: string | null;
  criteria: {
    name: string;
    description?: string | null;
    weight: number;
  }[];
}

export interface AssignmentFilterParams {
  classId?: string;
  page?: number;
  limit?: number;
  search?: string;
}
