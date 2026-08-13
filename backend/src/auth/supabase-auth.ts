import type { IncomingHttpHeaders } from 'node:http';

export type AuthenticatedUser = {
  displayName: string;
  email?: string;
  userId: string;
};

export type AuthenticationResult =
  | { authenticated: true; user: AuthenticatedUser }
  | { authenticated: false; message: string; statusCode: 401 | 503 };

type SupabaseAuthConfiguration = {
  fetchImplementation?: typeof fetch;
  publishableKey?: string;
  supabaseUrl?: string;
};

function readBearerToken(headers: IncomingHttpHeaders): string | null {
  const authorization = headers.authorization;
  if (typeof authorization !== 'string') return null;

  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

function getDisplayName(value: unknown, email?: string): string {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const metadata = value as Record<string, unknown>;
    for (const key of ['display_name', 'full_name', 'name']) {
      const candidate = metadata[key];
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim().slice(0, 80);
    }
  }

  const emailName = email?.split('@')[0]?.trim();
  return emailName ? emailName.slice(0, 80) : 'LookUP User';
}

export async function authenticateSupabaseRequest(
  headers: IncomingHttpHeaders,
  configuration: SupabaseAuthConfiguration = {},
): Promise<AuthenticationResult> {
  const token = readBearerToken(headers);
  if (!token) return { authenticated: false, message: 'A valid Bearer token is required.', statusCode: 401 };
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    return { authenticated: false, message: 'The access token is malformed.', statusCode: 401 };
  }

  const supabaseUrl = (configuration.supabaseUrl
    ?? process.env.SUPABASE_URL
    ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.trim().replace(/\/+$/, '');
  const publishableKey = (configuration.publishableKey
    ?? process.env.SUPABASE_PUBLISHABLE_KEY
    ?? process.env.EXPO_PUBLIC_SUPABASE_KEY)?.trim();

  if (!supabaseUrl || !publishableKey) {
    return { authenticated: false, message: 'Authentication is unavailable.', statusCode: 503 };
  }

  try {
    const response = await (configuration.fetchImplementation ?? fetch)(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
      },
      method: 'GET',
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return { authenticated: false, message: 'The access token is invalid or expired.', statusCode: 401 };
    }

    const value = await response.json() as unknown;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { authenticated: false, message: 'The access token is invalid or expired.', statusCode: 401 };
    }

    const user = value as Record<string, unknown>;
    if (typeof user.id !== 'string' || !user.id.trim()) {
      return { authenticated: false, message: 'The access token is invalid or expired.', statusCode: 401 };
    }

    const email = typeof user.email === 'string' ? user.email : undefined;
    return {
      authenticated: true,
      user: {
        displayName: getDisplayName(user.user_metadata, email),
        email,
        userId: user.id,
      },
    };
  } catch {
    return { authenticated: false, message: 'Authentication is temporarily unavailable.', statusCode: 503 };
  }
}
