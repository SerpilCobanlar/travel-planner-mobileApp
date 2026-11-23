import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { usePreferences } from '@/context/PreferencesContext';
import { BorderRadius } from '@/constants/theme';
import { parseTime, toTimeString } from '@/lib/date';
import { IconSymbol } from './IconSymbol';

interface TimePickerFieldProps {
  label: string;
  value: string | null; // HH:mm
  onChange: (timeStr: string | null) => void;
  allowClear?: boolean;
}

export function TimePickerField({ label, value, onChange, allowClear = true }: TimePickerFieldProps) {
  const theme = useTheme();
  const { activeTheme } = usePreferences();
  const [show, setShow] = useState(false);

  const parsedTime = parseTime(value ?? '12:00');

  const handleConfirm = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChange(toTimeString(selectedDate));
    }
  };

  // iOS renders an inline picker that already shows a time, so an empty value
  // would look selected without being set. Show a placeholder until the user taps it.
  const handlePlaceholderPress = () => {
    if (Platform.OS === 'ios') {
      onChange('12:00');
    } else {
      setShow(true);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {allowClear && value && (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
             <ThemedText type="smallBold" style={{ color: theme.error }}>Temizle</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      {Platform.OS === 'ios' && value ? (
        <View style={styles.iosRow}>
          <View style={[styles.iosContainer, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <DateTimePicker
              value={parsedTime}
              mode="time"
              display="default"
              onChange={handleConfirm}
              themeVariant={activeTheme}
              style={styles.iosPicker}
            />
          </View>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
            onPress={handlePlaceholderPress}
            activeOpacity={0.7}
          >
            <ThemedText style={{ color: value ? theme.text : theme.textSecondary }}>
              {value || 'HH:mm'}
            </ThemedText>
            <IconSymbol name="clock" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          {show && (
            <DateTimePicker
              value={parsedTime}
              mode="time"
              display="default"
              onChange={handleConfirm}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iosRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iosContainer: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  iosPicker: {
    height: 48,
    width: 90,
  }
});
