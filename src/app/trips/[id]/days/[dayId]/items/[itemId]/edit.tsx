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

    setLoading(true);
    try {
      // Update
      const { error: updateError } = await supabase
        .from('trip_items')
        .update({
          type: selectedType,
          title: trimmedTitle,
          notes: finalNotes,
          cost: parsedCost,
          currency: finalCurrency,
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
