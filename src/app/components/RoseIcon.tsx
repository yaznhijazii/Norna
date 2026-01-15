interface RoseIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function RoseIcon({ size = 100, className = '', animate = false }: RoseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stem - Shorter */}
      <path
        d="M100 220 Q98 180 99 140 Q100 100 100 80"
        stroke="url(#stemGradient)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Thorns */}
      <circle cx="100" cy="160" r="1.5" fill="url(#thornGradient)" />
      <circle cx="100" cy="120" r="1.2" fill="url(#thornGradient)" />

      {/* Leaves */}
      <ellipse cx="75" cy="120" rx="18" ry="10" fill="url(#leafGradient)" transform="rotate(-20 75 120)" />
      <ellipse cx="125" cy="140" rx="18" ry="10" fill="url(#leafGradient)" transform="rotate(20 125 140)" />

      {/* Outer petals - Layer 1 - Larger */}
      <ellipse cx="100" cy="60" rx="42" ry="34" fill="url(#outerPetal1)" transform="rotate(-15 100 60)" />
      <ellipse cx="100" cy="60" rx="42" ry="34" fill="url(#outerPetal2)" transform="rotate(15 100 60)" />
      <ellipse cx="100" cy="60" rx="42" ry="34" fill="url(#outerPetal1)" transform="rotate(45 100 60)" />
      <ellipse cx="100" cy="60" rx="42" ry="34" fill="url(#outerPetal2)" transform="rotate(75 100 60)" />
      <ellipse cx="100" cy="60" rx="42" ry="34" fill="url(#outerPetal3)" transform="rotate(105 100 60)" />

      {/* Middle petals - Layer 2 - Larger */}
      <ellipse cx="100" cy="55" rx="34" ry="27" fill="url(#middlePetal1)" transform="rotate(-30 100 55)" />
      <ellipse cx="100" cy="55" rx="34" ry="27" fill="url(#middlePetal2)" transform="rotate(30 100 55)" />
      <ellipse cx="100" cy="55" rx="34" ry="27" fill="url(#middlePetal1)" transform="rotate(90 100 55)" />

      {/* Inner petals - Layer 3 - Larger */}
      <ellipse cx="100" cy="50" rx="24" ry="19" fill="url(#innerPetal1)" transform="rotate(0 100 50)" />
      <ellipse cx="100" cy="50" rx="24" ry="19" fill="url(#innerPetal2)" transform="rotate(60 100 50)" />
      <ellipse cx="100" cy="50" rx="24" ry="19" fill="url(#innerPetal1)" transform="rotate(120 100 50)" />

      {/* Center - Larger */}
      <ellipse cx="100" cy="45" rx="14" ry="11" fill="url(#centerGlow)" />
      <ellipse cx="100" cy="45" rx="7" ry="6" fill="url(#centerCore)" />

      <defs>
        {/* Stem */}
        <linearGradient id="stemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2d5a1f" />
          <stop offset="30%" stopColor="#1e4d15" />
          <stop offset="100%" stopColor="#0f3310" />
        </linearGradient>

        {/* Thorns */}
        <radialGradient id="thornGradient">
          <stop offset="0%" stopColor="#1a3a0f" />
          <stop offset="100%" stopColor="#0d1f08" />
        </radialGradient>

        {/* Leaves */}
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>

        {/* Outer petals */}
        <radialGradient id="outerPetal1">
          <stop offset="0%" stopColor="#ff6b9d" />
          <stop offset="70%" stopColor="#ff3d7f" />
          <stop offset="100%" stopColor="#e91e63" />
        </radialGradient>
        <radialGradient id="outerPetal2">
          <stop offset="0%" stopColor="#ff8aab" />
          <stop offset="70%" stopColor="#ff5c8a" />
          <stop offset="100%" stopColor="#f06292" />
        </radialGradient>
        <radialGradient id="outerPetal3">
          <stop offset="0%" stopColor="#ff7a95" />
          <stop offset="70%" stopColor="#ff4a7a" />
          <stop offset="100%" stopColor="#e91e63" />
        </radialGradient>

        {/* Middle petals */}
        <radialGradient id="middlePetal1">
          <stop offset="0%" stopColor="#ff9bb3" />
          <stop offset="70%" stopColor="#ff6b9d" />
          <stop offset="100%" stopColor="#f8bbd9" />
        </radialGradient>
        <radialGradient id="middlePetal2">
          <stop offset="0%" stopColor="#ffb3d9" />
          <stop offset="70%" stopColor="#ff8aab" />
          <stop offset="100%" stopColor="#f8bbd9" />
        </radialGradient>

        {/* Inner petals */}
        <radialGradient id="innerPetal1">
          <stop offset="0%" stopColor="#ffcdd2" />
          <stop offset="70%" stopColor="#ff9bb3" />
          <stop offset="100%" stopColor="#fce4ec" />
        </radialGradient>
        <radialGradient id="innerPetal2">
          <stop offset="0%" stopColor="#ffebee" />
          <stop offset="70%" stopColor="#ffcdd2" />
          <stop offset="100%" stopColor="#fce4ec" />
        </radialGradient>

        {/* Center */}
        <radialGradient id="centerGlow">
          <stop offset="0%" stopColor="#fff3cd" />
          <stop offset="50%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#ffb300" />
        </radialGradient>
        <radialGradient id="centerCore">
          <stop offset="0%" stopColor="#ffeb3b" />
          <stop offset="100%" stopColor="#ff9800" />
        </radialGradient>
      </defs>
    </svg>
  );
}