import { useState, useEffect } from 'react';
import { TrendingUp, Award, Flame } from 'lucide-react';
import { getTodayPrayers, getTodayAthkarProgress, getTodayQuranProgress } from '../utils/db';

export function ProgressSummary() {
  const [stats, setStats] = useState({
    todayProgress: 0,
    weekStreak: 0,
    totalCompleted: 0,
  });
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('nooruna_user');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUserId(userData.id);  // Changed from userData.userId to userData.id
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      updateStats();
      const interval = setInterval(updateStats, 60000); // Update every minute

      // Listen for storage changes
      const handleStorageChange = () => {
        updateStats();
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [currentUserId]);

  const updateStats = async () => {
    if (!currentUserId) return;
    
    try {
      // Get all today's data
      const [prayers, athkar, quran] = await Promise.all([
        getTodayPrayers(currentUserId),
        getTodayAthkarProgress(currentUserId),
        getTodayQuranProgress(currentUserId),
      ]);
      
      // Count completed prayers
      const prayersCompleted = prayers ? 
        (prayers.fajr ? 1 : 0) +
        (prayers.dhuhr ? 1 : 0) +
        (prayers.asr ? 1 : 0) +
        (prayers.maghrib ? 1 : 0) +
        (prayers.isha ? 1 : 0) : 0;
      
      // Count completed athkar
      const athkarCompleted = athkar ? 
        athkar.filter((a: any) => a.completed).length : 0;
      
      // Count completed quran
      const quranCompleted = quran ? 
        quran.filter((q: any) => q.completed).length : 0;
      
      // Check if today is Friday for Kahf availability
      const isFriday = new Date().getDay() === 5;
      const maxQuranTasks = isFriday ? 3 : 2; // Kahf only on Friday
      
      const total = prayersCompleted + athkarCompleted + quranCompleted;
      const maxPossible = 5 + 2 + maxQuranTasks; // 5 prayers + 2 athkar + quran tasks
      const progress = Math.round((total / maxPossible) * 100);

      setStats({
        todayProgress: progress,
        weekStreak: 7, // This would be calculated from actual streak data
        totalCompleted: total,
      });
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Today Progress */}
      <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-[2px] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
        <div className="relative bg-background rounded-[14px] p-4 sm:p-5 h-full">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 sm:p-2 rounded-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">التقدم اليومي</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {stats.todayProgress}
            </p>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">من المهام اليومية</p>
          
          {/* Mini Progress Bar */}
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 rounded-full"
              style={{ width: `${stats.todayProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl p-[2px] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
        <div className="relative bg-background rounded-[14px] p-4 sm:p-5 h-full">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-1.5 sm:p-2 rounded-lg">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">سلسلة الأيام</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {stats.weekStreak}
            </p>
            <span className="text-lg text-muted-foreground">🔥</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">أيام متتالية</p>
        </div>
      </div>

      {/* Completed Tasks */}
      <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-[2px] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
        <div className="relative bg-background rounded-[14px] p-4 sm:p-5 h-full">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-1.5 sm:p-2 rounded-lg">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">المهام المكتملة</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {stats.totalCompleted}
            </p>
            <span className="text-lg text-muted-foreground">✓</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">اليوم</p>
        </div>
      </div>
    </div>
  );
}