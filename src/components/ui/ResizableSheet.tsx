import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

const SPRING = { damping: 22, stiffness: 220, mass: 0.6 };

/** While the keyboard is open the sheet takes at most this share of the space above it. */
const KEYBOARD_SHEET_RATIO = 0.6;

/** Animate the sheet to a height from outside (e.g. "show on map" half-opens it). */
export function snapSheetTo(height: SharedValue<number>, target: number) {
  height.set(withSpring(target, SPRING));
}

/**
 * The height the sheet actually shows. While the keyboard covers the bottom
 * (`bottomInset` > 0) it sits on top of the keyboard and shrinks so the
 * background above stays visible. Overlays can use it to follow the sheet.
 */
export function getVisibleSheetHeight(
  height: number,
  bottomInset: number,
  containerHeight: number,
  collapsedHeight: number
) {
  'worklet';
  if (bottomInset <= 0) return height;
  const available = containerHeight - bottomInset;
  return Math.max(collapsedHeight, Math.min(height, available * KEYBOARD_SHEET_RATIO));
}

interface ResizableSheetProps {
  /** Height of the area the sheet lives in (from onLayout). 0 until measured. */
  containerHeight: number;
  /** Sheet height when collapsed: only the header stays visible. */
  collapsedHeight: number;
  /** Owned by the parent so overlays (e.g. a card above the sheet) can follow it. */
  height: SharedValue<number>;
  /** Pixels covered at the bottom (e.g. by the keyboard); the sheet sits above them. */
  bottomInset?: SharedValue<number>;
  /** Drag area at the top of the sheet (handle, title...). */
  header: React.ReactNode;
  children: React.ReactNode;
  accessibilityLabel?: string;
}

/**
 * Bottom sheet over a full-size background (e.g. a map) that snaps to
 * collapsed / half / full. Dragging happens on the header only, so the
 * content can scroll freely.
 */
export function ResizableSheet({
  containerHeight,
  collapsedHeight,
  height,
  bottomInset,
  header,
  children,
  accessibilityLabel,
}: ResizableSheetProps) {
  const theme = useTheme();
  const dragStart = useSharedValue(0);

  // Open half-way once the container is measured (and again if it resizes).
  useEffect(() => {
    if (containerHeight > 0) height.set(containerHeight / 2);
  }, [containerHeight, height]);

  const pan = Gesture.Pan()
    .onStart(() => {
      dragStart.set(height.get());
    })
    .onUpdate((event) => {
      const next = dragStart.get() - event.translationY;
      height.set(Math.min(containerHeight, Math.max(collapsedHeight, next)));
    })
    .onEnd((event) => {
      const snaps = [collapsedHeight, containerHeight / 2, containerHeight];
      // Project a little along the fling so a quick swipe goes to the next snap.
      const projected = height.get() - event.velocityY * 0.15;
      let target = snaps[0];
      for (const snap of snaps) {
        if (Math.abs(snap - projected) < Math.abs(target - projected)) target = snap;
      }
      height.set(withSpring(target, SPRING));
    });

  const sheetStyle = useAnimatedStyle(() => {
    const inset = bottomInset ? bottomInset.get() : 0;
    return {
      bottom: inset,
      height: getVisibleSheetHeight(height.get(), inset, containerHeight, collapsedHeight),
    };
  });

  return (
    <Animated.View
      style={[styles.sheet, { backgroundColor: theme.background, shadowColor: '#000' }, sheetStyle]}
    >
      <GestureDetector gesture={pan}>
        <View style={styles.header} accessibilityRole="adjustable" accessibilityLabel={accessibilityLabel}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          {header}
        </View>
      </GestureDetector>
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
});
