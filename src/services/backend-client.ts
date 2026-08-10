export type BackendApiVersion = 'v1';

export type BackendStatus = {
  apiVersion: BackendApiVersion;
  service: 'lookup-backend';
  status: 'ok';
};

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
): Promise<BackendResult<T>> {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? BACKEND_BASE_URL);
  const fetchImplementation = options.fetchImplementation ?? fetch;
  let response: Response;

  try {
    response = await fetchImplementation(`${baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      method: 'GET',
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
