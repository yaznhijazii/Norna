import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, User, X, Trophy, Heart, TrendingUp } from 'lucide-react';
import { getTodayPrayers, getTodayQuranProgress, getTodayAthkarProgress } from '../utils/db';
import { supabase } from '../utils/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface UserStats {
  userId: string;
  username: string;
  avatar?: string;
  totalTasks: number;
  completedTasks: number;
  prayers: { total: number; completed: number };
  quran: { total: number; completed: number };
  athkar: { total: number; completed: number };
}

interface DailyPartnerStatsProps {
  currentUserId: string;
  partnerId?: string;
  onClose?: () => void;
  isOverlay?: boolean;
}

export function DailyPartnerStats({ currentUserId, partnerId, onClose, isOverlay = false }: DailyPartnerStatsProps) {
  const [partnerStats, setPartnerStats] = useState<UserStats | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    if (partnerId) {
      loadPartnerStats();
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === `avatar_${partnerId}`) {
          setForceUpdate(prev => prev + 1);
          loadPartnerStats();
        }
      };
      window.addEventListener('storage', handleStorageChange);
      const interval = setInterval(loadPartnerStats, 30000);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [partnerId, forceUpdate]);

  const loadPartnerStats = async () => {
    if (!partnerId) return;
    const stats = await getUserStats(partnerId);
    setPartnerStats(stats);
  };

  const getUserStats = async (userId: string): Promise<UserStats> => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('username, name, avatar_url')
        .eq('id', userId)
        .single();

      let displayName = userData?.name || userData?.username || 'شريكك';
      const { data: currentUserData } = await supabase
        .from('users')
        .select('partner_nickname')
        .eq('id', currentUserId)
        .single();

      if (currentUserData?.partner_nickname) {
        displayName = currentUserData.partner_nickname;
      }

      const localAvatar = localStorage.getItem(`avatar_${userId}`);
      const avatar = localAvatar || userData?.avatar_url || '';

      const [prayers, quranList, athkarList] = await Promise.all([
        getTodayPrayers(userId),
        getTodayQuranProgress(userId),
        getTodayAthkarProgress(userId),
      ]);

      const prayerFields = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      const completedPrayers = prayerFields.filter(p => prayers?.[p]).length;

      const dayOfWeek = new Date().getDay();
      const isFriday = dayOfWeek === 5;
      let quranTotal = 2;
      if (isFriday) quranTotal = 3;

      const completedQuran = quranList?.filter((q: any) => q.completed).length || 0;
      const completedAthkar = athkarList?.filter((a: any) => a.completed).length || 0;

      const totalTasks = 5 + quranTotal + 2;
      const completedTasks = completedPrayers + completedQuran + completedAthkar;

      return {
        userId,
        username: displayName,
        avatar,
        totalTasks,
        completedTasks,
        prayers: { total: 5, completed: completedPrayers },
        quran: { total: quranTotal, completed: completedQuran },
        athkar: { total: 2, completed: completedAthkar },
      };
    } catch (error) {
      return {
        userId,
        username: 'شريكك',
        totalTasks: 0,
        completedTasks: 0,
        prayers: { total: 5, completed: 0 },
        quran: { total: 2, completed: 0 },
        athkar: { total: 2, completed: 0 },
      };
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !partnerId) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      localStorage.setItem(`avatar_${partnerId}`, base64);
      setShowAvatarModal(false);
      loadPartnerStats();
    };
    reader.readAsDataURL(file);
  };

  if (!partnerId || !partnerStats) return null;

  const percentage = Math.round((partnerStats.completedTasks / partnerStats.totalTasks) * 100) || 0;
  const strokeDasharray = 2 * Math.PI * 45;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100">
            <Trophy className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-base">إحصائيات الإنجاز</h2>
            <p className="text-[11px] text-slate-400 font-bold">متابعة شريكك اليوم</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            تحديث مباشر
          </div>
          {isOverlay && onClose && (
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors border border-slate-100">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* Progress Ring & Avatar */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-teal-500/5 blur-3xl rounded-full" />
          <svg className="w-36 h-36 transform -rotate-90 relative z-10">
            <circle cx="72" cy="72" r="62" stroke="#f1f5f9" strokeWidth="10" fill="none" />
            <motion.circle
              initial={{ strokeDashoffset: 2 * Math.PI * 62 }}
              animate={{ strokeDashoffset: (2 * Math.PI * 62) - ((2 * Math.PI * 62) * percentage / 100) }}
              transition={{ duration: 1.5, ease: "circOut" }}
              cx="72" cy="72" r="62" stroke="#10b981" strokeWidth="10" fill="none" strokeLinecap="round"
              style={{ strokeDasharray: 2 * Math.PI * 62 }}
            />
          </svg>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowAvatarModal(true)}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full p-1.5 bg-white shadow-2xl z-20"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100">
              {partnerStats.avatar ? (
                <img src={partnerStats.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-200" />
              )}
            </div>
          </motion.button>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-xl z-30 flex items-center gap-1.5"
          >
            <TrendingUp className="w-3 h-3 text-amber-400" />
            {percentage}%
          </motion.div>
        </div>

        <h3 className="font-black text-slate-800 text-xl mb-1">{partnerStats.username}</h3>
        <p className="text-xs text-slate-400 font-bold mb-8">
          أنجز {partnerStats.completedTasks} من {partnerStats.totalTasks} مهام حتى الآن
        </p>

        {/* Stats Grid */}
        <div className="w-full space-y-3">
          {[
            { id: 'prayers', title: 'الصلوات', icon: '🕌', color: 'blue', stats: partnerStats.prayers },
            { id: 'quran', title: 'القرآن', icon: '📖', color: 'emerald', stats: partnerStats.quran },
            { id: 'athkar', title: 'الأذكار', icon: '📿', color: 'purple', stats: partnerStats.athkar }
          ].map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="group relative flex items-center justify-between bg-white/50 hover:bg-white rounded-2xl p-3 border border-slate-100 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-${item.color}-50 flex items-center justify-center text-lg`}>
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-slate-700">{item.title}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: item.stats.total }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        backgroundColor: i < item.stats.completed ?
                          (item.color === 'blue' ? '#3b82f6' : item.color === 'emerald' ? '#10b981' : '#a855f7') :
                          '#f1f5f9'
                      }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className={`w-2 h-2 rounded-full relative`}
                    >
                      {i < item.stats.completed && (
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-current rounded-full"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
                <span className={`text-[10px] font-black text-${item.color}-600 bg-${item.color}-50 px-2 py-0.5 rounded-lg`}>
                  {item.stats.completed}/{item.stats.total}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {percentage === 100 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full mt-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg shadow-amber-200"
          >
            <div className="p-2 bg-white/20 rounded-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-white font-black text-xs">إنجاز مذهل اليوم!</p>
              <p className="text-white/80 text-[10px]">تم إكمال جميع المهام بنجاح</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Avatar Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800">تحديث صورة الشريك</h3>
                <button onClick={() => setShowAvatarModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <label className="cursor-pointer group">
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <div className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold transition-all text-center flex items-center justify-center gap-2">
                    <User className="w-5 h-5" />
                    اختيار صورة
                  </div>
                </label>
                <button onClick={() => setShowAvatarModal(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}