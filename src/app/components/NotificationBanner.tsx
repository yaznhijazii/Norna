import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

interface PrayerTimes {
  Asr: string;
}

export function NotificationBanner() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);

  // Fetch prayer times
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const dateString = `${day}-${month}-${year}`;

        const url = `https://api.aladhan.com/v1/timings/${dateString}?latitude=31.9454&longitude=35.9284&method=4`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && data.data.timings) {
          setPrayerTimes({ Asr: data.data.timings.Asr });
        }
      } catch (error) {
        console.error('Error fetching prayer times:', error);
        setPrayerTimes({ Asr: '15:45' }); // Fallback
      }
    };

    fetchPrayerTimes();
  }, []);

  useEffect(() => {
    if (!prayerTimes) return;

    const checkNotifications = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentMinutes = hour * 60 + minute;

      // Parse Asr time
      const [asrHour, asrMinute] = prayerTimes.Asr.split(':').map(Number);
      const asrMinutes = asrHour * 60 + asrMinute;
      const eveningAthkarMinutes = asrMinutes + 60; // 1 hour after Asr

      // Morning Athkar reminder (6:00 AM - 6:05 AM)
      if (hour === 6 && minute < 5) {
        setMessage('⏰ حان وقت أذكار الصباح');
        setShow(true);
      }
      // Evening Athkar reminder (1 hour after Asr - for 5 minutes)
      else if (currentMinutes >= eveningAthkarMinutes && currentMinutes < eveningAthkarMinutes + 5) {
        setMessage('⏰ حان وقت أذكار المساء');
        setShow(true);
      }
      // Al-Mulk reminder (8:00 PM - 8:05 PM)
      else if (hour === 20 && minute < 5) {
        setMessage('📖 تذكير بقراءة سورة الملك');
        setShow(true);
      }
      // Friday Al-Kahf reminder (if it's Friday and 10:00 AM - 10:05 AM)
      else if (now.getDay() === 5 && hour === 10 && minute < 5) {
        setMessage('🕌 اليوم الجمعة - تذكير بقراءة سورة الكهف');
        setShow(true);
      }
    };

    // Check immediately
    checkNotifications();

    // Check every minute
    const interval = setInterval(checkNotifications, 60000);

    return () => clearInterval(interval);
  }, [prayerTimes]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300 px-3 max-w-full">
      <div className="bg-primary text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-3 sm:gap-4 min-w-[280px] sm:min-w-[320px] max-w-[calc(100vw-24px)] border border-primary/20">
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse shrink-0" />
        <p className="flex-1 text-sm sm:text-base font-medium">{message}</p>
        <button
          onClick={() => setShow(false)}
          className="hover:bg-white/10 rounded-lg p-1 transition-colors shrink-0"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}