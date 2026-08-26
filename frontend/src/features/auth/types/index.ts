export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  capabilities?: {
    audit_enabled?: boolean;
  };
  avatar_url?: string;
  student_id?: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
