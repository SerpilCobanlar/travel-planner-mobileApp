import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius } from '@/constants/theme';
import { IconSymbol } from './IconSymbol';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
}

export function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [show, setShow] = useState(false);

  let parsedDate = new Date();
  if (value) {
    const [y, m, d] = value.split('-').map(Number);
    parsedDate = new Date(y, m - 1, d);
  }

  const handleConfirm = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
  };

  const displayDate = value ? value.split('-').reverse().join('.') : 'DD.MM.YYYY';

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      
      {Platform.OS === 'ios' ? (
        <View style={[styles.iosContainer, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <DateTimePicker
            value={parsedDate}
            mode="date"
            display="default"
            onChange={handleConfirm}
            themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
            style={styles.iosPicker}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity 
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]} 
            onPress={() => setShow(true)}
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
