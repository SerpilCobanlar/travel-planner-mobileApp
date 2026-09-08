import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius } from '@/constants/theme';
import { IconSymbol } from './IconSymbol';

interface TimePickerFieldProps {
  label: string;
  value: string | null; // HH:mm
  onChange: (timeStr: string | null) => void;
  allowClear?: boolean;
}

export function TimePickerField({ label, value, onChange, allowClear = true }: TimePickerFieldProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [show, setShow] = useState(false);

  let parsedTime = new Date();
  if (value) {
    const [h, m] = value.split(':').map(Number);
    parsedTime.setHours(h, m, 0, 0);
  } else {
    parsedTime.setHours(12, 0, 0, 0);
  }

  const handleConfirm = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (event.type === 'set' && selectedDate) {
      const h = String(selectedDate.getHours()).padStart(2, '0');
      const m = String(selectedDate.getMinutes()).padStart(2, '0');
      onChange(`${h}:${m}`);
    } else if (event.type === 'dismiss') {
      // Do nothing
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
      
      {Platform.OS === 'ios' ? (
        <View style={styles.iosRow}>
          <View style={[styles.iosContainer, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <DateTimePicker
              value={parsedTime}
              mode="time"
              display="default"
              onChange={handleConfirm}
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              style={styles.iosPicker}
            />
          </View>
        </View>
      ) : (
        <>
          <TouchableOpacity 
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]} 
            onPress={() => setShow(true)}
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
