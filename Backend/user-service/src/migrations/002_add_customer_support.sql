-- Backend/user-service/src/migrations/002_add_customer_support_role.sql

-- Drop existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with customer-support role
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('customer', 'owner', 'admin', 'support'));

-- Insert sample customer support user for testing
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_verified, avatar_url)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440030',
   'support@wiz.com',
   '$2b$10$Fzb0rZVkkA1dNLJ3z0yzxuQCxpDBL8par8c8KPU.jlhzblFkGJy7a', -- SupportPass123!
   'Customer Support',
   '+84 900 000 003',
   'support',
   TRUE,
   NULL)
ON CONFLICT (user_id) DO NOTHING;