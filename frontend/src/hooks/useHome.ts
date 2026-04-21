import { useState, useEffect } from 'react';
import type { HomeData } from '../types/kudos';

type Status = 'loading' | 'success' | 'error';

interface UseHomeResult {
  status: Status;
  data: HomeData | null;
  error: string | null;
  refetch: () => void;
}

export function useHome(userId = ''): UseHomeResult {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    const url = userId ? `/api/home?userId=${encodeURIComponent(userId)}` : '/api/home';

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HomeData>;
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
  }, [tick, userId]);

  return { status, data, error, refetch: () => setTick((t) => t + 1) };
}
