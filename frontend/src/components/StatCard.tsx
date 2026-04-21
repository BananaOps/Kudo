type CardColor = 'coral' | 'teal' | 'yellow' | 'pink' | 'sky';

const COLOR_MAP: Record<CardColor, { bg: string; border: string; borderLeft: string; label: string }> = {
  coral:  { bg: 'var(--coral-light)',  border: 'var(--coral-border)',  borderLeft: 'var(--coral)',  label: 'var(--coral-dark)' },
  teal:   { bg: 'var(--teal-light)',   border: 'var(--teal-border)',   borderLeft: 'var(--teal)',   label: 'var(--teal)' },
  yellow: { bg: 'var(--yellow-light)', border: 'var(--yellow-border)', borderLeft: 'var(--yellow)', label: 'var(--spark-deep)' },
  pink:   { bg: 'var(--pink-light)',   border: 'var(--pink-border)',   borderLeft: 'var(--pink)',   label: 'var(--pink)' },
  sky:    { bg: 'var(--sky-light)',    border: 'var(--sky-border)',    borderLeft: 'var(--sky)',    label: 'var(--sky)' },
};

interface StatCardProps {
  icon?: string;
  value: number | string;
  label: string;
  delta?: number;
  highlight?: boolean;
  trendText?: string;
  trendType?: 'up' | 'down' | 'neutral';
  color?: CardColor;
}

export function StatCard({ icon, value, label, delta, highlight, trendText, trendType, color = 'coral' }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderLeft: `3px solid ${c.borderLeft}`,
      borderRadius: 'var(--radius)',
      padding: '20px 18px 16px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {highlight && (
        <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 15, opacity: 0.8 }}>🔥</span>
      )}
      <div style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em',
        color: c.label, display: 'flex', alignItems: 'center', gap: 6,
        fontWeight: 600,
      }}>
        {icon && <i className={icon} style={{ fontSize: 10 }} />}
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 44,
          fontWeight: 800, lineHeight: 1, color: 'var(--ink)',
          letterSpacing: '-1.5px',
        }}>{value}</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: c.borderLeft, fontWeight: 600 }}>⚡</span>
      </div>
      {(trendText || delta !== undefined) && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
          {trendType === 'up' && <span style={{ color: 'var(--good)', fontWeight: 500 }}>{trendText || `+${delta}`}</span>}
          {trendType === 'down' && <span style={{ color: 'var(--danger)', fontWeight: 500 }}>{trendText || delta}</span>}
          {(trendType === 'neutral' || (!trendType && trendText)) && <span>{trendText}</span>}
          {!trendType && delta !== undefined && !trendText && (
            <span style={{ color: delta >= 0 ? 'var(--good)' : 'var(--danger)', fontWeight: 500 }}>{delta >= 0 ? '+' : ''}{delta} vs last period</span>
          )}
        </div>
      )}
    </div>
  );
}
