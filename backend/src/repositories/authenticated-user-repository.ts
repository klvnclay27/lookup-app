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

type SupabaseProfileRow = {
  created_at: string;
  display_name: string;
  id: string;
  smart_mode_enabled: boolean;
  updated_at: string;
  username: string | null;
};

type SupabaseConfiguration = {
  publishableKey: string;
  url: string;
};

export class SupabaseProfileUnavailableError extends Error {
  constructor() {
    super('Profile storage is temporarily unavailable.');
    this.name = 'SupabaseProfileUnavailableError';
  }
}

function getSupabaseConfiguration(): SupabaseConfiguration {
  const url = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL)?.trim().replace(/\/+$/, '');
  const publishableKey = (process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY)?.trim();
  if (!url || !publishableKey) throw new SupabaseProfileUnavailableError();
  return { publishableKey, url };
}

function isProfileRow(value: unknown, userId: string): value is SupabaseProfileRow {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const row = value as Partial<SupabaseProfileRow>;
  return row.id === userId
    && (row.username === null || typeof row.username === 'string')
    && typeof row.display_name === 'string'
    && typeof row.smart_mode_enabled === 'boolean'
    && typeof row.created_at === 'string'
    && typeof row.updated_at === 'string';
}

function parseProfileRows(value: unknown, userId: string): SupabaseProfileRow[] {
  if (!Array.isArray(value) || !value.every((row) => isProfileRow(row, userId))) {
    throw new SupabaseProfileUnavailableError();
  }
  return value;
}

function toUserProfile(row: SupabaseProfileRow): UserProfile {
  return {
    userId: row.id,
    displayName: row.display_name,
    smartModeEnabled: row.smart_mode_enabled,
    ...(row.username ? { username: row.username } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function responseIsUniqueConflict(response: Response): Promise<boolean> {
  if (response.status === 409) return true;
  if (response.status !== 400) return false;
  try {
    const body = await response.clone().json() as { code?: unknown };
    return body.code === '23505';
  } catch {
    return false;
  }
}

export class AuthenticatedUserRepository implements UserRepository {
  private readonly accessToken: string;
  private readonly authenticatedUserId: string;

  constructor(authenticatedUserId: string, accessToken: string) {
    this.authenticatedUserId = authenticatedUserId;
    this.accessToken = accessToken;
  }

  private assertCurrentUser(userId: UserId): void {
    if (userId !== this.authenticatedUserId) throw new SupabaseProfileUnavailableError();
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const { publishableKey, url } = getSupabaseConfiguration();
    try {
      return await fetch(`${url}/rest/v1/user_profiles${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          apikey: publishableKey,
          Authorization: `Bearer ${this.accessToken}`,
          ...init.headers,
        },
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new SupabaseProfileUnavailableError();
    }
  }

  private async getRow(userId: UserId): Promise<SupabaseProfileRow | null> {
    this.assertCurrentUser(userId);
    const response = await this.request(`?id=eq.${encodeURIComponent(userId)}&select=id,username,display_name,smart_mode_enabled,created_at,updated_at`);
    if (!response.ok) throw new SupabaseProfileUnavailableError();
    const rows = parseProfileRows(await response.json() as unknown, userId);
    return rows[0] ?? null;
  }

  private async insertRow(profile: NewUserProfile): Promise<SupabaseProfileRow> {
    this.assertCurrentUser(profile.userId);
    const response = await this.request('?select=id,username,display_name,smart_mode_enabled,created_at,updated_at', {
      body: JSON.stringify({
        id: profile.userId,
        username: profile.username ?? null,
        display_name: profile.displayName,
        smart_mode_enabled: profile.smartModeEnabled,
      }),
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      method: 'POST',
    });
    if (await responseIsUniqueConflict(response)) throw new UsernameUnavailableError();
    if (!response.ok) throw new SupabaseProfileUnavailableError();
    const rows = parseProfileRows(await response.json() as unknown, profile.userId);
    if (!rows[0]) throw new SupabaseProfileUnavailableError();
    return rows[0];
  }

  async createUserProfile(profile: NewUserProfile): Promise<UserProfile> {
    this.assertCurrentUser(profile.userId);
    const existing = await this.getRow(profile.userId);
    return toUserProfile(existing ?? await this.insertRow(profile));
  }

  async getUserProfileByUsername(username: string): Promise<UserProfile | null> {
    const profile = await this.getRow(this.authenticatedUserId);
    return profile?.username?.toLowerCase() === username.toLowerCase() ? toUserProfile(profile) : null;
  }

  async getUserProfile(userId: UserId): Promise<UserProfile | null> {
    const row = await this.getRow(userId);
    return row ? toUserProfile(row) : null;
  }

  async updateUserProfile(userId: UserId, changes: UserProfileChanges): Promise<UserProfile | null> {
    this.assertCurrentUser(userId);
    const response = await this.request(
      `?id=eq.${encodeURIComponent(userId)}&select=id,username,display_name,smart_mode_enabled,created_at,updated_at`,
      {
        body: JSON.stringify({
          ...(changes.displayName !== undefined ? { display_name: changes.displayName } : {}),
          ...(changes.smartModeEnabled !== undefined ? { smart_mode_enabled: changes.smartModeEnabled } : {}),
          ...(changes.username !== undefined ? { username: changes.username } : {}),
          updated_at: new Date().toISOString(),
        }),
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        method: 'PATCH',
      },
    );
    if (await responseIsUniqueConflict(response)) throw new UsernameUnavailableError();
    if (!response.ok) throw new SupabaseProfileUnavailableError();
    const rows = parseProfileRows(await response.json() as unknown, userId);
    return rows[0] ? toUserProfile(rows[0]) : null;
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
