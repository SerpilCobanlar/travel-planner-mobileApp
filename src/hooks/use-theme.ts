/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { usePreferences } from '@/context/PreferencesContext';

export function useTheme() {
  const { activeTheme } = usePreferences();
  return Colors[activeTheme];
}
