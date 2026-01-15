import { useState, useEffect, useRef } from "react";
import { Sunrise, Sun, Sunset, Moon, Book, BookOpen, MessageCircle, Clock, Calendar } from "lucide-react";
import { Check } from "lucide-react";
import { usePrayerTimes } from "../hooks/usePrayerTimes";
import { motion } from "motion/react";
import confetti from 'canvas-confetti';
import {
  getTodayPrayers,
  updatePrayer,
  getTodayQuranProgress,
  updateQuranProgress,
  getTodayAthkarProgress,
  updateAthkarProgress
} from "../utils/db";

interface TimelineTask {
  id: string;
  title: string;
  time: string;
  timeValue: number;
  icon: any;
  isActive: boolean;
  isPast: boolean;
  type: "prayer" | "athkar" | "quran";
  storageField?: string;
}

interface InteractiveTimelineProps {
  userId?: string;
}

export function InteractiveTimeline({ userId }: InteractiveTimelineProps) {
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});
  const [nextPrayerCountdown, setNextPrayerCountdown] = useState<string>('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false); // Track if we already auto-scrolled
  const clickTimerRef = useRef<{ [key: string]: { count: number; timer: NodeJS.Timeout | null } }>({});
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const prayerTimes = usePrayerTimes();

  // Calculate current minutes from currentTime
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Get user ID from props or localStorage (nooruna_user)
  const getCurrentUserId = () => {
    if (userId) return userId;

    try {
      const userStr = localStorage.getItem('nooruna_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    } catch (error) {
      console.error('Error getting user from localStorage:', error);
    }

    return null;
  };

  const currentUserId = getCurrentUserId();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Calculate countdown to next prayer
  useEffect(() => {
    const prayers = tasks.filter(t => t.type === 'prayer' && !completionStatus[t.id]);
    const nextPrayer = prayers.find(p => p.timeValue > currentMinutes);

    if (nextPrayer) {
      const diff = nextPrayer.timeValue - currentMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      setNextPrayerCountdown(`${hours > 0 ? hours + 'س ' : ''}${mins}د`);
    } else {
      setNextPrayerCountdown('');
    }
  }, [tasks, currentMinutes, completionStatus]);

  // Load tasks and update them based on current time
  useEffect(() => {
    if (prayerTimes && currentUserId) {
      loadTasks(currentUserId);
    }
  }, [prayerTimes, currentTime, currentUserId]);

  // Auto-scroll to active task (only once on initial load)
  useEffect(() => {
    const activeTask = tasks.find((task) => task.isActive);
    if (activeTask && scrollContainerRef.current && !hasAutoScrolledRef.current && tasks.length > 0) {
      // Wait for DOM to be ready
      setTimeout(() => {
        const activeElement = scrollContainerRef.current?.querySelector(
          `[data-task-id="${activeTask.id}"]`
        );
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
          hasAutoScrolledRef.current = true; // Mark as scrolled
          console.log('✅ Auto-scrolled to active task (one-time only):', activeTask.title);
        }
      }, 100);
    }
  }, [tasks.length]); // Only depend on tasks.length, not tasks array itself

  const loadTasks = async (userId: string) => {
    if (!prayerTimes) return;

    const allTasks: TimelineTask[] = [
      {
        id: "fajr",
        title: "صلاة الفجر",
        time: prayerTimes.Fajr,
        timeValue: convertToMinutes(prayerTimes.Fajr),
        icon: Sunrise,
        isActive: false,
        isPast: false,
        type: "prayer",
        storageField: "fajr",
      },
      {
        id: "athkar-morning",
        title: "أذكار الصباح",
        time: "بعد الفجر",
        timeValue: convertToMinutes(prayerTimes.Fajr) + 30,
        icon: Book,
        isActive: false,
        isPast: false,
        type: "athkar",
      },
      {
        id: "baqarah",
        title: "سورة البقرة",
        time: `صفحة ${(() => {
          const dayOfWeek = new Date().getDay();
          return dayOfWeek === 6 ? 1 : dayOfWeek + 2;
        })()}`,
        timeValue: convertToMinutes(prayerTimes.Fajr) + 60,
        icon: BookOpen,
        isActive: false,
        isPast: false,
        type: "quran",
        storageField: "baqarah",
      },
      {
        id: "dhuhr",
        title: "صلاة الظهر",
        time: prayerTimes.Dhuhr,
        timeValue: convertToMinutes(prayerTimes.Dhuhr),
        icon: Sun,
        isActive: false,
        isPast: false,
        type: "prayer",
        storageField: "dhuhr",
      },
      {
        id: "asr",
        title: "صلاة العصر",
        time: prayerTimes.Asr,
        timeValue: convertToMinutes(prayerTimes.Asr),
        icon: Sun,
        isActive: false,
        isPast: false,
        type: "prayer",
        storageField: "asr",
      },
      {
        id: "maghrib",
        title: "صلاة المغرب",
        time: prayerTimes.Maghrib,
        timeValue: convertToMinutes(prayerTimes.Maghrib),
        icon: Sunset,
        isActive: false,
        isPast: false,
        type: "prayer",
        storageField: "maghrib",
      },
      {
        id: "athkar-evening",
        title: "أذكار المساء",
        time: "بعد المغرب",
        timeValue: convertToMinutes(prayerTimes.Maghrib) + 30,
        icon: Book,
        isActive: false,
        isPast: false,
        type: "athkar",
      },
      {
        id: "isha",
        title: "صلاة العشاء",
        time: prayerTimes.Isha,
        timeValue: convertToMinutes(prayerTimes.Isha),
        icon: Moon,
        isActive: false,
        isPast: false,
        type: "prayer",
        storageField: "isha",
      },
      {
        id: "mulk",
        title: "سورة الملك",
        time: "قبل النوم",
        timeValue: 23 * 60 + 58, // 23:58 - قبل نهاية اليوم بدقيقتين
        icon: BookOpen,
        isActive: false,
        isPast: false,
        type: "quran",
        storageField: "mulk",
      },
    ];

    // Determine current active task and past tasks
    let currentActiveIndex = -1;

    for (let i = 0; i < allTasks.length; i++) {
      if (currentMinutes >= allTasks[i].timeValue) {
        currentActiveIndex = i;
      }
    }

    allTasks.forEach((task, index) => {
      // Active task (the current one based on time)
      if (index === currentActiveIndex) {
        task.isActive = true;
        task.isPast = false;
      }
      // Past tasks (before the current active task)
      else if (index < currentActiveIndex) {
        task.isActive = false;
        task.isPast = true;
      }
    });

    setTasks(allTasks);

    // Load completion status from Supabase
    const status: Record<string, boolean> = {};

    try {
      const [prayers, quranList, athkarList] = await Promise.all([
        getTodayPrayers(userId),
        getTodayQuranProgress(userId),
        getTodayAthkarProgress(userId),
      ]);

      allTasks.forEach((task) => {
        if (task.type === "prayer" && task.storageField) {
          status[task.id] = prayers?.[task.storageField] || false;
        } else if (task.type === "quran" && task.storageField) {
          const quranData = quranList?.find((q: any) => q.surah === task.storageField);
          status[task.id] = quranData?.completed || false;
        } else if (task.type === "athkar") {
          const type = task.id === 'athkar-morning' ? 'morning' : 'evening';
          const athkarData = athkarList?.find((a: any) => a.type === type);
          status[task.id] = athkarData?.completed || false;
        }
      });
    } catch (error) {
      console.error('Error loading completion status:', error);
    }

    setCompletionStatus(status);
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentUserId) return;

    // For Quran tasks, open the reader instead of toggling (only on single click if not completed)
    if (task.type === "quran" && task.storageField && !completionStatus[taskId]) {
      // Dispatch event to open Quran reader
      window.dispatchEvent(new CustomEvent('openQuranSurah', {
        detail: {
          surah: task.storageField,
          openTodayPage: task.storageField === 'baqarah' // Open today's page for Baqarah
        }
      }));
      return;
    }

    // For Athkar tasks, open the reader instead of toggling (only on single click if not completed)
    if (task.type === "athkar" && !completionStatus[taskId]) {
      const athkarType = task.id === 'athkar-morning' ? 'morning' : 'evening';
      window.dispatchEvent(new CustomEvent('openAthkar', {
        detail: { type: athkarType }
      }));
      return;
    }

    const newStatus = !completionStatus[taskId];

    // Update Supabase based on task type
    try {
      if (task.type === "prayer" && task.storageField) {
        await updatePrayer(currentUserId, task.storageField, newStatus);
      } else if (task.type === "athkar") {
        const type = task.id === 'athkar-morning' ? 'morning' : 'evening';
        await updateAthkarProgress(currentUserId, type, newStatus);
      } else if (task.type === "quran" && task.storageField) {
        // Allow unchecking completed quran
        if (!newStatus) {
          await updateQuranProgress(
            currentUserId,
            task.storageField as 'baqarah' | 'mulk' | 'kahf',
            0, // Reset to 0 (not started)
            0, // Reset ayah
            false
          );
        }
      }

      // Update local state
      setCompletionStatus({
        ...completionStatus,
        [taskId]: newStatus,
      });

      // Trigger update for other components
      window.dispatchEvent(new Event("storage"));

      // Confetti for completed tasks
      if (newStatus) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  // Handle click with double-click detection
  const handleTaskClick = async (taskId: string, e: React.MouseEvent) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentUserId) return;

    // Initialize click tracking for this task if not exists
    if (!clickTimerRef.current[taskId]) {
      clickTimerRef.current[taskId] = { count: 0, timer: null };
    }

    const clickData = clickTimerRef.current[taskId];
    clickData.count++;

    // Clear existing timer
    if (clickData.timer) {
      clearTimeout(clickData.timer);
    }

    // Single click handler (after delay to check for double click)
    if (clickData.count === 1) {
      clickData.timer = setTimeout(() => {
        console.log('👆 Single click detected:', task.title);

        // Single click behavior:
        // - Prayer: Toggle completion
        // - Quran/Athkar (not completed): Open reader
        // - Quran/Athkar (completed): Uncheck
        if (task.type === 'prayer') {
          handleToggleTask(taskId);
        } else if (task.type === 'quran' || task.type === 'athkar') {
          if (!completionStatus[taskId]) {
            // Open reader
            if (task.type === 'quran' && task.storageField) {
              window.dispatchEvent(new CustomEvent('openQuranSurah', {
                detail: {
                  surah: task.storageField,
                  openTodayPage: task.storageField === 'baqarah'
                }
              }));
            } else if (task.type === 'athkar') {
              const athkarType = task.id === 'athkar-morning' ? 'morning' : 'evening';
              window.dispatchEvent(new CustomEvent('openAthkar', {
                detail: { type: athkarType }
              }));
            }
          } else {
            // Uncheck completed task
            handleToggleTask(taskId);
          }
        }

        clickData.count = 0;
      }, 300); // Wait 300ms to detect double click
    }
    // Double click handler
    else if (clickData.count === 2) {
      clearTimeout(clickData.timer!);
      clickData.count = 0;

      console.log('👆👆 Double click detected:', task.title);

      // Double click behavior:
      // - Quran/Athkar (not completed): Mark as completed directly
      // - Any (completed): Uncheck
      if ((task.type === 'quran' || task.type === 'athkar') && !completionStatus[taskId]) {
        // Mark as completed
        const newStatus = true;

        try {
          if (task.type === 'athkar') {
            const type = task.id === 'athkar-morning' ? 'morning' : 'evening';
            await updateAthkarProgress(currentUserId, type, newStatus);
          } else if (task.type === 'quran' && task.storageField) {
            await updateQuranProgress(
              currentUserId,
              task.storageField as 'baqarah' | 'mulk' | 'kahf',
              100, // Mark as fully completed
              0,
              true
            );
          }

          setCompletionStatus({
            ...completionStatus,
            [taskId]: newStatus,
          });

          window.dispatchEvent(new Event("storage"));

          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }

          // Confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (error) {
          console.error('Error completing task:', error);
        }
      } else {
        // Uncheck
        handleToggleTask(taskId);
      }
    }
  };

  // Handle swipe left to complete
  const handleTouchStart = (taskId: string, e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = async (taskId: string, e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartXRef.current - touchEndX;
    const diffY = Math.abs(touchStartYRef.current - touchEndY);

    // Swipe left detected (at least 100px horizontal, less than 50px vertical)
    if (diffX > 100 && diffY < 50) {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !currentUserId) return;

      console.log('👈 Swipe left detected:', task.title);

      // Only complete if not already completed
      if (!completionStatus[taskId]) {
        const newStatus = true;

        try {
          if (task.type === 'prayer' && task.storageField) {
            await updatePrayer(currentUserId, task.storageField, newStatus);
          } else if (task.type === 'athkar') {
            const type = task.id === 'athkar-morning' ? 'morning' : 'evening';
            await updateAthkarProgress(currentUserId, type, newStatus);
          } else if (task.type === 'quran' && task.storageField) {
            await updateQuranProgress(
              currentUserId,
              task.storageField as 'baqarah' | 'mulk' | 'kahf',
              100,
              0,
              true
            );
          }

          setCompletionStatus({
            ...completionStatus,
            [taskId]: newStatus,
          });

          window.dispatchEvent(new Event("storage"));

          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }

          // Confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (error) {
          console.error('Error completing task via swipe:', error);
        }
      }
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case "prayer":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "athkar":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "quran":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case "prayer":
        return "صلاة";
      case "athkar":
        return "أذكار";
      case "quran":
        return "قرآن";
      default:
        return "";
    }
  };

  if (!prayerTimes) {
    return (
      <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">
            جارٍ تحميل مواقيت الصلاة...
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-border/50 shadow-lg sticky top-4">
      <div className="flex items-center justify-between mb-3 px-2">
        <div>
          <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>جدول اليوم</span>
          </h2>

        </div>

        {nextPrayerCountdown && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 shadow-sm animate-pulse">
            <Clock className="w-3 h-3" />
            <span>باقي {nextPrayerCountdown}</span>
          </div>
        )}
      </div>

      <div
        className="relative min-h-[300px] px-2 pb-5 custom-scrollbar pr-1 max-h-[400px] overflow-y-auto"
        ref={scrollContainerRef}
      >
        {/* Continuous Vertical Timeline Line */}
        <div className="absolute right-[18px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-emerald-200/50 via-emerald-100/30 to-transparent rounded-full"></div>

        <div className="space-y-2.5 relative">
          {tasks.map((task, index) => {
            const Icon = task.icon;
            const isCompleted = completionStatus[task.id];

            // Find next task
            const nextTask = index < tasks.length - 1 ? tasks[index + 1] : null;
            // Missed logic: if past, not completed, and we are close to next task
            const isMissed = task.isPast && !isCompleted && nextTask && currentMinutes >= (nextTask.timeValue - 2);

            return (
              <motion.div
                key={task.id}
                data-task-id={task.id} // For auto-scroll
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pr-8"
              >
                {/* Timeline Node */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-8 h-full z-10 pointer-events-none">
                  <div className={`
                    w-2.5 h-2.5 rounded-full border-[2px] z-10 box-content transition-all duration-500
                    ${isCompleted
                      ? 'bg-emerald-500 border-white shadow-[0_0_0_3px_rgba(16,185,129,0.2)]'
                      : task.isActive
                        ? 'bg-amber-500 border-white shadow-[0_0_0_4px_rgba(245,158,11,0.3)] scale-125 animate-pulse'
                        : isMissed
                          ? 'bg-red-500 border-white shadow-[0_0_0_3px_rgba(239,68,68,0.2)]'
                          : 'bg-white border-slate-200'
                    }
                  `}>
                    {isCompleted && <Check className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 stroke-[3]" />}
                  </div>
                </div>

                {/* Card */}
                <motion.button
                  onClick={(e) => handleTaskClick(task.id, e)}
                  whileHover={{ scale: 1.01, x: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full relative overflow-hidden rounded-xl p-2.5 transition-all duration-300 text-right group
                    ${task.isActive
                      ? 'bg-gradient-to-br from-[#fffcf5] to-white border border-amber-200 shadow-[0_8px_30px_-10px_rgba(251,191,36,0.15)] ring-1 ring-amber-100'
                      : isCompleted
                        ? 'bg-white/60 border border-emerald-100/50 opacity-70 hover:opacity-100'
                        : isMissed
                          ? 'bg-red-50/50 border border-red-100'
                          : 'bg-white border border-slate-100 shadow-sm hover:shadow-md'
                    }
                  `}
                >
                  {/* Active Indicator Glow */}
                  {task.isActive && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/10 blur-[40px] rounded-full -mr-10 -mt-10"></div>
                  )}

                  <div className="flex items-center gap-3 relative z-10">
                    {/* Icon Box */}
                    <div className={`
                      w-9 h-9 rounded-lg flex items-center justify-center text-base shadow-sm transition-colors duration-300
                      ${isCompleted
                        ? 'bg-emerald-100/50 text-emerald-600'
                        : task.isActive
                          ? 'bg-amber-100 text-amber-600'
                          : isMissed
                            ? 'bg-red-100/50 text-red-500'
                            : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                      }
                    `}>
                      <Icon className={`w-4 h-4 ${task.isActive ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`font-bold text-sm truncate ${isCompleted ? 'text-emerald-800/70 line-through decoration-emerald-500/30' :
                          task.isActive ? 'text-amber-900' :
                            isMissed ? 'text-red-800' : 'text-slate-700'
                          }`}>
                          {task.title}
                        </h3>
                        {task.isActive && !isCompleted && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200/50 animate-pulse">
                            جاري الآن
                          </span>
                        )}
                        {isMissed && !task.isActive && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200/50">
                            فائت
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium">
                        <span className={`
                          px-1.5 py-px rounded text-[10px]
                          ${isCompleted
                            ? 'bg-emerald-50 text-emerald-600'
                            : task.isActive
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-slate-50 text-slate-400'}
                        `}>
                          {task.time}
                        </span>
                        {task.type === 'quran' && !isCompleted && (
                          <span className="text-amber-500 flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>ورد</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper function to convert time string (HH:MM) to minutes (unchanged)
function convertToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}