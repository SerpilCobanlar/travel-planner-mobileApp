import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, SafeAreaView } from 'react-native';
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

  const content = (
    <View style={[
      styles.container,
      padded && styles.padded,
      style,
    ]}>
      {children}
    </View>
  );

  const Wrapper = safeArea ? SafeAreaView : View;
  
  return (
    <Wrapper style={[styles.wrapper, { backgroundColor: theme.background }]}>
      {scrollable ? (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </Wrapper>
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
