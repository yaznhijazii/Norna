-- ═══════════════════════════════════════════════════════════════════
-- 💬 Add Reactions to Messages
-- ═══════════════════════════════════════════════════════════════════
-- يضيف نظام تفاعلات على الرسائل (لايك، قلوب، الخ)
-- ═══════════════════════════════════════════════════════════════════

-- إضافة حقل reaction للرسائل الموجودة
ALTER TABLE gifts
ADD COLUMN IF NOT EXISTS reaction TEXT CHECK (reaction IN ('like', 'love', 'fire', 'star', 'pray', NULL)),
ADD COLUMN IF NOT EXISTS reacted_at TIMESTAMPTZ;

-- إنشاء Index للبحث السريع عن الرسائل التي تم التفاعل معها
CREATE INDEX IF NOT EXISTS idx_gifts_reactions ON gifts(to_user_id, reaction) WHERE reaction IS NOT NULL;

-- تحديث التعليقات
COMMENT ON COLUMN gifts.reaction IS 'نوع التفاعل على الهدية: like, love, fire, star, pray';
COMMENT ON COLUMN gifts.reacted_at IS 'تاريخ ووقت التفاعل';

-- ✅ Migration completed
-- الآن يمكن للمستلم التفاعل على الرسائل المرسلة له
