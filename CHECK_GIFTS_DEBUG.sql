-- ═══════════════════════════════════════════════════════════════════
-- 🎁 GIFTS DEBUG - CHECK EVERYTHING
-- ═══════════════════════════════════════════════════════════════════

-- 1️⃣ Check gifts table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'gifts'
ORDER BY ordinal_position;

-- 2️⃣ Check RLS policies on gifts table
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'gifts';

-- 3️⃣ Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'gifts';

-- 4️⃣ Show recent gifts
SELECT 
    id,
    from_user_id,
    to_user_id,
    gift_type,
    message_text,
    is_read,
    created_at
FROM gifts
ORDER BY created_at DESC
LIMIT 10;

-- 5️⃣ Show users with partner links
SELECT 
    user_id,
    name,
    email,
    partner_id,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 6️⃣ Check constraints on gifts table
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'gifts';

-- ═══════════════════════════════════════════════════════════════════
-- 🔧 QUICK FIXES
-- ═══════════════════════════════════════════════════════════════════

-- ✅ If RLS is causing issues, disable it:
-- ALTER TABLE gifts DISABLE ROW LEVEL SECURITY;

-- ✅ If "different_users" constraint is causing issues, drop it:
-- ALTER TABLE gifts DROP CONSTRAINT IF EXISTS different_users;

-- ✅ To re-enable RLS later:
-- ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- ✅ To add back the constraint later:
-- ALTER TABLE gifts ADD CONSTRAINT different_users 
--   CHECK (from_user_id != to_user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 🧪 TEST DATA
-- ═══════════════════════════════════════════════════════════════════

-- Create 2 test users (if needed)
/*
INSERT INTO users (user_id, name, email, created_at)
VALUES 
  ('test-sender-123', 'المرسل', 'sender@test.com', NOW()),
  ('test-receiver-456', 'المستقبل', 'receiver@test.com', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Link them as partners
UPDATE users SET partner_id = 'test-receiver-456' WHERE user_id = 'test-sender-123';
UPDATE users SET partner_id = 'test-sender-123' WHERE user_id = 'test-receiver-456';

-- Send a test gift
INSERT INTO gifts (from_user_id, to_user_id, gift_type, is_read, created_at)
VALUES ('test-sender-123', 'test-receiver-456', 'rose', FALSE, NOW());

-- Check if it was inserted
SELECT * FROM gifts WHERE to_user_id = 'test-receiver-456' ORDER BY created_at DESC LIMIT 1;
*/
