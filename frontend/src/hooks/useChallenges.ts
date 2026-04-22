import { useState, useEffect, useCallback } from 'react';
import type { Challenge, ChallengeCompletion } from '../types/kudos';

// ── User hook ─────────────────────────────────────────────────────────────────

type ChallengesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; challenges: Challenge[] };

export function useChallenges(): ChallengesState & { reload: () => void } {
  const [state, setState] = useState<ChallengesState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/challenges');
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setState({ status: 'success', challenges: data.challenges ?? [] });
    } catch (e) {
      setState({ status: 'error', message: (e as Error).message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}

// ── Admin hook ────────────────────────────────────────────────────────────────

type AdminChallengesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; challenges: Challenge[]; completions: ChallengeCompletion[] };

export function useAdminChallenges(): AdminChallengesState & { reload: () => void } {
  const [state, setState] = useState<AdminChallengesState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const [cRes, compRes] = await Promise.all([
        fetch('/api/admin/challenges'),
        fetch('/api/admin/challenges/completions?status=pending'),
      ]);
      if (!cRes.ok) throw new Error(`Challenges: server responded with ${cRes.status}`);
      if (!compRes.ok) throw new Error(`Completions: server responded with ${compRes.status}`);
      const [cData, compData] = await Promise.all([cRes.json(), compRes.json()]);
      setState({
        status: 'success',
        challenges: cData.challenges ?? [],
        completions: compData.completions ?? [],
      });
    } catch (e) {
      setState({ status: 'error', message: (e as Error).message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}
