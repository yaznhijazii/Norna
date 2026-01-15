# 🎁 كيف تختبر الهدايا بشكل صحيح - دليل كامل

## ⚠️ المشكلة اللي صارت معك:

```
Error: "different_users" constraint violation
```

**السبب:** حاولت تبعث هدية لنفسك! 😅

```
From User ID: 893b1340-2355-402c-bfe9-7daed8c0d4e6
To User ID: 893b1340-2355-402c-bfe9-7daed8c0d4e6
       ☝️ نفس الـ ID!
```

---

## ✅ الحل: لازم تربط حساب شريك مختلف!

### **الطريقة الصحيحة للاختبار:**

---

## 🧪 **الطريقة 1: حسابين مختلفين (الأفضل!)**

### **الخطوات:**

#### **1️⃣ افتح تبويبين (Tabs):**
- **Tab 1:** نافذة عادية (Normal Window)
- **Tab 2:** نافذة خاصة/تخفي (Incognito/Private Window)

#### **2️⃣ في Tab 1 - سجل دخول User 1:**
```
البريد: user1@test.com
كلمة المرور: Test123!
الاسم: محمد
```

**انسخ الـ Partner Code:**
- اضغط ⚙️ (الإعدادات)
- انسخ كود الربط (مثال: `ABC123XYZ`)

#### **3️⃣ في Tab 2 - سجل دخول User 2:**
```
البريد: user2@test.com  
كلمة المرور: Test123!
الاسم: فاطمة
```

**الصق الـ Partner Code:**
- اضغط ⚙️ (الإعدادات)
- الصق كود الربط: `ABC123XYZ`
- اضغط "ربط"

#### **4️⃣ ارجع لـ Tab 1 وأدخل كود User 2:**
- انسخ كود User 2 من Tab 2
- الصقه في Tab 1
- اضغط "ربط"

#### **5️⃣ الحين جرّب ابعث هدية:**
- في Tab 1: اضغط الـ Menu الدائري → "إرسال هدية"
- اختر قلب/وردة/رسالة
- اضغط "إرسال"

#### **6️⃣ شوف Tab 2:**
- **Modal بيطلع تلقائياً مع الهدية!** 🎉
- شوف Console:
  ```
  🎁 NEW GIFT RECEIVED
  🎁 Gift received in App.tsx
  ```

---

## 🧪 **الطريقة 2: استخدام Supabase SQL (للاختبار السريع)**

### **إنشاء حسابين بسرعة:**

افتح **Supabase SQL Editor** ونفذ:

```sql
-- ═══════════════════════════════════════════════════════════
-- إنشاء حسابين للاختبار
-- ═══════════════════════════════════════════════════════════

-- 1. إنشاء User 1 (محمد)
INSERT INTO users (user_id, name, email, created_at)
VALUES (
  'test-user-1-mohammed',
  'محمد',
  'mohammed@test.com',
  NOW()
) ON CONFLICT (user_id) DO UPDATE 
  SET name = 'محمد', email = 'mohammed@test.com';

-- 2. إنشاء User 2 (فاطمة)
INSERT INTO users (user_id, name, email, created_at)
VALUES (
  'test-user-2-fatima',
  'فاطمة',
  'fatima@test.com',
  NOW()
) ON CONFLICT (user_id) DO UPDATE 
  SET name = 'فاطمة', email = 'fatima@test.com';

-- 3. ربط الحسابين مع بعض
UPDATE users 
SET partner_id = 'test-user-2-fatima'
WHERE user_id = 'test-user-1-mohammed';

UPDATE users 
SET partner_id = 'test-user-1-mohammed'
WHERE user_id = 'test-user-2-fatima';

-- 4. شوف النتيجة
SELECT user_id, name, email, partner_id FROM users 
WHERE user_id IN ('test-user-1-mohammed', 'test-user-2-fatima');
```

**الحين سجل دخول بأحد الحسابين:**
```javascript
// في localStorage (Console):
localStorage.setItem('nooruna_user', JSON.stringify({
  userId: 'test-user-1-mohammed',
  name: 'محمد',
  email: 'mohammed@test.com',
  partner_id: 'test-user-2-fatima'
}));

// Reload الصفحة
location.reload();
```

---

## 🧪 **الطريقة 3: إرسال هدية يدوياً (SQL Direct)**

### **إرسال هدية مباشرة من Supabase:**

```sql
-- إرسال وردة من محمد لفاطمة
INSERT INTO gifts (
  from_user_id,
  to_user_id,
  gift_type,
  message_text,
  is_read,
  created_at
) VALUES (
  'test-user-1-mohammed',
  'test-user-2-fatima',
  'rose',
  NULL,
  FALSE,
  NOW()
);

-- شوف الهدايا
SELECT 
  g.*,
  u1.name as sender_name,
  u2.name as receiver_name
FROM gifts g
JOIN users u1 ON g.from_user_id = u1.user_id
JOIN users u2 ON g.to_user_id = u2.user_id
ORDER BY g.created_at DESC
LIMIT 10;
```

**الحين:**
- سجل دخول كـ `test-user-2-fatima`
- Reload الصفحة
- **Modal بيطلع مع الوردة!** 🌹

---

## 📋 **Checklist قبل إرسال هدية:**

### ✅ **تأكد من:**

1. **Current User ID ≠ Partner ID**
   ```javascript
   // في Console:
   const user = JSON.parse(localStorage.getItem('nooruna_user'));
   console.log('My ID:', user.userId);
   console.log('Partner ID:', user.partner_id);
   console.log('Same?', user.userId === user.partner_id); // لازم false!
   ```

