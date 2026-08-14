import type { IncomingMessage } from 'node:http';

import type { UserProfileChanges } from '../models/user.ts';
import type { UserRepository } from '../repositories/user-repository.ts';
import { UsernameUnavailableError } from '../repositories/user-repository.ts';

export type ApiRouteResult = {
  body: unknown;
  statusCode: number;
};

const PROFILE_ROUTE = /^\/api\/v1\/users\/([^/]+)\/profile$/;
const MAX_BODY_BYTES = 16_384;
const APPROVED_UPDATE_FIELDS = new Set(['displayName', 'smartModeEnabled', 'username']);

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

function validateProfileChanges(value: unknown): UserProfileChanges {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RequestValidationError('Profile changes must be a JSON object.');
  }

  const input = value as Record<string, unknown>;
  const fields = Object.keys(input);
  if (fields.length === 0) throw new RequestValidationError('At least one profile field is required.');

  const unsupportedField = fields.find((field) => !APPROVED_UPDATE_FIELDS.has(field));
  if (unsupportedField) throw new RequestValidationError(`Field "${unsupportedField}" cannot be updated.`);

  const changes: UserProfileChanges = {};
  if ('displayName' in input) {
    if (typeof input.displayName !== 'string') throw new RequestValidationError('displayName must be a string.');
    const displayName = input.displayName.trim();
    if (displayName.length < 1 || displayName.length > 80) {
      throw new RequestValidationError('displayName must contain between 1 and 80 characters.');
    }
    changes.displayName = displayName;
  }

  if ('smartModeEnabled' in input) {
    if (typeof input.smartModeEnabled !== 'boolean') {
      throw new RequestValidationError('smartModeEnabled must be a boolean.');
    }
    changes.smartModeEnabled = input.smartModeEnabled;
  }

  if ('username' in input) {
    if (typeof input.username !== 'string') throw new RequestValidationError('username must be a string.');
    const username = input.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      throw new RequestValidationError('Username must be 3–24 characters using letters, numbers, or underscores.');
    }
    changes.username = username;
  }

  return changes;
}

function errorResult(statusCode: number, message: string): ApiRouteResult {
  return { statusCode, body: { status: 'error', message } };
}

export async function handleUserProfileRoute(
  request: IncomingMessage,
  pathname: string,
  repository: UserRepository,
): Promise<ApiRouteResult | null> {
  const match = PROFILE_ROUTE.exec(pathname);
  if (!match) return null;

  let userId: string;
  try {
    userId = decodeURIComponent(match[1]);
  } catch {
    return errorResult(400, 'The user ID is invalid.');
  }

  if (!userId.trim()) return errorResult(400, 'The user ID is required.');

  if (request.method === 'GET') {
    const profile = await repository.getUserProfile(userId);
    return profile
      ? { statusCode: 200, body: { data: profile } }
      : errorResult(404, 'User profile not found.');
  }

  if (request.method === 'PATCH') {
    try {
      const changes = validateProfileChanges(await readRequestBody(request));
      const profile = await repository.updateUserProfile(userId, changes);
      return profile
        ? { statusCode: 200, body: { data: profile } }
        : errorResult(404, 'User profile not found.');
    } catch (error) {
      if (error instanceof RequestValidationError) return errorResult(400, error.message);
      if (error instanceof UsernameUnavailableError) return errorResult(409, 'That username is unavailable.');
      throw error;
    }
  }

  return errorResult(405, 'Method not allowed.');
}
