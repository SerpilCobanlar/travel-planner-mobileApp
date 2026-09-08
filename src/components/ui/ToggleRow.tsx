import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius } from '@/constants/theme';

interface ToggleRowProps {
  labelFalse: string;
  labelTrue: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ToggleRow({ labelFalse, labelTrue, value, onValueChange }: ToggleRowProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <TouchableOpacity 
        style={[styles.option, !value && [styles.selected, { backgroundColor: theme.primary }]]} 
        onPress={() => onValueChange(false)}
        activeOpacity={0.8}
      >
        <ThemedText style={[styles.text, !value && { color: '#FFFFFF' }]}>{labelFalse}</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.option, value && [styles.selected, { backgroundColor: theme.primary }]]} 
        onPress={() => onValueChange(true)}
        activeOpacity={0.8}
      >
        <ThemedText style={[styles.text, value && { color: '#FFFFFF' }]}>{labelTrue}</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 44,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginVertical: 16,
  },
  option: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  selected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontWeight: '500',
  }
});
