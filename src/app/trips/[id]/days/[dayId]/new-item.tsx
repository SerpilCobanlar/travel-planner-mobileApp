import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams, RelativePathString, useFocusEffect } from 'expo-router';
import { getPickedLocation } from '@/lib/locationStore';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { TimePickerField } from '@/components/ui/TimePickerField';
import { SelectField } from '@/components/ui/SelectField';
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

const CURRENCIES = [
  { label: 'Türk Lirası (TRY)', value: 'TRY' },
  { label: 'US Dollar (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'British Pound (GBP)', value: 'GBP' },
];

export default function AddTripItemScreen() {
  const params = useLocalSearchParams();
  const { id, dayId } = params as { id: string; dayId: string };
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedType, setSelectedType] = useState((params.type as string) || 'place');
  const [title, setTitle] = useState((params.title as string) || '');
  const [notes, setNotes] = useState((params.notes as string) || '');
  const [costStr, setCostStr] = useState((params.costStr as string) || '');
  const [currency, setCurrency] = useState<string | null>((params.currency as string) || null);
  const [startTime, setStartTime] = useState<string | null>((params.startTime as string) || null);
  const [endTime, setEndTime] = useState<string | null>((params.endTime as string) || null);

  const [latitude, setLatitude] = useState<number | null>(
    params.lat ? parseFloat(params.lat as string) : null
  );
  const [longitude, setLongitude] = useState<number | null>(
    params.lng ? parseFloat(params.lng as string) : null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const loc = getPickedLocation();
      if (loc) {
        setLatitude(loc.lat);
        setLongitude(loc.lng);
      }
    }, [])
  );

  const submitLockRef = useRef(false);

  const handleCreate = async () => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setError(null);
    setLoading(true);

    // Validation
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 120) {
      setError(t('item.titleTooShort'));
      submitLockRef.current = false;
      setLoading(false);
      return;
    }

    let parsedCost: number | null = null;
    let finalCurrency: string | null = null;

    const trimmedCost = costStr.trim();
    if (trimmedCost) {
      const numCost = parseFloat(trimmedCost.replace(',', '.'));
      if (isNaN(numCost) || numCost < 0) {
        setError(t('item.negativeCost'));
        submitLockRef.current = false;
        setLoading(false);
        return;
      }
      parsedCost = numCost;

      if (numCost > 0) {
        if (!currency) {
          setError(t('item.currencyRequired'));
          submitLockRef.current = false;
          setLoading(false);
          return;
        }
        finalCurrency = currency;
      }
    }

    const finalNotes = notes.trim() || null;

    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    let validStartTime: string | null = null;
    let validEndTime: string | null = null;

    if (startTime) {
      if (!timeRegex.test(startTime)) {
        setError(t('item.invalidTime'));
        submitLockRef.current = false;
        setLoading(false);
        return;
      }
      validStartTime = startTime;
    }

    if (endTime) {
      if (!timeRegex.test(endTime)) {
        setError(t('item.invalidTime'));
        submitLockRef.current = false;
        setLoading(false);
        return;
      }
      validEndTime = endTime;
    }

    if (validEndTime && !validStartTime) {
      setError(t('item.endTimeRequiresStart'));
      submitLockRef.current = false;
      setLoading(false);
      return;
    }

    if (validStartTime && validEndTime) {
      const startValue = parseInt(validStartTime.replace(':', ''), 10);
      const endValue = parseInt(validEndTime.replace(':', ''), 10);
      if (endValue < startValue) {
        setError(t('item.endTimeBeforeStart'));
        submitLockRef.current = false;
        setLoading(false);
        return;
      }
    }

    try {
      // 1. Cross-trip safety checks? Handled by trigger / RLS optionally,
      // but let's just make sure day matches trip.
      const { data: dayData, error: dayError } = await supabase
        .from('trip_days')
        .select('id, day_date')
        .eq('id', dayId)
        .eq('trip_id', id)
        .single();

      if (dayError || !dayData) {
        throw new Error('Geçersiz gezi gün eşleşmesi');
      }

      // 2. Get Max Sort Order
      const { data: itemsData, error: itemsError } = await supabase
        .from('trip_items')
        .select('sort_order')
        .eq('trip_day_id', dayId)
        .order('sort_order', { ascending: false })
        .limit(1);

      if (itemsError) throw itemsError;

      const maxSortOrder = itemsData.length > 0 ? itemsData[0].sort_order : -1;
      const nextSortOrder = maxSortOrder + 1;

      // 3. Parse Time
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

      // 4. Insert
      const { error: insertError } = await supabase
        .from('trip_items')
        .insert({
          trip_id: id,
          trip_day_id: dayId,
          type: selectedType,
          title: trimmedTitle,
          notes: finalNotes,
          cost: parsedCost,
          currency: finalCurrency,
          sort_order: nextSortOrder,
          details: {},
          start_at: finalStartAt,
          end_at: finalEndAt,
          latitude,
          longitude,
        });

      if (insertError) throw insertError;

      // Success - back to day detail
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/trips/${id}/days/${dayId}` as RelativePathString);
      }
    } catch (err: any) {
      console.error('CREATE_TRIP_ITEM_ERROR', err);
      setError(t('item.createError') + ': ' + err.message);
      submitLockRef.current = false;
      setLoading(false);
    }
  };

  const handleOpenMap = () => {
    router.push({
      pathname: '/trips/location-picker' as RelativePathString,
      params: {
        ...(latitude !== null ? { lat: latitude.toString() } : {}),
        ...(longitude !== null ? { lng: longitude.toString() } : {}),
      },
    });
  };

  return (
    <Screen scrollable safeArea>
      <Stack.Screen options={{ title: t('item.createPlan'), headerBackTitle: 'Geri' }} />
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
              <SelectField
                label={t('item.currency')}
                value={currency}
                options={CURRENCIES}
                onChange={setCurrency}
                disabled={!costStr || parseFloat(costStr.replace(',', '.')) <= 0}
              />
            </View>
          </View>

          <View style={styles.row}>
            <TimePickerField
              label={t('item.startTime')}
              value={startTime}
              onChange={setStartTime}
            />
            <View style={{ width: 16 }} />
            <TimePickerField
              label={t('item.endTime')}
              value={endTime}
              onChange={setEndTime}
            />
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.row}>
              <ThemedText style={styles.label}>{t('item.location')}</ThemedText>
              {latitude && longitude && (
                <TouchableOpacity onPress={() => {
                  setLatitude(null);
                  setLongitude(null);
                }}>
                  <ThemedText style={[styles.removeLocation, { color: theme.error }]}>
                    {t('item.removeLocation')}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {latitude && longitude ? (
              <ThemedText style={styles.locationText}>
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </ThemedText>
            ) : (
              <ThemedText style={styles.locationText}>
                {t('item.noLocationSelected')}
              </ThemedText>
            )}

            <Button
              title={t('item.chooseOnMap')}
              onPress={handleOpenMap}
              variant="outline"
              style={styles.mapButton}
            />
          </View>

          <Button
            title={loading ? t('common.loading') : t('item.createPlan')}
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
  locationContainer: {
    marginBottom: 16,
  },
  removeLocation: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  mapButton: {
    marginTop: 8,
  },
});
