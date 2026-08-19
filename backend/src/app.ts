import type { IncomingMessage, ServerResponse } from 'node:http';

import { authenticateSupabaseRequest } from './auth/supabase-auth.ts';
import { supabaseAdminUserRepository } from './repositories/supabase-admin-user-repository.ts';
import { handleAuthRoute } from './routes/auth.ts';
import { handleCurrentUserRoute } from './routes/me.ts';
import { API_STATUS_RESPONSE } from './routes/status.ts';
import { handleUserProfileRoute } from './routes/users.ts';

export type HealthResponse = {
  service: 'lookup-backend';
  status: 'ok';
};

const HEALTH_RESPONSE: HealthResponse = {
  status: 'ok',
  service: 'lookup-backend',
};

const USER_PROFILE_ROUTE = /^\/api\/v1\/users\/([^/]+)\/profile$/;

function getConfiguredOrigins(): Set<string> {
  const configuredOrigins = process.env.LOOKUP_ALLOWED_ORIGINS ?? '';
  return new Set(
    configuredOrigins
      .split(',')
      .map((origin) => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  );
}

function getCorsHeaders(request: IncomingMessage): Record<string, string> {
  const origin = request.headers.origin;
  if (!origin) return {};

  try {
    const parsedOrigin = new URL(origin);
    const isHttp = parsedOrigin.protocol === 'http:' || parsedOrigin.protocol === 'https:';
    const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsedOrigin.hostname);
    const isConfiguredOrigin = getConfiguredOrigins().has(parsedOrigin.origin);

    if (isHttp && (isLoopback || isConfiguredOrigin)) {
      return {
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, PATCH, POST, OPTIONS',
        'Access-Control-Allow-Origin': origin,
        Vary: 'Origin',
      };
    }
  } catch {
    // Invalid origins receive no CORS headers.
  }

  return {};
}

function sendJson(request: IncomingMessage, response: ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...getCorsHeaders(request),
  });
  response.end(JSON.stringify(body));
}

export async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (request.method === 'OPTIONS' && requestUrl.pathname.startsWith('/api/v1/')) {
    response.writeHead(204, getCorsHeaders(request));
    response.end();
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(request, response, 200, HEALTH_RESPONSE);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/v1/status') {
    sendJson(request, response, 200, API_STATUS_RESPONSE);
    return;
  }

  try {
    const authResult = await handleAuthRoute(request, requestUrl.pathname, supabaseAdminUserRepository);
    if (authResult) {
      sendJson(request, response, authResult.statusCode, authResult.body);
      return;
    }

    const currentUserResult = await handleCurrentUserRoute(request, requestUrl.pathname);
    if (currentUserResult) {
      sendJson(request, response, currentUserResult.statusCode, currentUserResult.body);
      return;
    }

    const userProfileMatch = USER_PROFILE_ROUTE.exec(requestUrl.pathname);
    if (userProfileMatch) {
      const authentication = await authenticateSupabaseRequest(request.headers);
      if (!authentication.authenticated) {
        sendJson(request, response, authentication.statusCode, {
          status: 'error',
          message: authentication.message,
        });
        return;
      }

      let requestedUserId: string;
      try {
        requestedUserId = decodeURIComponent(userProfileMatch[1]);
      } catch {
        sendJson(request, response, 400, { status: 'error', message: 'The user ID is invalid.' });
        return;
      }

      if (requestedUserId !== authentication.user.userId) {
        sendJson(request, response, 403, {
          status: 'error',
          message: 'You cannot access another user profile.',
        });
        return;
      }

      const userProfileResult = await handleUserProfileRoute(
        request,
        requestUrl.pathname,
        supabaseAdminUserRepository,
      );
      if (userProfileResult) {
        sendJson(request, response, userProfileResult.statusCode, userProfileResult.body);
        return;
      }
    }

  } catch {
    sendJson(request, response, 500, {
      status: 'error',
      message: 'The backend could not complete the request.',
    });
    return;
  }

  sendJson(request, response, 404, {
    status: 'error',
    message: 'Route not found',
  });
}
