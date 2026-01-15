# 🎁 دليل إعداد نظام الهدايا - خطوة بخطوة

## 📋 المشكلة
عند إرسال هدية تظهر رسالة:
```
خطأ في الصلاحيات. تأكد من إعدادات Supabase RLS.
```

---

## ✅ الحل (اختر طريقة واحدة)

### 🚀 الطريقة الأولى: النسخة الكاملة (مُوصى بها)

1. **افتح Supabase Dashboard**
   - اذهب إلى: https://app.supabase.com
   - اختر مشروعك
   - اضغط **SQL Editor** من القائمة الجانبية

2. **اضغط New Query**

3. **انسخ محتوى ملف `/COMPLETE_GIFTS_FIX_V2.sql` كامل**

4. **الصقه في SQL Editor**

5. **اضغط Run ▶️**

6. **انتظر حتى تظهر الرسائل:**
   ```
   ✅ Step 1: Policies deleted
   ✅ Test insert successful! Gift ID: ...
   ✅ Test cleanup complete
   📊 CONFIGURATION SUMMARY
   🎉 SETUP COMPLETE! الآن جرب إرسال هدية!
   ```

---

### 🎯 الطريقة الثانية: البسيطة (إذا الأولى ما اشتغلت)

**نفذ كل سطر لوحده:**

1. افتح **SQL Editor** في Supabase

2. **نفذ هذا السطر الأول:**
   ```sql
   DROP TABLE IF EXISTS gifts CASCADE;
   ```
   اضغط Run ▶️

3. **نفذ هذا السطر الثاني:**
   ```sql
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
   ```
   اضغط Run ▶️

4. **نفذ الـ Indexes (كلها مرة واحدة):**
   ```sql
   CREATE INDEX idx_gifts_to_user_unread ON gifts(to_user_id, created_at DESC) WHERE is_read = false;
   CREATE INDEX idx_gifts_to_user ON gifts(to_user_id, created_at DESC);
   CREATE INDEX idx_gifts_from_user ON gifts(from_user_id, created_at DESC);
   CREATE INDEX idx_gifts_created_at ON gifts(created_at DESC);
   ```
   اضغط Run ▶️

5. **تعطيل RLS:**
   ```sql
   ALTER TABLE gifts DISABLE ROW LEVEL SECURITY;
   ```
   اضغط Run ▶️

6. **تفعيل Realtime:**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE gifts;
   ```
   اضغط Run ▶️

7. **اختبار:**
   ```sql
   INSERT INTO gifts (from_user_id, to_user_id, gift_type, is_read)
   VALUES ('test_1', 'test_2', 'rose', false);
   ```
   اضغط Run ▶️
   
   يجب أن تظهر: `INSERT 0 1` ← معناها نجح!

8. **حذف الاختبار:**
   ```sql
   DELETE FROM gifts WHERE from_user_id = 'test_1';
   ```
   اضغط Run ▶️

---

## 🧪 التأكد من أن كل شي اشتغل

نفذ هذا الاستعلام للتحقق:

```sql
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'gifts';
```

**النتيجة المتوقعة:**
```
tablename | RLS Enabled
----------|------------
gifts     | f           ← يعني معطل (صح!)
```

---

## 🎉 الاختبار النهائي

1. افتح التطبيق
2. سجل دخول
3. **افتح Console (F12)**
4. اضغط أيقونة الهدية 🎁
5. اختر نوع (وردة/قلب/رسالة)
6. اضغط إرسال

**يجب أن تشاهد في Console:**
```
📤 Sending gift: {...}
📦 Gift data to insert: {...}
✅ Gift sent successfully!
```

---

## ❌ إذا طلع خطأ بعد

### خطأ: "relation does not exist"
**الحل:** الجدول ما انشأ، نفذ خطوة 2 من الطريقة البسيطة

### خطأ: "violates row-level security"
**الحل:** RLS ما تعطل، نفذ:
```sql
ALTER TABLE gifts DISABLE ROW LEVEL SECURITY;
```

### خطأ: "permission denied"
**الحل:** تأكد أنك Admin في Supabase project

### خطأ: "duplicate key"
**الحل:** الجدول موجود مسبقاً، نفذ:
```sql
DROP TABLE gifts CASCADE;
```
ثم ابدأ من جديد

---

## 📞 للدعم

إذا لسه فيه مشكلة:
1. افتح **SQL Editor** في Supabase
2. نفذ:
   ```sql
   SELECT * FROM pg_tables WHERE tablename = 'gifts';
   ```
3. أرسل لي screenshot من النتيجة

---

## 🔒 ملاحظة للإنتاج

حالياً RLS **معطل** للتطوير. لما تجهز للإطلاق:

```sql
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_authenticated_users"
  ON gifts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

---

✅ **بالتوفيق!** 🎁✨
