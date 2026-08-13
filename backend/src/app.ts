import type { IncomingMessage, ServerResponse } from 'node:http';

import { fileUserRepository } from './data/file-user-repository.ts';
import { handleCurrentUserRoute } from './routes/me.ts';
import { handleUserPreferencesRoute } from './routes/preferences.ts';
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

function getLocalDevelopmentCorsHeaders(request: IncomingMessage): Record<string, string> {
  const origin = request.headers.origin;
  if (!origin) return {};

  try {
    const parsedOrigin = new URL(origin);
    const isHttp = parsedOrigin.protocol === 'http:' || parsedOrigin.protocol === 'https:';
    const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsedOrigin.hostname);

    if (isHttp && isLoopback) {
      return {
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
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
    ...getLocalDevelopmentCorsHeaders(request),
  });
  response.end(JSON.stringify(body));
}

export async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (request.method === 'OPTIONS' && requestUrl.pathname.startsWith('/api/v1/')) {
    response.writeHead(204, getLocalDevelopmentCorsHeaders(request));
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
    const currentUserResult = await handleCurrentUserRoute(request, requestUrl.pathname, fileUserRepository);
    if (currentUserResult) {
      sendJson(request, response, currentUserResult.statusCode, currentUserResult.body);
      return;
    }

    // Legacy demo-user routes remain available in local development only.
    if (process.env.NODE_ENV === 'production') {
      sendJson(request, response, 404, {
        status: 'error',
        message: 'Route not found',
      });
      return;
    }

    const userProfileResult = await handleUserProfileRoute(request, requestUrl.pathname, fileUserRepository);
    if (userProfileResult) {
      sendJson(request, response, userProfileResult.statusCode, userProfileResult.body);
      return;
    }

    const userPreferencesResult = await handleUserPreferencesRoute(request, requestUrl.pathname, fileUserRepository);
    if (userPreferencesResult) {
      sendJson(request, response, userPreferencesResult.statusCode, userPreferencesResult.body);
      return;
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
