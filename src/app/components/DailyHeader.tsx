import { useState, useEffect, useCallback } from "react";
import { BookOpen, X, Loader2, Check, RotateCcw, Bookmark, Star, Play, Pause, Flame, Users, Award, Heart, ArrowDown, Calendar, ArrowLeft, ChevronRight, ChevronLeft, Plus, Trash2, User, BookHeart, Edit2 } from 'lucide-react';
import { TasbihIcon } from './TasbihIcon';
import { useTimeOfDay, timeOfDayConfig } from "../hooks/useTimeOfDay";
import { QiblaCompass } from "./QiblaCompass";
import {
  getTodayPrayers,
  getTodayAthkarProgress,
  getTodayQuranProgress,
} from "../utils/db";

const logoImage =
  "https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png";

interface DailyHeaderProps {
  userName?: string;
  onPartnerStatsClick?: () => void;
  hasPartner?: boolean;
}

export function DailyHeader({
  userName,
  onPartnerStatsClick,
  hasPartner,
}: DailyHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTask, setCurrentTask] = useState<string | null>(
    null,
  );
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] =
    useState(false);
  const [stats, setStats] = useState({
    todayProgress: 0,
    totalCompleted: 0,
    totalTasks: 0,
  });
  const timeOfDay = useTimeOfDay();
  const timeConfig = timeOfDayConfig[timeOfDay];

  // Extract first name only
  const firstName = userName ? userName.split(" ")[0] : "";
  const greetingText = `السلام عليكم ورحمة الله ${firstName ? `يا ${firstName}` : ""} `;

  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0;
    setDisplayedText("");
    setIsTypingComplete(false);

    const typeInterval = setInterval(() => {
      if (currentIndex < greetingText.length) {
        setDisplayedText(
          greetingText.slice(0, currentIndex + 1),
        );
        currentIndex++;
      } else {
        setIsTypingComplete(true);
        clearInterval(typeInterval);
      }
    }, 50); // Typing speed

    return () => clearInterval(typeInterval);
  }, [greetingText]);

  // Calculate stats
  useEffect(() => {
    const updateStats = async () => {
      try {
        const currentUser =
          localStorage.getItem("nooruna_user");
        if (!currentUser) return;

        const user = JSON.parse(currentUser);
        const userId = user.id;

        // Get all today's data from Supabase
        const [prayers, athkar, quran] = await Promise.all([
          getTodayPrayers(userId),
          getTodayAthkarProgress(userId),
          getTodayQuranProgress(userId),
        ]);

        // Count completed prayers
        const prayersCompleted = prayers
          ? (prayers.fajr ? 1 : 0) +
          (prayers.dhuhr ? 1 : 0) +
          (prayers.asr ? 1 : 0) +
          (prayers.maghrib ? 1 : 0) +
          (prayers.isha ? 1 : 0)
          : 0;

        // Count completed athkar
        const athkarCompleted = athkar
          ? athkar.filter((a: any) => a.completed).length
          : 0;

        // Count completed quran
        const quranCompleted = quran
          ? quran.filter((q: any) => q.completed).length
          : 0;

        // Check if today is Friday for Kahf availability
        const isFriday = new Date().getDay() === 5;
        const maxQuranTasks = isFriday ? 3 : 2; // Kahf only on Friday

        const total =
          prayersCompleted + athkarCompleted + quranCompleted;
        const maxPossible = 5 + 2 + maxQuranTasks; // 5 prayers + 2 athkar + quran tasks
        const progress = Math.round(
          (total / maxPossible) * 100,
        );

        setStats({
          todayProgress: progress,
          totalCompleted: total,
          totalTasks: maxPossible,
        });
      } catch (error) {
        console.error("Error updating stats:", error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    window.addEventListener("storage", updateStats);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", updateStats);
    };
  }, []);

  // Fetch prayer times from API
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        // Format today's date as DD-MM-YYYY
        const today = new Date();
        const day = String(today.getDate()).padStart(2, "0");
        const month = String(today.getMonth() + 1).padStart(
          2,
          "0",
        );
        const year = today.getFullYear();
        const dateString = `${day} -${month} -${year} `;

        const url = `https://api.aladhan.com/v1/timings/${dateString}?latitude=31.9454&longitude=35.9284&method=1`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && data.data.timings) {
          setPrayerTimes(data.data.timings);
        }
      } catch (error) {
        console.error("Error fetching prayer times:", error);
        // Fallback to default times
        setPrayerTimes({
          Fajr: "05:15",
          Dhuhr: "12:30",
          Asr: "15:45",
          Maghrib: "18:20",
          Isha: "19:45",
        });
      }
    };

    fetchPrayerTimes();
  }, []);

  useEffect(() => {
    if (!prayerTimes) return;

    const timeStringToMinutes = (
      timeString: string,
    ): number => {
      const [hours, minutes] = timeString
        .split(":")
        .map(Number);
      return hours * 60 + minutes;
    };

    const updateCurrentTask = () => {
      const now = new Date();
      setCurrentTime(now);

      const today = now.toDateString();
      const currentUser = localStorage.getItem("nooruna_user");
      const username = currentUser
        ? JSON.parse(currentUser).username
        : "guest";
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentMinutes = hour * 60 + minute;

      const prayers = localStorage.getItem(
        `prayers-${username}-${today}`,
      );
      const morningAthkar = localStorage.getItem(
        `athkar-morning-${username}-${today}`,
      );
      const eveningAthkar = localStorage.getItem(
        `athkar-evening-${username}-${today}`,
      );
      const quran = localStorage.getItem(
        `quran-${username}-${today}`,
      );

      const fajrMinutes = timeStringToMinutes(prayerTimes.Fajr);
      const dhuhrMinutes = timeStringToMinutes(
        prayerTimes.Dhuhr,
      );
      const asrMinutes = timeStringToMinutes(prayerTimes.Asr);
      const maghribMinutes = timeStringToMinutes(
        prayerTimes.Maghrib,
      );
      const ishaMinutes = timeStringToMinutes(prayerTimes.Isha);

      let current = null;

      // Priority 1: Prayers (tight time windows)
      if (
        currentMinutes >= fajrMinutes &&
        currentMinutes < fajrMinutes + 75
      ) {
        const prayersData = prayers ? JSON.parse(prayers) : {};
        if (!prayersData.fajr) current = "صلاة الفجر";
      } else if (
        currentMinutes >= dhuhrMinutes &&
        currentMinutes < dhuhrMinutes + 90
      ) {
        const prayersData = prayers ? JSON.parse(prayers) : {};
        if (!prayersData.dhuhr) current = "صلاة الظهر";
      } else if (
        currentMinutes >= asrMinutes &&
        currentMinutes < asrMinutes + 90
      ) {
        const prayersData = prayers ? JSON.parse(prayers) : {};
        if (!prayersData.asr) current = "صلاة العصر";
      } else if (
        currentMinutes >= maghribMinutes &&
        currentMinutes < maghribMinutes + 40
      ) {
        const prayersData = prayers ? JSON.parse(prayers) : {};
        if (!prayersData.maghrib) current = "صلاة المغرب";
      } else if (
        currentMinutes >= ishaMinutes &&
        currentMinutes < ishaMinutes + 60
      ) {
        const prayersData = prayers ? JSON.parse(prayers) : {};
        if (!prayersData.isha) current = "صلاة العشاء";
      }

      // Priority 2: Athkar (if no prayer)
      if (
        !current &&
        currentMinutes >= 6 * 60 &&
        currentMinutes < 12 * 60
      ) {
        if (!morningAthkar || !JSON.parse(morningAthkar))
          current = "أذكار الصباح";
      } else if (
        !current &&
        currentMinutes >= asrMinutes + 60 &&
        currentMinutes < maghribMinutes
      ) {
        // Evening Athkar after Asr by 1 hour until Maghrib
        if (!eveningAthkar || !JSON.parse(eveningAthkar))
          current = "أذكار المساء";
      }

      // Priority 3: Quran (if no prayer/athkar)
      if (
        !current &&
        currentMinutes >= 8 * 60 &&
        currentMinutes < 12 * 60
      ) {
        const quranData = quran ? JSON.parse(quran) : {};
        if (!quranData.baqarah) current = "سورة البقرة";
      } else if (
        !current &&
        currentMinutes >= 20 * 60 &&
        currentMinutes < 23 * 60 + 30
      ) {
        const quranData = quran ? JSON.parse(quran) : {};
        if (!quranData.mulk) current = "سورة الملك";
      }

      setCurrentTask(current);
    };

    updateCurrentTask();
    const timer = setInterval(updateCurrentTask, 60000); // Update every minute

    // Listen for storage changes
    window.addEventListener("storage", updateCurrentTask);

    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", updateCurrentTask);
    };
  }, [prayerTimes]);

  const arabicDays = [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const arabicMonths = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const dayName = arabicDays[currentTime.getDay()];
  const day = currentTime.getDate();
  const month = arabicMonths[currentTime.getMonth()];
  const year = currentTime.getFullYear();

  // Handle click on current task badge
  const handleCurrentTaskClick = () => {
    if (!currentTask) return;

    // Open Quran Reader for Quran tasks
    if (currentTask === "سورة البقرة") {
      window.dispatchEvent(
        new CustomEvent("openQuranSurah", {
          detail: { surah: "baqarah" },
        }),
      );
    } else if (currentTask === "سورة الملك") {
      window.dispatchEvent(
        new CustomEvent("openQuranSurah", {
          detail: { surah: "mulk" },
        }),
      );
    } else if (currentTask === "سورة الكهف") {
      window.dispatchEvent(
        new CustomEvent("openQuranSurah", {
          detail: { surah: "kahf" },
        }),
      );
    }
    // For Athkar, dispatch custom event
    else if (currentTask === "أذكار الصباح") {
      window.dispatchEvent(
        new CustomEvent("openAthkar", {
          detail: { type: "morning" },
        }),
      );
    } else if (currentTask === "أذكار المساء") {
      window.dispatchEvent(
        new CustomEvent("openAthkar", {
          detail: { type: "evening" },
        }),
      );
    }
    // For prayers, just scroll to timeline (no special action needed)
  };

  return (
    <div
      className={`relative bg-gradient-to-br ${timeConfig.headerGradient} rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg text-white transition-all duration-1000 overflow-hidden`}
    >
      {/* Subtle background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full blur-2xl"></div>
        <div
          className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10">
        {/* Top section - Greeting with Qibla and Partner stats */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Left side - Greeting and Date */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl">{timeConfig.icon}</span>
              <span className="text-xs sm:text-sm opacity-90 font-medium">
                {timeConfig.name}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 min-h-[1.5rem]">
              {displayedText}
              {!isTypingComplete && (
                <span className="animate-pulse text-amber-200">|</span>
              )}
            </h1>
            <p className="text-white/90 text-xs sm:text-sm md:text-base leading-relaxed mb-3">
              <span className="font-bold">{timeConfig.message}</span>، <span className="text-xs opacity-80">{dayName} {day} {month} {year}</span>
            </p>

            {currentTask && (
              <div className="flex flex-wrap gap-2 mt-4">
                {/* Quran Task Pill - Matches Green Pill in Image */}
                {(currentTask === "سورة البقرة" || currentTask === "سورة الملك" || currentTask === "سورة الكهف") && (
                  <button
                    onClick={handleCurrentTaskClick}
                    className="flex items-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white px-4 py-1.5 rounded-full shadow-lg transition-all active:scale-95 group relative"
                  >
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">{currentTask}</span>
                    <ChevronLeft className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}

                {/* Athkar Task Pill - Matches White Pill in Image */}
                {(currentTask === "أذكار الصباح" || currentTask === "أذكار المساء") && (
                  <button
                    onClick={handleCurrentTaskClick}
                    className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 px-4 py-1.5 rounded-full shadow-lg transition-all active:scale-95 group border border-slate-100 relative"
                  >
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <TasbihIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] font-bold">{currentTask}</span>
                    <ChevronLeft className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}

                {/* Prayer Task Pill - Custom Amber */}
                {currentTask.includes("صلاة") && (
                  <button
                    onClick={handleCurrentTaskClick}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-full shadow-lg transition-all active:scale-95 group"
                  >
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span className="text-[11px] font-bold">{currentTask}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right side - Qibla and Progress side by side */}
          <div className="flex gap-3">
            <QiblaCompass />

            {/* Progress card next to Qibla */}
            <div className="bg-white/10 backdrop-blur-sm rounded-md p-3 border border-white/20 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-200" />
                <span className="text-xs font-medium opacity-90">تقدم اليوم</span>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-1">{stats.todayProgress}%</div>
                <div className="text-xs opacity-75 mb-2">مكتمل</div>
                <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden mb-1 mx-auto">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700 ease-out"
                    style={{ width: `${stats.todayProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs opacity-75">
                  {stats.totalCompleted}/{stats.totalTasks}
                </div>
              </div>
            </div>

            {/* Partner stats - only show if has partner */}
            {hasPartner && onPartnerStatsClick && (
              <button
                onClick={onPartnerStatsClick}
                className="bg-white/10 backdrop-blur-sm rounded-md p-3 border border-white/20 hover:bg-white/25 hover:scale-105 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-pink-200 group-hover:text-pink-100 transition-colors" />
                  <span className="text-xs opacity-90 font-medium">الشريك</span>
                </div>
                <p className="text-sm font-semibold mb-0.5">إحصائيات</p>
                <p className="text-xs opacity-75">اضغط للعرض</p>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}