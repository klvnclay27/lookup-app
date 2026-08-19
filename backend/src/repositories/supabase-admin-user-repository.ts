import type {
  NewUserProfile,
  UserId,
  UserPreferences,
  UserPreferencesChanges,
  UserProfile,
  UserProfileChanges,
} from '../models/user.ts';
import type { UserRepository } from './user-repository.ts';
import { UsernameUnavailableError } from './user-repository.ts';

type ProfileRow = {
  created_at: string;
  display_name: string;
  id: string;
  smart_mode_enabled: boolean;
  updated_at: string;
  username: string | null;
};

export class SupabaseAdminUnavailableError extends Error {
  constructor() {
    super('Account storage is temporarily unavailable.');
    this.name = 'SupabaseAdminUnavailableError';
  }
}

function configuration() {
  const url = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.trim().replace(/\/+$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new SupabaseAdminUnavailableError();
  return { serviceRoleKey, url };
}

function isRow(value: unknown): value is ProfileRow {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const row = value as Partial<ProfileRow>;
  return typeof row.id === 'string'
    && (row.username === null || typeof row.username === 'string')
    && typeof row.display_name === 'string'
    && typeof row.smart_mode_enabled === 'boolean'
    && typeof row.created_at === 'string'
    && typeof row.updated_at === 'string';
}

function parseRows(value: unknown): ProfileRow[] {
  if (!Array.isArray(value) || !value.every(isRow)) throw new SupabaseAdminUnavailableError();
  return value;
}

function toProfile(row: ProfileRow, email?: string): UserProfile {
  return {
    userId: row.id,
    displayName: row.display_name,
    smartModeEnabled: row.smart_mode_enabled,
    ...(email ? { email } : {}),
    ...(row.username ? { username: row.username } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function isUniqueConflict(response: Response): Promise<boolean> {
  if (response.status === 409) return true;
  if (response.status !== 400) return false;
  try {
    const body = await response.clone().json() as { code?: unknown };
    return body.code === '23505';
  } catch {
    return false;
  }
}

export class SupabaseAdminUserRepository implements UserRepository {
  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const { serviceRoleKey, url } = configuration();
    try {
      return await fetch(`${url}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          ...init.headers,
        },
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new SupabaseAdminUnavailableError();
    }
  }

  private async profileRows(query: string): Promise<ProfileRow[]> {
    const response = await this.request(`/rest/v1/user_profiles?${query}&select=id,username,display_name,smart_mode_enabled,created_at,updated_at`);
    if (!response.ok) throw new SupabaseAdminUnavailableError();
    return parseRows(await response.json() as unknown);
  }

  private async emailForUser(userId: string): Promise<string | undefined> {
    const response = await this.request(`/auth/v1/admin/users/${encodeURIComponent(userId)}`);
    if (!response.ok) throw new SupabaseAdminUnavailableError();
    const user = await response.json() as { email?: unknown };
    return typeof user.email === 'string' ? user.email : undefined;
  }

  async createUserProfile(profile: NewUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(profile.userId);
    if (existing) return existing;
    const response = await this.request('/rest/v1/user_profiles?select=id,username,display_name,smart_mode_enabled,created_at,updated_at', {
      body: JSON.stringify({
        id: profile.userId,
        username: profile.username ?? null,
        display_name: profile.displayName,
        smart_mode_enabled: profile.smartModeEnabled,
      }),
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      method: 'POST',
    });
    if (await isUniqueConflict(response)) throw new UsernameUnavailableError();
    if (!response.ok) throw new SupabaseAdminUnavailableError();
    const row = parseRows(await response.json() as unknown)[0];
    if (!row) throw new SupabaseAdminUnavailableError();
    return toProfile(row, profile.email);
  }

  async getUserProfileByUsername(username: string): Promise<UserProfile | null> {
    const rows = await this.profileRows(`username=eq.${encodeURIComponent(username.toLowerCase())}&limit=1`);
    const row = rows[0];
    if (!row) return null;
    return toProfile(row, await this.emailForUser(row.id));
  }

  async getUserProfile(userId: UserId): Promise<UserProfile | null> {
    const row = (await this.profileRows(`id=eq.${encodeURIComponent(userId)}&limit=1`))[0];
    return row ? toProfile(row) : null;
  }

  async updateUserProfile(userId: UserId, changes: UserProfileChanges): Promise<UserProfile | null> {
    const response = await this.request(`/rest/v1/user_profiles?id=eq.${encodeURIComponent(userId)}&select=id,username,display_name,smart_mode_enabled,created_at,updated_at`, {
      body: JSON.stringify({
        ...(changes.displayName !== undefined ? { display_name: changes.displayName } : {}),
        ...(changes.smartModeEnabled !== undefined ? { smart_mode_enabled: changes.smartModeEnabled } : {}),
        ...(changes.username !== undefined ? { username: changes.username } : {}),
        updated_at: new Date().toISOString(),
      }),
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      method: 'PATCH',
    });
    if (await isUniqueConflict(response)) throw new UsernameUnavailableError();
    if (!response.ok) throw new SupabaseAdminUnavailableError();
    const row = parseRows(await response.json() as unknown)[0];
    return row ? toProfile(row) : null;
  }

  async getUserPreferences(userId: UserId): Promise<UserPreferences | null> {
    const profile = await this.getUserProfile(userId);
    return profile ? { smartModeEnabled: profile.smartModeEnabled } : null;
  }

  async updateUserPreferences(userId: UserId, changes: UserPreferencesChanges): Promise<UserPreferences | null> {
    const profile = await this.updateUserProfile(userId, changes);
    return profile ? { smartModeEnabled: profile.smartModeEnabled } : null;
  }
}

export const supabaseAdminUserRepository = new SupabaseAdminUserRepository();
