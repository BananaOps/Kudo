import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface UserState {
  userId: string;
  userName: string;
  isAdmin: boolean;
}

interface UserContextValue extends UserState {
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  /** Dev-mode only: override the current user without a Slack session. */
  setUser: (userId: string, userName: string) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  userId: '',
  userName: '',
  isAdmin: false,
  authStatus: 'loading',
  isAuthenticated: false,
  setUser: () => undefined,
  logout: async () => undefined,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserState>({ userId: '', userName: '', isAdmin: false });
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    fetch('/api/me')
      .then((r) => {
        if (!r.ok) throw new Error('unauthenticated');
        return r.json() as Promise<{ userId: string; userName: string; isAdmin: boolean }>;
      })
      .then((data) => {
        setUserState({ userId: data.userId, userName: data.userName, isAdmin: data.isAdmin ?? false });
        setAuthStatus('authenticated');
      })
      .catch(() => {
        setAuthStatus('unauthenticated');
      });
  }, []);

  const setUser = (userId: string, userName: string) => {
    setUserState({ userId, userName, isAdmin: false });
    setAuthStatus('authenticated');
  };

  const logout = async () => {
    await fetch('/auth/logout', { method: 'POST' });
    setUserState({ userId: '', userName: '', isAdmin: false });
    setAuthStatus('unauthenticated');
  };

  return (
    <UserContext.Provider value={{
      ...user,
      authStatus,
      isAuthenticated: authStatus === 'authenticated',
      setUser,
      logout,
    }}>
      {children}
    </UserContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  return useContext(UserContext);
}
