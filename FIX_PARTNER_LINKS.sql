-- ═══════════════════════════════════════════════════════════════════
-- 🔧 FIX PARTNER LINKS - حل مشاكل ربط الشركاء
-- ═══════════════════════════════════════════════════════════════════

-- 1️⃣ شوف كل المستخدمين والشركاء
SELECT 
    id as "User ID",
    name as "Name",
    partner_id as "Partner ID",
    CASE 
        WHEN partner_id IS NULL THEN '❌ No Partner'
        WHEN partner_id = id THEN '🚨 SELF LINK (ERROR!)'
        ELSE '✅ Has Partner'
    END as "Status"
FROM users
ORDER BY created_at DESC;

-- 2️⃣ البحث عن المشاكل - المستخدمين المرتبطين بأنفسهم
SELECT 
    id,
    name,
    partner_id,
    '🚨 ERROR: User linked to self!' as issue
FROM users
WHERE partner_id = id;

-- 3️⃣ البحث عن روابط أحادية الاتجاه (User A → User B لكن User B لا يشير لـ User A)
SELECT 
    u1.id as "User 1",
    u1.name as "Name 1",
    u1.partner_id as "Points To",
    u2.name as "Partner Name",
    u2.partner_id as "Partner Points To",
    CASE 
        WHEN u2.partner_id = u1.id THEN '✅ Two-way link'
        ELSE '⚠️ One-way link only'
    END as "Link Status"
FROM users u1
LEFT JOIN users u2 ON u1.partner_id = u2.id
WHERE u1.partner_id IS NOT NULL
ORDER BY u1.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════
-- 🔧 إصلاح المشاكل
-- ═══════════════════════════════════════════════════════════════════

-- 4️⃣ إزالة الروابط الذاتية (Self-links)
-- ⚠️ انسخ هذا السطر وعدّله حسب user_id المشكل:
-- UPDATE users SET partner_id = NULL WHERE id = 'YOUR_USER_ID_HERE' AND partner_id = id;

-- 5️⃣ ربط مستخدمين بشكل صحيح (مثال)
-- انسخ والصق وعدّل الـ IDs:
/*
-- User 1 ID
DO $$
DECLARE
    user1_id TEXT := 'c6b7595c-c866-44b6-8c90-6916fa7e5a15';
    user2_id TEXT := '893b1340-2355-402c-bfe9-7daed8c0d4e6';
BEGIN
    -- التحقق من أن المستخدمين مختلفين
    IF user1_id = user2_id THEN
        RAISE EXCEPTION 'Error: Cannot link user to themselves!';
    END IF;
    
    -- ربط User 1 → User 2
    UPDATE users SET partner_id = user2_id WHERE id = user1_id;
    
    -- ربط User 2 → User 1
    UPDATE users SET partner_id = user1_id WHERE id = user2_id;
    
    RAISE NOTICE 'Success: Users linked successfully!';
END $$;
*/

-- 6️⃣ التحقق من النتيجة
SELECT 
    u1.id as "User 1",
    u1.name as "Name 1",
    u2.id as "User 2 (Partner)",
    u2.name as "Name 2",
    u2.partner_id as "Partner's Partner ID",
    CASE 
        WHEN u1.id = u1.partner_id THEN '🚨 ERROR: Self link!'
        WHEN u2.partner_id = u1.id THEN '✅ Perfect two-way link'
        WHEN u2.partner_id IS NULL THEN '⚠️ One-way link'
        ELSE '❌ Broken link'
    END as "Status"
FROM users u1
LEFT JOIN users u2 ON u1.partner_id = u2.id
WHERE u1.partner_id IS NOT NULL
ORDER BY u1.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════
-- 🎯 حل سريع لحسابك المحدد
-- ═══════════════════════════════════════════════════════════════════

-- من الـ error اللي عندك:
-- User: c6b7595c-c866-44b6-8c90-6916fa7e5a15
-- Partner (should be different): 893b1340-2355-402c-bfe9-7daed8c0d4e6

-- ✅ نفذ هذا عشان تربطهم صح:
DO $$
DECLARE
    user1_id TEXT := 'c6b7595c-c866-44b6-8c90-6916fa7e5a15';
    user2_id TEXT := '893b1340-2355-402c-bfe9-7daed8c0d4e6';
BEGIN
    -- التحقق
    IF user1_id = user2_id THEN
        RAISE EXCEPTION '❌ Cannot link user to themselves!';
    END IF;
    
    -- إزالة الروابط القديمة
    UPDATE users SET partner_id = NULL WHERE id = user1_id;
    UPDATE users SET partner_id = NULL WHERE id = user2_id;
    
    -- ربط جديد صحيح
    UPDATE users SET partner_id = user2_id WHERE id = user1_id;
    UPDATE users SET partner_id = user1_id WHERE id = user2_id;
    
    RAISE NOTICE '✅ Users linked successfully!';
    RAISE NOTICE 'User 1: % → Partner: %', user1_id, user2_id;
    RAISE NOTICE 'User 2: % → Partner: %', user2_id, user1_id;
END $$;

-- تأكيد
SELECT 
    id,
    name,
    partner_id,
    CASE 
        WHEN partner_id = id THEN '🚨 ERROR'
        WHEN partner_id IS NOT NULL THEN '✅ OK'
        ELSE '⚠️ No partner'
    END as status
FROM users 
WHERE id IN (
    'c6b7595c-c866-44b6-8c90-6916fa7e5a15',
    '893b1340-2355-402c-bfe9-7daed8c0d4e6'
);

-- ═══════════════════════════════════════════════════════════════════
-- 📊 تقرير نهائي
-- ═══════════════════════════════════════════════════════════════════

-- عدد المستخدمين حسب الحالة
SELECT 
    CASE 
        WHEN partner_id IS NULL THEN '❌ No Partner'
        WHEN partner_id = id THEN '🚨 Self Link (ERROR)'
        ELSE '✅ Has Partner'
    END as "Status",
    COUNT(*) as "Count"
FROM users
GROUP BY 
    CASE 
        WHEN partner_id IS NULL THEN '❌ No Partner'
        WHEN partner_id = id THEN '🚨 Self Link (ERROR)'
        ELSE '✅ Has Partner'
    END;