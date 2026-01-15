-- ═══════════════════════════════════════════════════════════════════
-- 🎁 GIFTS SCHEMA - من الصفر
-- ═══════════════════════════════════════════════════════════════════
-- نفذ هذا الملف كامل في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- 🗑️ STEP 1: حذف كل شي قديم
-- ═══════════════════════════════════════════════════════════════════

-- حذف الـ Policies القديمة
DROP POLICY IF EXISTS "Users can send gifts to their partner" ON gifts;
DROP POLICY IF EXISTS "Users can view their received gifts" ON gifts;
DROP POLICY IF EXISTS "Users can update their received gifts" ON gifts;
DROP POLICY IF EXISTS "Users can view sent and received gifts" ON gifts;
DROP POLICY IF EXISTS "Users can send gifts" ON gifts;
DROP POLICY IF EXISTS "Users can mark gifts as read" ON gifts;

-- حذف الـ Indexes القديمة
DROP INDEX IF EXISTS idx_gifts_to_user_unread;
DROP INDEX IF EXISTS idx_gifts_created_at;
DROP INDEX IF EXISTS idx_gifts_from_user;

-- حذف الـ Table القديمة (⚠️ سيحذف كل البيانات!)
DROP TABLE IF EXISTS gifts CASCADE;


-- ═══════════════════════════════════════════════════════════════════
-- ✨ STEP 2: إنشاء Table جديدة من الصفر
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE gifts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User References (TEXT لأن الـ users table تستخدم TEXT)
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  
  -- Gift Details
  gift_type TEXT NOT NULL CHECK (gift_type IN ('rose', 'heart', 'message')),
  message_text TEXT,
  
  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_gift_type CHECK (gift_type IN ('rose', 'heart', 'message')),
  CONSTRAINT message_required_for_type CHECK (
    (gift_type = 'message' AND message_text IS NOT NULL) OR
    (gift_type != 'message')
  ),
  CONSTRAINT different_users CHECK (from_user_id != to_user_id)
);

-- تفعيل RLS
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════
-- 📊 STEP 3: إنشاء Indexes للأداء
-- ═══════════════════════════════════════════════════════════════════

-- Index للهدايا غير المقروءة (أهم query)
CREATE INDEX idx_gifts_to_user_unread 
  ON gifts(to_user_id, is_read, created_at DESC) 
  WHERE is_read = false;

-- Index للمستقبل
CREATE INDEX idx_gifts_to_user 
  ON gifts(to_user_id, created_at DESC);

-- Index للمرسل
CREATE INDEX idx_gifts_from_user 
  ON gifts(from_user_id, created_at DESC);

