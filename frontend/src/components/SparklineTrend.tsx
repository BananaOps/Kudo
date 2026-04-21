interface SparklineTrendProps {
  data?: number[];
}

const DEFAULT = [3, 5, 4, 7, 6, 8, 9];

export function SparklineTrend({ data = DEFAULT }: SparklineTrendProps) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: 22, gap: 2 }}>
      {data.map((val, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: `${Math.max(15, Math.round((val / max) * 100))}%`,
            background: 'var(--spark)',
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
