import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Tabs>
        <Tabs.Screen name="index" options={{title: "Home"}} />
        <Tabs.Screen name="explore" options={{title: "Explore"}} />
        <Tabs.Screen name="weather" options={{title: "Weather"}} />
        <Tabs.Screen name="sports" options={{title: "Sports"}} />
        <Tabs.Screen name="entertainment" options={{title: "Entertainment"}} />
         <Tabs.Screen name="finance" options={{title: "Finance"}} />
         <Tabs.Screen name="music" options={{title: "Music", tabBarLabel: "Music"}} />
      </Tabs>
    </ThemeProvider>
  );
}
