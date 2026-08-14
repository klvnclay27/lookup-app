import type { IncomingMessage } from 'node:http';

import { authenticateSupabaseRequest } from '../auth/supabase-auth.ts';
import type { UserRepository } from '../repositories/user-repository.ts';
import { handleUserPreferencesRoute } from './preferences.ts';
import type { ApiRouteResult } from './users.ts';
import { handleUserProfileRoute } from './users.ts';

const CURRENT_PROFILE_ROUTE = '/api/v1/me/profile';
const CURRENT_PREFERENCES_ROUTE = '/api/v1/me/preferences';

export async function handleCurrentUserRoute(
  request: IncomingMessage,
  pathname: string,
  repository: UserRepository,
): Promise<ApiRouteResult | null> {
  if (pathname !== CURRENT_PROFILE_ROUTE && pathname !== CURRENT_PREFERENCES_ROUTE) return null;

  const authentication = await authenticateSupabaseRequest(request.headers);
  if (!authentication.authenticated) {
    return {
      statusCode: authentication.statusCode,
      body: { status: 'error', message: authentication.message },
    };
  }

  if (request.method !== 'GET' && request.method !== 'PATCH') {
    return { statusCode: 405, body: { status: 'error', message: 'Method not allowed.' } };
  }

  const { displayName, email, userId, username } = authentication.user;
  await repository.createUserProfile({ displayName, email, smartModeEnabled: true, userId, username });

  const encodedUserId = encodeURIComponent(userId);
  return pathname === CURRENT_PROFILE_ROUTE
    ? handleUserProfileRoute(request, `/api/v1/users/${encodedUserId}/profile`, repository)
    : handleUserPreferencesRoute(request, `/api/v1/users/${encodedUserId}/preferences`, repository);
}
