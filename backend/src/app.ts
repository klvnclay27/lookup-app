import type { IncomingMessage, ServerResponse } from 'node:http';

export type HealthResponse = {
  service: 'lookup-backend';
  status: 'ok';
};

const HEALTH_RESPONSE: HealthResponse = {
  status: 'ok',
  service: 'lookup-backend',
};

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

export function handleRequest(request: IncomingMessage, response: ServerResponse) {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (request.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(response, 200, HEALTH_RESPONSE);
    return;
  }

  sendJson(response, 404, {
    status: 'error',
    message: 'Route not found',
  });
}
