import { LeaderboardEntry } from '../types/kudos';
import { Avatar } from './Avatar';


interface UserRowProps {
  entry: LeaderboardEntry;
  index?: number;
}

export function UserRow({ entry, index = 0 }: UserRowProps) {
  const isTop = entry.rank <= 3;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '22px 32px 1fr auto',
      alignItems: 'center', gap: 10, padding: '10px 22px',
      background: isTop ? 'var(--spark-soft)' : 'transparent',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: isTop ? 'var(--spark-deep)' : 'var(--muted)', fontWeight: isTop ? 700 : 400 }}>
        {entry.rank.toString().padStart(2, '0')}
      </span>
      <Avatar name={entry.name} index={index} size={28} />
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{entry.name}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{entry.kudosCount} ⚡</span>
    </div>
  );
}
