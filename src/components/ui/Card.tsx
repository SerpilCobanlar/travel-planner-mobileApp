import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius } from '@/constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, style, ...props }: CardProps) {
  const theme = useTheme();

  return (
    <View 
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement },
        padded && styles.padded,
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: 16,
  },
  padded: {
    padding: 16,
  }
});
