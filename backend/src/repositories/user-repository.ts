import type {
  NewUserProfile,
  UserId,
  UserPreferences,
  UserPreferencesChanges,
  UserProfile,
  UserProfileChanges,
} from '../models/user.ts';

export interface UserRepository {
  createUserProfile(profile: NewUserProfile): Promise<UserProfile>;
  getUserProfileByUsername(username: string): Promise<UserProfile | null>;
  getUserProfile(userId: UserId): Promise<UserProfile | null>;
  updateUserProfile(userId: UserId, changes: UserProfileChanges): Promise<UserProfile | null>;
  getUserPreferences(userId: UserId): Promise<UserPreferences | null>;
  updateUserPreferences(userId: UserId, changes: UserPreferencesChanges): Promise<UserPreferences | null>;
}

export class UsernameUnavailableError extends Error {
  constructor() {
    super('That username is unavailable.');
    this.name = 'UsernameUnavailableError';
  }
}
