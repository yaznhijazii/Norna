-- =====================================================
-- CLEANUP: Delete everything and start fresh
-- =====================================================
-- Run this FIRST to clean up your Supabase database
-- =====================================================

-- Drop all policies
DROP POLICY IF EXISTS "Users can view their own and shared duaas" ON duaas;
DROP POLICY IF EXISTS "Users can insert their own duaas" ON duaas;
DROP POLICY IF EXISTS "Users can update their own duaas" ON duaas;
DROP POLICY IF EXISTS "Users can delete their own duaas" ON duaas;

DROP POLICY IF EXISTS "Users can view their own podcast progress" ON podcast_progress;
DROP POLICY IF EXISTS "Users can insert their own podcast progress" ON podcast_progress;
DROP POLICY IF EXISTS "Users can update their own podcast progress" ON podcast_progress;
DROP POLICY IF EXISTS "Users can delete their own podcast progress" ON podcast_progress;

DROP POLICY IF EXISTS "Users can view their own athkar progress" ON athkar_progress;
DROP POLICY IF EXISTS "Users can insert their own athkar progress" ON athkar_progress;
DROP POLICY IF EXISTS "Users can update their own athkar progress" ON athkar_progress;
DROP POLICY IF EXISTS "Users can delete their own athkar progress" ON athkar_progress;

DROP POLICY IF EXISTS "Users can view their own quran progress" ON quran_progress;
DROP POLICY IF EXISTS "Users can insert their own quran progress" ON quran_progress;
DROP POLICY IF EXISTS "Users can update their own quran progress" ON quran_progress;
DROP POLICY IF EXISTS "Users can delete their own quran progress" ON quran_progress;

DROP POLICY IF EXISTS "Users can view their own prayers" ON prayers;
DROP POLICY IF EXISTS "Users can insert their own prayers" ON prayers;
DROP POLICY IF EXISTS "Users can update their own prayers" ON prayers;
DROP POLICY IF EXISTS "Users can delete their own prayers" ON prayers;

DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Drop all triggers
DROP TRIGGER IF EXISTS trigger_auto_partner_code ON users;

-- Drop all functions
DROP FUNCTION IF EXISTS auto_generate_partner_code();
DROP FUNCTION IF EXISTS generate_random_partner_code();

-- Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS duaas CASCADE;
DROP TABLE IF EXISTS podcast_progress CASCADE;
DROP TABLE IF EXISTS athkar_progress CASCADE;
DROP TABLE IF EXISTS quran_progress CASCADE;
DROP TABLE IF EXISTS prayers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Verify cleanup
SELECT 'All tables dropped successfully!' as status;
