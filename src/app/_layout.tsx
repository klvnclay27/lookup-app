import { DarkTheme, DefaultTheme, ThemeProvider, Tabs, usePathname } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MAX_APP_SHELL_WIDTH } from '@/constants/layout';
import { AuthProvider } from '@/providers/auth-provider';

const ACTIVE_COLOR = '#69E08C';
const INACTIVE_COLOR = '#64758A';

function TabIcon({ color, focused, name, size }: { color: ColorValue; focused: boolean; name: SymbolViewProps['name']; size: number }) {
  return <View style={styles.iconContainer}>{focused && <View style={styles.activeIndicator} />}<SymbolView name={name} size={size} tintColor={color} fallback={<Text style={[styles.iconFallback, { color }]}>●</Text>} /></View>;
}

function TabLabel({ color, compact, label }: { color: ColorValue; compact: boolean; label: string }) {
  const isWeb = Platform.OS === 'web';
  return (
    <Text
      adjustsFontSizeToFit={!isWeb}
      minimumFontScale={0.62}
      numberOfLines={1}
      style={[
        styles.tabLabel,
        compact && styles.tabLabelCompact,
        isWeb && styles.tabLabelWeb,
        isWeb && compact && styles.tabLabelCompactWeb,
        { color },
      ]}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [tabBarCollapsed, setTabBarCollapsed] = useState(false);
  const tabBarProgress = useRef(new Animated.Value(1)).current;
  const compact = width <= 430;
  const iconSize = compact ? 18 : 20;
  const tabBarBaseHeight = Platform.OS === 'web' ? (compact ? 72 : 57) : (compact ? 52 : 55);
  const tabBarSideInset = Math.max(12, (width - MAX_APP_SHELL_WIDTH) / 2);
  const tabBarBottom = Math.max(insets.bottom, Platform.OS === 'web' ? 10 : 8);
  const tabBarControlsVisible = pathname !== '/sign-in';
  const hiddenTabOffset = tabBarBaseHeight + tabBarBottom + 24;

  const collapseTabBar = () => {
    setTabBarCollapsed(true);
    Animated.timing(tabBarProgress, {
      duration: 220,
      toValue: 0,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const restoreTabBar = () => {
    Animated.timing(tabBarProgress, {
      duration: 220,
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) setTabBarCollapsed(false);
    });
  };

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
          tabBarItemStyle: [styles.tabItem, Platform.OS === 'web' && styles.tabItemWeb, Platform.OS === 'web' && compact && styles.tabItemCompactWeb],
          tabBarLabelPosition: 'below-icon',
          tabBarBackground: () => <GlassView colorScheme="light" glassEffectStyle="regular" style={StyleSheet.absoluteFill} tintColor="rgba(225, 231, 238, 0.94)" />,
          tabBarStyle: [styles.tabBar, compact && styles.tabBarCompact, {
            bottom: tabBarBottom,
            height: tabBarBaseHeight,
            left: tabBarSideInset,
            opacity: tabBarProgress,
            paddingBottom: Platform.OS === 'web' ? (compact ? 10 : 6) : 4,
            right: tabBarSideInset,
            transform: [{
              translateY: tabBarProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [hiddenTabOffset, 0],
              }),
            }],
          }],
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Home" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'house.fill', android: 'home', web: 'home' }} size={iconSize} /> }} />
        <Tabs.Screen name="weather" options={{ title: 'Weather', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Weather" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'cloud.sun.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' }} size={iconSize} /> }} />
        <Tabs.Screen name="sports" options={{ title: 'Sports', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Sports" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'basketball.fill', android: 'sports_basketball', web: 'sports_basketball' }} size={iconSize} /> }} />
        <Tabs.Screen name="entertainment" options={{ title: 'Media', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Media" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'film.fill', android: 'movie', web: 'movie' }} size={iconSize} /> }} />
        <Tabs.Screen name="finance" options={{ title: 'Finance', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Finance" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }} size={iconSize} /> }} />
        <Tabs.Screen name="music" options={{ title: 'Rhythm', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Rhythm" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'music.note', android: 'music_note', web: 'music_note' }} size={iconSize} /> }} />
        <Tabs.Screen name="traffic" options={{ title: 'Traffic', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="Traffic" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'car.fill', android: 'directions_car', web: 'directions_car' }} size={iconSize} /> }} />
        <Tabs.Screen name="my-locker" options={{ title: 'My Locker', tabBarLabel: ({ color }) => <TabLabel color={color} compact={compact} label="My Locker" />, tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name={{ ios: 'tshirt.fill', android: 'checkroom', web: 'checkroom' }} size={iconSize} /> }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore', href: null }} />
        <Tabs.Screen name="game-details" options={{ title: 'Game Details', href: null }} />
        <Tabs.Screen name="social-hub" options={{ title: 'Social Hub', href: null }} />
        <Tabs.Screen name="sign-in" options={{ title: 'Account', href: null, tabBarStyle: { display: 'none' } }} />
        </Tabs>
        {tabBarControlsVisible ? tabBarCollapsed ? (
          <Animated.View style={[styles.restoreControlPosition, {
            bottom: tabBarBottom,
            opacity: tabBarProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          }]}>
            <Pressable accessibilityLabel="Show bottom navigation" accessibilityRole="button" onPress={restoreTabBar} style={({ pressed }) => [styles.restoreControl, pressed && styles.controlPressed]}>
              <SymbolView name={{ ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }} size={16} tintColor="#40536A" />
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable accessibilityLabel="Hide bottom navigation" accessibilityRole="button" onPress={collapseTabBar} style={({ pressed }) => [styles.collapseControl, {
            bottom: tabBarBottom + tabBarBaseHeight + 4,
            right: tabBarSideInset + 8,
          }, pressed && styles.controlPressed]}>
            <SymbolView name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }} size={14} tintColor="#40536A" />
          </Pressable>
        ) : null}
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
  tabBarCompact: { paddingHorizontal: 1, paddingTop: Platform.OS === 'web' ? 5 : 3 },
  tabItem: { flexBasis: 0, flexGrow: 1, flexShrink: 1, marginHorizontal: 0, marginVertical: 0, minWidth: 0, paddingHorizontal: 0, width: '12.5%' },
  tabItemWeb: { paddingHorizontal: 1 },
  tabItemCompactWeb: { minHeight: 56 },
  tabLabel: { fontSize: 10, fontWeight: '700', lineHeight: 12, maxWidth: '100%', textAlign: 'center', textDecorationLine: 'none' },
  tabLabelCompact: { fontSize: 8, lineHeight: 12, minWidth: 40 },
  tabLabelWeb: { minHeight: 12, overflow: 'visible' },
  tabLabelCompactWeb: { lineHeight: 14, minHeight: 14 },
  iconContainer: { alignItems: 'center', height: 22, justifyContent: 'center', position: 'relative', width: 34 },
  activeIndicator: { backgroundColor: '#69E08C', borderRadius: 2, height: 2, position: 'absolute', top: -4, width: 18 },
  iconFallback: { fontSize: 15, lineHeight: 18 },
  collapseControl: { alignItems: 'center', backgroundColor: 'rgba(225, 231, 238, 0.96)', borderColor: 'rgba(70, 92, 118, 0.14)', borderRadius: 12, borderWidth: 1, elevation: 5, height: 24, justifyContent: 'center', position: 'absolute', shadowColor: '#465C76', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, width: 32, zIndex: 20 },
  restoreControlPosition: { alignItems: 'center', left: 0, position: 'absolute', right: 0, zIndex: 20 },
  restoreControl: { alignItems: 'center', backgroundColor: 'rgba(225, 231, 238, 0.97)', borderColor: 'rgba(70, 92, 118, 0.16)', borderRadius: 14, borderWidth: 1, elevation: 6, height: 28, justifyContent: 'center', shadowColor: '#465C76', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 9, width: 48 },
  controlPressed: { opacity: 0.72 },
});
