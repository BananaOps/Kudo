interface StatCardProps {
  icon?: string;
  value: number | string;
  label: string;
  delta?: number;
  highlight?: boolean;
  trendText?: string;
  trendType?: 'up' | 'down' | 'neutral';
}

export function StatCard({ icon, value, label, delta, highlight, trendText, trendType }: StatCardProps) {
  return (
    <div style={{
      background: highlight ? 'linear-gradient(140deg, var(--spark-soft) 0%, #fff 70%)' : 'var(--surface)',
      border: `1px solid ${highlight ? '#EDD97A' : 'var(--line)'}`,
      borderRadius: 'var(--radius)',
      padding: '22px 20px 18px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {highlight && (
        <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 16, opacity: 0.8 }}>🔥</span>
      )}
      <div style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em',
        color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6,
        fontWeight: 500,
      }}>
        {icon && <i className={icon} style={{ fontSize: 10 }} />}
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 46,
          fontWeight: 800, lineHeight: 1, color: 'var(--ink)',
          letterSpacing: '-1.5px',
        }}>{value}</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 18, color: 'var(--spark-deep)', fontWeight: 600 }}>⚡</span>
      </div>
      {(trendText || delta !== undefined) && (
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>
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
