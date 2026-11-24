/**
 * TanStack Query client (#33).
 *
 * React Native has no window focus event, so we tell TanStack Query that the
 * app is "focused" when it returns to the foreground; stale queries refetch then.
 */
import { AppState, Platform } from 'react-native';
import { focusManager, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is shared between screens; consider it fresh for 30s to avoid
      // refetching when navigating back and forth.
      staleTime: 30_000,
      retry: 1,
    },
  },
});

if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) => {
      handleFocus(state === 'active');
    });
    return () => subscription.remove();
  });
}
