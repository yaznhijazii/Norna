import { useState, useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';
import { TasbihIcon } from './TasbihIcon';
import { motion, AnimatePresence } from 'motion/react';
import { QuranReader } from './QuranReader';
import { AthkarReader } from './AthkarReader';


export function ReadingsCenter() {
  const [activeTab, setActiveTab] = useState<'quran' | 'athkar'>('quran');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpenAthkar = (e: any) => {
      const type = e.detail?.type;
      if (type === 'morning' || type === 'evening') {
        setActiveTab('athkar');
        setTimeout(() => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    };
    window.addEventListener('openAthkar', handleOpenAthkar);
    return () => window.removeEventListener('openAthkar', handleOpenAthkar);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Content Area */}
      <div className="relative">
        {/* Compact Switcher - Positioned Top Left Inside Content */}
        <div className="absolute top-4 left-4 z-50">
          <div className="relative p-0.5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/50 dark:border-white/10 flex gap-0.5 shadow-sm overflow-hidden min-w-[140px]">
            {/* Sliding Background */}
            <motion.div
              layoutId="tab-bg-readings"
              animate={{
                x: activeTab === 'quran' ? '0%' : '100%',
                backgroundColor: activeTab === 'quran' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'
              }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-lg shadow-sm z-0"
            />
            <button onClick={() => setActiveTab('athkar')} className={`relative z-10 flex-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5 duration-300 ${activeTab === 'athkar' ? 'text-amber-600' : 'text-slate-500'}`}><TasbihIcon className="w-3.5 h-3.5" /> الأذكار</button>
            <button onClick={() => setActiveTab('quran')} className={`relative z-10 flex-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5 duration-300 ${activeTab === 'quran' ? 'text-emerald-600' : 'text-slate-500'}`}><BookOpen className="w-3 h-3" /> القرآن</button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'quran' ? <QuranReader /> : <AthkarReader />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}