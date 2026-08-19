import type { IncomingMessage } from 'node:http';

import { authenticateSupabaseRequest } from '../auth/supabase-auth.ts';
import {
  AuthenticatedUserRepository,
  SupabaseProfileUnavailableError,
} from '../repositories/authenticated-user-repository.ts';
import type { UserRepository } from '../repositories/user-repository.ts';
import { UsernameUnavailableError } from '../repositories/user-repository.ts';
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
  if (pathname === CURRENT_PREFERENCES_ROUTE) {
    return handleUserPreferencesRoute(request, `/api/v1/users/${encodedUserId}/preferences`, repository);
  }

  try {
    const authenticatedRepository = new AuthenticatedUserRepository(repository, userId, authentication.accessToken);
    await authenticatedRepository.createUserProfile({ displayName, email, smartModeEnabled: true, userId, username });
    return handleUserProfileRoute(request, `/api/v1/users/${encodedUserId}/profile`, authenticatedRepository);
  } catch (error) {
    if (error instanceof UsernameUnavailableError) {
      return { statusCode: 409, body: { status: 'error', message: error.message } };
    }
    if (error instanceof SupabaseProfileUnavailableError) {
      return { statusCode: 503, body: { status: 'error', message: error.message } };
    }
    throw error;
  }
}
