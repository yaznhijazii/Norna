ALTER TABLE gifts
ALTER COLUMN created_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_gifts_to_user_unread
ON gifts(to_user_id, is_read)
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_gifts_created_at
ON gifts(created_at DESC);

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can send gifts to their partner" ON gifts;
DROP POLICY IF EXISTS "Users can view their received gifts" ON gifts;
DROP POLICY IF EXISTS "Users can update their received gifts" ON gifts;

CREATE POLICY "Users can send gifts to their partner"
ON gifts
FOR INSERT
WITH CHECK (
  from_user_id::uuid = auth.uid()
  AND to_user_id::uuid IN (
    SELECT partner_id::uuid FROM users WHERE id::uuid = auth.uid()
  )
);

CREATE POLICY "Users can view their received gifts"
ON gifts
FOR SELECT
USING (
  to_user_id::uuid = auth.uid()
  OR from_user_id::uuid = auth.uid()
);

CREATE POLICY "Users can update their received gifts"
ON gifts
FOR UPDATE
USING (to_user_id::uuid = auth.uid())
WITH CHECK (to_user_id::uuid = auth.uid());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gifts')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND tablename = 'gifts'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE gifts;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_prayers')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND tablename = 'daily_prayers'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_prayers;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quran_progress')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND tablename = 'quran_progress'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE quran_progress;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'athkar_progress')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND tablename = 'athkar_progress'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE athkar_progress;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON push_subscriptions;

CREATE POLICY "Users can manage their own subscriptions"
ON push_subscriptions
FOR ALL
USING (user_id::uuid = auth.uid())
WITH CHECK (user_id::uuid = auth.uid());

CREATE TABLE IF NOT EXISTS partner_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('prayer','quran','athkar')),
  activity_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_partner_activity_user_date
ON partner_activity_log(user_id, date DESC);

ALTER TABLE partner_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own and partner's activity" ON partner_activity_log;
DROP POLICY IF EXISTS "Users can insert their own activity" ON partner_activity_log;

CREATE POLICY "Users can view their own and partner's activity"
ON partner_activity_log
FOR SELECT
USING (
  user_id::uuid = auth.uid()
  OR user_id::uuid IN (
    SELECT partner_id::uuid FROM users WHERE id::uuid = auth.uid()
  )
);

CREATE POLICY "Users can insert their own activity"
ON partner_activity_log
FOR INSERT
WITH CHECK (user_id::uuid = auth.uid());

CREATE OR REPLACE FUNCTION send_gift_to_partner(
  p_gift_type TEXT,
  p_message_text TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_partner_id UUID;
  v_gift_id UUID;
BEGIN
  v_user_id := auth.uid();

  SELECT partner_id::uuid
  INTO v_partner_id
  FROM users
  WHERE id::uuid = v_user_id;

  INSERT INTO gifts (
    from_user_id,
    to_user_id,
    gift_type,
    message_text,
    is_read,
    created_at
  )
  VALUES (
    v_user_id::text,
    v_partner_id::text,
    p_gift_type,
    p_message_text,
    false,
    NOW()
  )
  RETURNING id INTO v_gift_id;

  RETURN json_build_object(
    'success', true,
    'gift_id', v_gift_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION send_gift_to_partner TO authenticated;

CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_type TEXT;
  v_activity_name TEXT;
BEGIN
  IF TG_TABLE_NAME = 'daily_prayers' THEN
    v_activity_type := 'prayer';
    IF NEW.fajr AND NOT OLD.fajr THEN v_activity_name := 'fajr';
    ELSIF NEW.dhuhr AND NOT OLD.dhuhr THEN v_activity_name := 'dhuhr';
    ELSIF NEW.asr AND NOT OLD.asr THEN v_activity_name := 'asr';
    ELSIF NEW.maghrib AND NOT OLD.maghrib THEN v_activity_name := 'maghrib';
    ELSIF NEW.isha AND NOT OLD.isha THEN v_activity_name := 'isha';
    END IF;
  ELSIF TG_TABLE_NAME = 'quran_progress' THEN
    v_activity_type := 'quran';
    v_activity_name := NEW.surah;
  ELSIF TG_TABLE_NAME = 'athkar_progress' THEN
    v_activity_type := 'athkar';
    v_activity_name := NEW.type;
  END IF;

  IF v_activity_name IS NOT NULL THEN
    INSERT INTO partner_activity_log (
      user_id,
      activity_type,
      activity_name,
      timestamp,
      date
    )
    VALUES (
      NEW.user_id,
      v_activity_type,
      v_activity_name,
      NOW(),
      CURRENT_DATE
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_old_gifts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM gifts
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_read = true;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;
