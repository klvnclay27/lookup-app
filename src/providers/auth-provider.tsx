import type { Session } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/services/supabase';

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    const appStateListener = Platform.OS === 'web'
      ? undefined
      : AppState.addEventListener('change', (state) => {
          if (state === 'active') supabase.auth.startAutoRefresh();
          else supabase.auth.stopAutoRefresh();
        });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      appStateListener?.remove();
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
    };
  }, []);

  const value = useMemo(() => ({ configured: isSupabaseConfigured, loading, session }), [loading, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
