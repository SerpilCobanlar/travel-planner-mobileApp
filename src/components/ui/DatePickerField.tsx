import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { usePreferences } from '@/context/PreferencesContext';
import { BorderRadius } from '@/constants/theme';
import { IconSymbol } from './IconSymbol';

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
}

export function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const theme = useTheme();
  const { activeTheme } = usePreferences();
  const [show, setShow] = useState(false);

  let parsedDate = new Date();
  if (value) {
    const [y, m, d] = value.split('-').map(Number);
    parsedDate = new Date(y, m - 1, d);
  }

  const handleConfirm = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    // Android also calls onChange when the dialog is cancelled ('dismissed'),
    // passing the current value; only a confirmed selection should update.
    if (event.type === 'set' && selectedDate) {
      onChange(formatDate(selectedDate));
    }
  };

  // iOS renders an inline picker that already shows a date, so an empty value
  // would look selected without being set. Show a placeholder until the user taps it.
  const handlePlaceholderPress = () => {
    if (Platform.OS === 'ios') {
      onChange(formatDate(new Date()));
    } else {
      setShow(true);
    }
  };

  const displayDate = value ? value.split('-').reverse().join('.') : 'DD.MM.YYYY';

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>

      {Platform.OS === 'ios' && value ? (
        <View style={[styles.iosContainer, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <DateTimePicker
            value={parsedDate}
            mode="date"
            display="default"
            onChange={handleConfirm}
            themeVariant={activeTheme}
            style={styles.iosPicker}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
            onPress={handlePlaceholderPress}
            activeOpacity={0.7}
          >
            <ThemedText style={{ color: value ? theme.text : theme.textSecondary }}>
              {displayDate}
            </ThemedText>
            <IconSymbol name="calendar" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          {show && (
            <DateTimePicker
              value={parsedDate}
              mode="date"
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
  label: {
    marginBottom: 8,
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
  iosContainer: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  iosPicker: {
    height: 48,
  }
});