-- Index للتاريخ
CREATE INDEX idx_gifts_created_at 
  ON gifts(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════
-- 🔒 STEP 4: RLS Policies (سياسات الأمان)
-- ═══════════════════════════════════════════════════════════════════

-- Policy 1: المستخدمين يقدرون يشوفون الهدايا المرسلة لهم أو منهم
CREATE POLICY "Users can view their gifts"
  ON gifts
  FOR SELECT
  USING (
    to_user_id = auth.uid()::text 
    OR 
    from_user_id = auth.uid()::text
  );

-- Policy 2: المستخدمين يقدرون يرسلون هدايا (بدون قيود - يتحقق من الشريك في الـ app)
CREATE POLICY "Users can send gifts"
  ON gifts
  FOR INSERT
  WITH CHECK (
    from_user_id = auth.uid()::text
  );

-- Policy 3: المستخدمين يقدرون يحدثون is_read و read_at للهدايا المستلمة فقط
CREATE POLICY "Users can mark their gifts as read"
  ON gifts
  FOR UPDATE
  USING (to_user_id = auth.uid()::text)
  WITH CHECK (to_user_id = auth.uid()::text);

-- Policy 4: لا أحد يقدر يحذف الهدايا (اختياري - احذفه إذا تبي تسمح بالحذف)
-- CREATE POLICY "No one can delete gifts"
--   ON gifts
--   FOR DELETE
--   USING (false);


-- ═══════════════════════════════════════════════════════════════════
-- 🔔 STEP 5: تفعيل Realtime
-- ═══════════════════════════════════════════════════════════════════

-- تفعيل Realtime للـ gifts table
ALTER PUBLICATION supabase_realtime ADD TABLE gifts;


-- ═══════════════════════════════════════════════════════════════════
-- 🎯 STEP 6: Helper Functions (اختياري)
-- ═══════════════════════════════════════════════════════════════════

-- Function لإرسال هدية بأمان
CREATE OR REPLACE FUNCTION send_gift(
  p_to_user_id TEXT,
  p_gift_type TEXT,
  p_message_text TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_user_id TEXT;
  v_gift_id UUID;
BEGIN
  -- الحصول على ID المستخدم الحالي
  v_from_user_id := auth.uid()::text;
  
  -- التحقق من تسجيل الدخول
  IF v_from_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- التحقق من أن المستخدم لا يرسل لنفسه
  IF v_from_user_id = p_to_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot send gift to yourself'
    );
  END IF;
  
  -- التحقق من نوع الهدية
  IF p_gift_type NOT IN ('rose', 'heart', 'message') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid gift type'
    );
  END IF;
  
  -- التحقق من النص إذا كان نوع الهدية "message"
  IF p_gift_type = 'message' AND (p_message_text IS NULL OR TRIM(p_message_text) = '') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Message text is required for message type'
    );
  END IF;
  
  -- إدراج الهدية
  INSERT INTO gifts (
    from_user_id, 
    to_user_id, 
    gift_type, 
    message_text, 
    is_read,
    created_at
  )
  VALUES (
    v_from_user_id,
    p_to_user_id,
    p_gift_type,
    CASE WHEN p_gift_type = 'message' THEN TRIM(p_message_text) ELSE NULL END,
    false,
    NOW()
  )
  RETURNING id INTO v_gift_id;
  
  -- إرجاع النتيجة
  RETURN json_build_object(
    'success', true,
    'gift_id', v_gift_id,
    'message', 'Gift sent successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- إعطاء صلاحية التنفيذ للمستخدمين المسجلين
GRANT EXECUTE ON FUNCTION send_gift TO authenticated;


-- Function لتحديث حالة القراءة
CREATE OR REPLACE FUNCTION mark_gift_as_read(
  p_gift_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id TEXT;
  v_to_user_id TEXT;
BEGIN
  -- الحصول على ID المستخدم الحالي
  v_user_id := auth.uid()::text;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- التحقق من أن الهدية موجهة للمستخدم الحالي
  SELECT to_user_id INTO v_to_user_id
  FROM gifts
  WHERE id = p_gift_id;
  
  IF v_to_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Gift not found');
  END IF;
  
  IF v_to_user_id != v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  
  -- تحديث الهدية
  UPDATE gifts
  SET 
    is_read = true,
    read_at = NOW()
  WHERE id = p_gift_id;
  
  RETURN json_build_object('success', true, 'message', 'Gift marked as read');
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION mark_gift_as_read TO authenticated;


-- Function لحذف الهدايا القديمة المقروءة (صيانة)
CREATE OR REPLACE FUNCTION cleanup_old_read_gifts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- حذف الهدايا المقروءة الأقدم من 30 يوم
  DELETE FROM gifts
  WHERE is_read = true 
    AND read_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- ✅ STEP 7: تحقق من أن كل شي شغال
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_rls_enabled BOOLEAN;
  v_policies_count INTEGER;
  v_indexes_count INTEGER;
BEGIN
  -- التحقق من وجود الجدول
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'gifts' AND table_schema = 'public'
  ) INTO v_table_exists;
  
  RAISE NOTICE '✅ Gifts table exists: %', v_table_exists;
  
  -- التحقق من تفعيل RLS
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables
  WHERE tablename = 'gifts' AND schemaname = 'public';
  
  RAISE NOTICE '✅ RLS enabled: %', v_rls_enabled;
  
  -- عدد الـ Policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE tablename = 'gifts';
  
  RAISE NOTICE '✅ Number of policies: %', v_policies_count;
  
  -- عدد الـ Indexes
  SELECT COUNT(*) INTO v_indexes_count
  FROM pg_indexes
  WHERE tablename = 'gifts' AND schemaname = 'public';
  
  RAISE NOTICE '✅ Number of indexes: %', v_indexes_count;
  
  -- التحقق من الـ Functions
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_gift') THEN
    RAISE NOTICE '✅ Function send_gift exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_gift_as_read') THEN
    RAISE NOTICE '✅ Function mark_gift_as_read exists';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 GIFTS SCHEMA SETUP COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;


-- ═══════════════════════════════════════════════════════════════════
-- 📝 STEP 8: بيانات اختبارية (اختياري - احذفها بعد الاختبار)
-- ═══════════════════════════════════════════════════════════════════

/*
-- مثال: إدراج هدية يدوياً للاختبار
INSERT INTO gifts (from_user_id, to_user_id, gift_type, message_text, is_read)
VALUES 
  ('user1_id_here', 'user2_id_here', 'rose', NULL, false),
  ('user1_id_here', 'user2_id_here', 'heart', NULL, false),
  ('user2_id_here', 'user1_id_here', 'message', 'السلام عليكم! 💚', false);

-- عرض كل الهدايا
SELECT * FROM gifts ORDER BY created_at DESC;
*/


-- ═══════════════════════════════════════════════════════════════════
-- 📚 USAGE EXAMPLES
-- ═══════════════════════════════════════════════════════════════════

/*
-- إرسال هدية باستخدام الـ Function:
SELECT send_gift('partner_user_id_here', 'rose', NULL);
SELECT send_gift('partner_user_id_here', 'heart', NULL);
SELECT send_gift('partner_user_id_here', 'message', 'رسالتك هنا');

-- تحديث حالة القراءة:
SELECT mark_gift_as_read('gift_uuid_here');

-- عرض الهدايا غير المقروءة للمستخدم الحالي:
SELECT * FROM gifts 
WHERE to_user_id = auth.uid()::text 
  AND is_read = false 
ORDER BY created_at DESC;

-- عرض كل هدايا المستخدم (مرسلة ومستلمة):
SELECT * FROM gifts 
WHERE to_user_id = auth.uid()::text 
   OR from_user_id = auth.uid()::text 
ORDER BY created_at DESC;
*/


-- ═══════════════════════════════════════════════════════════════════
-- 🎉 DONE! تم بنجاح
-- ═══════════════════════════════════════════════════════════════════
-- الآن عندك:
-- ✅ جدول gifts نظيف من الصفر
-- ✅ RLS policies محكمة
-- ✅ Indexes للأداء
-- ✅ Realtime مفعّل
-- ✅ Helper functions آمنة
-- ✅ Constraints للتحقق من البيانات
-- ═══════════════════════════════════════════════════════════════════
