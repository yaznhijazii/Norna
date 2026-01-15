import { useState, useEffect, useRef } from 'react';
import { BookOpen, X, Loader2, Check, ChevronRight, ChevronLeft, RotateCcw, Bookmark, Star, Moon, SunMedium, Play, Pause } from 'lucide-react';
import { getQuranProgress, updateQuranProgress } from '../utils/db';
import { motion, AnimatePresence } from 'motion/react';

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
}

interface SurahData {
  ayahs: Ayah[];
  name: string;
  englishName: string;
  numberOfAyahs: number;
}

interface SurahProgress {
  currentPage: number;
  currentAyah: number;
  totalPages: number;
  completed: boolean;
}

const SURAHS = {
  baqarah: { id: 2, name: 'سورة البقرة', pages: 7, ayahsPerPage: 41 },
  mulk: { id: 67, name: 'سورة الملك', pages: 1, ayahsPerPage: 30 },
  kahf: { id: 18, name: 'سورة الكهف', pages: 1, ayahsPerPage: 110 },
};

export function QuranReader() {
  const [selectedSurah, setSelectedSurah] = useState<keyof typeof SURAHS | null>(null);
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAyah, setCurrentAyah] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Record<string, SurahProgress>>({});
  const [selectedAyahDetail, setSelectedAyahDetail] = useState<Ayah | null>(null);
  const ayahAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAyahPlaying, setIsAyahPlaying] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const user = localStorage.getItem('nooruna_user');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUserId(userData.id);  // Changed from userData.userId to userData.id
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadProgress();
      window.addEventListener('storage', loadProgress);

      // Listen for open surah requests from timeline
      const handleOpenSurah = (e: any) => {
        const surahKey = e.detail?.surah as keyof typeof SURAHS;
        const openTodayPage = e.detail?.openTodayPage || false;
        if (surahKey && SURAHS[surahKey]) {
          fetchSurah(surahKey, openTodayPage);
        }
      };

      window.addEventListener('openQuranSurah', handleOpenSurah);

      return () => {
        window.removeEventListener('storage', loadProgress);
        window.removeEventListener('openQuranSurah', handleOpenSurah);
      };
    }
  }, [currentUserId]);

  const loadProgress = async () => {
    if (!currentUserId) return;

    const savedProgress: Record<string, SurahProgress> = {};

    try {
      const progressData = await Promise.all(
        Object.keys(SURAHS).map(async (key) => {
          const surahKey = key as keyof typeof SURAHS;
          const data = await getQuranProgress(currentUserId, surahKey);

          // Try to load currentAyah from localStorage
          const localKey = `quran_ayah_${currentUserId}_${surahKey}`;
          const savedAyah = localStorage.getItem(localKey);

          return {
            surahKey,
            progress: data ? {
              currentPage: data.current_page,
              currentAyah: savedAyah ? parseInt(savedAyah) : 0,
              totalPages: SURAHS[surahKey].pages,
              completed: data.completed,
            } : {
              currentPage: 0,  // Changed from 1 to 0 for not started
              currentAyah: 0,
              totalPages: SURAHS[surahKey].pages,
              completed: false,
            }
          };
        })
      );

      progressData.forEach(({ surahKey, progress }) => {
        savedProgress[surahKey] = progress;
      });
    } catch (error) {
      console.error('Error loading progress:', error);
    }

    setProgress(savedProgress);
  };

  const saveProgress = async (surahKey: keyof typeof SURAHS, page: number, ayah: number, completed: boolean) => {
    if (!currentUserId) return;

    try {
      await updateQuranProgress(currentUserId, surahKey, page, ayah, completed);

      // Update local state
      setProgress(prev => ({
        ...prev,
        [surahKey]: {
          currentPage: page,
          currentAyah: ayah,
          totalPages: SURAHS[surahKey].pages,
          completed,
        }
      }));

      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const fetchSurah = async (surahKey: keyof typeof SURAHS, openTodayPage: boolean = false) => {
    setLoading(true);
    setSelectedSurah(surahKey);

    // For Baqarah: if no progress, start from today's page
    let startPage = 1;
    let startAyah = 0;

    if (surahKey === 'baqarah') {
      const savedPage = progress[surahKey]?.currentPage;
      if (savedPage && savedPage > 0) {
        // Has progress, continue from there
        startPage = savedPage;
        startAyah = progress[surahKey]?.currentAyah || 0;
      } else {
        // No progress, start from today's page
        const dayOfWeek = new Date().getDay();
        startPage = dayOfWeek === 6 ? 1 : dayOfWeek + 2;
      }
    } else {
      // Clamp startPage to ensure it doesn't exceed total pages
      const totalPages = SURAHS[surahKey].pages;

      let savedPage = progress[surahKey]?.currentPage || 1;
      if (savedPage > totalPages) savedPage = 1;

      startPage = savedPage;
      startAyah = progress[surahKey]?.currentAyah || 0;
    }

    if (openTodayPage && surahKey === 'baqarah') {
      const dayOfWeek = new Date().getDay();
      startPage = dayOfWeek === 6 ? 1 : dayOfWeek + 2;
    }

    setCurrentPage(startPage);
    setCurrentAyah(startAyah);

    try {
      const url = `https://api.alquran.cloud/v1/surah/${SURAHS[surahKey].id}/quran-simple`;
      const response = await fetch(url);
      const data = await response.json();

      // Process Ayahs (Bismillah cleanup and special cases)
      if (data.data && data.data.ayahs) {
        const ayahs = data.data.ayahs;

        // Comprehensive Bismillah cleanup for the first ayah
        const firstAyah = ayahs[0];
        if (firstAyah && firstAyah.text) {
          // This regex catches almost all variations of Bismillah found in different API sources
          const bismillahRegex = /^[\u0628\u0650\u0633\u0652\u0645\u0650\u0627\u0644\u0644\u0651\u064e\u0647\u0650\u0627\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650\u0627\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650\s]*|^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*|^بِسْمِ\s+اللهِ\s+الرَّحْمَنِ\s+الرَّحِيمِ\s*|^بسم\s+الله\s+الرحمن\s+الرحيم\s*/;
          firstAyah.text = firstAyah.text.replace(bismillahRegex, '').trim();
        }

        // Special Case: Surah Al-Baqarah (Alif Lam Meem)
        if (surahKey === 'baqarah') {
          if (!firstAyah.text.startsWith('الٓمٓ')) {
            firstAyah.text = 'الٓمٓ ' + firstAyah.text;
          }
        }

        // Special Case: Surah Al-Mulk
        if (surahKey === 'mulk' && firstAyah.text.length < 10) {
          firstAyah.text = 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ';
        }

        // Surah Al-Kahf often returns just the text after bismillah, which is correct
      }


      setSurahData(data.data);
    } catch (err) {
      console.error('Error fetching surah:', err);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setSelectedSurah(null);
    setSurahData(null);
    setCurrentPage(1);
    setCurrentAyah(0);
  };

  const handleNextPage = () => {
    if (!selectedSurah) return;

    const totalPages = SURAHS[selectedSurah].pages;
    const nextPage = currentPage + 1;

    if (nextPage <= totalPages) {
      setCurrentPage(nextPage);
      setCurrentAyah(0);

      // For Baqarah: check if finished today's page
      if (selectedSurah === 'baqarah') {
        const dayOfWeek = new Date().getDay();
        const todayPage = dayOfWeek === 6 ? 1 : dayOfWeek + 2;
        const completedTodayPage = currentPage >= todayPage;
        saveProgress(selectedSurah, nextPage, 0, completedTodayPage);
      } else {
        saveProgress(selectedSurah, nextPage, 0, false);
      }
    } else {
      // Finished all pages
      saveProgress(selectedSurah, totalPages, 0, true);
      close();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      setCurrentAyah(0);
      if (selectedSurah) {
        saveProgress(selectedSurah, prevPage, 0, false);
      }
    }
  };

  const handleReset = (surahKey: keyof typeof SURAHS) => {
    if (!currentUserId) return;

    // Clear localStorage for ayah
    const localKey = `quran_ayah_${currentUserId}_${surahKey}`;
    localStorage.removeItem(localKey);

    // Reset progress in DB
    saveProgress(surahKey, 0, 0, false);
  };

  const handleAyahClick = (ayah: Ayah) => {
    if (!selectedSurah || !currentUserId) return;
    setSelectedAyahDetail(ayah);
    setCurrentAyah(ayah.numberInSurah);

    // Save ayah to localStorage
    const localKey = `quran_ayah_${currentUserId}_${selectedSurah}`;
    localStorage.setItem(localKey, ayah.numberInSurah.toString());

    saveProgress(selectedSurah, currentPage, ayah.numberInSurah, false);

    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const getCurrentPageAyahs = (): Ayah[] => {
    if (!surahData || !selectedSurah) return [];

    const ayahsPerPage = SURAHS[selectedSurah].ayahsPerPage;
    const startIndex = (currentPage - 1) * ayahsPerPage;
    const endIndex = startIndex + ayahsPerPage;

    let ayahs = surahData.ayahs.slice(startIndex, endIndex);


    return ayahs;
  };

  const isFriday = new Date().getDay() === 5;

  // Get today's Baqarah page (Saturday=1, Sunday=2, ..., Friday=7)
  const getTodayBaqarahPage = () => {
    const dayOfWeek = new Date().getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert: Saturday(6)=1, Sunday(0)=2, Monday(1)=3, ..., Friday(5)=7
    return dayOfWeek === 6 ? 1 : dayOfWeek + 2;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100/50 shadow-sm overflow-hidden"
      >
        {/* Decorative Islamic Pattern Background */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] pointer-events-none">
          <svg viewBox="0 0 100 100" className="text-emerald-900">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M50 5 L50 95 M5 50 L95 50" stroke="currentColor" strokeWidth="0.5" />
            <path d="M18 18 L82 82 M82 18 L18 82" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-24 h-24 opacity-[0.04] pointer-events-none rotate-180">
          <svg viewBox="0 0 100 100" className="text-emerald-900">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(45 50 50)" />
          </svg>
        </div>

        <div className="relative z-10">
          <h3 className="font-bold text-emerald-900 mb-6 flex items-center gap-2 text-xl">
            <BookOpen className="w-6 h-6 text-emerald-700" />
            <span>القرآن الكريم</span>
            <div className="h-px flex-1 bg-gradient-to-l from-emerald-300/50 to-transparent mr-4"></div>
          </h3>

          {/* Horizontal Cards Grid */}
          <div className={`grid gap-5 relative ${isFriday ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>

            {/* Baqarah - Golden/Orange Theme */}
            <motion.div
              whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(217, 119, 6, 0.1)" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative bg-[#FFFCF5] rounded-xl p-4 border border-amber-200/60 shadow-sm group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/20 rounded-full blur-3xl -mr-8 -mt-8 transition-all group-hover:bg-amber-100/30"></div>

              <div className="flex items-start justify-between mb-2 relative z-10">
                <div className="relative">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-2 text-base">
                    سورة البقرة
                    <span className="text-amber-500"><SunMedium className="w-3.5 h-3.5 fill-amber-500/20" /></span>
                  </h4>
                  <p className="text-[10px] text-emerald-700/70 mt-0.5 font-medium bg-amber-50 px-2 py-0.5 rounded-full inline-block border border-amber-100/50">
                    286 آية • 7 صفحات
                  </p>
                </div>
                {progress.baqarah?.completed && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </div>

              <div className="space-y-3 relative z-10">
                {progress.baqarah && progress.baqarah.currentAyah > 0 && !progress.baqarah.completed && (
                  <div className="flex items-center gap-2 text-[10px] text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/50">
                    <Bookmark className="w-3 h-3 fill-amber-700/20" />
                    <span className="font-medium">توقفت عند آية {progress.baqarah.currentAyah}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-emerald-700/80 font-medium px-1">
                    <span>صفحة {progress.baqarah?.currentPage || 0} من 7</span>
                    <span>{progress.baqarah?.completed ? 100 : Math.round((Math.max((progress.baqarah?.currentPage || 0) - 1, 0) / 7) * 100)}%</span>
                  </div>
                  <div className="h-1 bg-amber-100/50 rounded-full overflow-hidden shadow-inner ring-1 ring-amber-50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.baqarah?.completed ? 100 : (Math.max((progress.baqarah?.currentPage || 0) - 1, 0) / 7) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-amber-500"
                    ></motion.div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => fetchSurah('baqarah')}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-1.5 rounded-lg transition-all font-medium text-xs shadow-sm hover:shadow flex items-center justify-center gap-2"
                  >
                    <span>{progress.baqarah && progress.baqarah.currentPage > 0 ? 'أكمل القراءة' : 'ابدأ القراءة'}</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {progress.baqarah && progress.baqarah.currentPage > 0 && (
                    <button
                      onClick={() => handleReset('baqarah')}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-800 p-1.5 rounded-lg transition-all shadow-sm border border-amber-100"
                      title="إعادة من البداية"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Mulk - Purple Theme */}
            <motion.div
              whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(109, 40, 217, 0.1)" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative bg-[#FBFBFF] rounded-xl p-4 border border-purple-100 shadow-sm group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100/20 rounded-full blur-3xl -mr-8 -mt-8 transition-all group-hover:bg-purple-100/30"></div>

              <div className="flex items-start justify-between mb-2 relative z-10">
                <div className="relative">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-2 text-base">
                    سورة الملك
                    <span className="text-purple-500"><Moon className="w-3.5 h-3.5 fill-purple-500/20" /></span>
                  </h4>
                  <p className="text-[10px] text-emerald-700/70 mt-0.5 font-medium bg-purple-50 px-2 py-0.5 rounded-full inline-block border border-purple-100/50">
                    30 آية • قراءة مسائية
                  </p>
                </div>
                {progress.mulk?.completed && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </div>

              <div className="space-y-3 relative z-10">
                {progress.mulk && progress.mulk.currentAyah > 0 && !progress.mulk.completed && (
                  <div className="flex items-center gap-2 text-[10px] text-indigo-800 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100">
                    <Bookmark className="w-3 h-3 fill-indigo-700/20" />
                    <span className="font-medium">توقفت عند آية {progress.mulk.currentAyah}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-emerald-700/80 font-medium px-1">
                    <span>{progress.mulk?.completed ? 'مكتملة' : progress.mulk && progress.mulk.currentPage > 0 ? 'قيد القراءة' : 'لم تبدأ'}</span>
                    <span>{progress.mulk?.completed ? '100%' : '0%'}</span>
                  </div>
                  <div className="h-1 bg-purple-100/50 rounded-full overflow-hidden shadow-inner ring-1 ring-purple-50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.mulk?.completed ? 100 : 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-purple-500"
                    ></motion.div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => fetchSurah('mulk')}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-1.5 rounded-lg transition-all font-medium text-xs shadow-sm hover:shadow flex items-center justify-center gap-2"
                  >
                    <span>{progress.mulk && progress.mulk.currentPage > 0 ? 'أكمل القراءة' : 'ابدأ القراءة'}</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {progress.mulk && progress.mulk.currentPage > 0 && (
                    <button
                      onClick={() => handleReset('mulk')}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-800 p-1.5 rounded-lg transition-all shadow-sm border border-purple-100"
                      title="إعادة من البداية"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Kahf - Friday only */}
            {isFriday && (
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(5, 150, 105, 0.1)" }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative bg-white rounded-xl p-4 border border-emerald-100 shadow-sm group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/20 rounded-full blur-3xl -mr-8 -mt-8 transition-all group-hover:bg-emerald-100/30"></div>

                <div className="flex items-start justify-between mb-2 relative z-10">
                  <div className="relative">
                    <h4 className="font-bold text-emerald-950 flex items-center gap-2 text-base">
                      سورة الكهف
                      <span className="text-emerald-500"><Star className="w-3.5 h-3.5 fill-emerald-500/20" /></span>
                    </h4>
                    <p className="text-[10px] text-emerald-700/70 mt-0.5 font-medium bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-100/50">
                      110 آية • سنة الجمعة
                    </p>
                  </div>
                  {progress.kahf?.completed && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3 relative z-10">
                  {progress.kahf && progress.kahf.currentAyah > 0 && !progress.kahf.completed && (
                    <div className="flex items-center gap-2 text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      <Bookmark className="w-3 h-3 fill-emerald-700/20" />
                      <span className="font-medium">توقفت عند آية {progress.kahf.currentAyah}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-emerald-700/80 font-medium px-1">
                      <span>{progress.kahf?.completed ? 'مكتملة' : progress.kahf && progress.kahf.currentPage > 0 ? 'قيد القراءة' : 'لم تبدأ'}</span>
                      <span>{progress.kahf?.completed ? '100%' : '0%'}</span>
                    </div>
                    <div className="h-1 bg-emerald-100/50 rounded-full overflow-hidden shadow-inner ring-1 ring-emerald-50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.kahf?.completed ? 100 : 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-emerald-500"
                      ></motion.div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => fetchSurah('kahf')}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-1.5 rounded-lg transition-all font-medium text-xs shadow-sm hover:shadow flex items-center justify-center gap-2"
                    >
                      <span>{progress.kahf?.completed ? 'قراءة مجددة' : 'ابدأ القراءة'}</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {progress.kahf && progress.kahf.currentPage > 0 && (
                      <button
                        onClick={() => handleReset('kahf')}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg transition-all shadow-sm border border-emerald-100"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Reader Modal */}
      <AnimatePresence>
        {selectedSurah && surahData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#fdfbf7] w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#f0f9f6] border-b border-emerald-100 p-4 flex items-center justify-between shrink-0 h-16">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100/50 rounded-full flex items-center justify-center text-emerald-800">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-emerald-950">
                      {SURAHS[selectedSurah].name}
                    </h2>
                    <p className="text-xs text-emerald-600 font-medium">
                      {SURAHS[selectedSurah].pages > 1 ? `صفحة ${currentPage} من ${SURAHS[selectedSurah].pages}` : 'جزء عام'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={close}
                  className="w-10 h-10 rounded-full hover:bg-red-50 hover:text-red-500 text-emerald-900/60 flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-[#FFFCF5] relative scroll-smooth">
                {/* Page Background Texture - Subtle */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(#2d6a4f 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>

                <div className="min-h-full p-4 sm:p-8 flex flex-col items-center">
                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-80">
                      <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                      <p className="text-emerald-800 font-amiri text-lg">جاري تحميل السورة...</p>
                    </div>
                  ) : (
                    <div className="w-full max-w-3xl mx-auto space-y-6">
                      {/* Bismillah */}
                      {currentPage === 1 && (
                        <div className="text-center py-4 mb-2">
                          <p className="font-amiri text-xl text-emerald-900 leading-normal">
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                          </p>
                        </div>
                      )}

                      {/* Ayahs Container */}
                      <div className="w-full font-amiri text-right text-emerald-950 p-6 sm:p-10 leading-loose text-xl sm:text-2xl bg-white border border-[#eee8d5] shadow-sm rounded-[2px] relative">
                        {/* Quran Page Border Aesthetic */}
                        <div className="absolute top-0 bottom-0 left-3 right-3 border-x border-[#eee8d5] pointer-events-none"></div>

                        <div className="relative z-10 text-justify" dir="rtl">
                          {getCurrentPageAyahs().map((ayah) => (
                            <span key={ayah.number} className="inline leading-relaxed">
                              <span className="font-amiri text-emerald-950 hover:text-emerald-700 transition-colors text-lg">
                                {ayah.text}
                              </span>
                              <span className="inline-flex items-center justify-center mx-1 align-middle relative">
                                {/* Ayah End Symbol */}
                                <svg viewBox="0 0 36 36" className="w-7 h-7 text-[#d4b483] fill-current opacity-90 inline-block align-middle transform translate-y-1">
                                  <path d="M18 2L20.8 5.2L25 5.5L26.5 9.5L30.5 11L30.5 15.2L33.5 18L30.5 20.8L30.5 25L26.5 26.5L25 30.5L20.8 30.8L18 34L15.2 30.8L11 30.5L9.5 26.5L5.5 25L5.5 20.8L2.5 18L5.5 15.2L5.5 11L9.5 9.5L11 5.5L15.2 5.2L18 2Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                <button
                                  data-ayah={ayah.numberInSurah}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAyahClick(ayah);
                                  }}
                                  className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold font-amiri pt-0.5
                                      ${ayah.numberInSurah === currentAyah
                                      ? 'text-red-700 font-extrabold scale-110'
                                      : 'text-emerald-800'
                                    }`}
                                >
                                  {ayah.numberInSurah}
                                </button>
                              </span>
                              {' '}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-gray-100 p-4 shrink-0">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${currentPage === 1
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                    <span className="md:inline hidden">السابق</span>
                  </button>

                  <div className="flex-1 text-center">
                    <div className="inline-block bg-[#f0f9f6] text-emerald-800 px-6 py-2 rounded-full font-bold border border-emerald-100/50">
                      {currentPage}
                    </div>
                  </div>

                  <button
                    onClick={handleNextPage}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 ${currentPage === SURAHS[selectedSurah].pages
                      ? 'bg-[#d97706] hover:bg-[#b45309]'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                  >
                    <span className="md:inline hidden">
                      {currentPage === SURAHS[selectedSurah].pages ? 'إنهاء السورة' : 'التالي'}
                    </span>
                    {currentPage === SURAHS[selectedSurah].pages ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <ChevronLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ayah Detail Modal - Cinematic Interaction */}
      <AnimatePresence>
        {selectedAyahDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            onClick={() => {
              setSelectedAyahDetail(null);
              setIsAyahPlaying(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl relative border border-white/20 dark:border-white/5"
              onClick={e => e.stopPropagation()}
            >
              {/* Decorative Header */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-500/10 dark:from-emerald-500/20 to-transparent pointer-events-none" />

              <div className="relative p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{SURAHS[selectedSurah!].name}</h4>
                      <p className="text-xs font-bold text-emerald-600">الآية رقم {selectedAyahDetail.numberInSurah}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAyahDetail(null);
                      setIsAyahPlaying(false);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-50/50 dark:bg-white/5 rounded-2xl p-6 mb-6 border border-slate-100 dark:border-white/5">
                  <p className="font-amiri text-2xl sm:text-3xl text-right text-slate-800 dark:text-white leading-relaxed dir-rtl" dir="rtl">
                    {selectedAyahDetail.text}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (ayahAudioRef.current) {
                        if (isAyahPlaying) ayahAudioRef.current.pause();
                        else ayahAudioRef.current.play();
                        setIsAyahPlaying(!isAyahPlaying);
                      }
                    }}
                    className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-bold transition-all ${isAyahPlaying
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      }`}
                  >
                    {isAyahPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    <span>استماع لهذه الآية</span>
                  </motion.button>
                </div>
              </div>

              <audio
                ref={ayahAudioRef}
                src={`https://cdn.islamic.network/quran/audio/ar.alafasy/${selectedAyahDetail.number}.mp3`}
                onPlay={() => setIsAyahPlaying(true)}
                onPause={() => setIsAyahPlaying(false)}
                onEnded={() => setIsAyahPlaying(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}