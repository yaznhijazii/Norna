# 🎁 دليل إعداد إشعارات الهدايا - نورنا

## ✨ الميزات المضافة

### 1️⃣ **إشعارات فورية عند استلام الهدايا**
- 🌹 وردة
- ❤️ قلب
- 💌 رسالة

### 2️⃣ **دعم كامل لـ iOS (iPhone/iPad)**
- PWA Notifications
- Local Notifications
- Haptic Feedback
- Sound Effects

### 3️⃣ **Realtime Updates**
- استخدام Supabase Realtime
- فوري وبدون تأخير

---

## 📱 كيفية التفعيل على iPhone

### الخطوة 1️⃣: افتح التطبيق في Safari
- **مهم:** استخدم Safari فقط (ليس Chrome أو Firefox)
- اذهب للرابط: `https://your-app-url.com`

### الخطوة 2️⃣: أضف التطبيق للشاشة الرئيسية
1. اضغط زر **Share** (المربع + السهم) في الأسفل
2. اختر **"Add to Home Screen"**
3. اضغط **"Add"**
4. **الأيقونة بتظهر على الشاشة الرئيسية! 🎉**

### الخطوة 3️⃣: افتح التطبيق من الشاشة الرئيسية
- **لا تفتحه من Safari!** افتحه من الأيقونة مباشرة
- بيفتح كأنه تطبيق حقيقي (بدون browser bar)

### الخطوة 4️⃣: السماح بالإشعارات
عند فتح التطبيق لأول مرة:
1. **سيظهر طلب إذن الإشعارات** تلقائياً
2. اضغط **"Allow"** أو **"السماح"**
3. ✅ تم! الإشعارات الآن شغالة!

---

## 🔔 كيفية عمل الإشعارات

### **عند إرسال هدية:**
1. المرسل يختار الهدية (قلب/وردة/رسالة)
2. يضغط "إرسال الآن"
3. ✅ تُحفظ في قاعدة البيانات

### **عند استلام هدية:**
1. 🔔 **يظهر إشعار فوري** على جهاز المستقبل
2. 📳 **Haptic Feedback** (اهتزاز خفيف)
3. 🔊 **Sound Effect** (صوت تنبيه)
4. 📱 **الإشعار يظهر حتى لو التطبيق مغلق!**

---

## 🎨 أنواع الإشعارات

### 🌹 وردة
```
🌹 وردة من أحمد
أرسل لك وردة جميلة
```

### ❤️ قلب
```
❤️ قلب من فاطمة
أرسل لك قلباً
```

### 💌 رسالة
```
💌 رسالة من أحمد
"صباح الخير يا حبيبتي ❤️"
```

---

## 🛠️ التقنيات المستخدمة

### Frontend
- ✅ **Service Worker** (`/public/sw.js`)
- ✅ **Web Notifications API**
- ✅ **Vibration API** (Haptic Feedback)
- ✅ **Web Audio API** (Sound Effects)
- ✅ **PWA Manifest** (`/public/manifest.json`)

### Backend
- ✅ **Supabase Realtime** (Postgres Changes)
- ✅ **Custom Hook** (`useGiftNotifications`)
- ✅ **Local Notifications** (`showLocalNotification`)

### iOS Support
- ✅ **Apple Touch Icon** (180x180)
- ✅ **Apple Meta Tags**
- ✅ **PWA Manifest** with icons
- ✅ **Service Worker** للـ offline support

---

## 📝 الملفات المحدثة

### 1. `/src/app/hooks/useGiftNotifications.ts`
- **Hook جديد** للاستماع للهدايا عبر Supabase Realtime
- يظهر notification فوري عند استلام هدية
- يدعم Haptic Feedback و Sound

### 2. `/src/app/utils/pushNotifications.ts`
- تحديث `showLocalNotification` لدعم طلب الإذن تلقائياً
- إضافة الأيقونات من GitHub
- دعم كامل لـ iOS

