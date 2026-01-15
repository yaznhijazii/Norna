import { useState } from 'react';
import { Navigation, Info } from 'lucide-react';
import { useQiblaDirection } from '../hooks/useQiblaDirection';

export function QiblaCompass() {
  const { qiblaDirection, deviceHeading, needsPermission, error, loading, requestPermission } = useQiblaDirection();
  const [showDetails, setShowDetails] = useState(false);

  // Calculate the rotation angle for the Kaaba icon
  const getRotation = () => {
    if (qiblaDirection === null) return 0;
    if (deviceHeading === null) return qiblaDirection;

    // Calculate relative angle
    const relativeAngle = qiblaDirection - deviceHeading;
    return relativeAngle;
  };

  const rotation = getRotation();

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 hover:bg-white/20 transition-all flex-1 sm:flex-none">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 hover:bg-white/20 transition-all flex-1 sm:flex-none">
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm opacity-90">القبلة</span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-auto p-1 rounded hover:bg-white/20 transition-all"
          aria-label="Toggle details"
        >
          <Info className="w-3 h-3 sm:w-4 sm:h-4 opacity-70" />
        </button>
      </div>

      {needsPermission ? (
        <button
          onClick={requestPermission}
          className="text-xs bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-all font-medium"
        >
          تفعيل البوصلة
        </button>
      ) : error ? (
        <div className="text-xs opacity-75 bg-red-500/20 p-2 rounded-lg border border-red-500/30">
          {error}
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          {/* Compass background */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/30 flex items-center justify-center shadow-inner">
            {/* Cardinal directions */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-60">
              N
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-60">
              S
            </div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-60">
              W
            </div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-60">
              E
            </div>

            {/* Qibla needle */}
            <div
              className="absolute transition-transform duration-500 ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                className="drop-shadow-lg"
              >
                {/* Red Side (Pointing to Qibla) */}
                <path
                  d="M12 3 L12 12"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* White Side (Opposite direction) */}
                <path
                  d="M12 12 L12 21"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Arrow Head - Red */}
                <path
                  d="M12 3 L9 8 L12 6.5 L15 8 Z"
                  fill="#ef4444"
                />
              </svg>
            </div>

            {/* Center dot */}
            <div className="w-2 h-2 bg-white rounded-full shadow-lg z-10"></div>
          </div>
        </div>
      )}

      {qiblaDirection !== null && (
        <p className="text-xs text-center opacity-75 mt-1 font-medium">
          {Math.round(qiblaDirection)}°
        </p>
      )}

      {showDetails && (
        <div className="mt-3 p-2 bg-white/5 rounded-lg border border-white/10 text-xs space-y-1">
          <p className="opacity-90">
            <span className="font-medium">اتجاه القبلة:</span> {qiblaDirection !== null ? `${Math.round(qiblaDirection)}°` : 'غير متوفر'}
          </p>
          <p className="opacity-90">
            <span className="font-medium">اتجاه الجهاز:</span> {deviceHeading !== null ? `${Math.round(deviceHeading)}°` : 'غير متوفر'}
          </p>
          {deviceHeading !== null && qiblaDirection !== null && (
            <p className="opacity-90">
              <span className="font-medium">الزاوية النسبية:</span> {Math.round(rotation)}°
            </p>
          )}
        </div>
      )}
    </div>
  );
}