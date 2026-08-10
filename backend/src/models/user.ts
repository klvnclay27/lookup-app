export type UserId = string;

export type UserPreferences = {
  smartModeEnabled: boolean;
};

export type UserProfile = UserPreferences & {
  userId: UserId;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileChanges = Partial<Pick<UserProfile, 'displayName' | 'smartModeEnabled'>>;
export type UserPreferencesChanges = Partial<UserPreferences>;
