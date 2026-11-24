import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queries/client';
import * as SplashScreen from 'expo-splash-screen';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppLoader } from '@/components/ui/AppLoader';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/localization';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { activeTheme, isReady } = usePreferences();
  const { session, isLoading } = useAuth();
  const theme = useTheme();
  const { t } = useTranslation();
  const userId = session?.user.id;

  // Never show one account's cached trips to the next account.
  useEffect(() => {
    if (!userId) queryClient.clear();
  }, [userId]);

  if (isLoading || !isReady) {
    return <AppLoader />;
  }

  return (
    <ThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {/* Pushed screens (trips, days, plans, maps) show a native header with a
          back button; auth and tab screens hide it. Screens set their own title. */}
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primary,
          headerTitleStyle: { color: theme.text },
          headerShadowVisible: false,
          headerBackTitle: t('trip.back'),
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="trips/new" />
          <Stack.Screen name="trips/[id]" />
          <Stack.Screen name="trips/[id]/edit" />
          <Stack.Screen name="trips/[id]/days/[dayId]" />
          <Stack.Screen name="trips/[id]/days/[dayId]/map" />
          <Stack.Screen name="trips/[id]/days/[dayId]/new-item" />
          <Stack.Screen name="trips/[id]/days/[dayId]/items/[itemId]/edit" />
          <Stack.Screen name="trips/location-picker" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </PreferencesProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
