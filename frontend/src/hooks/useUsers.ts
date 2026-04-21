import { useEffect, useState } from 'react';

interface UserProfile {
  userId: string;
  name: string;
}

type Status = 'loading' | 'success' | 'error';

interface UseUsersResult {
  status: Status;
  users: UserProfile[];
  error: string | null;
}

export function useUsers(): UseUsersResult {
  const [status, setStatus] = useState<Status>('loading');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ users: UserProfile[] }>;
      })
      .then((d) => {
        setUsers(d.users ?? []);
        setStatus('success');
      })
      .catch((err: Error) => {
        setError(err.message);
        setStatus('error');
      });
  }, []);

  return { status, users, error };
}
