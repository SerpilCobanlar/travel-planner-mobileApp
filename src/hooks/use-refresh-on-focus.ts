import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Refetch when a screen comes back into focus (not on first mount, where the
 * query already fetches). Keeps lists fresh after changes made by trip members
 * on other devices; changes made in this app are handled by query invalidation.
 */
export function useRefreshOnFocus(refetch: () => unknown) {
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
}
