-- ========================================
-- خطوة 1: Enable UUID Extension
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- خطوة 2: جدول المستخدمين (Users)
-- ========================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  partner_code TEXT UNIQUE,
  partner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_partner_code ON public.users(partner_code);

-- ========================================
-- خطوة 3: جدول الجلسات (Sessions)
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id);

-- ========================================
-- خطوة 4: جدول الصلوات (Prayers)
-- ========================================
CREATE TABLE IF NOT EXISTS public.prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fajr BOOLEAN DEFAULT false,
  dhuhr BOOLEAN DEFAULT false,
  asr BOOLEAN DEFAULT false,
  maghrib BOOLEAN DEFAULT false,
  isha BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_prayers_user_date ON public.prayers(user_id, date);

-- ========================================
-- خطوة 5: جدول الأذكار (Athkar)
-- ========================================
CREATE TABLE IF NOT EXISTS public.athkar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('morning', 'evening')),
  completed BOOLEAN DEFAULT false,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, type)
);

CREATE INDEX IF NOT EXISTS idx_athkar_user_date ON public.athkar(user_id, date);

-- ========================================
-- خطوة 6: جدول القرآن (Quran Readings)
-- ========================================
CREATE TABLE IF NOT EXISTS public.quran_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  surah_name TEXT NOT NULL,
  pages_read INTEGER DEFAULT 0,
  target_pages INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quran_user_date ON public.quran_readings(user_id, date);

-- ========================================
-- خطوة 7: جدول الدعاء (Duaas)
-- ========================================
CREATE TABLE IF NOT EXISTS public.duaas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('personal', 'partner_request', 'partner_shared')),
  is_shared BOOLEAN DEFAULT false,
  partner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duaas_user ON public.duaas(user_id);
CREATE INDEX IF NOT EXISTS idx_duaas_partner ON public.duaas(partner_id);

-- ========================================
-- خطوة 8: جدول النشاطات (Activities/Timeline)
-- ========================================
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
-- خطوة 9: RLS Policies
-- ========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athkar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duaas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can manage sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can manage own data" ON public.prayers;
DROP POLICY IF EXISTS "Users can insert prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can select prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can update prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can manage own athkar" ON public.athkar;
DROP POLICY IF EXISTS "Users can insert athkar" ON public.athkar;
DROP POLICY IF EXISTS "Users can select athkar" ON public.athkar;
DROP POLICY IF EXISTS "Users can update athkar" ON public.athkar;
DROP POLICY IF EXISTS "Users can manage own quran" ON public.quran_readings;
DROP POLICY IF EXISTS "Users can insert quran" ON public.quran_readings;
DROP POLICY IF EXISTS "Users can select quran" ON public.quran_readings;
DROP POLICY IF EXISTS "Users can update quran" ON public.quran_readings;
DROP POLICY IF EXISTS "Users can manage own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can manage own duaas" ON public.duaas;

-- Users table policies
CREATE POLICY "Users can read all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (true);

-- Sessions table policies
CREATE POLICY "Anyone can manage sessions" ON public.user_sessions FOR ALL USING (true);

-- Prayers table policies
CREATE POLICY "Users can select prayers" ON public.prayers FOR SELECT USING (true);
CREATE POLICY "Users can insert prayers" ON public.prayers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update prayers" ON public.prayers FOR UPDATE USING (true);

-- Athkar table policies
CREATE POLICY "Users can select athkar" ON public.athkar FOR SELECT USING (true);
CREATE POLICY "Users can insert athkar" ON public.athkar FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update athkar" ON public.athkar FOR UPDATE USING (true);

-- Quran readings table policies
CREATE POLICY "Users can select quran" ON public.quran_readings FOR SELECT USING (true);
CREATE POLICY "Users can insert quran" ON public.quran_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update quran" ON public.quran_readings FOR UPDATE USING (true);

-- Activities table policies
CREATE POLICY "Users can manage own activities" ON public.activities FOR ALL USING (true);

-- Duaas table policies
CREATE POLICY "Users can manage own duaas" ON public.duaas FOR ALL USING (true);

-- ========================================
-- خطوة 10: Helper Functions
-- ========================================

-- Function to validate session token
CREATE OR REPLACE FUNCTION public.validate_session(session_token TEXT)
RETURNS TABLE(user_id UUID, username TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username
  FROM public.user_sessions s
  JOIN public.users u ON s.user_id = u.id
  WHERE s.token = session_token
    AND s.expires_at > NOW();
END;
$$;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION public.clean_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_sessions WHERE expires_at < NOW();
END;
$$;

-- Function to generate partner code
CREATE OR REPLACE FUNCTION public.generate_partner_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to register a new user
CREATE OR REPLACE FUNCTION public.register_user(
  p_username TEXT,
  p_password TEXT,
  p_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_partner_code TEXT;
  v_token TEXT;
  v_password_hash TEXT;
BEGIN
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE username = p_username) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'اسم المستخدم موجود بالفعل'
    );
  END IF;

  -- Hash the password
  v_password_hash := crypt(p_password, gen_salt('bf'));

  -- Generate unique partner code
  LOOP
    v_partner_code := generate_partner_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE partner_code = v_partner_code);
  END LOOP;

  -- Create user
  INSERT INTO public.users (username, password_hash, name, partner_code)
  VALUES (p_username, v_password_hash, p_name, v_partner_code)
  RETURNING id INTO v_user_id;

  -- Generate session token
  v_token := encode(gen_random_bytes(32), 'base64');

  -- Create session (expires in 30 days)
  INSERT INTO public.user_sessions (user_id, token, expires_at)
  VALUES (v_user_id, v_token, NOW() + INTERVAL '30 days');

  -- Return success with user data
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user_id,
      'username', p_username,
      'name', p_name,
      'partner_code', v_partner_code
    ),
    'token', v_token
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'حدث خطأ أثناء إنشاء الحساب'
    );
END;
$$;

-- Function to login user
CREATE OR REPLACE FUNCTION public.login_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_token TEXT;
BEGIN
  -- Find user and verify password
  SELECT id, username, name, password_hash, partner_code, partner_id
  INTO v_user
  FROM public.users
  WHERE username = p_username;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'اسم المستخدم أو كلمة المرور غير صحيحة'
    );
  END IF;

  -- Verify password
  IF v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'اسم المستخدم أو كلمة المرور غير صحيحة'
    );
  END IF;

  -- Generate session token
  v_token := encode(gen_random_bytes(32), 'base64');

  -- Create session (expires in 30 days)
  INSERT INTO public.user_sessions (user_id, token, expires_at)
  VALUES (v_user.id, v_token, NOW() + INTERVAL '30 days');

  -- Return success with user data
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'name', v_user.name,
      'partner_code', v_user.partner_code,
      'partner_id', v_user.partner_id
    ),
    'token', v_token
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'حدث خطأ أثناء تسجيل الدخول'
    );
END;
$$;

-- ========================================
-- ✅ تم! تحقق من النتيجة
-- ========================================
SELECT 'All tables created successfully!' as status;