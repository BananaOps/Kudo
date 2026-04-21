/**
 * Heatmap — GitHub-style contribution grid.
 *
 * Props:
 *   data    Record<string, number>  ISO-date (YYYY-MM-DD) → spark count.
 *                                   When omitted, falls back to seeded demo data.
 *   weeks   number                  Number of weeks to display (default 52).
 */

// Coral-scale from empty → full
const SCALE = [
  'var(--surface-2)', // 0 — no activity
  'var(--coral-light)',// 1 — low
  '#FFB3A7',          // 2 — medium-low
  '#FF7B6B',          // 3 — medium-high  (= var(--coral))
  '#D95E50',          // 4 — high         (= var(--coral-dark))
];

function intensity(val: number): number {
  if (val === 0) return 0;
  if (val === 1) return 1;
  if (val <= 3) return 2;
  if (val <= 5) return 3;
  return 4;
}

// Deterministic pseudo-random (for demo data)
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Returns an ISO date string `YYYY-MM-DD` for a cell at `weeksAgo` weeks and `dayOfWeek` (0=Mon). */
function isoDate(weeksAgo: number, dayOfWeek: number): string {
  const d = new Date();
  // Align to the start of the current week (Monday)
  const todayDow = (d.getDay() + 6) % 7; // 0=Mon
  d.setDate(d.getDate() - todayDow - weeksAgo * 7 + dayOfWeek);
  return d.toISOString().slice(0, 10);
}

function buildDemoData(weeks: number): Record<string, number> {
  const rand = seeded(42);
  const out: Record<string, number> = {};
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const r = rand();
      out[isoDate(weeks - 1 - w, d)] = r > 0.72 ? Math.ceil(r * 7) : 0;
    }
  }
  return out;
}

interface HeatmapProps {
  data?: Record<string, number>;
  weeks?: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS   = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export function Heatmap({ data, weeks = 52 }: HeatmapProps) {
  const resolved = data ?? buildDemoData(weeks);

  // Build ordered grid: weeks (oldest → newest), 7 days each
  const grid: { date: string; val: number }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: { date: string; val: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = isoDate(weeks - 1 - w, d);
      week.push({ date, val: resolved[date] ?? 0 });
    }
    grid.push(week);
  }

  // Month labels — show label on the first week of each month
  const monthLabels: (string | null)[] = grid.map((week) => {
    const firstDay = week[0].date; // Monday of this week
    const d = new Date(firstDay);
    // Show label only if this week contains the 1st of a month
    const hasFirst = week.some(cell => cell.date.slice(8) === '01');
    return hasFirst ? MONTH_NAMES[d.getMonth()] : null;
  });

  // Stats
  const total = Object.values(resolved).reduce((s, v) => s + v, 0);
  const activeDays = Object.values(resolved).filter(v => v > 0).length;
  const maxVal = Math.max(...Object.values(resolved), 0);
  const bestDate = Object.entries(resolved).find(([, v]) => v === maxVal)?.[0];
  const bestLabel = bestDate
    ? new Date(bestDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '—';

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start', minWidth: 'min-content' }}>

        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 22, marginRight: 4, flexShrink: 0 }}>
          {DAY_LABELS.map((label, i) => (
            <div key={i} style={{
              height: 13, fontSize: 10, color: 'var(--muted-2)',
              lineHeight: '13px', minWidth: 26, textAlign: 'right',
              fontFamily: 'var(--font-mono)',
            }}>
              {label}
            </div>
          ))}
        </div>

        <div>
          {/* Month labels */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
            {grid.map((_, wi) => (
              <div key={wi} style={{
                width: 13, fontSize: 10, color: 'var(--muted)',
                overflow: 'visible', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-mono)',
              }}>
                {monthLabels[wi] ?? ''}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div style={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridTemplateRows: 'repeat(7, 13px)',
            gap: 3,
          }}>
            {grid.map((week, wi) =>
              week.map(({ date, val }) => (
                <div
                  key={`${wi}-${date}`}
                  title={val > 0 ? `${date} · ${val} spark${val > 1 ? 's' : ''}` : date}
                  style={{
                    width: 13, height: 13, borderRadius: 3,
                    background: SCALE[intensity(val)],
                    cursor: val > 0 ? 'default' : 'default',
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legend + stats */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 14, flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Less</span>
          {SCALE.map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: c, border: '1px solid rgba(0,0,0,0.06)' }} />
          ))}
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>More</span>
        </div>
        <div style={{
          display: 'flex', gap: 16, fontSize: 11,
          color: 'var(--muted)', fontFamily: 'var(--font-sans)',
        }}>
          <span><strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{total}</strong> sparks total</span>
          <span><strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{activeDays}</strong> active days</span>
          {maxVal > 0 && (
            <span>Best day: <strong style={{ color: 'var(--coral)', fontWeight: 600 }}>{bestLabel} · {maxVal} ⚡</strong></span>
          )}
        </div>
      </div>
    </div>
  );
}
