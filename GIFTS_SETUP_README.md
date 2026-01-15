# 🎁 GIFTS SCHEMA SETUP GUIDE

## خطوات التنفيذ في Supabase

### 1️⃣ افتح Supabase Dashboard
- اذهب إلى: https://app.supabase.com
- اختر مشروعك

### 2️⃣ افتح SQL Editor
- من القائمة الجانبية، اضغط على **SQL Editor**
- اضغط **New Query**

### 3️⃣ نفذ السكيما
- انسخ **كامل** محتوى ملف `/GIFTS_SCHEMA_FRESH.sql`
- الصقه في SQL Editor
- اضغط **Run** أو **Ctrl+Enter**

### 4️⃣ تأكد من النجاح
يجب أن تشاهد رسائل خضراء مثل:
```
✅ Gifts table exists: true
✅ RLS enabled: true
✅ Number of policies: 3
✅ Number of indexes: 4
✅ Function send_gift exists
✅ Function mark_gift_as_read exists
🎉 GIFTS SCHEMA SETUP COMPLETE!
```

---

## 🔍 ماذا تم إنشاؤه؟

### Tables:
- **gifts** - جدول الهدايا الرئيسي

### Columns:
```sql
id              UUID PRIMARY KEY
from_user_id    TEXT NOT NULL
to_user_id      TEXT NOT NULL
gift_type       TEXT ('rose', 'heart', 'message')
message_text    TEXT (للرسائل فقط)
is_read         BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT NOW()
read_at         TIMESTAMPTZ
```

### Functions:
1. **send_gift(p_to_user_id, p_gift_type, p_message_text)** - إرسال هدية بأمان
2. **mark_gift_as_read(p_gift_id)** - تحديث حالة القراءة

### RLS Policies:
1. المستخدمين يشوفون هداياهم (المرسلة والمستلمة)
2. المستخدمين يقدرون يرسلون هدايا
3. المستخدمين يقدرون يعلّمون هداياهم كمقروءة

### Indexes:
- للأداء العالي في الاستعلامات

### Realtime:
- تفعيل الإشعارات الفورية

---

## 🧪 اختبار الهدايا

### إرسال هدية من SQL Editor:
```sql
SELECT send_gift(
  'partner_user_id_here',  -- معرف الشريك
  'rose',                   -- نوع الهدية: rose, heart, message
  NULL                      -- الرسالة (NULL للورد والقلب)
);

-- إرسال رسالة:
SELECT send_gift(
  'partner_user_id_here',
  'message',
  'السلام عليكم ورحمة الله وبركاته'
);
```

### عرض الهدايا غير المقروءة:
```sql
SELECT * FROM gifts 
WHERE to_user_id = 'your_user_id_here' 
  AND is_read = false 
ORDER BY created_at DESC;
```

### تحديث حالة القراءة:
```sql
SELECT mark_gift_as_read('gift_uuid_here');
```

---

## ✅ التحقق من أن كل شي شغال

افتح **Browser Console** في التطبيق وجرب:

1. **إرسال هدية:**
   - اضغط على أيقونة الهدية
   - اختر نوع هدية
   - أرسل

2. **شاهد الـ Console:**
   ```
   ✅ Gift sent successfully: {success: true, gift_id: "..."}
   ```

3. **استلام هدية (من حساب الشريك):**
   ```
   🎁 New gift received via Realtime! {gift_type: "rose", ...}
   ```

---

## 🐛 استكشاف الأخطاء

### ❌ Error: "User not authenticated"
**الحل:** تأكد أنك مسجل دخول في التطبيق

### ❌ Error: "Cannot send gift to yourself"
**الحل:** تأكد أنك ترسل للشريك وليس لنفسك

### ❌ Error: "Invalid gift type"
**الحل:** استخدم فقط: `'rose'`, `'heart'`, `'message'`

### ❌ Error: "Message text is required"
**الحل:** لازم تكتب رسالة إذا اخترت نوع "message"

### ❌ الهدايا ما توصل
**الحل:**
1. تأكد من تنفيذ SQL script كامل
2. تأكد من تفعيل Realtime:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE gifts;
   ```
3. تحقق من الـ console للأخطاء

---

## 📊 معلومات إضافية

### عدد الهدايا الكلي:
```sql
SELECT COUNT(*) FROM gifts;
```

### الهدايا غير المقروءة:
```sql
SELECT COUNT(*) FROM gifts WHERE is_read = false;
```

### أكثر نوع هدية شعبية:
```sql
SELECT gift_type, COUNT(*) as count 
FROM gifts 
GROUP BY gift_type 
ORDER BY count DESC;
```

### تنظيف الهدايا القديمة (أكثر من 30 يوم ومقروءة):
```sql
SELECT cleanup_old_read_gifts();
```

---

## 🎉 خلاص!

الآن نظام الهدايا شغال 100%!

- ✅ إرسال آمن
- ✅ استقبال فوري (Realtime)
- ✅ حماية RLS
- ✅ أداء عالي (Indexes)
- ✅ رسائل خطأ واضحة

**بالتوفيق! 🚀**
