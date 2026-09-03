-- ==============================================================================
-- DATABASE MOCK SEED FILE CHO PEERREVIEW-AI (E2E TESTING)
-- Mật khẩu cho toàn bộ tài khoản là: password123
-- ==============================================================================

DO $$
DECLARE
  v_admin_role_id UUID;
  v_teacher_role_id UUID;
  v_student_role_id UUID;
  v_teacher_id UUID;
  v_student1_id UUID;
  v_student2_id UUID;
  v_student3_id UUID;
  v_class_id UUID;
  v_assignment_id UUID;
  v_group1_id UUID;
  v_group2_id UUID;
  v_password_hash_val VARCHAR := '$2b$10$aGRBr5US2jWlZHo2ndIOJ.HEeb8fRwZ6pfpCGZiz.Jxd8DkNHEG.a';
BEGIN
  -- 1. SEED ROLES
  INSERT INTO roles (name) VALUES ('ADMIN'), ('TEACHER'), ('STUDENT') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'ADMIN';
  SELECT id INTO v_teacher_role_id FROM roles WHERE name = 'TEACHER';
  SELECT id INTO v_student_role_id FROM roles WHERE name = 'STUDENT';

  -- 2. SEED USERS
  INSERT INTO users (role_id, email, password_hash, full_name, student_id, status)
  VALUES 
    (v_admin_role_id, 'admin@example.com', v_password_hash_val, 'System Admin', NULL, 'ACTIVE'),
    (v_teacher_role_id, 'teacher01@example.com', v_password_hash_val, 'Giảng viên A', NULL, 'ACTIVE'),
    (v_student_role_id, 'student01@example.com', v_password_hash_val, 'Sinh viên 01', 'SV001', 'ACTIVE'),
    (v_student_role_id, 'student02@example.com', v_password_hash_val, 'Sinh viên 02', 'SV002', 'ACTIVE'),
    (v_student_role_id, 'student03@example.com', v_password_hash_val, 'Sinh viên 03', 'SV003', 'ACTIVE')
  ON CONFLICT (email) DO UPDATE SET 
    role_id = EXCLUDED.role_id,
    password_hash = EXCLUDED.password_hash,
    status = 'ACTIVE';

  SELECT id INTO v_teacher_id FROM users WHERE email = 'teacher01@example.com';
  SELECT id INTO v_student1_id FROM users WHERE email = 'student01@example.com';
  SELECT id INTO v_student2_id FROM users WHERE email = 'student02@example.com';
  SELECT id INTO v_student3_id FROM users WHERE email = 'student03@example.com';

  -- 3. SEED CLASSES
  INSERT INTO classes (teacher_id, course_code, course_name, name, invite_code, semester)
  VALUES 
    (v_teacher_id, 'CSC10001', 'Cấu trúc dữ liệu', 'Lớp 01 - Cấu trúc dữ liệu', 'INVITE_E2E_01', 'HK2026')
  ON CONFLICT (invite_code) DO NOTHING;

  SELECT id INTO v_class_id FROM classes WHERE invite_code = 'INVITE_E2E_01' LIMIT 1;

  -- 4. SEED CLASS MEMBERS
  INSERT INTO class_members (class_id, user_id, role)
  VALUES 
    (v_class_id, v_student1_id, 'STUDENT'),
    (v_class_id, v_student2_id, 'STUDENT'),
    (v_class_id, v_student3_id, 'STUDENT')
  ON CONFLICT (class_id, user_id) DO NOTHING;

  -- 5. SEED ASSIGNMENTS
  SELECT id INTO v_assignment_id FROM assignments WHERE title = 'Bài tập lớn: B-Tree' AND class_id = v_class_id LIMIT 1;
  IF v_assignment_id IS NULL THEN
    INSERT INTO assignments (class_id, title, description, requirements, deadline)
    VALUES 
      (v_class_id, 'Bài tập lớn: B-Tree', 'Triển khai B-Tree bằng C++', 'Yêu cầu có đủ hàm Insert, Delete, Search', NOW() + INTERVAL '7 days')
    RETURNING id INTO v_assignment_id;
  END IF;

  -- 6. SEED RUBRICS
  INSERT INTO rubrics (assignment_id, description)
  VALUES 
    (v_assignment_id, 'Khung chấm điểm đồ án B-Tree')
  ON CONFLICT (assignment_id) DO NOTHING;

  -- 8. SEED GROUPS
  SELECT id INTO v_group1_id FROM groups WHERE name = 'Nhóm 1' AND class_id = v_class_id LIMIT 1;
  IF v_group1_id IS NULL THEN
    INSERT INTO groups (class_id, name) VALUES (v_class_id, 'Nhóm 1') RETURNING id INTO v_group1_id;
  END IF;

  SELECT id INTO v_group2_id FROM groups WHERE name = 'Nhóm 2' AND class_id = v_class_id LIMIT 1;
  IF v_group2_id IS NULL THEN
    INSERT INTO groups (class_id, name) VALUES (v_class_id, 'Nhóm 2') RETURNING id INTO v_group2_id;
  END IF;

  -- 9. SEED GROUP MEMBERS
  INSERT INTO group_members (group_id, user_id, is_leader)
  VALUES 
    (v_group1_id, v_student1_id, TRUE),
    (v_group1_id, v_student2_id, FALSE),
    (v_group2_id, v_student3_id, TRUE)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- 10. SEED SYSTEM CONFIG
  INSERT INTO system_config (key, value, description, updated_by)
  VALUES 
    ('audit_logging_enabled', 'true', 'Tự động ghi vết mọi thao tác nhạy cảm vào activity_logs', 'SYSTEM'),
    ('telemetry_enabled', 'true', 'Thu thập lỗi runtime và báo cáo sự cố mạng (/api/client-errors)', 'SYSTEM'),
    ('rate_limit_ai_mentor', '30', 'Giới hạn số request AI Mentor mỗi phút per sinh viên', 'SYSTEM'),
    ('pii_sanitization_mode', 'STRICT', 'Chế độ mã hóa PII thông tin sinh viên và người chấm', 'SYSTEM')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

END $$;
