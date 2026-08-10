import type { IncomingMessage, ServerResponse } from 'node:http';

import { API_STATUS_RESPONSE } from './routes/status.ts';

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
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

export function handleRequest(request: IncomingMessage, response: ServerResponse) {
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

  sendJson(request, response, 404, {
    status: 'error',
    message: 'Route not found',
  });
}
