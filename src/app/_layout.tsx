import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, StyleSheet, Text, useColorScheme, useWindowDimensions, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/providers/auth-provider';

const ACTIVE_COLOR = '#69E08C';
const INACTIVE_COLOR = '#64758A';

function TabIcon({ color, focused, name, size }: { color: ColorValue; focused: boolean; name: SymbolViewProps['name']; size: number }) {
  return <View style={styles.iconContainer}>{focused && <View style={styles.activeIndicator} />}<SymbolView name={name} size={size} tintColor={color} fallback={<Text style={[styles.iconFallback, { color }]}>●</Text>} /></View>;
}

function TabLabel({ color, compact, label }: { color: ColorValue; compact: boolean; label: string }) {
  return <Text adjustsFontSizeToFit minimumFontScale={0.62} numberOfLines={1} style={[styles.tabLabel, compact && styles.tabLabelCompact, { color }]}>{label}</Text>;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 430;
  const iconSize = compact ? 18 : 20;
  const tabBarBaseHeight = Platform.OS === 'web' ? (compact ? 54 : 57) : (compact ? 52 : 55);
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Tabs screenOptions={{
          headerShown: false,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarAllowFontScaling: false,
          tabBarHideOnKeyboard: true,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          tabBarItemStyle: styles.tabItem,
          tabBarBackground: () => <GlassView colorScheme="light" glassEffectStyle="regular" style={StyleSheet.absoluteFill} tintColor="rgba(225, 231, 238, 0.94)" />,
          tabBarStyle: [styles.tabBar, compact && styles.tabBarCompact, {
            bottom: Math.max(insets.bottom, Platform.OS === 'web' ? 10 : 8),
            height: tabBarBaseHeight,
            paddingBottom: Platform.OS === 'web' ? 6 : 4,
          }],
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Home" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'house.fill', android: 'home', web: 'home' }} size={iconSize} /> }} />
        <Tabs.Screen name="weather" options={{ title: 'Weather', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Weather" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'cloud.sun.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' }} size={iconSize} /> }} />
        <Tabs.Screen name="sports" options={{ title: 'Sports', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Sports" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'basketball.fill', android: 'sports_basketball', web: 'sports_basketball' }} size={iconSize} /> }} />
        <Tabs.Screen name="entertainment" options={{ title: 'Entertainment', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Entertainment" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'film.fill', android: 'movie', web: 'movie' }} size={iconSize} /> }} />
        <Tabs.Screen name="finance" options={{ title: 'Finance', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Finance" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }} size={iconSize} /> }} />
        <Tabs.Screen name="music" options={{ title: 'Music', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Music" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'music.note', android: 'music_note', web: 'music_note' }} size={iconSize} /> }} />
        <Tabs.Screen name="traffic" options={{ title: 'Traffic', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Traffic" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'car.fill', android: 'directions_car', web: 'directions_car' }} size={iconSize} /> }} />
        <Tabs.Screen name="my-locker" options={{ title: 'My Locker', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="My Locker" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'tshirt.fill', android: 'checkroom', web: 'checkroom' }} size={iconSize} /> }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore', href: null }} />
        <Tabs.Screen name="game-details" options={{ title: 'Game Details', href: null }} />
        <Tabs.Screen name="sign-in" options={{ title: 'Account', href: null, tabBarStyle: { display: 'none' } }} />
        </Tabs>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#E1E7EE',
    borderColor: 'rgba(70, 92, 118, 0.12)',
    borderRadius: 22,
    borderTopWidth: 1,
    borderWidth: 1,
    elevation: 8,
    left: 12,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingTop: 4,
    position: 'absolute',
    right: 12,
    shadowColor: '#465C76',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  tabBarCompact: { paddingHorizontal: 1, paddingTop: 3 },
  tabItem: { marginHorizontal: 0, marginVertical: 0, minWidth: 0, paddingHorizontal: 0 },
  tabLabel: { fontSize: 10, fontWeight: '700', lineHeight: 12, maxWidth: '100%', textAlign: 'center', textDecorationLine: 'none' },
  tabLabelCompact: { fontSize: 9, lineHeight: 10 },
  iconContainer: { alignItems: 'center', height: 22, justifyContent: 'center', position: 'relative', width: 34 },
  activeIndicator: { backgroundColor: '#69E08C', borderRadius: 2, height: 2, position: 'absolute', top: -4, width: 18 },
  iconFallback: { fontSize: 15, lineHeight: 18 },
});
