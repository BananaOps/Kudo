import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface UserState {
  userId: string;
  userName: string;
}

interface UserContextValue extends UserState {
  setUser: (userId: string, userName: string) => void;
}

const STORAGE_KEY = 'kudo_current_user';

const defaultUser: UserState = { userId: '', userName: '' };

const UserContext = createContext<UserContextValue>({
  ...defaultUser,
  setUser: () => undefined,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as UserState) : defaultUser;
    } catch {
      return defaultUser;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  const setUser = (userId: string, userName: string) => {
    setUserState({ userId, userName });
  };

  return (
    <UserContext.Provider value={{ ...user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  return useContext(UserContext);
}
