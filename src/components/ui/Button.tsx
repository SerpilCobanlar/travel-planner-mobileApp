import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleProp
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';
import { BorderRadius } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({ 
  title, 
  variant = 'primary', 
  loading = false, 
  disabled, 
  style, 
  textStyle,
  ...props 
}: ButtonProps) {
  const theme = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.backgroundSelected;
    switch (variant) {
      case 'primary': return theme.primary;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return theme.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return theme.border;
    switch (variant) {
      case 'outline': return theme.primary;
      default: return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    switch (variant) {
      case 'primary': return '#FFFFFF'; // Force white text on primary button
      case 'outline': return theme.primary;
      case 'ghost': return theme.primary;
      default: return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <ThemedText 
          style={[
            styles.text, 
            { color: getTextColor() },
            textStyle
          ]} 
          type="default"
        >
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  text: {
    fontWeight: '600',
  }
});
