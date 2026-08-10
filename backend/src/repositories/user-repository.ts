import type {
  UserId,
  UserPreferences,
  UserPreferencesChanges,
  UserProfile,
  UserProfileChanges,
} from '../models/user.ts';

export interface UserRepository {
  getUserProfile(userId: UserId): Promise<UserProfile | null>;
  updateUserProfile(userId: UserId, changes: UserProfileChanges): Promise<UserProfile | null>;
  getUserPreferences(userId: UserId): Promise<UserPreferences | null>;
  updateUserPreferences(userId: UserId, changes: UserPreferencesChanges): Promise<UserPreferences | null>;
}
