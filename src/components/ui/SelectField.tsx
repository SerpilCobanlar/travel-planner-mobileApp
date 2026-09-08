import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius } from '@/constants/theme';
import { IconSymbol } from './IconSymbol';

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SelectField({ label, value, options, onChange, placeholder = 'Seçiniz', disabled }: SelectFieldProps) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      
      <TouchableOpacity 
        style={[
          styles.input, 
          { borderColor: theme.border, backgroundColor: disabled ? theme.backgroundSelected : theme.backgroundElement },
          disabled && { opacity: 0.6 }
        ]} 
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <ThemedText style={{ color: selectedOption ? theme.text : theme.textSecondary }}>
          {selectedOption ? selectedOption.label : placeholder}
        </ThemedText>
        <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
      
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText type="subtitle">{label}</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <ThemedText style={{ color: theme.primary, fontWeight: 'bold' }}>Kapat</ThemedText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.optionRow, { borderBottomColor: theme.border }]}
                  onPress={() => handleSelect(item.value)}
                >
                  <ThemedText style={[
                    item.value === value && { color: theme.primary, fontWeight: 'bold' }
                  ]}>
                    {item.label}
                  </ThemedText>
                </TouchableOpacity>
              )}
            />
            <SafeAreaView />
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  }
});
