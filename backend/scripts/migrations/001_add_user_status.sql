-- ==============================================================================
-- MIGRATION: Add status column to users table for Admin User Management
-- ==============================================================================

-- 1. Bổ sung cột status với mặc định là 'ACTIVE'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';

-- 2. Cập nhật các bản ghi hiện có nếu status đang là NULL
UPDATE users 
SET status = 'ACTIVE' 
WHERE status IS NULL;

-- 3. Bổ sung Ràng buộc Check (Constraint) cho trạng thái tài khoản hợp lệ
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS chk_user_status;

ALTER TABLE users 
ADD CONSTRAINT chk_user_status 
CHECK (status IN ('ACTIVE', 'LOCKED', 'INACTIVE'));
