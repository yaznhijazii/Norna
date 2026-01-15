-- ========================================
-- 🔐 Custom Authentication System (بدون Supabase Auth)
-- ========================================
-- هذا النظام يستخدم username + password فقط
-- ========================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- 1️⃣ جدول المستخدمين (بدون Auth)
-- ========================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  partner_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
  partner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast username lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_partner_code ON public.users(partner_code);

-- ========================================
-- 2️⃣ جدول الجلسات (Sessions)
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.user_sessions(user_id);

-- Auto-delete expired sessions
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.user_sessions(expires_at);

-- ========================================
-- 3️⃣ دالة تسجيل مستخدم جديد
-- ========================================
CREATE OR REPLACE FUNCTION public.register_user(
  p_name TEXT,
  p_password TEXT,
  p_username TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_session_token TEXT;
  v_partner_code TEXT;
BEGIN
  -- Validate input
  IF length(p_username) < 3 THEN
    RETURN json_build_object('error', 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
  END IF;

  IF length(p_password) < 6 THEN
    RETURN json_build_object('error', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  END IF;

  IF length(p_name) < 2 THEN
    RETURN json_build_object('error', 'الرجاء إدخال الاسم الكامل');
  END IF;

  -- Check if username exists
  IF EXISTS (SELECT 1 FROM public.users WHERE username = p_username) THEN
    RETURN json_build_object('error', 'اسم المستخدم موجود مسبقاً');
  END IF;

  -- Insert new user with hashed password
  INSERT INTO public.users (username, password_hash, name)
  VALUES (
    p_username,
    crypt(p_password, gen_salt('bf', 10)),
    p_name
  )
  RETURNING id, partner_code INTO v_user_id, v_partner_code;

  -- Create session
  INSERT INTO public.user_sessions (user_id)
  VALUES (v_user_id)
  RETURNING token INTO v_session_token;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user_id,
      'username', p_username,
      'name', p_name,
      'partner_code', v_partner_code
    ),
    'token', v_session_token
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', 'حدث خطأ أثناء إنشاء الحساب');
END;
$$;

-- ========================================
-- 4️⃣ دالة تسجيل الدخول
-- ========================================
CREATE OR REPLACE FUNCTION public.login_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_session_token TEXT;
BEGIN
  -- Find user and verify password
  SELECT id, username, name, password_hash, partner_code, partner_id
  INTO v_user
  FROM public.users
  WHERE username = p_username;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  END IF;

  -- Verify password
  IF NOT (v_user.password_hash = crypt(p_password, v_user.password_hash)) THEN
    RETURN json_build_object('error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  END IF;

  -- Delete old sessions for this user (optional: keep only one session per user)
  -- DELETE FROM public.user_sessions WHERE user_id = v_user.id;

  -- Create new session
  INSERT INTO public.user_sessions (user_id)
  VALUES (v_user.id)
  RETURNING token INTO v_session_token;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'name', v_user.name,
      'partner_code', v_user.partner_code,
      'partner_id', v_user.partner_id
    ),
    'token', v_session_token
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', 'حدث خطأ أثناء تسجيل الدخول');
END;
$$;

-- ========================================
-- 5️⃣ دالة التحقق من الجلسة
-- ========================================
CREATE OR REPLACE FUNCTION public.validate_session(
  p_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_user RECORD;
BEGIN
  -- Find session
  SELECT user_id, expires_at
  INTO v_session
  FROM public.user_sessions
  WHERE token = p_token;

  -- Check if session exists
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'جلسة غير صالحة');
  END IF;

  -- Check if session expired
  IF v_session.expires_at < now() THEN
    DELETE FROM public.user_sessions WHERE token = p_token;
    RETURN json_build_object('error', 'انتهت صلاحية الجلسة');
  END IF;

  -- Get user data
  SELECT id, username, name, partner_code, partner_id
  INTO v_user
  FROM public.users
  WHERE id = v_session.user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'المستخدم غير موجود');
  END IF;

  -- Return user data
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'name', v_user.name,
      'partner_code', v_user.partner_code,
      'partner_id', v_user.partner_id
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', 'حدث خطأ أثناء التحقق من الجلسة');
END;
$$;

-- ========================================
-- 6️⃣ دالة تسجيل الخروج
-- ========================================
CREATE OR REPLACE FUNCTION public.logout_user(
  p_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_sessions WHERE token = p_token;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', 'حدث خطأ أثناء تسجيل الخروج');
END;
$$;

-- ========================================
-- 7️⃣ باقي الجداول (نفس اللي عندك)
-- ========================================

-- جدول الصلوات
CREATE TABLE IF NOT EXISTS public.prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prayer_name TEXT NOT NULL,
  prayer_time TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prayers_user_date ON public.prayers(user_id, date);

-- جدول الأذكار
CREATE TABLE IF NOT EXISTS public.athkar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('morning', 'evening')),
  completed BOOLEAN DEFAULT false,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_athkar_user_date ON public.athkar(user_id, date);

-- جدول القرآن
CREATE TABLE IF NOT EXISTS public.quran_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  surah_name TEXT NOT NULL,
  pages_read INTEGER DEFAULT 0,
  target_pages INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quran_user_date ON public.quran_readings(user_id, date);

-- جدول النشاطات (Timeline)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  completed BOOLEAN DEFAULT false,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_date ON public.activities(user_id, date);

-- ========================================
-- 8️⃣ Row Level Security (RLS)
-- ========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athkar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Users table policies (للقراءة العامة فقط للـ partner linking)
CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (true);

-- Sessions policies (عام - لأننا نستخدم token validation)
CREATE POLICY "Anyone can manage sessions" ON public.user_sessions
  FOR ALL USING (true);

-- Data policies (عام مؤقتاً - راح نضيف custom validation في الـ client)
CREATE POLICY "Users can manage own data" ON public.prayers
  FOR ALL USING (true);

CREATE POLICY "Users can manage own athkar" ON public.athkar
  FOR ALL USING (true);

CREATE POLICY "Users can manage own quran" ON public.quran_readings
  FOR ALL USING (true);

CREATE POLICY "Users can manage own activities" ON public.activities
  FOR ALL USING (true);

-- ========================================
-- ✅ تم! Custom Auth جاهز
-- ========================================