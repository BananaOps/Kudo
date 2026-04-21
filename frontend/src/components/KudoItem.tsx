import { Kudo } from '../types/kudos';
import { Avatar } from './Avatar';

interface KudoItemProps {
  kudo: Kudo;
  variant?: 'received' | 'given';
  index?: number;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function KudoItem({ kudo, variant = 'received', index = 0 }: KudoItemProps) {
  const name = variant === 'received' ? kudo.fromUserName : kudo.toUserName;
  const role = variant === 'received' ? 'Product' : 'Engineering';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, padding: '16px 22px', borderBottom: '1px solid var(--line)' }}>
      <Avatar name={name} index={index} size={40} />
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{name}</div>
        <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>{role} · {formatRelativeTime(kudo.createdAt)}</div>
        <div style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5 }}>{kudo.message}</div>
        {kudo.channel && (
          <div style={{ marginTop: 6, display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--surface-2)', borderRadius: 5, padding: '2px 6px', color: 'var(--muted)' }}>#{kudo.channel}</div>
        )}
      </div>
      <div style={{ alignSelf: 'start' }}>
        <span style={{ background: 'var(--spark-soft)', border: '1px solid #F0DE9A', color: 'var(--spark-deep)', fontWeight: 600, fontSize: 13, padding: '5px 10px', borderRadius: 999 }}>
          ⚡ {kudo.kudosCount}
        </span>
      </div>
    </div>
  );
}
