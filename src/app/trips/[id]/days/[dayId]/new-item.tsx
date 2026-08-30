import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
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

export default function AddTripItemScreen() {
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedType, setSelectedType] = useState('place');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [costStr, setCostStr] = useState('');
  const [currency, setCurrency] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
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
      // 1. Cross-trip safety checks? Handled by trigger / RLS optionally, 
      // but let's just make sure day matches trip.
      const { data: dayData, error: dayError } = await supabase
        .from('trip_days')
        .select('id')
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

      // 3. Insert
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
        });

      if (insertError) throw insertError;

      // Success
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/trips/${id}/days/${dayId}`);
      }
    } catch (err: any) {
      console.error('CREATE_TRIP_ITEM_ERROR', err);
      setError(t('item.createError') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen safeArea>
      <Stack.Screen options={{ title: t('item.createPlan'), headerBackTitle: 'Geri' }} />
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
            title={loading ? t('common.loading') : t('item.createPlan')}
            onPress={handleCreate}
            disabled={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
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
});
