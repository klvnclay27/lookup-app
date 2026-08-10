import AsyncStorage from '@react-native-async-storage/async-storage';

import { getUserProfile, updateUserProfile } from '@/services/backend-client';

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
  const backendResult = await getUserProfile(DEVELOPMENT_USER_ID);

  if (backendResult.state === 'available') {
    return {
      displayName: backendResult.data.displayName,
      smartModeEnabled: backendResult.data.smartModeEnabled,
      source: 'backend',
      userId: backendResult.data.userId,
    };
  }

  return {
    displayName: FALLBACK_DISPLAY_NAME,
    smartModeEnabled: localSmartMode ?? true,
    source: 'local',
    userId: DEVELOPMENT_USER_ID,
  };
}

export async function saveSmartModePreference(enabled: boolean): Promise<void> {
  await Promise.allSettled([
    AsyncStorage.setItem(SMART_MODE_PREFERENCE_KEY, String(enabled)),
    updateUserProfile(DEVELOPMENT_USER_ID, { smartModeEnabled: enabled }),
  ]);
}
