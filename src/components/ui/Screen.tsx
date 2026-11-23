import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  safeArea?: boolean;
}

export function Screen({
  children,
  scrollable = false,
  padded = true,
  style,
  safeArea = true,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[
      styles.container,
      padded && styles.padded,
      style,
    ]}>
      {children}
    </View>
  );

  const wrapperStyle = [
    styles.wrapper,
    {
      backgroundColor: theme.background,
      paddingTop: safeArea ? insets.top : 0,
      paddingBottom: safeArea ? insets.bottom : 0,
    }
  ];

  if (scrollable) {
    return (
      <View style={wrapperStyle}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={wrapperStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollContent: {
    flexGrow: 1,
  }
});
