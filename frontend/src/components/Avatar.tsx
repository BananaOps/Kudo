// Palette pastel arc-en-ciel, sans violet — [bg, fg] pour assurer le contraste
const AVATAR_COLORS: [string, string][] = [
  ['#FF7B6B', '#fff'],    // coral
  ['#3BBFA3', '#fff'],    // teal
  ['#F5B800', '#1F1F2E'], // yellow — texte sombre pour contraste WCAG AA
  ['#F472B6', '#fff'],    // pink
  ['#60A5FA', '#fff'],    // sky
  ['#E87CA0', '#fff'],    // rose
  ['#5BA4CF', '#fff'],    // bleu moyen
  ['#6BAE8C', '#fff'],    // vert sauge
];

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  index?: number;
  style?: React.CSSProperties;
}

export function Avatar({ src, name, size = 40, index = 0, style }: AvatarProps) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const [bg, fg] = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const fontSize = Math.round(size * 0.35);
  if (src) {
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0, ...style }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 'var(--radius-sm)', background: bg, color: fg, fontWeight: 700, fontSize, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-sans)', ...style }}>
      {initials}
    </div>
  );
}
