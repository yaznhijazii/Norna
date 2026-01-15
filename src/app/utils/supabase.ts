import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database Types
export interface User {
  id: string;
  username: string;
  name: string;
  partner_code?: string;
  partner_id?: string;
  created_at: string;
}

export interface Prayer {
  id: string;
  user_id: string;
  date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  created_at: string;
}

export interface QuranProgress {
  id: string;
  user_id: string;
  date: string;
  surah: 'baqarah' | 'mulk' | 'kahf';
  current_page: number;
  current_ayah: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AthkarProgress {
  id: string;
  user_id: string;
  date: string;
  type: 'morning' | 'evening';
  completed: boolean;
  created_at: string;
}

export interface PodcastProgress {
  id: string;
  user_id: string;
  week_start: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Duaa {
  id: string;
  user_id: string;
  content: string;
  category: 'personal' | 'partner_request' | 'partner_shared';
  is_shared: boolean;
  shared_with_user_id?: string;
  created_at: string;
  updated_at: string;
}