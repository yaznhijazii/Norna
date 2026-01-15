-- ═══════════════════════════════════════════════════════════════════
-- 🎁 SIMPLE GIFTS FIX - حل بسيط ومباشر
-- ═══════════════════════════════════════════════════════════════════
-- نفذ كل سطر لوحده في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. حذف الجدول القديم (⚠️ سيحذف كل البيانات!)
DROP TABLE IF EXISTS gifts CASCADE;

-- 2. إنشاء جدول جديد
CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  gift_type TEXT NOT NULL CHECK (gift_type IN ('rose', 'heart', 'message')),
  message_text TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  CONSTRAINT different_users CHECK (from_user_id != to_user_id)
);

-- 3. إضافة Indexes
CREATE INDEX idx_gifts_to_user_unread ON gifts(to_user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_gifts_to_user ON gifts(to_user_id, created_at DESC);
CREATE INDEX idx_gifts_from_user ON gifts(from_user_id, created_at DESC);
CREATE INDEX idx_gifts_created_at ON gifts(created_at DESC);

-- 4. تعطيل RLS (للتطوير)
ALTER TABLE gifts DISABLE ROW LEVEL SECURITY;

-- 5. تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE gifts;

-- 6. اختبار (نفذ هذا السطر لوحده)
INSERT INTO gifts (from_user_id, to_user_id, gift_type, is_read)
VALUES ('test_1', 'test_2', 'rose', false);

-- 7. حذف الاختبار (نفذ هذا السطر لوحده)
DELETE FROM gifts WHERE from_user_id = 'test_1';

-- ✅ تم! الآن جرب إرسال هدية من التطبيق
