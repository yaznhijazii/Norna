import { useEffect, useState, useRef } from 'react';
import { notificationService } from '../utils/notifications';

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface UseNotificationsOptions {
  prayerTimes: PrayerTimes | null;
  enabled?: boolean;
}

export function useNotifications({ prayerTimes, enabled = true }: UseNotificationsOptions) {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const notifiedPrayersRef = useRef<Set<string>>(new Set());
  const notifiedAthkarRef = useRef<Set<string>>(new Set());

  // Request permission on mount
  useEffect(() => {
    const init = async () => {
      if (enabled) {
        const granted = await notificationService.requestPermission();
        setIsPermissionGranted(granted);
      }
    };
    init();
  }, [enabled]);

  // Check prayer times every minute
  useEffect(() => {
    if (!enabled || !isPermissionGranted || !prayerTimes) return;

    const checkPrayerTimes = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = now.toDateString();

      // Check each prayer
      const prayers = [
        { name: 'Fajr', arabic: 'الفجر', time: prayerTimes.Fajr },
        { name: 'Dhuhr', arabic: 'الظهر', time: prayerTimes.Dhuhr },
        { name: 'Asr', arabic: 'العصر', time: prayerTimes.Asr },
        { name: 'Maghrib', arabic: 'المغرب', time: prayerTimes.Maghrib },
        { name: 'Isha', arabic: 'العشاء', time: prayerTimes.Isha },
      ];

      prayers.forEach(prayer => {
        const prayerKey = `${today}-${prayer.name}`;
        
        // Check if it's prayer time (within 1 minute window)
        if (currentTime === prayer.time && !notifiedPrayersRef.current.has(prayerKey)) {
          console.log(`🕌 Prayer time notification: ${prayer.arabic}`);
          notificationService.notifyPrayerTime(prayer.name, prayer.arabic);
          notifiedPrayersRef.current.add(prayerKey);
        }
      });
    };

    // Check athkar times
    const checkAthkarTimes = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const today = now.toDateString();

      // Morning athkar reminder at 7:00 AM
      if (currentHour === 7 && currentMinutes === 0) {
        const key = `${today}-morning-athkar`;
        if (!notifiedAthkarRef.current.has(key)) {
          console.log('🌅 Morning athkar notification');
          notificationService.notifyAthkar('morning');
          notifiedAthkarRef.current.add(key);
        }
      }

      // Evening athkar reminder at 6:00 PM
      if (currentHour === 18 && currentMinutes === 0) {
        const key = `${today}-evening-athkar`;
        if (!notifiedAthkarRef.current.has(key)) {
          console.log('🌙 Evening athkar notification');
          notificationService.notifyAthkar('evening');
          notifiedAthkarRef.current.add(key);
        }
      }
    };

    // Check Quran reading times
    const checkQuranReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentDay = now.getDay();
      const today = now.toDateString();

      // Al-Baqarah daily reminder at 9:00 AM (except Friday)
      if (currentHour === 9 && currentMinutes === 0 && currentDay !== 5) {
        const key = `${today}-baqarah`;
        if (!notifiedAthkarRef.current.has(key)) {
          console.log('📖 Al-Baqarah notification');
          notificationService.notifyQuranReading('سورة البقرة');
          notifiedAthkarRef.current.add(key);
        }
      }

      // Al-Kahf Friday reminder at 10:00 AM
      if (currentHour === 10 && currentMinutes === 0 && currentDay === 5) {
        const key = `${today}-kahf`;
        if (!notifiedAthkarRef.current.has(key)) {
          console.log('📖 Al-Kahf notification');
          notificationService.notifyQuranReading('سورة الكهف');
          notifiedAthkarRef.current.add(key);
        }
      }

      // Al-Mulk evening reminder at 8:00 PM
      if (currentHour === 20 && currentMinutes === 0) {
        const key = `${today}-mulk`;
        if (!notifiedAthkarRef.current.has(key)) {
          console.log('📖 Al-Mulk notification');
          notificationService.notifyQuranReading('سورة الملك');
          notifiedAthkarRef.current.add(key);
        }
      }
    };

    // Check every minute
    const interval = setInterval(() => {
      checkPrayerTimes();
      checkAthkarTimes();
      checkQuranReminders();
    }, 60000); // Every minute

    // Check immediately
    checkPrayerTimes();
    checkAthkarTimes();
    checkQuranReminders();

    // Clear old notifications at midnight
    const midnightCheck = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        notifiedPrayersRef.current.clear();
        notifiedAthkarRef.current.clear();
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(midnightCheck);
    };
  }, [prayerTimes, enabled, isPermissionGranted]);

  return {
    isPermissionGranted,
    requestPermission: () => notificationService.requestPermission(),
  };
}
