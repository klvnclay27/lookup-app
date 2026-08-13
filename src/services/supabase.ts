import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

// Invalid local placeholders keep the app bootable when auth is not configured.
// Auth operations return a clear configuration error before this client is used.
export const supabase = createClient(
  supabaseUrl || 'https://invalid.localhost',
  supabasePublishableKey || 'missing-publishable-key',
  {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
      persistSession: true,
    },
  },
);
