import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SocialHub } from '@/components/social-hub';
import { MAX_APP_SHELL_WIDTH, pageHorizontalPadding } from '@/constants/layout';

export default function SocialHubScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + 140,
          paddingHorizontal: pageHorizontalPadding(width),
          paddingTop: Math.max(insets.top, 20) + 18,
        },
      ]}>
      <View style={styles.pageHeader}>
        <Pressable accessibilityLabel="Back to Entertainment" accessibilityRole="button" onPress={() => router.replace('/entertainment')} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Entertainment</Text>
        </Pressable>
        <Text style={styles.context}>ENTERTAINMENT · SOCIAL</Text>
      </View>
      <SocialHub />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#0B0E12', flex: 1 },
  content: { alignSelf: 'center', maxWidth: MAX_APP_SHELL_WIDTH, width: '100%' },
  pageHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#151D25', borderColor: '#293641', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 12, paddingVertical: 8 },
  backArrow: { color: '#69E08C', fontSize: 20, lineHeight: 18 },
  backText: { color: '#E8EEF3', fontSize: 11, fontWeight: '900' },
  context: { color: '#667585', fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  pressed: { opacity: 0.7 },
});
