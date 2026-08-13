import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCurrentUserPreferences, getCurrentUserProfile, updateCurrentUserPreferences } from '@/services/backend-client';
import { supabase } from '@/services/supabase';

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

export async function loadHomeUserProfile(): Promise<HomeUserProfile> {
  const localSmartMode = await readLocalSmartModePreference();
  let authenticatedUserId: string | undefined;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    authenticatedUserId = sessionData.session?.user.id;
  } catch {
    authenticatedUserId = undefined;
  }

  if (!authenticatedUserId) {
    return {
      displayName: FALLBACK_DISPLAY_NAME,
      smartModeEnabled: localSmartMode ?? true,
      source: 'local',
      userId: 'local-user',
    };
  }

  const [profileResult, preferencesResult] = await Promise.all([
    getCurrentUserProfile(),
    getCurrentUserPreferences(),
  ]);

  return {
    displayName: profileResult.state === 'available' ? profileResult.data.displayName : FALLBACK_DISPLAY_NAME,
    smartModeEnabled: preferencesResult.state === 'available'
      ? preferencesResult.data.smartModeEnabled
      : profileResult.state === 'available'
        ? profileResult.data.smartModeEnabled
        : localSmartMode ?? true,
    source: profileResult.state === 'available' || preferencesResult.state === 'available' ? 'backend' : 'local',
    userId: profileResult.state === 'available' ? profileResult.data.userId : authenticatedUserId,
  };
}

export async function saveSmartModePreference(enabled: boolean): Promise<void> {
  await Promise.allSettled([
    AsyncStorage.setItem(SMART_MODE_PREFERENCE_KEY, String(enabled)),
    updateCurrentUserPreferences({ smartModeEnabled: enabled }),
  ]);
}
