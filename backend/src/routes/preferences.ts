import type { IncomingMessage } from 'node:http';

import type { UserPreferencesChanges } from '../models/user.ts';
import type { UserRepository } from '../repositories/user-repository.ts';
import type { ApiRouteResult } from './users.ts';

const PREFERENCES_ROUTE = /^\/api\/v1\/users\/([^/]+)\/preferences$/;
const MAX_BODY_BYTES = 16_384;
const APPROVED_PREFERENCE_FIELDS = new Set(['smartModeEnabled']);

class RequestValidationError extends Error {}

async function readRequestBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;
    if (totalBytes > MAX_BODY_BYTES) throw new RequestValidationError('Request body is too large.');
    chunks.push(buffer);
  }

  if (chunks.length === 0) throw new RequestValidationError('A JSON request body is required.');

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new RequestValidationError('Request body must be valid JSON.');
  }
}

function validatePreferenceChanges(value: unknown): UserPreferencesChanges {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RequestValidationError('Preference changes must be a JSON object.');
  }

  const input = value as Record<string, unknown>;
  const fields = Object.keys(input);
  if (fields.length === 0) throw new RequestValidationError('smartModeEnabled is required.');

  const unsupportedField = fields.find((field) => !APPROVED_PREFERENCE_FIELDS.has(field));
  if (unsupportedField) throw new RequestValidationError(`Preference field "${unsupportedField}" cannot be updated.`);
  if (typeof input.smartModeEnabled !== 'boolean') {
    throw new RequestValidationError('smartModeEnabled must be a boolean.');
  }

  return { smartModeEnabled: input.smartModeEnabled };
}

function errorResult(statusCode: number, message: string): ApiRouteResult {
  return { statusCode, body: { status: 'error', message } };
}

export async function handleUserPreferencesRoute(
  request: IncomingMessage,
  pathname: string,
  repository: UserRepository,
): Promise<ApiRouteResult | null> {
  const match = PREFERENCES_ROUTE.exec(pathname);
  if (!match) return null;

  let userId: string;
  try {
    userId = decodeURIComponent(match[1]);
  } catch {
    return errorResult(400, 'The user ID is invalid.');
  }

  if (!userId.trim()) return errorResult(400, 'The user ID is required.');

  if (request.method === 'GET') {
    const preferences = await repository.getUserPreferences(userId);
    return preferences
      ? { statusCode: 200, body: { data: preferences } }
      : errorResult(404, 'User preferences not found.');
  }

  if (request.method === 'PATCH') {
    try {
      const changes = validatePreferenceChanges(await readRequestBody(request));
      const preferences = await repository.updateUserPreferences(userId, changes);
      return preferences
        ? { statusCode: 200, body: { data: preferences } }
        : errorResult(404, 'User preferences not found.');
    } catch (error) {
      if (error instanceof RequestValidationError) return errorResult(400, error.message);
      throw error;
    }
  }

  return errorResult(405, 'Method not allowed.');
}
