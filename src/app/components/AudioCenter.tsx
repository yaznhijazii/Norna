import { useState, useEffect, useRef } from 'react';
import { Headphones, Radio, BookOpen, Play, Pause, Volume2, VolumeX, X, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PodcastCard } from './PodcastCard';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
}

export function AudioCenter() {
  const [activeTab, setActiveTab] = useState<'podcast' | 'radio' | 'quran'>('podcast');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const quranAudioRef = useRef<HTMLAudioElement>(null);
  const radioAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(data => { if (data.data) setSurahs(data.data); })
      .catch(err => console.error('Error fetching surahs:', err));
  }, []);

  useEffect(() => {
    if (quranAudioRef.current) quranAudioRef.current.volume = volume;
    if (radioAudioRef.current) radioAudioRef.current.volume = volume;
  }, [volume]);

  const normalizeArabic = (text: string) => {
    return text.replace(/[\u064B-\u0652]/g, '').replace(/[أإآ]/g, 'ا').replace(/[ى]/g, 'ي').replace(/[ة]/g, 'ه');
  };

  const filteredSurahs = surahs.filter(surah => {
    const normalizedQuery = normalizeArabic(searchQuery.toLowerCase());
    const normalizedName = normalizeArabic(surah.name);
    return normalizedName.includes(normalizedQuery) || surah.englishName.toLowerCase().includes(normalizedQuery);
  });

  const togglePlay = () => {
    const audio = activeTab === 'radio' ? radioAudioRef.current : quranAudioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { if (activeTab === 'radio') audio.load(); audio.play().catch(err => console.error('Error playing:', err)); }
  };

  const toggleMute = () => {
    const audio = activeTab === 'radio' ? radioAudioRef.current : quranAudioRef.current;
    if (audio) { audio.muted = !isMuted; setIsMuted(!isMuted); }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (quranAudioRef.current) quranAudioRef.current.muted = false;
      if (radioAudioRef.current) radioAudioRef.current.muted = false;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (quranAudioRef.current) { setCurrentTime(quranAudioRef.current.currentTime); setDuration(quranAudioRef.current.duration); }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (quranAudioRef.current) { quranAudioRef.current.currentTime = time; setCurrentTime(time); }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Integrated Switcher at Top Left - Lowered Z-index for modal compatibility */}
        <div className="absolute top-4 left-4 z-50">
          <div className="relative p-0.5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-white dark:border-white/10 flex gap-0.5 shadow-sm overflow-hidden min-w-[210px]">
            <motion.div
              animate={{
                x: activeTab === 'quran' ? '0%' : activeTab === 'radio' ? '100%' : '200%',
                backgroundColor: activeTab === 'quran' ? 'rgba(59, 130, 246, 0.1)' : activeTab === 'radio' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(147, 51, 234, 0.1)'
              }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="absolute inset-y-0.5 left-0.5 w-[calc(33.33%-2px)] bg-white dark:bg-slate-800 rounded-lg shadow-sm z-0"
            />
            <button onClick={() => { setActiveTab('podcast'); setIsPlaying(false); }} className={`relative z-10 flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 duration-300 whitespace-nowrap ${activeTab === 'podcast' ? 'text-purple-600' : 'text-slate-500'}`}><Headphones className="w-3 h-3" /> بودكاست</button>
            <button onClick={() => { setActiveTab('radio'); setIsPlaying(false); }} className={`relative z-10 flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 duration-300 whitespace-nowrap ${activeTab === 'radio' ? 'text-emerald-600' : 'text-slate-500'}`}><Radio className="w-3 h-3" /> إذاعة</button>
            <button onClick={() => { setActiveTab('quran'); setIsPlaying(false); }} className={`relative z-10 flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 duration-300 whitespace-nowrap ${activeTab === 'quran' ? 'text-blue-600' : 'text-slate-500'}`}><BookOpen className="w-3 h-3" /> قرآن</button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'podcast' && (
              <div className="pt-14">
                <PodcastCard />
              </div>
            )}
            {activeTab === 'radio' && (
              <div className="bg-[#fafcff] dark:bg-slate-900 rounded-[1.5rem] p-4 pt-14 shadow-xl border border-slate-100 dark:border-white/5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-16 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)', backgroundSize: '6px 6px', maskImage: 'linear-gradient(to right, black 50%, transparent)' }} />
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="flex-1 bg-emerald-950 rounded-xl p-3 shadow-inner relative overflow-hidden">
                      <div className="relative flex justify-between items-start">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 mb-1"><div className={`w-1 h-1 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} /><span className="text-[8px] font-mono text-emerald-500/80 tracking-widest uppercase">SIGNAL</span></div>
                          <h4 className="font-bold text-emerald-400 text-sm font-mono truncate">ARABIC QURAN</h4>
                        </div>
                        <div className="text-right"><span className="text-xl font-black text-emerald-400 font-mono tracking-tighter">90.9</span></div>
                      </div>
                      <div className="mt-2 flex items-end gap-[1.5px] h-4 opacity-40">
                        {[...Array(20)].map((_, i) => (<motion.div key={i} animate={{ height: isPlaying ? [2, Math.random() * 14 + 2, 2] : 2 }} transition={{ duration: 0.5 + Math.random(), repeat: Infinity }} className="flex-1 bg-emerald-400 rounded-t-[1px]" />))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 justify-center items-center shrink-0 w-10">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 flex items-center justify-center"><Volume2 className="w-3.5 h-3.5 text-slate-400" /></div>
                      <div className={`w-2.5 h-2.5 rounded-full border ${isPlaying ? 'bg-red-500 border-red-200' : 'bg-slate-300 border-slate-200'}`} />
                    </div>
                  </div>
                  {/* Controls */}
                  <div className="flex items-center gap-4">
                    <motion.button onClick={togglePlay} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${isPlaying ? 'bg-slate-900 dark:bg-emerald-500 text-white' : 'bg-emerald-500 text-white shadow-emerald-500/30'}`}>
                      {isBuffering ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </motion.button>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between items-center px-1"><span className="text-[7px] font-black text-slate-400">Level</span><span className="text-[9px] font-mono font-bold text-emerald-600">{Math.round(volume * 100)}%</span></div>
                      <div className="relative h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${volume * 100}%` }} className="absolute h-full bg-emerald-500" />
                        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      </div>
                    </div>
                  </div>
                </div>
                <audio ref={radioAudioRef} src="https://backup.qurango.net/radio/mishary_alafasi" onPlay={() => { setIsPlaying(true); setIsBuffering(false); }} onPause={() => { setIsPlaying(false); setIsBuffering(false); }} onWaiting={() => setIsBuffering(true)} onPlaying={() => setIsBuffering(false)} onLoadStart={() => isPlaying && setIsBuffering(true)} />
              </div>
            )}
            {activeTab === 'quran' && (
              <div className="space-y-4 pt-14">
                {!selectedSurah ? (
                  <div className="space-y-4">
                    <div className="relative group">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
                      <input type="text" placeholder="البحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-11 pl-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                      {filteredSurahs.map((surah) => (
                        <button key={surah.number} onClick={() => setSelectedSurah(surah)} className="group flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl transition-all shadow-sm">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center font-mono text-[10px] text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">{surah.number.toString().padStart(3, '0')}</div>
                          <div className="flex-1 min-w-0 text-right">
                            <h4 className="font-amiri font-bold text-slate-800 dark:text-white text-lg leading-none mb-1">{surah.name}</h4>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{surah.englishName}</div>
                          </div>
                          <Play className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#fafcff] dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-xl relative p-5">
                    <button onClick={() => { setSelectedSurah(null); setIsPlaying(false); if (quranAudioRef.current) quranAudioRef.current.pause(); }} className="absolute top-4 right-4 p-1.5 bg-slate-100/50 dark:bg-white/5 rounded-lg text-slate-400 z-10"><X className="w-3.5 h-3.5" /></button>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center mb-4 relative">
                        <BookOpen className="w-7 h-7 text-white" />
                        <motion.div animate={isPlaying ? { scale: [1, 1.15, 1], opacity: [0.2, 0.05, 0.2] } : {}} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute inset-0 bg-blue-400 rounded-2xl -z-10" />
                      </div>
                      <h3 className="text-xl font-amiri font-bold text-slate-800 dark:text-white mb-1 text-center">{selectedSurah.name}</h3>
                      <div className="text-slate-400 text-[10px] font-bold uppercase mb-6">{selectedSurah.numberOfAyahs} آية</div>
                      <div className="w-full space-y-6">
                        <div className="space-y-2">
                          <div className="relative h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${(currentTime / duration) * 100 || 0}%` }} className="absolute h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          </div>
                          <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
                        </div>
                        <div className="flex items-center justify-center gap-6">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={togglePlay} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isPlaying ? 'bg-slate-900 dark:bg-white text-white' : 'bg-blue-500 text-white'}`}>
                            {isBuffering ? <Loader2 className="w-6 h-6 animate-spin" /> : isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                          </motion.button>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-white/5 rounded-2xl p-3 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <button onClick={toggleMute} className="text-slate-400">{isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
                            <div className="flex-1 relative h-6 flex items-center min-w-[80px]">
                              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-full h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer" dir="ltr" style={{ background: `linear-gradient(to right, #3b82f6 ${volume * 100}%, #e2e8f0 0%)` }} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500">{Math.round(volume * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <audio ref={quranAudioRef} src={`https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${selectedSurah.number}.mp3`} onPlay={() => { setIsPlaying(true); setIsBuffering(false); }} onPause={() => { setIsPlaying(false); setIsBuffering(false); }} onWaiting={() => setIsBuffering(true)} onPlaying={() => setIsBuffering(false)} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleTimeUpdate} />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}