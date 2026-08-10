export type BackendApiVersion = 'v1';

export type BackendStatus = {
  apiVersion: BackendApiVersion;
  service: 'lookup-backend';
  status: 'ok';
};

export type BackendUserProfile = {
  userId: string;
  displayName: string;
  smartModeEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BackendUserProfileChanges = Partial<Pick<BackendUserProfile, 'displayName' | 'smartModeEnabled'>>;

export type BackendUserPreferences = {
  smartModeEnabled: boolean;
};

export type BackendUserPreferencesChanges = Partial<BackendUserPreferences>;

export type BackendClientError = {
  code: 'network' | 'http' | 'invalid-response';
  message: string;
  statusCode?: number;
};

export type BackendResult<T> =
  | { data: T; error: null; state: 'available' }
  | { data: null; error: BackendClientError; state: 'unavailable' | 'error' };

export type BackendRequestOptions = {
  baseUrl?: string;
  fetchImplementation?: typeof fetch;
};

type BackendDataResponse<T> = { data: T };
type BackendRequestMethod = 'GET' | 'PATCH';

const DEFAULT_BACKEND_BASE_URL = 'http://localhost:4000';

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export const BACKEND_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_LOOKUP_BACKEND_URL || DEFAULT_BACKEND_BASE_URL,
);

function isBackendStatus(value: unknown): value is BackendStatus {
  if (typeof value !== 'object' || value === null) return false;
  const status = value as Partial<BackendStatus>;
  return status.status === 'ok' && status.service === 'lookup-backend' && status.apiVersion === 'v1';
}

function isBackendUserProfile(value: unknown): value is BackendUserProfile {
  if (typeof value !== 'object' || value === null) return false;
  const profile = value as Partial<BackendUserProfile>;
  return typeof profile.userId === 'string'
    && typeof profile.displayName === 'string'
    && typeof profile.smartModeEnabled === 'boolean'
    && typeof profile.createdAt === 'string'
    && typeof profile.updatedAt === 'string';
}

function isUserProfileResponse(value: unknown): value is BackendDataResponse<BackendUserProfile> {
  return typeof value === 'object' && value !== null && isBackendUserProfile((value as { data?: unknown }).data);
}

function isBackendUserPreferences(value: unknown): value is BackendUserPreferences {
  return typeof value === 'object'
    && value !== null
    && typeof (value as Partial<BackendUserPreferences>).smartModeEnabled === 'boolean';
}

function isUserPreferencesResponse(value: unknown): value is BackendDataResponse<BackendUserPreferences> {
  return typeof value === 'object' && value !== null && isBackendUserPreferences((value as { data?: unknown }).data);
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('The backend returned a non-JSON response.');
  }

  return response.json();
}

async function requestJson<T>(
  path: string,
  validate: (value: unknown) => value is T,
  options: BackendRequestOptions = {},
  method: BackendRequestMethod = 'GET',
  body?: unknown,
): Promise<BackendResult<T>> {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? BACKEND_BASE_URL);
  const fetchImplementation = options.fetchImplementation ?? fetch;
  let response: Response;

  try {
    response = await fetchImplementation(`${baseUrl}${path}`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      method,
    });
  } catch {
    return {
      data: null,
      error: { code: 'network', message: 'The LookUP backend is unavailable.' },
      state: 'unavailable',
    };
  }

  if (!response.ok) {
    return {
      data: null,
      error: {
        code: 'http',
        message: `The LookUP backend returned HTTP ${response.status}.`,
        statusCode: response.status,
      },
      state: 'error',
    };
  }

  try {
    const data = await readJson(response);
    if (!validate(data)) throw new Error('The backend response did not match the expected shape.');
    return { data, error: null, state: 'available' };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'invalid-response',
        message: error instanceof Error ? error.message : 'The backend returned an invalid response.',
      },
      state: 'error',
    };
  }
}

export function getBackendStatus(options: BackendRequestOptions = {}): Promise<BackendResult<BackendStatus>> {
  return requestJson('/api/v1/status', isBackendStatus, options);
}

function unwrapDataResult<T>(result: BackendResult<BackendDataResponse<T>>): BackendResult<T> {
  return result.state === 'available'
    ? { data: result.data.data, error: null, state: 'available' }
    : result;
}

export async function getUserProfile(
  userId: string,
  options: BackendRequestOptions = {},
): Promise<BackendResult<BackendUserProfile>> {
  const result = await requestJson(
    `/api/v1/users/${encodeURIComponent(userId)}/profile`,
    isUserProfileResponse,
    options,
  );
  return unwrapDataResult(result);
}

export async function updateUserProfile(
  userId: string,
  changes: BackendUserProfileChanges,
  options: BackendRequestOptions = {},
): Promise<BackendResult<BackendUserProfile>> {
  const result = await requestJson(
    `/api/v1/users/${encodeURIComponent(userId)}/profile`,
    isUserProfileResponse,
    options,
    'PATCH',
    changes,
  );
  return unwrapDataResult(result);
}

export async function getUserPreferences(
  userId: string,
  options: BackendRequestOptions = {},
): Promise<BackendResult<BackendUserPreferences>> {
  const result = await requestJson(
    `/api/v1/users/${encodeURIComponent(userId)}/preferences`,
    isUserPreferencesResponse,
    options,
  );
  return unwrapDataResult(result);
}

export async function updateUserPreferences(
  userId: string,
  changes: BackendUserPreferencesChanges,
  options: BackendRequestOptions = {},
): Promise<BackendResult<BackendUserPreferences>> {
  const result = await requestJson(
    `/api/v1/users/${encodeURIComponent(userId)}/preferences`,
    isUserPreferencesResponse,
    options,
    'PATCH',
    changes,
  );
  return unwrapDataResult(result);
}
