import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppLoader } from '@/components/ui/AppLoader';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { activeTheme, isReady } = usePreferences();
  const { session, isLoading } = useAuth();

  if (isLoading || !isReady) {
    return <AppLoader />;
  }

  return (
    <ThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        {/* @ts-ignore - Some TS versions might not have Stack.Protected type natively if it's unstable or custom */}
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        {/* @ts-ignore */}
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="trips/new" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PreferencesProvider>
  );
}
