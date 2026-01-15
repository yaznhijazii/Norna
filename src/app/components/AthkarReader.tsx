import { useState, useEffect } from 'react';
import { Sun, Moon, X, Loader2, Check, RotateCcw, Heart } from 'lucide-react';
import { getAthkarProgress, updateAthkarProgress } from '../utils/db';

interface Zekr {
  zekr: string;
  repeat: number;
  bless: string;
}

type AthkarType = 'morning' | 'evening';

export function AthkarReader() {
  const [selectedType, setSelectedType] = useState<AthkarType | null>(null);
  const [athkar, setAthkar] = useState<Zekr[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [completedToday, setCompletedToday] = useState({
    morning: false,
    evening: false,
  });
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

      // Listen for open athkar requests from DailyHeader
      const handleOpenAthkar = (e: any) => {
        const type = e.detail?.type as AthkarType;
        if (type && (type === 'morning' || type === 'evening')) {
          fetchAthkar(type);
        }
      };

      window.addEventListener('openAthkar', handleOpenAthkar);

      return () => {
        window.removeEventListener('storage', loadProgress);
        window.removeEventListener('openAthkar', handleOpenAthkar);
      };
    }
  }, [currentUserId]);

  const loadProgress = async () => {
    if (!currentUserId) return;

    try {
      const [morningData, eveningData] = await Promise.all([
        getAthkarProgress(currentUserId, 'morning'),
        getAthkarProgress(currentUserId, 'evening'),
      ]);

      setCompletedToday({
        morning: morningData?.completed || false,
        evening: eveningData?.completed || false,
      });
    } catch (error) {
      console.error('Error loading athkar progress:', error);
    }
  };

  const fetchAthkar = async (type: AthkarType) => {
    setLoading(true);
    setSelectedType(type);
    setProgress({});

    try {
      const url = type === 'morning'
        ? 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/77117060ce43a12ea603b025a7852ffe62cb5c1f/morningthk.json'
        : 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/77117060ce43a12ea603b025a7852ffe62cb5c1f/masaatk.json';

      console.log('Fetching athkar from:', url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Athkar data received:', data);

      // Handle different data formats
      let athkarArray: any[] = [];

      // Check if data has a 'content' property (new format)
      if (data.content && Array.isArray(data.content)) {
        athkarArray = data.content;
      }
      // Check if data is directly an array (old format)
      else if (Array.isArray(data)) {
        athkarArray = data;
      }
      // Check if data is an object with values (fallback)
      else if (typeof data === 'object') {
        athkarArray = Object.values(data);
      }

      // Filter and clean the data
      athkarArray = athkarArray.filter((item: any) => {
        return item &&
          typeof item === 'object' &&
          typeof item.zekr === 'string' &&
          item.zekr.trim() !== '';
      }).map((item: any) => ({
        zekr: item.zekr || '',
        repeat: typeof item.repeat === 'number' ? item.repeat : parseInt(item.repeat) || 1,
        bless: item.bless || ''
      }));

      console.log('Processed athkar array:', athkarArray.length, 'items');
      setAthkar(athkarArray);
    } catch (err) {
      console.error('Error fetching athkar:', err);
      alert('خطأ في تحميل الأذكار: ' + (err as Error).message);
      setAthkar([]);
    } finally {
      setLoading(false);
    }
  };

  const handleZekrClick = (index: number, totalRepeats: number) => {
    const currentCount = progress[index] || 0;
    const newCount = currentCount + 1;

    if (newCount <= totalRepeats) {
      setProgress({ ...progress, [index]: newCount });

      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }

      // Check if all athkar are completed
      const newProgress = { ...progress, [index]: newCount };
      const allCompleted = athkar.every((zekr, idx) => {
        const count = newProgress[idx] || 0;
        return count >= zekr.repeat;
      });

      if (allCompleted) {
        markAsCompleted();
      }
    }
  };

  const markAsCompleted = () => {
    if (!selectedType || !currentUserId) return;

    const storageKey = selectedType === 'morning'
      ? `athkar-morning-${currentUserId}`
      : `athkar-evening-${currentUserId}`;

    updateAthkarProgress(currentUserId, selectedType, true);
    window.dispatchEvent(new Event('storage'));
    loadProgress();
  };

  const handleReset = () => {
    setProgress({});
  };

  const close = () => {
    setSelectedType(null);
    setAthkar([]);
    setProgress({});
  };

  const getTotalProgress = () => {
    if (!Array.isArray(athkar) || athkar.length === 0) {
      return { total: 0, completed: 0, percentage: 0 };
    }

    const total = athkar.reduce((sum, zekr) => sum + zekr.repeat, 0);
    const completed = athkar.reduce((sum, zekr, idx) => sum + (progress[idx] || 0), 0);
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const stats = getTotalProgress();
  const isCompleted = stats.completed === stats.total && stats.total > 0;

  return (
    <div className="space-y-4">
      {/* Athkar Cards - Simple & Beautiful */}
      <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 shadow-md overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative">
          <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-lg">
            <span className="text-2xl">📿</span>
            <span>الأذكار اليومية</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* Morning Athkar */}
          <div className="relative bg-white rounded-xl p-4 border border-amber-200 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
            {/* Animated sunrise gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/0 via-yellow-200/0 to-orange-200/0 group-hover:from-amber-200/40 group-hover:via-yellow-200/30 group-hover:to-orange-200/40 transition-all duration-700 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300/0 to-amber-300/0 group-hover:from-yellow-300/20 group-hover:to-amber-300/30 transition-all duration-1000 pointer-events-none"></div>

            {/* Large sun appears from top-right on hover */}
            <div className="absolute -top-20 -right-20 w-64 h-64 opacity-0 scale-0 group-hover:opacity-30 group-hover:scale-100 transition-all duration-700 ease-out pointer-events-none origin-top-right">
              <svg viewBox="0 0 200 200" className="w-full h-full text-amber-400">
                <circle cx="100" cy="100" r="40" fill="currentColor" />
                {/* Sun rays */}
                <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                  <line x1="100" y1="20" x2="100" y2="35" />
                  <line x1="100" y1="165" x2="100" y2="180" />
                  <line x1="20" y1="100" x2="35" y2="100" />
                  <line x1="165" y1="100" x2="180" y2="100" />
                  <line x1="42" y1="42" x2="52" y2="52" />
                  <line x1="148" y1="148" x2="158" y2="158" />
                  <line x1="42" y1="158" x2="52" y2="148" />
                  <line x1="148" y1="52" x2="158" y2="42" />
                </g>
              </svg>
            </div>

            <div className="relative flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 p-2 rounded-lg transition-all duration-500 group-hover:opacity-0 group-hover:scale-75">
                  <Sun className="w-5 h-5 text-amber-600 group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <h4 className="font-bold text-amber-900">أذكار الصباح</h4>
              </div>
              {completedToday.morning && (
                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <p className="text-xs text-amber-700 mb-4 relative">بعد صلاة الفجر • حماية من الجن</p>

            <button
              onClick={() => fetchAthkar('morning')}
              className="relative w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-all font-semibold text-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              {completedToday.morning ? 'اقرأ مرة أخرى' : 'ابدأ الأذكار'}
            </button>
          </div>

          {/* Evening Athkar */}
          <div className="relative bg-white rounded-xl p-4 border border-orange-200 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
            {/* Animated sunset/night gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-200/0 via-indigo-200/0 to-violet-200/0 group-hover:from-purple-200/40 group-hover:via-indigo-200/30 group-hover:to-violet-200/40 transition-all duration-700 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-indigo-300/0 to-purple-300/0 group-hover:from-indigo-300/20 group-hover:to-purple-300/30 transition-all duration-1000 pointer-events-none"></div>

            {/* Twinkling stars on hover */}
            <div className="absolute top-4 left-8 w-1 h-1 rounded-full bg-indigo-300 opacity-0 group-hover:opacity-60 transition-all duration-500 group-hover:animate-pulse"></div>
            <div className="absolute top-8 left-16 w-1 h-1 rounded-full bg-purple-300 opacity-0 group-hover:opacity-70 transition-all duration-700 group-hover:animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute top-12 left-6 w-1 h-1 rounded-full bg-violet-300 opacity-0 group-hover:opacity-50 transition-all duration-600 group-hover:animate-pulse" style={{ animationDelay: '0.6s' }}></div>

            {/* Large moon appears from top-right on hover */}
            <div className="absolute -top-20 -right-20 w-64 h-64 opacity-0 scale-0 group-hover:opacity-30 group-hover:scale-100 transition-all duration-700 ease-out pointer-events-none origin-top-right">
              <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-400">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Crescent moon */}
                <circle cx="100" cy="100" r="45" fill="currentColor" filter="url(#glow)" />
                <circle cx="115" cy="95" r="40" fill="white" />
                {/* Small stars */}
                <circle cx="60" cy="60" r="2" fill="currentColor" opacity="0.6" />
                <circle cx="140" cy="50" r="2" fill="currentColor" opacity="0.6" />
                <circle cx="150" cy="120" r="2" fill="currentColor" opacity="0.6" />
                <circle cx="55" cy="140" r="2" fill="currentColor" opacity="0.6" />
              </svg>
            </div>

            <div className="relative flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-lg transition-all duration-500 group-hover:opacity-0 group-hover:scale-75">
                  <Moon className="w-5 h-5 text-orange-600 group-hover:-rotate-12 transition-transform duration-500" />
                </div>
                <h4 className="font-bold text-orange-900">أذكار المساء</h4>
              </div>
              {completedToday.evening && (
                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <p className="text-xs text-orange-700 mb-4 relative">بعد صلاة العصر • حماية حتى الصباح</p>

            <button
              onClick={() => fetchAthkar('evening')}
              className="relative w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition-all font-semibold text-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              {completedToday.evening ? 'اقرأ مرة أخرى' : 'ابدأ الأذكار'}
            </button>
          </div>
        </div>
      </div>

      {/* Athkar Reader Modal */}
      {selectedType && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border-2 border-amber-300">
            {/* Header */}
            <div className={`${selectedType === 'morning' ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-orange-600 to-red-600'} text-white p-4 border-b border-amber-600`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    {selectedType === 'morning' ? (
                      <>
                        <Sun className="w-5 h-5" />
                        <span>أذكار الصباح</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-5 h-5" />
                        <span>أذكار المساء</span>
                      </>
                    )}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-amber-100 mt-1">
                    <span>{stats.completed} من {stats.total}</span>
                    <span>•</span>
                    <span>{Math.round(stats.percentage)}%</span>
                  </div>
                </div>
                <button
                  onClick={close}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(athkar) && athkar.map((zekr, index) => {
                    const currentCount = progress[index] || 0;
                    const isZekrCompleted = currentCount >= zekr.repeat;

                    return (
                      <div
                        key={index}
                        className={`bg-white rounded-xl p-5 border-2 transition-all ${isZekrCompleted
                            ? 'border-green-300 bg-green-50/50'
                            : 'border-amber-200 hover:border-amber-300 hover:shadow-md'
                          }`}
                      >
                        {/* Zekr Number & Status */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isZekrCompleted ? 'bg-green-500 text-white' : 'bg-amber-100 text-amber-700'
                              }`}>
                              {index + 1}
                            </div>
                            {isZekrCompleted && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                مكتمل
                              </span>
                            )}
                          </div>

                          {/* Counter Button */}
                          {zekr.repeat > 1 && (
                            <button
                              onClick={() => handleZekrClick(index, zekr.repeat)}
                              disabled={isZekrCompleted}
                              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${isZekrCompleted
                                  ? 'bg-green-100 text-green-700 cursor-default'
                                  : 'bg-amber-500 hover:bg-amber-600 text-white hover:scale-105 active:scale-95'
                                }`}
                            >
                              {currentCount} / {zekr.repeat}
                            </button>
                          )}
                        </div>

                        {/* Zekr Text */}
                        <button
                          onClick={() => handleZekrClick(index, zekr.repeat)}
                          disabled={isZekrCompleted}
                          className={`w-full text-right mb-4 ${!isZekrCompleted && 'cursor-pointer'}`}
                        >
                          <p className={`text-lg leading-loose ${isZekrCompleted ? 'text-gray-500 line-through' : 'text-gray-800'
                            }`} style={{ lineHeight: '2.2' }}>
                            {zekr.zekr}
                          </p>
                        </button>

                        {/* Bless */}
                        {zekr.bless && (
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
                            <div className="flex items-start gap-2">
                              <Heart className="w-4 h-4 text-amber-600 mt-1 shrink-0" />
                              <p className="text-sm text-amber-900">{zekr.bless}</p>
                            </div>
                          </div>
                        )}

                        {/* Single Repeat Indicator */}
                        {zekr.repeat === 1 && !isZekrCompleted && (
                          <button
                            onClick={() => handleZekrClick(index, zekr.repeat)}
                            className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-all font-semibold text-sm"
                          >
                            تم القراءة
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Completion Message */}
              {isCompleted && (
                <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6 text-center">
                  <div className="text-4xl mb-2">✨</div>
                  <h3 className="font-bold text-xl mb-2">بارك الله فيك!</h3>
                  <p className="text-green-100">أتممت {selectedType === 'morning' ? 'أذكار الصباح' : 'أذكار المساء'}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-t from-amber-50 to-white p-4 border-t border-amber-200">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-amber-100 hover:bg-amber-200 text-amber-700 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة</span>
                </button>

                <div className="text-sm text-amber-700 font-semibold">
                  {stats.completed} / {stats.total} ذكر
                </div>

                <button
                  onClick={close}
                  className="px-6 py-2 rounded-lg font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}