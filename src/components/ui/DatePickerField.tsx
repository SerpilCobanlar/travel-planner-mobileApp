import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/localization';
import { usePreferences } from '@/context/PreferencesContext';
import { BorderRadius } from '@/constants/theme';
import { formatDayDate, parseDayDate, toDayString } from '@/lib/date';
import { IconSymbol } from './IconSymbol';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
}

export function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { activeTheme } = usePreferences();
  const [show, setShow] = useState(false);

  const parsedDate = value ? parseDayDate(value) : new Date();

  // onValueChange fires only for a confirmed selection; cancelling calls onDismiss.
  const handleValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    onChange(toDayString(selectedDate));
  };

  const handleDismiss = () => setShow(false);

  // iOS renders an inline picker that already shows a date, so an empty value
  // would look selected without being set. Show a placeholder until the user taps it.
  const handlePlaceholderPress = () => {
    if (Platform.OS === 'ios') {
      onChange(toDayString(new Date()));
    } else {
      setShow(true);
    }
  };

  const displayDate = value ? formatDayDate(value) : t('trip.datePlaceholder');

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>

      {Platform.OS === 'ios' && value ? (
        <View style={[styles.iosContainer, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <DateTimePicker
            value={parsedDate}
            mode="date"
            display="default"
            onValueChange={handleValueChange}
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
              onValueChange={handleValueChange}
              onDismiss={handleDismiss}
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
