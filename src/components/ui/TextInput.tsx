import React, { useState } from 'react';
import { 
  TextInput as RNTextInput, 
  TextInputProps as RNTextInputProps, 
  StyleSheet, 
  View,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';
import { BorderRadius } from '@/constants/theme';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
}

export function TextInput({ 
  label, 
  error, 
  secureTextEntry, 
  style, 
  ...props 
}: TextInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={styles.label} type="smallBold">
          {label}
        </ThemedText>
      )}
      
      <View style={[
        styles.inputContainer,
        props.multiline && styles.multilineContainer,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: error ? theme.error : (isFocused ? theme.primary : theme.border),
        }
      ]}>
        <RNTextInput
          style={[
            styles.input,
            props.multiline && styles.multilineInput,
            { color: theme.text },
            style
          ] as any}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <ThemedText type="small" themeColor="primary">
              {isPasswordVisible ? 'Gizle' : 'Göster'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <ThemedText style={[styles.error, { color: theme.error }]} type="small">
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  multilineContainer: {
    height: 'auto',
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  multilineInput: {
    height: 'auto',
    minHeight: 76, // 100 - 24 padding
    textAlignVertical: 'top',
  },
  eyeIcon: {
    padding: 4,
  },
  error: {
    marginTop: 4,
  }
});
