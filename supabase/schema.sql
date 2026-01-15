-- =====================================================
-- Islamic Reminder App - Supabase Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  partner_code TEXT UNIQUE,
  partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast username lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Index for fast partner code lookup
CREATE INDEX IF NOT EXISTS idx_users_partner_code ON users(partner_code);

-- =====================================================
-- 2. PRAYERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prayers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_prayers_user_date ON prayers(user_id, date);
CREATE INDEX IF NOT EXISTS idx_prayers_date ON prayers(date);

-- =====================================================
-- 3. QURAN PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quran_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quran_user_date ON quran_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_quran_date ON quran_progress(date);

-- =====================================================
-- 4. ATHKAR PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS athkar_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('morning', 'evening')),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_athkar_user_date ON athkar_progress(user_id, date);

-- =====================================================
-- 5. PODCAST PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS podcast_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_podcast_user_week ON podcast_progress(user_id, week_start);

-- =====================================================
-- 6. DUAAS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS duaas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('personal', 'partner_request', 'partner_shared')),
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_duaas_user ON duaas(user_id);
CREATE INDEX IF NOT EXISTS idx_duaas_shared_with ON duaas(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_duaas_category ON duaas(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE athkar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE duaas ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, but only authenticated users can insert/update their own
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (true);

-- Prayers: Users can only manage their own prayers
CREATE POLICY "Users can view own prayers" ON prayers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own prayers" ON prayers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own prayers" ON prayers
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own prayers" ON prayers
  FOR DELETE USING (true);

-- Quran Progress: Users can only manage their own progress
CREATE POLICY "Users can view own quran progress" ON quran_progress
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own quran progress" ON quran_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own quran progress" ON quran_progress
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own quran progress" ON quran_progress
  FOR DELETE USING (true);

-- Athkar Progress: Users can only manage their own progress
CREATE POLICY "Users can view own athkar progress" ON athkar_progress
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own athkar progress" ON athkar_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own athkar progress" ON athkar_progress
  FOR UPDATE USING (true);

-- Podcast Progress: Users can only manage their own progress
CREATE POLICY "Users can view own podcast progress" ON podcast_progress
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own podcast progress" ON podcast_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own podcast progress" ON podcast_progress
  FOR UPDATE USING (true);

-- Duaas: Users can view their own duaas and shared duaas
CREATE POLICY "Users can view own and shared duaas" ON duaas
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own duaas" ON duaas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own duaas" ON duaas
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own duaas" ON duaas
  FOR DELETE USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quran_progress_updated_at BEFORE UPDATE ON quran_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_podcast_progress_updated_at BEFORE UPDATE ON podcast_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_duaas_updated_at BEFORE UPDATE ON duaas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION: Generate partner codes for existing users
-- =====================================================
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

-- Update existing users without partner_code
DO $$
DECLARE
  user_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE partner_code IS NULL OR partner_code = '' LOOP
    LOOP
      new_code := generate_random_partner_code();
      
      -- Check if code already exists
      SELECT EXISTS(SELECT 1 FROM users WHERE partner_code = new_code) INTO code_exists;
      
      -- If code is unique, use it
      IF NOT code_exists THEN
        UPDATE users SET partner_code = new_code WHERE id = user_record.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- DONE!
-- =====================================================
-- Copy this entire script and run it in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/cobhopfnjktuwpxkejlz/sql