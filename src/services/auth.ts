import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { isSupabaseConfigured, supabase } from '@/services/supabase';

export type AuthResult =
  | { error: null; session: Session | null; user: User | null }
  | { error: string; session: null; user: null };

export type PasswordRecoveryResult =
  | { error: null; recovered: true }
  | { error: string; recovered: false };

function getPasswordResetRedirectUrl(): string {
  const configuredRedirect = process.env.EXPO_PUBLIC_LOOKUP_AUTH_REDIRECT_URL?.trim();
  return configuredRedirect || Linking.createURL('sign-in');
}

function configurationError(): AuthResult {
  return {
    error: 'Supabase Auth is not configured for this build.',
    session: null,
    user: null,
  };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return configurationError();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error
      ? { error: error.message, session: null, user: null }
      : { error: null, session: data.session, user: data.user };
  } catch {
    return { error: 'LookUP could not reach the authentication service.', session: null, user: null };
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return configurationError();

  try {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    return error
      ? { error: error.message, session: null, user: null }
      : { error: null, session: data.session, user: data.user };
  } catch {
    return { error: 'LookUP could not reach the authentication service.', session: null, user: null };
  }
}

export async function signOut(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { error } = await supabase.auth.signOut();
    return error?.message ?? null;
  } catch {
    return 'LookUP could not reach the authentication service.';
  }
}

export async function requestPasswordReset(email: string): Promise<string | null> {
  if (!isSupabaseConfigured) return configurationError().error;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordResetRedirectUrl(),
    });
    return error?.message ?? null;
  } catch {
    return 'LookUP could not reach the authentication service.';
  }
}

export async function recoverPasswordSession(url: string): Promise<PasswordRecoveryResult> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase Auth is not configured for this build.', recovered: false };
  }

  try {
    const parsedUrl = new URL(url);
    const query = parsedUrl.searchParams;
    const fragment = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
    const recoveryType = fragment.get('type') ?? query.get('type');
    const accessToken = fragment.get('access_token');
    const refreshToken = fragment.get('refresh_token');
    const authorizationCode = query.get('code');
    const tokenHash = query.get('token_hash');

    if (accessToken && refreshToken && recoveryType === 'recovery') {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      return error ? { error: error.message, recovered: false } : { error: null, recovered: true };
    }

    if (authorizationCode) {
      const { error } = await supabase.auth.exchangeCodeForSession(authorizationCode);
      return error ? { error: error.message, recovered: false } : { error: null, recovered: true };
    }

    if (tokenHash && recoveryType === 'recovery') {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
      return error ? { error: error.message, recovered: false } : { error: null, recovered: true };
    }

    return { error: 'This password reset link is invalid or has expired.', recovered: false };
  } catch {
    return { error: 'This password reset link is invalid or has expired.', recovered: false };
  }
}

export async function updateRecoveredPassword(password: string): Promise<string | null> {
  if (!isSupabaseConfigured) return configurationError().error;

  try {
    const { error } = await supabase.auth.updateUser({ password });
    return error?.message ?? null;
  } catch {
    return 'LookUP could not reach the authentication service.';
  }
}