2. **Partner ID موجود فعلاً:**
   ```sql
   -- في Supabase SQL:
   SELECT * FROM users WHERE user_id = 'PARTNER_ID_HERE';
   ```

3. **الربط متبادل (Two-way linking):**
   ```sql
   -- كل واحد partner_id حقه يشير للثاني:
   SELECT 
     u1.name as user1,
     u1.partner_id as points_to,
     u2.name as partner_name,
     u2.partner_id as partner_points_to
   FROM users u1
   JOIN users u2 ON u1.partner_id = u2.user_id
   WHERE u1.user_id = 'YOUR_USER_ID';
   ```

4. **RLS Policies معطلة (للاختبار):**
   ```sql
   -- شوف الـ policies:
   SELECT tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE tablename = 'gifts';
   
   -- لو في policies، عطلها:
   ALTER TABLE gifts DISABLE ROW LEVEL SECURITY;
   ```

---

## 🎯 **الـ Flow الصحيح:**

```
┌─────────────────────────────────────────────────────────────┐
│                    إرسال هدية صحيح                          │
└─────────────────────────────────────────────────────────────┘

1. User 1 (محمد)
   ├─ user_id: test-user-1-mohammed
   └─ partner_id: test-user-2-fatima ✅
                      │
                      │ (مختلف!)
                      ▼
2. User 2 (فاطمة)
   ├─ user_id: test-user-2-fatima
   └─ partner_id: test-user-1-mohammed ✅

3. محمد يبعث هدية:
   ├─ from_user_id: test-user-1-mohammed
   ├─ to_user_id: test-user-2-fatima ✅
   └─ ✅ SUCCESS! (IDs مختلفة)

4. Database يحفظ الهدية ✅

5. Realtime يبلغ فاطمة ✅

6. Modal يطلع عند فاطمة 🎉
```

---

## ❌ **الـ Flow الخطأ (اللي صار معك):**

```
┌─────────────────────────────────────────────────────────────┐
│                    إرسال هدية خطأ ❌                        │
└─────────────────────────────────────────────────────────────┘

1. User 1 (محمد)
   ├─ user_id: 893b1340-2355-402c-bfe9-7daed8c0d4e6
   └─ partner_id: 893b1340-2355-402c-bfe9-7daed8c0d4e6 ❌
                      │
                      │ (نفس الـ ID! 😅)
                      ▼
2. محمد يبعث هدية لنفسه:
   ├─ from_user_id: 893b1340-2355-402c-bfe9-7daed8c0d4e6
   ├─ to_user_id: 893b1340-2355-402c-bfe9-7daed8c0d4e6 ❌
   └─ ❌ ERROR! (نفس الـ ID)

3. Database يرفض الهدية:
   └─ Error: "different_users" constraint violation ❌
```

---

## 🔧 **إصلاح Partner ID الحالي:**

### **لو Partner ID خطأ، صلحه:**

```sql
-- 1. شوف الوضع الحالي:
SELECT user_id, name, partner_id FROM users;

-- 2. صلّح Partner ID:
UPDATE users 
SET partner_id = 'CORRECT_PARTNER_ID_HERE'
WHERE user_id = 'YOUR_USER_ID';

-- 3. تأكد:
SELECT user_id, name, partner_id FROM users 
WHERE user_id = 'YOUR_USER_ID';
```

**أو من localStorage:**
```javascript
// في Console:
const user = JSON.parse(localStorage.getItem('nooruna_user'));
user.partner_id = 'CORRECT_PARTNER_ID_HERE';
localStorage.setItem('nooruna_user', JSON.stringify(user));
location.reload();
```

---

## 🎊 **الخلاصة:**

| السيناريو | النتيجة | الحل |
|-----------|---------|------|
| من User A → User A | ❌ Error | اربط شريك مختلف! |
| من User A → User B (مو مربوط) | ⚠️ يشتغل لكن مو منطقي | اربط الحسابين |
| من User A → User B (مربوطين) | ✅ Perfect! | هذا الصحيح! |

---

## 📞 **لو ما زال في مشاكل:**

### **Debug Checklist:**

```javascript
// في Console - نفذ كل الأوامر:

// 1. شوف بيانات المستخدم الحالي:
console.log('Current User:', JSON.parse(localStorage.getItem('nooruna_user')));

// 2. شوف Partner ID:
const user = JSON.parse(localStorage.getItem('nooruna_user'));
console.log('My ID:', user.userId);
console.log('Partner ID:', user.partner_id);
console.log('Are they same?', user.userId === user.partner_id);

// 3. لو نفس الشي، معناها الـ partner_id خطأ!
// الحل: اربط حساب شريك صحيح من الإعدادات
```

```sql
-- في Supabase SQL Editor:

-- 1. شوف كل المستخدمين:
SELECT user_id, name, email, partner_id FROM users;

-- 2. شوف الهدايا:
SELECT * FROM gifts ORDER BY created_at DESC LIMIT 10;

-- 3. شوف الربط:
SELECT 
  u1.name as user1,
  u1.partner_id,
  u2.name as partner_name
FROM users u1
LEFT JOIN users u2 ON u1.partner_id = u2.user_id;
```

---

## 🚀 **Next Steps:**

1. ✅ **أنشئ حسابين مختلفين** (الطريقة 1 أو 2)
2. ✅ **اربط الحسابين** (Partner Code)
3. ✅ **ابعث هدية** (من حساب للثاني)
4. ✅ **شوف الـ Modal يطلع!** 🎉

---

**🌟 بالتوفيق! جرب الطرق فوق وأخبرني وش صار! 🎁**
