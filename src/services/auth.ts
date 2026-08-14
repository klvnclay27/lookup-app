import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { signInThroughBackend, signUpThroughBackend } from '@/services/backend-client';

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

function getUsernameRecoveryRedirectUrl(): string {
  const configuredRedirect = process.env.EXPO_PUBLIC_LOOKUP_AUTH_REDIRECT_URL?.trim();
  if (configuredRedirect) return `${configuredRedirect}${configuredRedirect.includes('?') ? '&' : '?'}usernameRecovery=true`;
  return Linking.createURL('sign-in', { queryParams: { usernameRecovery: 'true' } });
}

function configurationError(): AuthResult {
  return {
    error: 'Supabase Auth is not configured for this build.',
    session: null,
    user: null,
  };
}

export async function signInWithIdentifier(identifier: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return configurationError();

  try {
    const normalizedIdentifier = identifier.trim();
    if (normalizedIdentifier.includes('@')) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedIdentifier, password });
      return error
        ? { error: error.message, session: null, user: null }
        : { error: null, session: data.session, user: data.user };
    }

    const result = await signInThroughBackend(normalizedIdentifier, password);
    if (result.state !== 'available' || !result.data.accessToken || !result.data.refreshToken) {
      return { error: 'Invalid sign-in credentials.', session: null, user: null };
    }
    const { data, error } = await supabase.auth.setSession({ access_token: result.data.accessToken, refresh_token: result.data.refreshToken });
    return error ? { error: 'Invalid sign-in credentials.', session: null, user: null } : { error: null, session: data.session, user: data.user };
  } catch {
    return { error: 'LookUP could not reach the authentication service.', session: null, user: null };
  }
}

export async function signUpWithEmail(email: string, password: string, username: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return configurationError();

  try {
    const result = await signUpThroughBackend(email.trim(), password, username.trim().toLowerCase());
    if (result.state !== 'available') return { error: result.error.message, session: null, user: null };
    if (!result.data.accessToken || !result.data.refreshToken) return { error: null, session: null, user: null };
    const { data, error } = await supabase.auth.setSession({ access_token: result.data.accessToken, refresh_token: result.data.refreshToken });
    return error ? { error: error.message, session: null, user: null } : { error: null, session: data.session, user: data.user };
  } catch {
    return { error: 'LookUP could not reach the authentication service.', session: null, user: null };
  }
}

export async function requestUsernameRecovery(email: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: getUsernameRecoveryRedirectUrl(), shouldCreateUser: false },
    });
  } catch {
    // The UI intentionally returns the same neutral response for every address.
  }
}

export async function recoverEmailSession(url: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase Auth is not configured for this build.';
  try {
    const parsed = new URL(url);
    const query = parsed.searchParams;
    const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
    const accessToken = fragment.get('access_token');
    const refreshToken = fragment.get('refresh_token');
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      return error?.message ?? null;
    }
    const code = query.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      return error?.message ?? null;
    }
    const tokenHash = query.get('token_hash');
    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
      return error?.message ?? null;
    }
    return 'This username recovery link is invalid or has expired.';
  } catch {
    return 'This username recovery link is invalid or has expired.';
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
