import { useState, useEffect } from 'react';
import { BarChart, Heart, X, TrendingUp, Award, CheckCircle2, Star, Trophy } from 'lucide-react';
import { getWeekPrayers, getUserById, getWeekAthkarProgress, getWeekQuranProgress } from '../utils/db';

interface WeeklyReportProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProgress {
  name: string;
  prayers: number;  // out of 35 (5 prayers × 7 days)
  quran: {
    totalPages: number;
    baqarah: number;
    mulk: number;
    kahf: number;
  };
  athkar: {
    total: number;  // days with both completed
    morning: number;  // days completed
    evening: number;  // days completed
  };
}

export function WeeklyReport({ isOpen, onClose }: WeeklyReportProps) {
  const [myProgress, setMyProgress] = useState<UserProgress | null>(null);
  const [partnerProgress, setPartnerProgress] = useState<UserProgress | null>(null);
  const [hasPartner, setHasPartner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('nooruna_user');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUserId(userData.id);
    }
  }, []);

  useEffect(() => {
    if (isOpen && currentUserId) {
      loadWeeklyData();
    }
  }, [isOpen, currentUserId]);

  const loadWeeklyData = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      const user = await getUserById(currentUserId);
      if (!user) return;

      // Load my progress
      const myProgressData = await calculateUserProgress(currentUserId, user.name);
      setMyProgress(myProgressData);

      // Check for partner
      if (user.partner_id) {
        const partner = await getUserById(user.partner_id);
        if (partner) {
          setHasPartner(true);
          const partnerProgressData = await calculateUserProgress(user.partner_id, partner.name);
          setPartnerProgress(partnerProgressData);
        }
      } else {
        setHasPartner(false);
        setPartnerProgress(null);
      }
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserProgress = async (userId: string, name: string): Promise<UserProgress> => {
    try {
      // Get week prayers
      const weekPrayers = await getWeekPrayers(userId);
      const totalPrayers = weekPrayers.reduce((sum, day) => {
        return sum +
          (day.fajr ? 1 : 0) +
          (day.dhuhr ? 1 : 0) +
          (day.asr ? 1 : 0) +
          (day.maghrib ? 1 : 0) +
          (day.isha ? 1 : 0);
      }, 0);

      // Get week quran progress
      const weekQuran = await getWeekQuranProgress(userId);
      const quranStats = {
        totalPages: 0,
        baqarah: 0,
        mulk: 0,
        kahf: 0,
      };

      weekQuran.forEach((reading: any) => {
        const pages = reading.pages_read || 0;
        quranStats.totalPages += pages;

        if (reading.surah_name === 'baqarah') {
          quranStats.baqarah += pages;
        } else if (reading.surah_name === 'mulk') {
          quranStats.mulk += pages;
        } else if (reading.surah_name === 'kahf') {
          quranStats.kahf += pages;
        }
      });

      // Get week athkar progress
      const weekAthkar = await getWeekAthkarProgress(userId);

      // Count unique dates where athkar was completed
      const athkarDates = new Map<string, { morning: boolean; evening: boolean }>();

      weekAthkar.forEach((athkar: any) => {
        if (!athkar.completed) return;

        const date = athkar.date;
        if (!athkarDates.has(date)) {
          athkarDates.set(date, { morning: false, evening: false });
        }

        const dayData = athkarDates.get(date)!;
        if (athkar.type === 'morning') {
          dayData.morning = true;
        } else if (athkar.type === 'evening') {
          dayData.evening = true;
        }
      });

      let morningDays = 0;
      let eveningDays = 0;
      let bothDays = 0;

      athkarDates.forEach((data) => {
        if (data.morning) morningDays++;
        if (data.evening) eveningDays++;
        if (data.morning && data.evening) bothDays++;
      });

      return {
        name,
        prayers: totalPrayers,
        quran: quranStats,
        athkar: {
          total: bothDays,
          morning: morningDays,
          evening: eveningDays,
        },
      };
    } catch (error) {
      console.error('Error calculating progress:', error);
      return {
        name,
        prayers: 0,
        quran: { totalPages: 0, baqarah: 0, mulk: 0, kahf: 0 },
        athkar: { total: 0, morning: 0, evening: 0 },
      };
    }
  };

  const getPercentage = (value: number, max: number) => {
    return Math.min(Math.round((value / max) * 100), 100);
  };

  const getComparisonEmoji = (myValue: number, partnerValue: number) => {
    if (myValue > partnerValue) return '🏆';
    if (myValue < partnerValue) return '💪';
    return '🤝';
  };

  const getBadge = (prayers: number, quran: number, athkar: number) => {
    const total = prayers + quran + athkar;
    if (total >= 80) return { emoji: '🌟', title: 'متميز جداً!', color: 'gold' };
    if (total >= 60) return { emoji: '✨', title: 'ممتاز!', color: 'emerald' };
    if (total >= 40) return { emoji: '⭐', title: 'جيد جداً', color: 'blue' };
    if (total >= 20) return { emoji: '💫', title: 'جيد', color: 'purple' };
    return { emoji: '🌱', title: 'ابدأ قوي!', color: 'gray' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full my-8 border border-border">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <BarChart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl">التقرير الأسبوعي</h2>
                <p className="text-purple-100 text-sm">آخر 7 أيام</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : myProgress && (
            <>
              {/* User Cards with Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* My card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 relative overflow-hidden">
                  <div className="absolute top-2 left-2">
                    <span className="text-3xl">{getBadge(myProgress.prayers, myProgress.quran.totalPages, myProgress.athkar.total).emoji}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                      {myProgress.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-blue-900 text-lg">{myProgress.name}</p>
                      <p className="text-xs text-blue-700 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {getBadge(myProgress.prayers, myProgress.quran.totalPages, myProgress.athkar.total).title}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mt-4">
                    <div className="bg-white/60 rounded-lg p-2">
                      <p className="text-2xl font-bold text-blue-600">{myProgress.prayers}</p>
                      <p className="text-xs text-blue-800">صلاة</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                      <p className="text-2xl font-bold text-blue-600">{myProgress.quran.totalPages}</p>
                      <p className="text-xs text-blue-800">صفحة</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                      <p className="text-2xl font-bold text-blue-600">{myProgress.athkar.total}</p>
                      <p className="text-xs text-blue-800">يوم</p>
                    </div>
                  </div>
                </div>

                {/* Partner card */}
                {hasPartner && partnerProgress ? (
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 border-2 border-pink-200 relative overflow-hidden">
                    <div className="absolute top-2 left-2">
                      <span className="text-3xl">{getBadge(partnerProgress.prayers, partnerProgress.quran.totalPages, partnerProgress.athkar.total).emoji}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-xl">
                        {partnerProgress.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-pink-900 text-lg">{partnerProgress.name}</p>
                        <p className="text-xs text-pink-700 flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {getBadge(partnerProgress.prayers, partnerProgress.quran.totalPages, partnerProgress.athkar.total).title}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mt-4">
                      <div className="bg-white/60 rounded-lg p-2">
                        <p className="text-2xl font-bold text-pink-600">{partnerProgress.prayers}</p>
                        <p className="text-xs text-pink-800">صلاة</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <p className="text-2xl font-bold text-pink-600">{partnerProgress.quran.totalPages}</p>
                        <p className="text-xs text-pink-800">صفحة</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <p className="text-2xl font-bold text-pink-600">{partnerProgress.athkar.total}</p>
                        <p className="text-xs text-pink-800">يوم</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 flex flex-col items-center justify-center min-h-[180px]">
                    <Heart className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 text-center">
                      لم يتم الربط مع شريك بعد
                    </p>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      اربط حسابك لمتابعة التقدم معاً
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Comparison */}
              <div className="space-y-4">
                {/* Prayers */}
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                      🕌 الصلوات
                    </h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                      من أصل 35 صلاة
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{myProgress.name}</span>
                        <span className="font-bold text-blue-600 flex items-center gap-1">
                          {myProgress.prayers}
                          {hasPartner && partnerProgress && (
                            <span className="text-xl">{getComparisonEmoji(myProgress.prayers, partnerProgress.prayers)}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${getPercentage(myProgress.prayers, 35)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{getPercentage(myProgress.prayers, 35)}% مكتمل</p>
                    </div>
                    {hasPartner && partnerProgress && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{partnerProgress.name}</span>
                          <span className="font-bold text-pink-600 flex items-center gap-1">
                            {partnerProgress.prayers}
                            <span className="text-xl">{getComparisonEmoji(partnerProgress.prayers, myProgress.prayers)}</span>
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-500"
                            style={{ width: `${getPercentage(partnerProgress.prayers, 35)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{getPercentage(partnerProgress.prayers, 35)}% مكتمل</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quran - Detailed */}
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                      📖 القرآن الكريم
                    </h3>
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      إجمالي الصفحات
                    </span>
                  </div>

                  {/* Total Pages */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{myProgress.name}</span>
                        <span className="font-bold text-blue-600 flex items-center gap-1">
                          {myProgress.quran.totalPages} صفحة
                          {hasPartner && partnerProgress && (
                            <span className="text-xl">{getComparisonEmoji(myProgress.quran.totalPages, partnerProgress.quran.totalPages)}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                          style={{ width: `${Math.min(getPercentage(myProgress.quran.totalPages, 70), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    {hasPartner && partnerProgress && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{partnerProgress.name}</span>
                          <span className="font-bold text-pink-600 flex items-center gap-1">
                            {partnerProgress.quran.totalPages} صفحة
                            <span className="text-xl">{getComparisonEmoji(partnerProgress.quran.totalPages, myProgress.quran.totalPages)}</span>
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-600 transition-all duration-500"
                            style={{ width: `${Math.min(getPercentage(partnerProgress.quran.totalPages, 70), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Surah Details */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-700 mb-1">البقرة</p>
                      <p className="text-lg font-bold text-blue-600">{myProgress.quran.baqarah}</p>
                      {hasPartner && partnerProgress && (
                        <p className="text-xs text-blue-500 mt-1">vs {partnerProgress.quran.baqarah}</p>
                      )}
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-700 mb-1">الملك</p>
                      <p className="text-lg font-bold text-purple-600">{myProgress.quran.mulk}</p>
                      {hasPartner && partnerProgress && (
                        <p className="text-xs text-purple-500 mt-1">vs {partnerProgress.quran.mulk}</p>
                      )}
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-amber-700 mb-1">الكهف</p>
                      <p className="text-lg font-bold text-amber-600">{myProgress.quran.kahf}</p>
                      {hasPartner && partnerProgress && (
                        <p className="text-xs text-amber-500 mt-1">vs {partnerProgress.quran.kahf}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Athkar - Detailed */}
                <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                      📿 الأذكار
                    </h3>
                    <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                      أيام الالتزام
                    </span>
                  </div>

                  {/* Both completed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">أيام كاملة (صباح ومساء)</span>
                        <span className="font-bold text-blue-600 flex items-center gap-1">
                          {myProgress.athkar.total}/7
                          {hasPartner && partnerProgress && (
                            <span className="text-xl">{getComparisonEmoji(myProgress.athkar.total, partnerProgress.athkar.total)}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${getPercentage(myProgress.athkar.total, 7)}%` }}
                        ></div>
                      </div>
                    </div>
                    {hasPartner && partnerProgress && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">أيام كاملة (صباح ومساء)</span>
                          <span className="font-bold text-pink-600 flex items-center gap-1">
                            {partnerProgress.athkar.total}/7
                            <span className="text-xl">{getComparisonEmoji(partnerProgress.athkar.total, myProgress.athkar.total)}</span>
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-500"
                            style={{ width: `${getPercentage(partnerProgress.athkar.total, 7)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Morning vs Evening */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs text-yellow-700 mb-2 flex items-center gap-1">
                        <span>🌅</span> أذكار الصباح
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-yellow-600">{myProgress.athkar.morning}/7</p>
                        {hasPartner && partnerProgress && (
                          <p className="text-xs text-yellow-500">vs {partnerProgress.athkar.morning}/7</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-xs text-indigo-700 mb-2 flex items-center gap-1">
                        <span>🌙</span> أذكار المساء
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-indigo-600">{myProgress.athkar.evening}/7</p>
                        {hasPartner && partnerProgress && (
                          <p className="text-xs text-indigo-500">vs {partnerProgress.athkar.evening}/7</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivation Messages */}
              {hasPartner && partnerProgress && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-500 p-2 rounded-full">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 mb-2">تنافسوا في الخيرات! 🌟</h4>
                      <p className="text-sm text-amber-800">
                        {myProgress.prayers > partnerProgress.prayers
                          ? `أنت متقدم في الصلوات، واصل! 💪`
                          : partnerProgress.prayers > myProgress.prayers
                            ? `شريكك يتفوق عليك، شد حيلك! 🔥`
                            : `أنتم متساوون في الصلوات، ما شاء الله! 🤝`
                        }
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        ما أجمل أن تشجعوا بعضكم في الطاعات والعبادات 💚
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Achievements */}
              {myProgress.prayers >= 30 || myProgress.quran.totalPages >= 40 || myProgress.athkar.total >= 6 ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 p-2 rounded-full">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900 mb-2">إنجازات هذا الأسبوع 🎉</h4>
                      <div className="space-y-1">
                        {myProgress.prayers >= 30 && (
                          <p className="text-sm text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            أكملت {myProgress.prayers} صلاة من 35!
                          </p>
                        )}
                        {myProgress.quran.totalPages >= 40 && (
                          <p className="text-sm text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            قرأت {myProgress.quran.totalPages} صفحة من القرآن!
                          </p>
                        )}
                        {myProgress.athkar.total >= 6 && (
                          <p className="text-sm text-green-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            التزمت بالأذكار {myProgress.athkar.total} أيام!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
