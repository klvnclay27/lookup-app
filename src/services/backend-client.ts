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
  username?: string;
};

export type BackendUserProfileChanges = Partial<Pick<BackendUserProfile, 'displayName' | 'smartModeEnabled' | 'username'>>;

export type BackendUserPreferences = {
  smartModeEnabled: boolean;
};

export type BackendUserPreferencesChanges = Partial<BackendUserPreferences>;

export type BackendClientError = {
  code: 'network' | 'http' | 'invalid-response' | 'unauthorized';
  message: string;
  statusCode?: number;
};

export type BackendResult<T> =
  | { data: T; error: null; state: 'available' }
  | { data: null; error: BackendClientError; state: 'unavailable' | 'error' };

export type BackendRequestOptions = {
  accessToken?: string;
  baseUrl?: string;
  fetchImplementation?: typeof fetch;
};

type BackendDataResponse<T> = { data: T };
type BackendRequestMethod = 'GET' | 'PATCH' | 'POST';

export type BackendAuthSession = { accessToken: string | null; refreshToken: string | null };

const LOCAL_DEVELOPMENT_BACKEND_URL = 'http://localhost:4000';

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export const BACKEND_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_LOOKUP_BACKEND_URL || (__DEV__ ? LOCAL_DEVELOPMENT_BACKEND_URL : ''),
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

function isAuthSessionResponse(value: unknown): value is BackendDataResponse<BackendAuthSession> {
  if (typeof value !== 'object' || value === null) return false;
  const data = (value as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return false;
  const session = data as Partial<BackendAuthSession>;
  return (typeof session.accessToken === 'string' && typeof session.refreshToken === 'string')
    || (session.accessToken === null && session.refreshToken === null);
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
  requiresAuthentication = false,
): Promise<BackendResult<T>> {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? BACKEND_BASE_URL);
  const fetchImplementation = options.fetchImplementation ?? fetch;
  let response: Response;
  let accessToken = options.accessToken;

  if (!baseUrl) {
    return {
      data: null,
      error: { code: 'network', message: 'The LookUP backend is not configured for this build.' },
      state: 'unavailable',
    };
  }

  if (requiresAuthentication && !accessToken) {
    try {
      const { supabase } = await import('@/services/supabase');
      const { data } = await supabase.auth.getSession();
      accessToken = data.session?.access_token;
    } catch {
      return {
        data: null,
        error: { code: 'unauthorized', message: 'LookUP could not restore the authentication session.', statusCode: 401 },
        state: 'error',
      };
    }
  }

  if (requiresAuthentication && !accessToken) {
    return {
      data: null,
      error: { code: 'unauthorized', message: 'Sign in to access your LookUP data.', statusCode: 401 },
      state: 'error',
    };
  }

  try {
    response = await fetchImplementation(`${baseUrl}${path}`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
    let backendMessage: string | undefined;
    try {
      const errorBody = await readJson(response);
      if (typeof errorBody === 'object' && errorBody !== null && typeof (errorBody as { message?: unknown }).message === 'string') {
        backendMessage = (errorBody as { message: string }).message;
      }
    } catch {
      backendMessage = undefined;
    }
    return {
      data: null,
      error: {
        code: 'http',
        message: backendMessage ?? `The LookUP backend returned HTTP ${response.status}.`,
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

export async function getCurrentUserProfile(
  options: BackendRequestOptions = {},
): Promise<BackendResult<BackendUserProfile>> {
  const result = await requestJson('/api/v1/me/profile', isUserProfileResponse, options, 'GET', undefined, true);
  return unwrapDataResult(result);
}

export async function updateCurrentUserProfile(
  changes: BackendUserProfileChanges,
  options: BackendRequestOptions = {},
): Promise<BackendResult<BackendUserProfile>> {
  const result = await requestJson('/api/v1/me/profile', isUserProfileResponse, options, 'PATCH', changes, true);
  return unwrapDataResult(result);
}

export async function getCurrentUserPreferences(
  options: BackendRequestOptions = {},
): Promise<BackendResult<BackendUserPreferences>> {
  const result = await requestJson('/api/v1/me/preferences', isUserPreferencesResponse, options, 'GET', undefined, true);
  return unwrapDataResult(result);
}

export async function updateCurrentUserPreferences(
  changes: BackendUserPreferencesChanges,
  options: BackendRequestOptions = {},
): Promise<BackendResult<BackendUserPreferences>> {
  const result = await requestJson('/api/v1/me/preferences', isUserPreferencesResponse, options, 'PATCH', changes, true);
  return unwrapDataResult(result);
}

export async function signInThroughBackend(
  identifier: string,
  password: string,
  options: BackendRequestOptions = {},
): Promise<BackendResult<BackendAuthSession>> {
  const result = await requestJson('/api/v1/auth/sign-in', isAuthSessionResponse, options, 'POST', { identifier, password });
  return unwrapDataResult(result);
}

export async function signUpThroughBackend(
  email: string,
  password: string,
  username: string,
  options: BackendRequestOptions = {},
): Promise<BackendResult<BackendAuthSession>> {
  const result = await requestJson('/api/v1/auth/sign-up', isAuthSessionResponse, options, 'POST', { email, password, username });
  return unwrapDataResult(result);
}
