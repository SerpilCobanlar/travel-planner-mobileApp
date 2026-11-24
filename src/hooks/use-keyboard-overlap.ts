import { useEffect, useRef } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * How many pixels of a view the keyboard covers, as an animated shared value
 * (0 when the keyboard is hidden).
 *
 * Android apps are edge-to-edge, so the window no longer shrinks when the
 * keyboard opens; a screen that wants content above the keyboard reads this.
 * Pass the view's bottom edge in window coordinates (from measureInWindow).
 * Uses React Native's own Keyboard events, so no extra native dependency.
 */
export function useKeyboardOverlap(viewBottomY: number) {
  const overlap = useSharedValue(0);
  const bottomY = useRef(viewBottomY);

  useEffect(() => {
    bottomY.current = viewBottomY;
  }, [viewBottomY]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const covered = Math.max(0, bottomY.current - event.endCoordinates.screenY);
      overlap.set(withTiming(covered, { duration: 220 }));
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      overlap.set(withTiming(0, { duration: 200 }));
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [overlap]);

  return overlap;
}
