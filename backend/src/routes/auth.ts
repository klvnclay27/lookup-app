import type { IncomingMessage } from 'node:http';

import type { UserRepository } from '../repositories/user-repository.ts';
import { UsernameUnavailableError } from '../repositories/user-repository.ts';
import type { ApiRouteResult } from './users.ts';

const SIGN_IN_ROUTE = '/api/v1/auth/sign-in';
const SIGN_UP_ROUTE = '/api/v1/auth/sign-up';
const MAX_BODY_BYTES = 16_384;
const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

class RequestValidationError extends Error {}

async function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > MAX_BODY_BYTES) throw new RequestValidationError('Request body is too large.');
    chunks.push(buffer);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new RequestValidationError('A valid JSON request body is required.');
  }
}

function configuration() {
  const url = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.trim().replace(/\/+$/, '');
  const key = (process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY)?.trim();
  return url && key ? { key, url } : null;
}

function error(statusCode: number, message: string): ApiRouteResult {
  return { statusCode, body: { status: 'error', message } };
}

function sessionPayload(value: unknown): ApiRouteResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return error(502, 'Authentication is temporarily unavailable.');
  const root = value as Record<string, unknown>;
  const data = typeof root.session === 'object' && root.session !== null ? root.session as Record<string, unknown> : root;
  if (typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string') return error(401, 'Invalid sign-in credentials.');
  return { statusCode: 200, body: { data: { accessToken: data.access_token, refreshToken: data.refresh_token } } };
}

export async function handleAuthRoute(request: IncomingMessage, pathname: string, repository: UserRepository): Promise<ApiRouteResult | null> {
  if (pathname !== SIGN_IN_ROUTE && pathname !== SIGN_UP_ROUTE) return null;
  if (request.method !== 'POST') return error(405, 'Method not allowed.');
  const config = configuration();
  if (!config) return error(503, 'Authentication is unavailable.');

  try {
    const input = await readBody(request);
    if (typeof input.password !== 'string' || input.password.length === 0) return error(400, 'Valid credentials are required.');

    if (pathname === SIGN_IN_ROUTE) {
      if (typeof input.identifier !== 'string' || !input.identifier.trim()) return error(400, 'Valid credentials are required.');
      const identifier = input.identifier.trim();
      let email = identifier;
      if (!identifier.includes('@')) {
        const username = identifier.toLowerCase();
        if (!USERNAME_PATTERN.test(username)) return error(401, 'Invalid sign-in credentials.');
        email = (await repository.getUserProfileByUsername(username))?.email ?? '';
      }
      if (!email) return error(401, 'Invalid sign-in credentials.');

      const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
        body: JSON.stringify({ email, password: input.password }),
        headers: { apikey: config.key, 'Content-Type': 'application/json' },
        method: 'POST',
        signal: AbortSignal.timeout(8_000),
      });
      return response.ok ? sessionPayload(await response.json()) : error(401, 'Invalid sign-in credentials.');
    }

    if (typeof input.email !== 'string' || !input.email.includes('@') || typeof input.username !== 'string') return error(400, 'Email, username, and password are required.');
    if (input.password.length < 8) return error(400, 'Password must be at least 8 characters.');
    const username = input.username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(username)) return error(400, 'Username must be 3–24 characters using letters, numbers, or underscores.');
    if (await repository.getUserProfileByUsername(username)) return error(409, 'That username is unavailable.');

    const response = await fetch(`${config.url}/auth/v1/signup`, {
      body: JSON.stringify({ email: input.email.trim(), password: input.password, data: { username } }),
      headers: { apikey: config.key, 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(8_000),
    });
    const value = await response.json() as Record<string, unknown>;
    if (!response.ok) return error(400, 'LookUP could not create that account. Check your details and try again.');
    const user = typeof value.user === 'object' && value.user !== null ? value.user as Record<string, unknown> : value;
    if (typeof user.id !== 'string') return error(502, 'Authentication is temporarily unavailable.');
    await repository.createUserProfile({ displayName: username, email: input.email.trim().toLowerCase(), smartModeEnabled: true, userId: user.id, username });
    const session = typeof value.session === 'object' && value.session !== null ? value.session as Record<string, unknown> : value;
    if (typeof session.access_token === 'string' && typeof session.refresh_token === 'string') return sessionPayload(value);
    return { statusCode: 200, body: { data: { accessToken: null, refreshToken: null } } };
  } catch (caught) {
    if (caught instanceof RequestValidationError) return error(400, caught.message);
    if (caught instanceof UsernameUnavailableError) return error(409, 'That username is unavailable.');
    return error(503, 'Authentication is temporarily unavailable.');
  }
}
