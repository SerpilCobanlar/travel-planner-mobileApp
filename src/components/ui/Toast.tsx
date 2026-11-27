import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/use-theme';

export interface ToastMessage {
  title: string;
  description?: string;
  icon?: IconSymbolName;
}

/** Holds the current toast and hides it after `duration` ms. */
export function useToast(duration = 2000) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const show = useCallback(
    (message: ToastMessage) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(message);
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  return { toast, show };
}

interface ToastProps {
  toast: ToastMessage | null;
  /** Distance from the bottom of the screen (e.g. to sit above a bottom button). */
  bottom?: number;
}

/** Small non-blocking message that slides up from the bottom and fades away. */
export function Toast({ toast, bottom = 24 }: ToastProps) {
  const theme = useTheme();
  if (!toast) return null;

  return (
    <View style={[styles.wrapper, { bottom }]} pointerEvents="none">
      <Animated.View
        entering={FadeInDown.duration(200)}
        exiting={FadeOutDown.duration(200)}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.toast, { backgroundColor: theme.text }]}
      >
        {toast.icon && <IconSymbol name={toast.icon} size={20} color={theme.background} />}
        <View style={styles.texts}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            {toast.title}
          </ThemedText>
          {toast.description ? (
            <ThemedText type="small" style={[styles.description, { color: theme.background }]}>
              {toast.description}
            </ThemedText>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    maxWidth: 480,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  texts: {
    flexShrink: 1,
  },
  description: {
    opacity: 0.85,
    marginTop: 1,
  },
});
