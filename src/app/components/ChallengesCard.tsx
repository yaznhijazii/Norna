import { Trophy, Users, BookOpen, Quote, ChevronRight, CheckCircle2, Clock, HandHeart } from 'lucide-react';
import { motion } from 'motion/react';

export interface UserChallengeData {
    id: string;
    type: 'quran' | 'charity';
    title: string;
    details: Record<string, string>;
    progress: number;
    partnerProgress: number;
    startDate: string;
    targetDate?: string;
}

interface ChallengesCardProps {
    onChallengesClick: () => void;
    activeChallenges: UserChallengeData[];
    partnerId?: string;
    partnerName?: string;
}

export function ChallengesCard({ onChallengesClick, activeChallenges, partnerName = 'الشريك' }: ChallengesCardProps) {
    const activeChallenge = activeChallenges[0]; // Show the most recent active one

    if (!activeChallenge) {
        return (
            <motion.button
                onClick={onChallengesClick}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-amber-500/20 text-white text-right relative overflow-hidden group"
            >
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-12 -translate-y-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full tracking-widest uppercase">التحديات</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">ابدأ تحدياً جديداً</h3>
                    <p className="text-white/80 text-[10px] font-medium font-amiri leading-relaxed">
                        ﴿وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ﴾
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold">
                        استعرض التحديات المتاحة <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </motion.button>
        );
    }

    const isQuran = activeChallenge.type === 'quran';

    return (
        <div className="bg-[#fcf8ff] dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden group">
            {/* Background Icon */}
            <Trophy className="absolute -left-4 -bottom-4 w-32 h-32 text-slate-50 dark:text-white/5 -rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isQuran ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-amber-500 shadow-amber-500/20'}`}>
                            {isQuran ? <BookOpen className="w-5 h-5 text-white" /> : <HandHeart className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">تحدي جارٍ</h3>
                            <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {isQuran ? 'حفظ مشترك' : 'صدقة مشتركة'}
                            </div>
                        </div>
                    </div>
                    <button onClick={onChallengesClick} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                </div>

                {/* Challenge Info */}
                <div className="bg-[#fcf8ff] dark:bg-white/5 rounded-2xl p-4 mb-5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {isQuran ? (
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {activeChallenge.details.surah || 'تحدي الحفظ'} (صفحة {activeChallenge.details.from_page} - {activeChallenge.details.to_page})
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    صدقة بقيمة {activeChallenge.details.amount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <Clock className="w-3.5 h-3.5" /> بدأ اليوم
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* You */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black px-1">
                                <span className="text-slate-500 uppercase">تقدمك أنت</span>
                                <span className="text-emerald-600">{activeChallenge.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${activeChallenge.progress}%` }} className="h-full bg-emerald-500" />
                            </div>
                        </div>

                        {/* Partner */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black px-1">
                                <span className="text-slate-500 uppercase">تقدم {partnerName}</span>
                                <span className="text-indigo-600">{activeChallenge.partnerProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${activeChallenge.partnerProgress}%` }} className="h-full bg-indigo-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={onChallengesClick}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all group/btn"
                >
                    {activeChallenge.progress >= 100 ? (
                        <>إكمال التحدي <CheckCircle2 className="w-4 h-4" /></>
                    ) : (
                        <>متابعة التحدي <Quote className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" /></>
                    )}
                </button>
            </div>
        </div>
    );
}
