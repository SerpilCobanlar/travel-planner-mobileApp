import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams, RelativePathString } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { TripItemForm } from '@/components/TripItemForm';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabaseClient';
import {
  toTripItemColumns,
  tripItemRowToForm,
  TripItemFormOutput,
  TripItemFormValues,
} from '@/lib/validation/tripItem';

export default function EditTripItemScreen() {
  const { id, dayId, itemId } = useLocalSearchParams<{ id: string; dayId: string; itemId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const [initialValues, setInitialValues] = useState<TripItemFormValues | null>(null);
  const [dayDate, setDayDate] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !dayId || !itemId) return;
    let cancelled = false;

    (async () => {
      // The item and its day (for turning HH:mm into timestamps on save)
      const [itemResult, dayResult] = await Promise.all([
        supabase
          .from('trip_items')
          .select('*')
          .eq('id', itemId)
          .eq('trip_id', id)
          .eq('trip_day_id', dayId)
          .single(),
        supabase.from('trip_days').select('day_date').eq('id', dayId).eq('trip_id', id).single(),
      ]);

      if (cancelled) return;
      if (itemResult.error || !itemResult.data || dayResult.error || !dayResult.data) {
        console.error('FETCH_TRIP_ITEM_ERROR', itemResult.error ?? dayResult.error);
        setLoadError(t('item.fetchError'));
        return;
      }
      setInitialValues(tripItemRowToForm(itemResult.data));
      setDayDate(dayResult.data.day_date);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, dayId, itemId, t]);

  const handleUpdate = async (values: TripItemFormOutput) => {
    if (!dayDate) return;

    const { data: updatedRows, error: updateError } = await supabase
      .from('trip_items')
      .update(toTripItemColumns(values, dayDate))
      .eq('id', itemId)
      .eq('trip_id', id)
      .eq('trip_day_id', dayId)
      .select('id');

    if (updateError) {
      console.error('UPDATE_TRIP_ITEM_ERROR', updateError);
      throw new Error(t('item.updateError'));
    }
    // RLS-blocked updates don't error; they just affect 0 rows.
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error(t('common.noPermission'));
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/trips/${id}/days/${dayId}` as RelativePathString);
    }
  };

  return (
    <Screen scrollable safeArea="bottom" padded={false}>
      <Stack.Screen options={{ title: t('item.editPlan') }} />
      {initialValues ? (
        <TripItemForm defaultValues={initialValues} submitLabel={t('item.saveChanges')} onSubmit={handleUpdate} />
      ) : (
        <View style={styles.center}>
          {loadError ? (
            <ThemedText themeColor="error" style={styles.errorText}>
              {loadError}
            </ThemedText>
          ) : (
            <ActivityIndicator size="large" color={theme.primary} />
          )}
        </View>
      )}
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
  errorText: {
    textAlign: 'center',
  },
});
