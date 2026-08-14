import type {
  NewUserProfile,
  UserId,
  UserPreferences,
  UserPreferencesChanges,
  UserProfile,
  UserProfileChanges,
} from '../models/user.ts';
import type { UserRepository } from '../repositories/user-repository.ts';
import { UsernameUnavailableError } from '../repositories/user-repository.ts';

export const DEMO_USER_ID = 'demo-user';

const DEMO_CREATED_AT = '2026-01-01T00:00:00.000Z';

export const DEMO_USER_PROFILE: UserProfile = {
  userId: DEMO_USER_ID,
  displayName: 'Demo User',
  smartModeEnabled: true,
  createdAt: DEMO_CREATED_AT,
  updatedAt: DEMO_CREATED_AT,
};

function copyProfile(profile: UserProfile): UserProfile {
  return { ...profile };
}

export class InMemoryUserRepository implements UserRepository {
  private readonly profiles: Map<UserId, UserProfile>;

  constructor(seedProfiles: UserProfile[] = [DEMO_USER_PROFILE]) {
    this.profiles = new Map(seedProfiles.map((profile) => [profile.userId, copyProfile(profile)]));
  }

  async createUserProfile(profile: NewUserProfile): Promise<UserProfile> {
    const existing = this.profiles.get(profile.userId);
    if (existing) {
      const updated = { ...existing, ...(!existing.email && profile.email ? { email: profile.email } : {}), ...(!existing.username && profile.username && ![...this.profiles.values()].some((candidate) => candidate.userId !== profile.userId && candidate.username?.toLowerCase() === profile.username?.toLowerCase()) ? { username: profile.username } : {}), updatedAt: new Date().toISOString() };
      this.profiles.set(profile.userId, updated);
      return copyProfile(updated);
    }
    if (profile.username && [...this.profiles.values()].some((candidate) => candidate.username?.toLowerCase() === profile.username?.toLowerCase())) throw new UsernameUnavailableError();

    const now = new Date().toISOString();
    const created: UserProfile = { ...profile, createdAt: now, updatedAt: now };
    this.profiles.set(created.userId, created);
    return copyProfile(created);
  }

  async getUserProfileByUsername(username: string): Promise<UserProfile | null> {
    const normalized = username.toLowerCase();
    const profile = [...this.profiles.values()].find((candidate) => candidate.username?.toLowerCase() === normalized);
    return profile ? copyProfile(profile) : null;
  }

  async getUserProfile(userId: UserId): Promise<UserProfile | null> {
    const profile = this.profiles.get(userId);
    return profile ? copyProfile(profile) : null;
  }

  async updateUserProfile(userId: UserId, changes: UserProfileChanges): Promise<UserProfile | null> {
    const current = this.profiles.get(userId);
    if (!current) return null;
    if (changes.username && [...this.profiles.values()].some((candidate) => candidate.userId !== userId && candidate.username?.toLowerCase() === changes.username?.toLowerCase())) throw new UsernameUnavailableError();

    const updated: UserProfile = {
      ...current,
      ...changes,
      userId: current.userId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(userId, updated);
    return copyProfile(updated);
  }

  async getUserPreferences(userId: UserId): Promise<UserPreferences | null> {
    const profile = this.profiles.get(userId);
    return profile ? { smartModeEnabled: profile.smartModeEnabled } : null;
  }

  async updateUserPreferences(userId: UserId, changes: UserPreferencesChanges): Promise<UserPreferences | null> {
    const updated = await this.updateUserProfile(userId, changes);
    return updated ? { smartModeEnabled: updated.smartModeEnabled } : null;
  }
}

export const inMemoryUserRepository = new InMemoryUserRepository();
