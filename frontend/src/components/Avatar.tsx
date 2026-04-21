// Palette pastel arc-en-ciel, sans violet
const AVATAR_COLORS = [
  '#FF7B6B', // coral
  '#3BBFA3', // teal
  '#F5B800', // yellow
  '#F472B6', // pink
  '#60A5FA', // sky
  '#E87CA0', // rose
  '#5BA4CF', // bleu moyen
  '#6BAE8C', // vert sauge
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
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const fontSize = Math.round(size * 0.35);
  if (src) {
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0, ...style }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 'var(--radius-sm)', background: bg, color: '#fff', fontWeight: 700, fontSize, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-sans)', ...style }}>
      {initials}
    </div>
  );
}
