-- ═══════════════════════════════════════════════════════════════════
-- 🔍 VERIFY GIFTS TABLE - تحقق من إعدادات جدول الهدايا
-- ═══════════════════════════════════════════════════════════════════
-- نفذ هذا الملف كامل في Supabase SQL Editor للتحقق من الإعدادات
-- ═══════════════════════════════════════════════════════════════════

-- 1️⃣ تحقق من وجود الجدول
SELECT 
  'gifts' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'gifts' AND schemaname = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END as status;

-- 2️⃣ تحقق من RLS
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = false THEN '✅ DISABLED (Good for testing!)'
    WHEN rowsecurity = true THEN '⚠️ ENABLED (May cause issues)'
  END as rls_status
FROM pg_tables
WHERE tablename = 'gifts' AND schemaname = 'public';

-- 3️⃣ تحقق من الـ Policies
SELECT 
  COUNT(*) as policies_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO POLICIES (Good for testing!)'
    ELSE '⚠️ HAS POLICIES (May cause issues)'
  END as policies_status
FROM pg_policies
WHERE tablename = 'gifts';

-- 4️⃣ تحقق من الـ Indexes
SELECT 
  indexname,
  '✅ OK' as status
FROM pg_indexes
WHERE tablename = 'gifts' AND schemaname = 'public'
ORDER BY indexname;

-- 5️⃣ تحقق من Realtime
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'gifts'
  ) THEN '✅ REALTIME ENABLED' ELSE '❌ REALTIME DISABLED' END as realtime_status;

-- 6️⃣ تحقق من الـ Columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'gifts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7️⃣ عرض جميع الهدايا (للتحقق من البيانات)
SELECT 
  id,
  from_user_id,
  to_user_id,
  gift_type,
  is_read,
  created_at
FROM gifts
ORDER BY created_at DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ إذا شفت جميع النتائج خضراء، معناها كل شي تمام!
-- ❌ إذا شفت شي أحمر، نفذ /COMPLETE_GIFTS_FIX_V2.sql
-- ═══════════════════════════════════════════════════════════════════
