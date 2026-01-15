export const TasbihIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Chain of beads forming a curve like the image */}
        <circle cx="16" cy="5" r="1.2" />
        <circle cx="13" cy="4" r="1.2" />
        <circle cx="10" cy="4" r="1.2" />
        <circle cx="7" cy="5" r="1.2" />
        <circle cx="5" cy="7" r="1.2" />
        <circle cx="4" cy="10" r="1.2" />
        <circle cx="4" cy="13" r="1.2" />
        <circle cx="5" cy="16" r="1.2" />
        <circle cx="7" cy="18" r="1.2" />
        <circle cx="10" cy="19" r="1.2" />
        <circle cx="13" cy="18" r="1.2" />
        <circle cx="15.5" cy="15.5" r="1.2" />

        {/* Second row of beads (the loop part) */}
        <circle cx="18" cy="8" r="1.2" />
        <circle cx="19" cy="11" r="1.2" />
        <circle cx="18" cy="14" r="1.5" fill="currentColor" /> {/* Imam/Main bead */}

        {/* Tassel */}
        <path d="M18 15.5v2" />
        <path d="M16.5 21l1.5-3.5 1.5 3.5h-3z" fill="currentColor" strokeWidth="1" />
    </svg>
);
