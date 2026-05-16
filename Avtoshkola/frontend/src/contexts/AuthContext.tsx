import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import axios from 'axios';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { setAuthToken, apiClient } from '../api/client';
import { AuthenticatedUser } from '../types';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  session: Session | null;
  isLoading: boolean;
  profileError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(): Promise<AuthenticatedUser> {
  const { data } = await apiClient.get<{ data: AuthenticatedUser }>('/auth/me');
  return data.data!;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const hydrateUser = useCallback(async (sess: Session) => {
    setAuthToken(sess.access_token);
    setSession(sess);
    setProfileError(null);
    try {
      const profile = await fetchProfile();
      setUser(profile);
    } catch (err) {
      // Sign out only on explicit auth/profile errors (401/403).
      // Network errors (backend down) keep the Supabase session alive
      // so the user sees an error message instead of silently logging out.
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          await supabase.auth.signOut();
          return;
        }
        const msg = (err.response?.data as { error?: string })?.error ?? err.message;
        setProfileError(msg || 'Неуспешна връзка с сървъра. Моля, опитайте отново.');
      } else {
        setProfileError('Неуспешна връзка с сървъра. Моля, опитайте отново.');
      }
    }
  }, []);

  const clearUser = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setSession(null);
  }, []);

  useEffect(() => {
    // Restore session from localStorage on first load
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (sess) {
        hydrateUser(sess).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && sess) {
          hydrateUser(sess);
        } else if (event === 'SIGNED_OUT') {
          clearUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [hydrateUser, clearUser]);

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, profileError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
