import React, { useEffect } from 'react';
import { Pressable, StyleProp, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { AnimatedStyle, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/use-theme';

const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;

interface DismissibleCardProps {
  /** Changing it resets the swipe (e.g. a different item was selected). */
  itemKey: string;
  onDismiss: () => void;
  closeLabel: string;
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
  children: React.ReactNode;
}

/** Wraps a card with a close (×) button and swipe-left/right to dismiss. */
export function DismissibleCard({ itemKey, onDismiss, closeLabel, style, children }: DismissibleCardProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.set(0);
  }, [itemKey, translateX]);

  const pan = Gesture.Pan()
    // Horizontal only, and only after a clear move, so taps still reach the card.
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      translateX.set(event.translationX);
    })
    .onEnd((event) => {
      const shouldDismiss =
        Math.abs(event.translationX) > DISMISS_DISTANCE || Math.abs(event.velocityX) > DISMISS_VELOCITY;
      if (shouldDismiss) {
        const direction = event.translationX + event.velocityX * 0.1 >= 0 ? 1 : -1;
        translateX.set(
          withTiming(direction * width, { duration: 180 }, (finished) => {
            if (finished) scheduleOnRN(onDismiss);
          })
        );
      } else {
        translateX.set(withSpring(0));
      }
    });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
    opacity: 1 - Math.min(Math.abs(translateX.get()) / width, 0.6),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[style, swipeStyle]}>
        {children}
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          style={[styles.closeButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        >
          <IconSymbol name="xmark" size={16} color={theme.text} />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -6,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
