-- =====================================================
-- FRESH SETUP: Complete Database with Auth Integration
-- =====================================================
-- Run this AFTER cleanup to set up everything fresh
-- =====================================================

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  partner_code TEXT UNIQUE,
  partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_partner_code ON users(partner_code);
CREATE INDEX idx_users_username ON users(username);

-- Function to generate random partner code
CREATE OR REPLACE FUNCTION generate_random_partner_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate partner_code
CREATE OR REPLACE FUNCTION auto_generate_partner_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.partner_code IS NULL OR NEW.partner_code = '' THEN
    LOOP
      new_code := generate_random_partner_code();
      SELECT EXISTS(SELECT 1 FROM users WHERE partner_code = new_code) INTO code_exists;
      IF NOT code_exists THEN
        NEW.partner_code := new_code;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_partner_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_partner_code();

-- =====================================================
-- 2. PRAYERS TABLE
-- =====================================================
CREATE TABLE prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fajr BOOLEAN DEFAULT FALSE,
  dhuhr BOOLEAN DEFAULT FALSE,
  asr BOOLEAN DEFAULT FALSE,
  maghrib BOOLEAN DEFAULT FALSE,
  isha BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_prayers_user_date ON prayers(user_id, date);

-- =====================================================
-- 3. QURAN PROGRESS TABLE
-- =====================================================
CREATE TABLE quran_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  surah TEXT NOT NULL CHECK (surah IN ('baqarah', 'mulk', 'kahf')),
  current_page INTEGER DEFAULT 1,
  current_ayah INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, surah)
);

CREATE INDEX idx_quran_user_date ON quran_progress(user_id, date);

-- =====================================================
-- 4. ATHKAR PROGRESS TABLE
-- =====================================================
CREATE TABLE athkar_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('morning', 'evening')),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, type)
);

CREATE INDEX idx_athkar_user_date ON athkar_progress(user_id, date);

-- =====================================================
-- 5. PODCAST PROGRESS TABLE
-- =====================================================
CREATE TABLE podcast_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_podcast_user_week ON podcast_progress(user_id, week_start);

-- =====================================================
-- 6. DUAAS TABLE
-- =====================================================
CREATE TABLE duaas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('personal', 'partner_request', 'partner_shared')),
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_duaas_user ON duaas(user_id);
CREATE INDEX idx_duaas_shared ON duaas(shared_with_user_id) WHERE shared_with_user_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE athkar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE duaas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Allow authenticated users to insert their own user record
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow anyone to read users (for partner code lookup)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT 
  USING (true);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

-- =====================================================
-- PRAYERS POLICIES
-- =====================================================

CREATE POLICY "Users can view own and partner prayers" ON prayers
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR auth.uid() IN (
      SELECT partner_id FROM users WHERE id = user_id
    )
  );

CREATE POLICY "Users can insert own prayers" ON prayers
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prayers" ON prayers
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prayers" ON prayers
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- QURAN PROGRESS POLICIES
-- =====================================================

CREATE POLICY "Users can view own and partner quran" ON quran_progress
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR auth.uid() IN (
      SELECT partner_id FROM users WHERE id = user_id
    )
  );

CREATE POLICY "Users can insert own quran progress" ON quran_progress
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quran progress" ON quran_progress
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quran progress" ON quran_progress
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- ATHKAR PROGRESS POLICIES
-- =====================================================

CREATE POLICY "Users can view own and partner athkar" ON athkar_progress
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR auth.uid() IN (
      SELECT partner_id FROM users WHERE id = user_id
    )
  );

CREATE POLICY "Users can insert own athkar progress" ON athkar_progress
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own athkar progress" ON athkar_progress
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own athkar progress" ON athkar_progress
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- PODCAST PROGRESS POLICIES
-- =====================================================

CREATE POLICY "Users can view own and partner podcast" ON podcast_progress
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR auth.uid() IN (
      SELECT partner_id FROM users WHERE id = user_id
    )
  );

CREATE POLICY "Users can insert own podcast progress" ON podcast_progress
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own podcast progress" ON podcast_progress
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own podcast progress" ON podcast_progress
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- DUAAS POLICIES
-- =====================================================

CREATE POLICY "Users can view own and shared duaas" ON duaas
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR auth.uid() = shared_with_user_id
    OR auth.uid() IN (
      SELECT partner_id FROM users WHERE id = user_id
    )
  );

CREATE POLICY "Users can insert own duaas" ON duaas
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own duaas" ON duaas
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own duaas" ON duaas
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'prayers', 'quran_progress', 'athkar_progress', 'podcast_progress', 'duaas')
ORDER BY table_name;

-- Check RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'prayers', 'quran_progress', 'athkar_progress', 'podcast_progress', 'duaas')
ORDER BY tablename;

-- Count policies
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';
