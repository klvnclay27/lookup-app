import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import { AuthenticatedUserRepository, SupabaseProfileUnavailableError } from '../src/repositories/authenticated-user-repository.ts';
import { SupabaseAdminUserRepository } from '../src/repositories/supabase-admin-user-repository.ts';

const originalFetch = globalThis.fetch;
const originalEnvironment = {
  EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const row = {
  id: 'user-a',
  username: 'user_a',
  display_name: 'User A',
  smart_mode_enabled: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project.example';
  process.env.EXPO_PUBLIC_SUPABASE_KEY = 'publishable-test-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-test-key';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

test('authenticated repositories reject a different user ID before requesting Supabase', async () => {
  let requested = false;
  globalThis.fetch = async () => {
    requested = true;
    return Response.json([]);
  };

  const repository = new AuthenticatedUserRepository('user-a', 'user-a-token');
  await assert.rejects(repository.getUserProfile('user-b'), SupabaseProfileUnavailableError);
  assert.equal(requested, false);
});

test('authenticated preferences use the current user Bearer token and Supabase row', async () => {
  globalThis.fetch = async (_input, init) => {
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer user-a-token');
    return Response.json([{ ...row, smart_mode_enabled: false }]);
  };

  const repository = new AuthenticatedUserRepository('user-a', 'user-a-token');
  assert.deepEqual(await repository.updateUserPreferences('user-a', { smartModeEnabled: false }), { smartModeEnabled: false });
});

test('server-only username lookup resolves the matching Supabase Auth email', async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requestedUrls.push(url);
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer server-only-test-key');
    if (url.includes('/rest/v1/user_profiles')) return Response.json([row]);
    if (url.includes('/auth/v1/admin/users/user-a')) return Response.json({ email: 'user-a@example.test' });
    return Response.json({}, { status: 404 });
  };

  const repository = new SupabaseAdminUserRepository();
  const profile = await repository.getUserProfileByUsername('user_a');
  assert.equal(profile?.userId, 'user-a');
  assert.equal(profile?.email, 'user-a@example.test');
  assert.equal(requestedUrls.length, 2);
});
