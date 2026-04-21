const AVATAR_COLORS = ['#E48A2C','#3E8E5A','#4A6CF7','#C24A38','#7C3AED','#0EA5A0','#D946EF','#64748B'];

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
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...style }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', fontWeight: 600, fontSize, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-sans)', ...style }}>
      {initials}
    </div>
  );
}
