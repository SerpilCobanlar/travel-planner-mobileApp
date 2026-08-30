import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useTranslation, TranslationKey } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabaseClient';

const ITEM_TYPES = [
  'place',
  'restaurant',
  'accommodation',
  'transport',
  'flight',
  'train',
  'bus',
  'car',
  'activity',
  'note',
];

export default function EditTripItemScreen() {
  const { id, dayId, itemId } = useLocalSearchParams<{ id: string; dayId: string; itemId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedType, setSelectedType] = useState('place');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [costStr, setCostStr] = useState('');
  const [currency, setCurrency] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (!id || !dayId || !itemId) return;

    try {
      setInitialLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('trip_items')
        .select('*')
        .eq('id', itemId)
        .eq('trip_id', id)
        .eq('trip_day_id', dayId)
        .single();

      if (fetchError || !data) {
        throw new Error('Geçersiz plan');
      }

      setSelectedType(data.type);
      setTitle(data.title);
      setNotes(data.notes || '');
      setCostStr(data.cost !== null ? data.cost.toString() : '');
      setCurrency(data.currency || '');

      if (data.start_at) {
        const d = new Date(data.start_at);
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        setStartTime(`${hh}:${mm}`);
      } else {
        setStartTime('');
      }

      if (data.end_at) {
        const d = new Date(data.end_at);
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        setEndTime(`${hh}:${mm}`);
      } else {
        setEndTime('');
      }

    } catch (err: any) {
      console.error('FETCH_TRIP_ITEM_ERROR', err);
      setError(t('item.fetchError'));
    } finally {
      setInitialLoading(false);
    }
  }, [id, dayId, itemId, t]);

  useFocusEffect(
    useCallback(() => {
      fetchItem();
    }, [fetchItem])
  );

  const handleUpdate = async () => {
    setError(null);

    // Validation
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 120) {
      setError(t('item.titleTooShort'));
      return;
    }

    let parsedCost: number | null = null;
    let finalCurrency: string | null = null;

    const trimmedCost = costStr.trim();
    if (trimmedCost) {
      const numCost = parseFloat(trimmedCost.replace(',', '.'));
      if (isNaN(numCost) || numCost < 0) {
        setError(t('item.negativeCost'));
        return;
      }
      parsedCost = numCost;

      const trimmedCurr = currency.trim().toUpperCase();
      if (trimmedCurr.length !== 3) {
        setError(t('item.invalidCurrency'));
        return;
      }
      finalCurrency = trimmedCurr;
    }

    const finalNotes = notes.trim() || null;

    // Time Validation
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    let validStartTime: string | null = null;
    let validEndTime: string | null = null;

    const trimmedStart = startTime.trim();
    if (trimmedStart) {
      if (!timeRegex.test(trimmedStart)) {
        setError(t('item.invalidTime'));
        return;
      }
      validStartTime = trimmedStart;
    }

    const trimmedEnd = endTime.trim();
    if (trimmedEnd) {
      if (!timeRegex.test(trimmedEnd)) {
        setError(t('item.invalidTime'));
        return;
      }
      validEndTime = trimmedEnd;
    }

    if (validEndTime && !validStartTime) {
      setError(t('item.endTimeRequiresStart'));
      return;
    }

    if (validStartTime && validEndTime) {
      const startValue = parseInt(validStartTime.replace(':', ''), 10);
      const endValue = parseInt(validEndTime.replace(':', ''), 10);
      if (endValue < startValue) {
        setError(t('item.endTimeBeforeStart'));
        return;
      }
    }

    setLoading(true);
    try {
      const { data: dayData, error: dayError } = await supabase
        .from('trip_days')
        .select('id, day_date')
        .eq('id', dayId)
        .eq('trip_id', id)
        .single();

      if (dayError || !dayData) {
        throw new Error('Geçersiz gezi gün eşleşmesi');
      }

      // Parse Time
      let finalStartAt = null;
      let finalEndAt = null;

      if (dayData && dayData.day_date) {
        const [y, m, d] = dayData.day_date.split('-');
        const year = parseInt(y, 10);
        const month = parseInt(m, 10);
        const day = parseInt(d, 10);

        if (validStartTime) {
          const [sh, sm] = validStartTime.split(':');
          const dateStart = new Date(year, month - 1, day, parseInt(sh, 10), parseInt(sm, 10));
          finalStartAt = dateStart.toISOString();
        }

        if (validEndTime) {
          const [eh, em] = validEndTime.split(':');
          const dateEnd = new Date(year, month - 1, day, parseInt(eh, 10), parseInt(em, 10));
          finalEndAt = dateEnd.toISOString();
        }
      }

      // Update
      const { error: updateError } = await supabase
        .from('trip_items')
        .update({
          type: selectedType,
          title: trimmedTitle,
          notes: finalNotes,
          cost: parsedCost,
          currency: finalCurrency,
          start_at: finalStartAt,
          end_at: finalEndAt,
        })
        .eq('id', itemId)
        .eq('trip_id', id)
        .eq('trip_day_id', dayId);

      if (updateError) throw updateError;

      // Success
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/trips/${id}/days/${dayId}`);
      }
    } catch (err: any) {
      console.error('UPDATE_TRIP_ITEM_ERROR', err);
      setError(t('item.updateError') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Screen safeArea>
        <Stack.Screen options={{ title: t('item.editPlan'), headerBackTitle: 'Geri' }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea>
      <Stack.Screen options={{ title: t('item.editPlan'), headerBackTitle: 'Geri' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
              <ThemedText style={styles.errorText} themeColor="error">
                {error}
              </ThemedText>
            </View>
          )}

          <ThemedText style={styles.label}>{t('item.planType')}</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
            style={styles.chipsScroll}
          >
            {ITEM_TYPES.map((type) => {
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.border,
                      borderColor: isSelected ? theme.primary : 'transparent',
                    }
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      { color: isSelected ? theme.background : theme.text }
                    ]}
                  >
                    {t(`item.types.${type}` as TranslationKey)}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ThemedText style={styles.label}>{t('item.title')}</ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('item.title')}
            maxLength={120}
            style={styles.input}
          />

          <ThemedText style={styles.label}>{t('item.notes')}</ThemedText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('item.notes')}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <ThemedText style={styles.label}>{t('item.cost')}</ThemedText>
              <TextInput
                value={costStr}
                onChangeText={setCostStr}
                placeholder="0.00"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={styles.halfCol}>
              <ThemedText style={styles.label}>{t('item.currency')}</ThemedText>
              <TextInput
                value={currency}
                onChangeText={(val) => setCurrency(val.toUpperCase())}
                placeholder="TRY"
                maxLength={3}
                autoCapitalize="characters"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <ThemedText style={styles.label}>{t('item.startTime')}</ThemedText>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder={t('item.timePlaceholder')}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={styles.input}
              />
            </View>
            <View style={styles.halfCol}>
              <ThemedText style={styles.label}>{t('item.endTime')}</ThemedText>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder={t('item.timePlaceholder')}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={styles.input}
              />
            </View>
          </View>

          <Button
            title={loading ? t('common.loading') : t('item.saveChanges')}
            onPress={handleUpdate}
            disabled={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    padding: 16,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
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
  chipsScroll: {
    marginBottom: 16,
  },
  chipsContainer: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 24,
  },
});
