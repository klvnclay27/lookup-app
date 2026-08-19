import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCurrentUserPreferences, getCurrentUserProfile, updateCurrentUserPreferences } from '@/services/backend-client';
import { supabase } from '@/services/supabase';

const SIGNED_OUT_SMART_MODE_PREFERENCE_KEY = 'lookup.dailyIntelligence.enabled.v1';
const FALLBACK_DISPLAY_NAME = 'LookUP User';

export type HomeUserProfile = {
  displayName: string;
  smartModeEnabled: boolean;
  source: 'backend' | 'local';
  userId: string;
};

function smartModePreferenceKey(userId: string | null): string {
  return userId
    ? `lookup.dailyIntelligence.${userId}.enabled.v1`
    : SIGNED_OUT_SMART_MODE_PREFERENCE_KEY;
}

async function getAuthenticatedUserId(): Promise<string | null | undefined> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return undefined;
  }
}

async function readLocalSmartModePreference(userId: string | null): Promise<boolean | undefined> {
  try {
    const stored = await AsyncStorage.getItem(smartModePreferenceKey(userId));
    return stored === null ? undefined : stored === 'true';
  } catch {
    return undefined;
  }
}

export async function loadHomeUserProfile(): Promise<HomeUserProfile> {
  const authenticatedUserId = await getAuthenticatedUserId();
  const localSmartMode = authenticatedUserId === undefined
    ? undefined
    : await readLocalSmartModePreference(authenticatedUserId);

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
    displayName: profileResult.state === 'available'
      ? profileResult.data.username?.trim() || profileResult.data.displayName || FALLBACK_DISPLAY_NAME
      : FALLBACK_DISPLAY_NAME,
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
  const authenticatedUserId = await getAuthenticatedUserId();
  const operations: Promise<unknown>[] = [updateCurrentUserPreferences({ smartModeEnabled: enabled })];
  if (authenticatedUserId !== undefined) {
    operations.push(AsyncStorage.setItem(smartModePreferenceKey(authenticatedUserId), String(enabled)));
  }
  await Promise.allSettled(operations);
}
