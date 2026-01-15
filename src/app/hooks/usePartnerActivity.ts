import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { toast } from 'sonner';

interface PartnerActivity {
  user_id: string;
  activity_type: 'prayer' | 'quran' | 'athkar';
  activity_name: string;
  timestamp: string;
}

export function usePartnerActivity(
  userId: string | null,
  partnerId: string | null,
  partnerName?: string
) {
  const [lastActivity, setLastActivity] = useState<PartnerActivity | null>(null);

  // Use partner name or fallback to "شريكك"
  const displayName = partnerName || 'شريكك';

  useEffect(() => {
    if (!userId || !partnerId) return;

    // Subscribe to partner's prayer updates
    const prayerChannel = supabase
      .channel(`partner-prayers-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prayers',
          filter: `user_id=eq.${partnerId}`,
        },
        (payload) => {
          const newData = payload.new as any;

          // Check which prayer was just completed
          const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
          for (const prayer of prayers) {
            if (newData[prayer] && (!payload.old || !(payload.old as any)[prayer])) {
              toast.success(`صلى ${displayName} ${getPrayerName(prayer)}! 🙏`, {
                duration: 3000,
                position: 'top-center',
              });

              setLastActivity({
                user_id: partnerId,
                activity_type: 'prayer',
                activity_name: prayer,
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to partner's Quran progress
    const quranChannel = supabase
      .channel(`partner-quran-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quran_readings',
          filter: `user_id=eq.${partnerId}`,
        },
        (payload) => {
          const newData = payload.new as any;

          if (newData.completed && (!payload.old || !(payload.old as any).completed)) {
            toast.success(`أنهى ${displayName} ${getSurahName(newData.surah_name)}! 📖`, {
              duration: 3000,
              position: 'top-center',
            });

            setLastActivity({
              user_id: partnerId,
              activity_type: 'quran',
              activity_name: newData.surah_name,
              timestamp: new Date().toISOString(),
            });
          }
        }
      )
      .subscribe();

    // Subscribe to partner's Athkar progress
    const athkarChannel = supabase
      .channel(`partner-athkar-${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'athkar',
          filter: `user_id=eq.${partnerId}`,
        },
        (payload) => {
          const newData = payload.new as any;

          if (newData.completed && (!payload.old || !(payload.old as any).completed)) {
            toast.success(`أكمل ${displayName} ${getAthkarName(newData.type)}! 🤲`, {
              duration: 3000,
              position: 'top-center',
            });

            setLastActivity({
              user_id: partnerId,
              activity_type: 'athkar',
              activity_name: newData.type,
              timestamp: new Date().toISOString(),
            });
          }
        }
      )
      .subscribe();

    return () => {
      prayerChannel.unsubscribe();
      quranChannel.unsubscribe();
      athkarChannel.unsubscribe();
    };
  }, [userId, partnerId, displayName]);

  return lastActivity;
}

function getPrayerName(prayer: string): string {
  const names: Record<string, string> = {
    fajr: 'الفجر',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  };
  return names[prayer] || prayer;
}

function getSurahName(surah: string): string {
  const names: Record<string, string> = {
    baqarah: 'سورة البقرة',
    mulk: 'سورة الملك',
    kahf: 'سورة الكهف',
  };
  return names[surah] || surah;
}

function getAthkarName(type: string): string {
  const names: Record<string, string> = {
    morning: 'أذكار الصباح',
    evening: 'أذكار المساء',
  };
  return names[type] || type;
}