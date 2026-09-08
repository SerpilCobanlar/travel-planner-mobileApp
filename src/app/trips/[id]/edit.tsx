import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dates are in YYYY-MM-DD format from DatePickerField

  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (data) {
          setTitle(data.title);
          setDescription(data.description || '');
          setStartDate(data.start_date);
          setEndDate(data.end_date);
          setIsPublic(data.is_public ?? false);
        }
      } catch (err: any) {
        console.error('FETCH_TRIP_EDIT_ERROR', err);
        setError(t('trip.fetchError'));
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id, t]);

  // No need for parseDate as DatePickerField outputs YYYY-MM-DD

  const handleUpdate = async () => {
    if (saving) return;
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

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          title: trimmedTitle,
          description: description.trim() || null,
          start_date: startDate,
          end_date: endDate,
          is_public: isPublic,
        })
        .eq('id', id as string);

      if (updateError) {
        if (updateError.message.includes('DATE_RANGE_REJECTED_HAS_ITEMS')) {
          throw new Error(t('trip.dateRangeRejectedItems'));
        }
        throw updateError;
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/trips/${id}`);
      }
    } catch (err: any) {
      if (err.message !== t('trip.dateRangeRejectedItems')) {
        console.error('UPDATE_TRIP_ERROR', err);
      }
      setError(err.message || t('trip.updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen safeArea>
        <Stack.Screen options={{ title: t('trip.editTrip'), headerBackTitle: t('trip.cancel') }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable safeArea>
      <Stack.Screen options={{ title: t('trip.editTrip'), headerBackTitle: t('trip.cancel') }} />
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
            title={saving ? t('common.loading') : t('trip.saveChanges')}
            onPress={handleUpdate}
            disabled={saving}
            style={styles.submitButton}
          />
        </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
