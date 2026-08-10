import AsyncStorage from '@react-native-async-storage/async-storage';

import { getUserPreferences, getUserProfile, updateUserPreferences } from '@/services/backend-client';

export const DEVELOPMENT_USER_ID = 'demo-user';

const SMART_MODE_PREFERENCE_KEY = 'lookup.dailyIntelligence.enabled.v1';
const FALLBACK_DISPLAY_NAME = 'Kelvin';

export type HomeUserProfile = {
  displayName: string;
  smartModeEnabled: boolean;
  source: 'backend' | 'local';
  userId: string;
};

async function readLocalSmartModePreference(): Promise<boolean | undefined> {
  try {
    const stored = await AsyncStorage.getItem(SMART_MODE_PREFERENCE_KEY);
    return stored === null ? undefined : stored === 'true';
  } catch {
    return undefined;
  }
}

export async function loadDevelopmentUserProfile(): Promise<HomeUserProfile> {
  const localSmartMode = await readLocalSmartModePreference();
  const [profileResult, preferencesResult] = await Promise.all([
    getUserProfile(DEVELOPMENT_USER_ID),
    getUserPreferences(DEVELOPMENT_USER_ID),
  ]);

  return {
    displayName: profileResult.state === 'available' ? profileResult.data.displayName : FALLBACK_DISPLAY_NAME,
    smartModeEnabled: preferencesResult.state === 'available'
      ? preferencesResult.data.smartModeEnabled
      : profileResult.state === 'available'
        ? profileResult.data.smartModeEnabled
        : localSmartMode ?? true,
    source: profileResult.state === 'available' || preferencesResult.state === 'available' ? 'backend' : 'local',
    userId: profileResult.state === 'available' ? profileResult.data.userId : DEVELOPMENT_USER_ID,
  };
}

export async function saveSmartModePreference(enabled: boolean): Promise<void> {
  await Promise.allSettled([
    AsyncStorage.setItem(SMART_MODE_PREFERENCE_KEY, String(enabled)),
    updateUserPreferences(DEVELOPMENT_USER_ID, { smartModeEnabled: enabled }),
  ]);
}
