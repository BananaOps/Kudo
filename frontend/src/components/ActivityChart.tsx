interface DayData { day: string; count: number; }

interface ActivityChartProps {
  data: DayData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
      <p className="text-sm font-semibold text-stone-700 mb-4">Activité des 7 derniers jours</p>
      <div className="flex items-end gap-2 h-20">
        {data.map(d => (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-amber-400 hover:bg-amber-500 transition-colors rounded-t"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
              title={`${d.day} : ${d.count} ⚡`}
            />
            <span className="text-xs text-stone-400">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
