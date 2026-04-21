interface ZapMascotProps {
  size?: number;
  className?: string;
}

export function ZapMascot({ size = 32, className }: ZapMascotProps) {
  // Viewbox 100x130, on scale via width/height
  const scale = size / 32;
  const w = 100 * scale;
  const h = 130 * scale;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Corps de l'éclair */}
      <path
        d="M62 4L20 68H46L34 126L82 52H54L62 4Z"
        fill="#FF7B6B"
        stroke="#D95E50"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Reflet */}
      <path
        d="M56 10L28 62H50L42 100L74 56H52L56 10Z"
        fill="#FF9E94"
        opacity="0.35"
      />
      {/* Œil gauche — ouvert */}
      <circle cx="42" cy="58" r="7" fill="white" />
      <circle cx="44" cy="57" r="3.5" fill="#1F1F2E" />
      <circle cx="45.5" cy="55.5" r="1.2" fill="white" />
      {/* Œil droit — clin d'œil */}
      <path
        d="M53 52 Q60 46 67 52"
        stroke="#1F1F2E"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Grand sourire */}
      <path
        d="M37 70 Q51 84 67 70"
        stroke="#1F1F2E"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Joues rosées */}
      <circle cx="34" cy="70" r="5.5" fill="#FFB3A7" opacity="0.75" />
      <circle cx="69" cy="64" r="5.5" fill="#FFB3A7" opacity="0.75" />
    </svg>
  );
}
