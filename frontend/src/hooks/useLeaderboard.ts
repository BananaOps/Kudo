import { useState, useEffect } from 'react';
import type { LeaderboardData } from '../types/kudos';

type Status = 'loading' | 'success' | 'error';

interface UseLeaderboardResult {
  status: Status;
  data: LeaderboardData | null;
  error: string | null;
  setPeriod: (period: string) => void;
  setTab: (tab: string) => void;
}

export function useLeaderboard(initialPeriod = 'week', initialTab = 'received'): UseLeaderboardResult {
  const [period, setPeriod] = useState(initialPeriod);
  const [tab, setTab] = useState(initialTab);
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetch(`/api/leaderboard?period=${period}&tab=${tab}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<LeaderboardData>;
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setStatus('success');
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setStatus('error');
        }
      });

    return () => { cancelled = true; };
  }, [period, tab]);

  return { status, data, error, setPeriod, setTab };
}