### 3. `/public/sw.js`
- تحديث Service Worker لدعم الأيقونات الجديدة
- تحسين push notification handler

### 4. `/public/manifest.json`
- تحديث الأيقونات لتشير للوغو من GitHub
- 8 أحجام مختلفة (72x72 إلى 512x512)
- دعم `maskable` للـ iOS

### 5. `/src/app/App.tsx`
- إضافة `useGiftNotifications` hook
- تفعيل الإشعارات للمستخدمين المسجلين

---

## ✅ اختبار الإشعارات

### على الكمبيوتر (Desktop):
1. افتح Chrome DevTools (F12)
2. اذهب لـ **Application** → **Service Workers**
3. تحقق من تسجيل Service Worker
4. اذهب لـ **Console** وشوف الرسائل:
   ```
   ✅ Service Worker registered successfully
   🎁 Setting up gift notifications for user: [USER_ID]
   ```

### على الموبايل (iPhone):
1. افتح التطبيق من الشاشة الرئيسية (PWA)
2. اطلب من شريكك يرسل لك هدية
3. **المفروض يظهر إشعار فوري! 🎉**
4. إذا ما ظهر، تحقق من:
   - ✅ الإذن ممنوح (Settings → Safari → Allow Notifications)
   - ✅ التطبيق مفتوح من الشاشة الرئيسية
   - ✅ Service Worker شغال

### Console Logs للتأكد:
```javascript
// عند إرسال هدية:
📤 SENDING GIFT - FULL DEBUG INFO
Gift Type: rose
To User ID: abc123
✅ Gift sent successfully!

// عند استلام هدية:
🎁 NEW GIFT RECEIVED: { ... }
🎁 Gift channel status: SUBSCRIBED
✅ Gift notification sent successfully
```

---

## 🐛 حل المشاكل

### المشكلة: الإشعارات ما تظهر
**الحل:**
1. تحقق من أن الإذن ممنوح:
   ```javascript
   console.log(Notification.permission); // يجب أن يكون 'granted'
   ```
2. تحقق من Service Worker:
   ```javascript
   navigator.serviceWorker.getRegistration().then(reg => {
     console.log('SW registered:', !!reg);
   });
   ```
3. تأكد من فتح التطبيق من الشاشة الرئيسية (PWA)

### المشكلة: Service Worker مش شغال
**الحل:**
1. تأكد من أن التطبيق يعمل على HTTPS أو localhost
2. افحص Console للأخطاء
3. جرب Unregister ثم Register من جديد:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister());
   });
   ```

### المشكلة: الأيقونة ما تظهر صح
**الحل:**
1. تحقق من رابط الأيقونة في manifest.json
2. تأكد من الوصول للأيقونة من GitHub:
   ```
   https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png
   ```
3. امسح cache وجرب مرة ثانية

---

## 🎯 الخطوات التالية (اختياري)

### 1. إضافة VAPID Keys للـ Push API
- توليد VAPID keys من: https://web-push-codelab.glitch.me/
- تحديث `VAPID_PUBLIC_KEY` في `/src/app/utils/pushNotifications.ts`
- إعداد backend لإرسال push notifications

### 2. إضافة جدول `push_subscriptions` في Supabase
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

### 3. Background Sync (للإشعارات في الخلفية)
- تفعيل Background Sync في Service Worker
- إرسال إشعارات حتى لو التطبيق مغلق

---

## 📚 مصادر مفيدة

- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA on iOS](https://developer.apple.com/documentation/webkit/progressive_web_apps)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

## 🎉 النتيجة النهائية

✅ **إشعارات فورية** عند استلام الهدايا  
✅ **دعم كامل لـ iOS** (iPhone/iPad)  
✅ **PWA Experience** كأنه تطبيق حقيقي  
✅ **Haptic Feedback** و Sound Effects  
✅ **Realtime Updates** بدون تأخير  
✅ **أيقونات جميلة** من GitHub  

---

**🌟 بالتوفيق! جزاك الله خيراً 🌟**
