export type UserId = string;

export type UserPreferences = {
  smartModeEnabled: boolean;
};

export type UserProfile = UserPreferences & {
  userId: UserId;
  displayName: string;
  email?: string;
  username?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileChanges = Partial<Pick<UserProfile, 'displayName' | 'smartModeEnabled' | 'username'>>;
export type UserPreferencesChanges = Partial<UserPreferences>;
export type NewUserProfile = Pick<UserProfile, 'displayName' | 'smartModeEnabled' | 'userId'> & Pick<Partial<UserProfile>, 'email' | 'username'>;
