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
  id: string;
  updated_at: string;
  username: string;
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
    && typeof row.username === 'string'
    && typeof row.created_at === 'string'
    && typeof row.updated_at === 'string';
}

function parseProfileRows(value: unknown, userId: string): SupabaseProfileRow[] {
  if (!Array.isArray(value) || !value.every((row) => isProfileRow(row, userId))) {
    throw new SupabaseProfileUnavailableError();
  }
  return value;
}

export class AuthenticatedUserRepository implements UserRepository {
  private readonly accessToken: string;
  private readonly authenticatedUserId: string;
  private readonly localRepository: UserRepository;

  constructor(
    localRepository: UserRepository,
    authenticatedUserId: string,
    accessToken: string,
  ) {
    this.localRepository = localRepository;
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

  private async getSupabaseProfile(userId: UserId): Promise<SupabaseProfileRow | null> {
    this.assertCurrentUser(userId);
    const response = await this.request(`?id=eq.${encodeURIComponent(userId)}&select=id,username,created_at,updated_at`);
    if (!response.ok) throw new SupabaseProfileUnavailableError();
    const rows = parseProfileRows(await response.json() as unknown, userId);
    return rows[0] ?? null;
  }

  private async createSupabaseProfile(userId: UserId, username: string): Promise<SupabaseProfileRow> {
    this.assertCurrentUser(userId);
    const response = await this.request('?select=id,username,created_at,updated_at', {
      body: JSON.stringify({ id: userId, username }),
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      method: 'POST',
    });
    if (response.status === 409) throw new UsernameUnavailableError();
    if (!response.ok) throw new SupabaseProfileUnavailableError();
    const rows = parseProfileRows(await response.json() as unknown, userId);
    if (!rows[0]) throw new SupabaseProfileUnavailableError();
    return rows[0];
  }

  private async updateSupabaseUsername(userId: UserId, username: string): Promise<SupabaseProfileRow> {
    this.assertCurrentUser(userId);
    const response = await this.request(
      `?id=eq.${encodeURIComponent(userId)}&select=id,username,created_at,updated_at`,
      {
        body: JSON.stringify({ updated_at: new Date().toISOString(), username }),
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        method: 'PATCH',
      },
    );
    if (response.status === 409) throw new UsernameUnavailableError();
    if (!response.ok) throw new SupabaseProfileUnavailableError();
    const rows = parseProfileRows(await response.json() as unknown, userId);
    if (!rows[0]) throw new SupabaseProfileUnavailableError();
    return rows[0];
  }

  async createUserProfile(profile: NewUserProfile): Promise<UserProfile> {
    this.assertCurrentUser(profile.userId);
    const localProfile = await this.localRepository.createUserProfile(profile);
    let supabaseProfile = await this.getSupabaseProfile(profile.userId);
    if (!supabaseProfile) {
      const username = localProfile.username ?? profile.username;
      if (!username) return localProfile;
      supabaseProfile = await this.createSupabaseProfile(profile.userId, username);
    }
    return { ...localProfile, username: supabaseProfile.username };
  }

  getUserProfileByUsername(username: string): Promise<UserProfile | null> {
    return this.localRepository.getUserProfileByUsername(username);
  }

  async getUserProfile(userId: UserId): Promise<UserProfile | null> {
    this.assertCurrentUser(userId);
    const [localProfile, supabaseProfile] = await Promise.all([
      this.localRepository.getUserProfile(userId),
      this.getSupabaseProfile(userId),
    ]);
    return localProfile && supabaseProfile
      ? { ...localProfile, username: supabaseProfile.username }
      : localProfile;
  }

  async updateUserProfile(userId: UserId, changes: UserProfileChanges): Promise<UserProfile | null> {
    this.assertCurrentUser(userId);
    let supabaseProfile: SupabaseProfileRow | null = null;
    if (changes.username) supabaseProfile = await this.updateSupabaseUsername(userId, changes.username);
    const localProfile = await this.localRepository.updateUserProfile(userId, changes);
    return localProfile && supabaseProfile
      ? { ...localProfile, username: supabaseProfile.username }
      : localProfile;
  }

  getUserPreferences(userId: UserId): Promise<UserPreferences | null> {
    this.assertCurrentUser(userId);
    return this.localRepository.getUserPreferences(userId);
  }

  updateUserPreferences(userId: UserId, changes: UserPreferencesChanges): Promise<UserPreferences | null> {
    this.assertCurrentUser(userId);
    return this.localRepository.updateUserPreferences(userId, changes);
  }
}
