import React from 'react';

const COLORS = ['#F0EDE4', '#FFE9A8', '#FFD34D', '#F5B800', '#B8850A'];

function getIntensity(val: number): number {
  if (val === 0) return 0;
  if (val <= 1) return 1;
  if (val <= 2) return 2;
  if (val <= 4) return 3;
  return 4;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function Heatmap() {
  const rand = seededRandom(42);
  const weeks = 52;
  const days = 7;
  const cells: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: number[] = [];
    for (let d = 0; d < days; d++) {
      const r = rand();
      const val = r > 0.7 ? Math.floor(r * 8) : 0;
      week.push(val);
    }
    cells.push(week);
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayLabels = ['Mon','','Wed','','Fri','',''];

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 20, marginRight: 4 }}>
          {dayLabels.map((d, i) => (
            <div key={i} style={{ height: 14, fontSize: 10, color: 'var(--muted)', lineHeight: '14px', minWidth: 28, textAlign: 'right' }}>{d}</div>
          ))}
        </div>
        <div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
            {Array.from({ length: 52 }).map((_, w) => {
              const monthIdx = Math.floor(w / 4.33);
              const isFirst = w % Math.round(52 / 12) === 0;
              return (
                <div key={w} style={{ width: 14, fontSize: 10, color: 'var(--muted)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {isFirst ? months[Math.min(monthIdx, 11)] : ''}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 14px)', gap: 3 }}>
            {cells.map((week, wi) =>
              week.map((val, di) => (
                <div
                  key={`${wi}-${di}`}
                  title={`${val} sparks`}
                  style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: COLORS[getIntensity(val)],
                    cursor: 'default',
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
        <span>Less</span>
        {COLORS.map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />)}
        <span>More</span>
        <span style={{ marginLeft: 16 }}>Longest streak: 14 days · Best day: Mar 14 · 7 ⚡</span>
      </div>
    </div>
  );
}
