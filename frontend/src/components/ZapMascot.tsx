interface ZapMascotProps {
  size?: number;
  className?: string;
}

export function ZapMascot({ size = 32, className }: ZapMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Lueur douce derrière le bolt */}
      <ellipse cx="50" cy="54" rx="28" ry="22" fill="#FFB3A7" opacity="0.35" />

      {/* Corps du bolt — contour épais comme dans l'image */}
      <path
        d="M67 8 L24 8 L13 56 L40 56 L29 94 L83 44 L55 44 Z"
        fill="#FF7B6B"
        stroke="#1A1A2E"
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Œil gauche */}
      <circle cx="38" cy="36" r="10" fill="white" stroke="#1A1A2E" strokeWidth="2.5" />
      <circle cx="39.5" cy="35" r="5.2" fill="#1A1A2E" />
      <circle cx="41.2" cy="33.2" r="1.8" fill="white" />

      {/* Œil droit */}
      <circle cx="61" cy="34" r="10" fill="white" stroke="#1A1A2E" strokeWidth="2.5" />
      <circle cx="62.5" cy="33" r="5.2" fill="#1A1A2E" />
      <circle cx="64.2" cy="31.2" r="1.8" fill="white" />

      {/* Sourire */}
      <path
        d="M42 50 Q50 57 59 50"
        stroke="#1A1A2E"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
