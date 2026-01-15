import { useState, useEffect } from 'react';

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export function usePrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        // Format today's date as DD-MM-YYYY
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const dateString = `${day}-${month}-${year}`;
        
        // Fetch from Aladhan API for Amman, Jordan
        const url = `https://api.aladhan.com/v1/timings/${dateString}?latitude=31.9454&longitude=35.9284&method=2`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.data && data.data.timings) {
          setPrayerTimes(data.data.timings);
        }
      } catch (error) {
        console.error('Error fetching prayer times:', error);
        // Fallback to default times
        setPrayerTimes({
          Fajr: '05:15',
          Dhuhr: '12:30',
          Asr: '15:45',
          Maghrib: '18:20',
          Isha: '19:45',
        });
      }
    };

    fetchPrayerTimes();
  }, []);

  return prayerTimes;
}
