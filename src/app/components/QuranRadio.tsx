import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio } from 'lucide-react';

export function QuranRadio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const radioStation = {
    id: 14,
    name: "إذاعة القرآن الكريم",
    reader: "مشاري راشد العفاسي",
    url: "https://backup.qurango.net/radio/mishary_alafasi",
    description: "بث مباشر على مدار الساعة"
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
      });
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
    }
  };

  return (
    <div className="relative">
      {/* Main Radio Container */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-4 shadow-xl overflow-hidden">
        {/* Decorative Islamic Patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-32 h-32">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <pattern id="islamic-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="currentColor" className="text-emerald-300" />
              </pattern>
              <rect width="200" height="200" fill="url(#islamic-pattern)" />
            </svg>
          </div>
        </div>

        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header with Live Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600/20 rounded-lg backdrop-blur-sm border border-emerald-500/30">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm tracking-wide">إذاعة القرآن الكريم</h2>
                <p className="text-emerald-300/70 text-xs">بث مباشر - {radioStation.reader}</p>
              </div>
            </div>
            {isPlaying && (
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-md animate-pulse"></div>
                <div className="relative flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-red-500 px-2.5 py-1 rounded-full shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  <span className="text-white text-[10px] font-bold tracking-wider">LIVE</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Play Button */}
            <div className="relative flex-shrink-0">
              {isPlaying && (
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
              )}

              <button
                onClick={togglePlay}
                className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-xl shadow-emerald-500/40 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group border-2 border-emerald-300/30"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white group-hover:scale-110 transition-transform relative z-10" fill="currentColor" />
                ) : (
                  <Play className="w-7 h-7 text-white group-hover:scale-110 transition-transform relative z-10 mr-[-2px]" fill="currentColor" />
                )}
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex-1 bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-all flex-shrink-0"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1 py-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer volume-slider"
                    dir="ltr"
                  />
                </div>

                <span className="text-white font-bold text-sm tabular-nums min-w-[2.5rem] text-left">
                  {Math.round(volume * 100)}
                  <span className="text-emerald-400 text-[10px] ml-0.5">%</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={radioStation.url}
        preload="none"
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Audio error:', e);
          setIsPlaying(false);
        }}
      />

      <style>{`
        .volume-slider {
          background: linear-gradient(to right, 
            rgb(16 185 129) 0%, 
            rgb(16 185 129) ${volume * 100}%, 
            rgba(255,255,255,0.15) ${volume * 100}%, 
            rgba(255,255,255,0.15) 100%
          );
          position: relative;
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s;
          border: 2px solid rgb(16 185 129);
          position: relative;
          margin-top: -6px;
        }

        .volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(0,0,0,0.4);
        }

        .volume-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid rgb(16 185 129);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s;
        }

        .volume-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(0,0,0,0.4);
        }

        .volume-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 3px;
        }

        .volume-slider::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.15);
        }

        .volume-slider::-moz-range-progress {
          height: 6px;
          border-radius: 3px;
          background: rgb(16 185 129);
        }
      `}</style>
    </div>
  );
}