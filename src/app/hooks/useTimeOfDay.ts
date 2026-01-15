import { useState, useEffect } from 'react';

export type TimeOfDay = 'fajr' | 'morning' | 'afternoon' | 'evening' | 'night';

export function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 7) {
        setTimeOfDay('fajr');
      } else if (hour >= 7 && hour < 12) {
        setTimeOfDay('morning');
      } else if (hour >= 12 && hour < 17) {
        setTimeOfDay('afternoon');
      } else if (hour >= 17 && hour < 20) {
        setTimeOfDay('evening');
      } else {
        setTimeOfDay('night');
      }
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return timeOfDay;
}

export const timeOfDayConfig = {
  fajr: {
    name: 'الفجر',
    gradient: 'from-indigo-50 via-purple-50 to-pink-50',
    headerGradient: 'from-indigo-600 via-purple-600 to-purple-700',
    icon: '🌅',
    message: 'بارك الله في بكورها',
  },
  morning: {
    name: 'الصباح',
    gradient: 'from-amber-50 via-orange-50 to-yellow-50',
    headerGradient: 'from-teal-600 via-teal-500 to-emerald-500',
    icon: '☀️',
    message: 'صباح النور والبركة',
  },
  afternoon: {
    name: 'الظهيرة',
    gradient: 'from-sky-50 via-blue-50 to-cyan-50',
    headerGradient: 'from-sky-500 via-blue-500 to-cyan-500',
    icon: '🌤️',
    message: 'نهارك مبارك',
  },
  evening: {
    name: 'المساء',
    gradient: 'from-violet-100 via-purple-100 to-pink-100',
    headerGradient: 'from-violet-600 via-purple-500 to-pink-500',
    icon: '🌆',
    message: 'مساء الخير والسكينة',
  },
  night: {
    name: 'الليل',
    gradient: 'from-slate-900 via-indigo-950 to-purple-950',
    headerGradient: 'from-indigo-700 via-purple-700 to-pink-700',
    icon: '🌙',
    message: 'ليلة مباركة',
  },
  // Manual theme modes
  light: {
    name: 'النهار',
    gradient: 'from-amber-50 via-orange-50 to-yellow-50',
    headerGradient: 'from-teal-600 via-teal-500 to-emerald-500',
    icon: '☀️',
    message: 'صباح النور والبركة',
  },
  dark: {
    name: 'الليل',
    gradient: 'from-slate-900 via-indigo-950 to-purple-950',
    headerGradient: 'from-indigo-700 via-purple-700 to-pink-700',
    icon: '🌙',
    message: 'ليلة مباركة',
  },
};