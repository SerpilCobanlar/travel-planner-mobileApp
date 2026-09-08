import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function CreateTripScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dates are already YYYY-MM-DD from DatePickerField

  const handleCreate = async () => {
    setError(null);

    if (!user) {
      setError(t('auth.error'));
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2) {
      setError(t('trip.titleTooShort'));
      return;
    }

    if (!startDate || !endDate) {
      setError(t('trip.invalidDate'));
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError(t('trip.endDateBeforeStart'));
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('trips')
        .insert({
          owner_id: user.id,
          title: trimmedTitle,
          description: description.trim() || null,
          start_date: startDate,
          end_date: endDate,
          is_public: isPublic,
        });

      if (insertError) throw insertError;

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('CREATE_TRIP_ERROR', err);
      setError(t('trip.createError') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable safeArea>
      <Stack.Screen
        options={{
          title: t('trip.createTrip'),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -8 }}>
              <IconSymbol name="chevron.left" size={28} color={theme.primary} />
              <ThemedText style={{ color: theme.primary, fontSize: 17 }}>{t('trip.back')}</ThemedText>
            </TouchableOpacity>
          )
        }}
      />
      <View style={styles.container}>
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
            <ThemedText style={styles.errorText} themeColor="error">
              {error}
            </ThemedText>
          </View>
        )}

        <ThemedText style={styles.label}>{t('trip.title')}</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('trip.titlePlaceholder')}
          maxLength={100}
          style={styles.input}
        />

        <ThemedText style={styles.label}>{t('trip.description')}</ThemedText>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('trip.descPlaceholder')}
          multiline
          numberOfLines={3}
          style={[styles.input, styles.textArea]}
        />

        <View style={styles.row}>
          <DatePickerField
            label={t('trip.startDate')}
            value={startDate}
            onChange={setStartDate}
          />
          <View style={{ width: 16 }} />
          <DatePickerField
            label={t('trip.endDate')}
            value={endDate}
            onChange={setEndDate}
          />
        </View>

        <ToggleRow
          labelFalse={t('trip.isPrivate')}
          labelTrue={t('trip.isPublic')}
          value={isPublic}
          onValueChange={setIsPublic}
        />

        <Button
          title={loading ? t('common.loading') : t('trip.createTrip')}
          onPress={handleCreate}
          disabled={loading}
          style={styles.submitButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    padding: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfCol: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
});
