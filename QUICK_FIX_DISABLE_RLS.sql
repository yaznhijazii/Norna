-- ═══════════════════════════════════════════════════════════════════
-- ⚡ QUICK FIX - تعطيل RLS مؤقتاً للاختبار
-- ═══════════════════════════════════════════════════════════════════
-- نفذ هذا الملف في Supabase SQL Editor
-- هذا حل مؤقت للتطوير فقط!
-- ═══════════════════════════════════════════════════════════════════

-- 1️⃣ تعطيل RLS (مؤقتاً!)
ALTER TABLE gifts DISABLE ROW LEVEL SECURITY;

-- 2️⃣ حذف جميع الـ Policies
DROP POLICY IF EXISTS "authenticated_users_can_insert_gifts" ON gifts;
DROP POLICY IF EXISTS "users_can_view_their_gifts" ON gifts;
DROP POLICY IF EXISTS "authenticated_users_can_update_gifts" ON gifts;
DROP POLICY IF EXISTS "Users can send gifts to their partner" ON gifts;
DROP POLICY IF EXISTS "Users can view their received gifts" ON gifts;
DROP POLICY IF EXISTS "Users can update their received gifts" ON gifts;
DROP POLICY IF EXISTS "Users can view sent and received gifts" ON gifts;
DROP POLICY IF EXISTS "Users can send gifts" ON gifts;
DROP POLICY IF EXISTS "Users can mark gifts as read" ON gifts;
DROP POLICY IF EXISTS "Users can view their gifts" ON gifts;
DROP POLICY IF EXISTS "Users can mark their gifts as read" ON gifts;

-- 3️⃣ تحقق من أن RLS معطل
SELECT 
  tablename,
  rowsecurity as "RLS Enabled (should be 'f')"
FROM pg_tables
WHERE tablename = 'gifts' 
  AND schemaname = 'public';

-- 4️⃣ تحقق من عدد الـ Policies (يجب أن يكون 0)
SELECT COUNT(*) as "Policies Count (should be 0)"
FROM pg_policies
WHERE tablename = 'gifts';

RAISE NOTICE '🎉 RLS DISABLED! الآن جرب إرسال هدية';

-- ═══════════════════════════════════════════════════════════════════
-- ⚠️ ملاحظة مهمة:
-- هذا حل مؤقت للتطوير فقط!
-- بعد ما تتأكد أن كل شي شغال، نفعّل RLS من جديد
-- ═══════════════════════════════════════════════════════════════════
