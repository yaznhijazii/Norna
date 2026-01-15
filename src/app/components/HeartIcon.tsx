interface HeartIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function HeartIcon({ size = 100, className = '', animate = false }: HeartIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shadow */}
      <ellipse cx="100" cy="170" rx="50" ry="8" fill="black" opacity="0.1" />

      {/* Main Heart Shape */}
      <path
        d="M100 165 C100 165, 70 140, 60 115 C50 90, 50 70, 60 55 C70 40, 85 35, 100 45 C115 35, 130 40, 140 55 C150 70, 150 90, 140 115 C130 140, 100 165, 100 165 Z"
        fill="url(#heartGradient)"
        className={animate ? 'animate-heart-beat' : ''}
      />

      {/* Inner Highlight */}
      <path
        d="M100 50 C95 48, 88 50, 85 58 C82 66, 85 75, 92 82 L100 90"
        fill="url(#heartHighlight)"
        opacity="0.4"
        className={animate ? 'animate-heart-shine' : ''}
      />

      {/* No Sparkles */}

      {/* Gradients */}
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b9d" />
          <stop offset="50%" stopColor="#ff3d71" />
          <stop offset="100%" stopColor="#c70039" />
        </linearGradient>

        <radialGradient id="heartHighlight">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffccd5" />
        </radialGradient>
      </defs>

      <style>{`
        @keyframes heart-beat {
          0%, 100% {
            transform: scale(1);
          }
          10%, 30% {
            transform: scale(1.1);
          }
          20%, 40% {
            transform: scale(1.05);
          }
        }
        
        @keyframes heart-shine {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        .animate-heart-beat {
          animation: heart-beat 1.5s ease-in-out infinite;
        }
        
        .animate-heart-shine {
          animation: heart-shine 2s ease-in-out infinite;
        }
      `}</style>
    </svg>
  );
}
