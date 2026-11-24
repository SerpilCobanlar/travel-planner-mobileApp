import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams, RelativePathString } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { TripItemForm } from '@/components/TripItemForm';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabaseClient';
import { useInvalidateTrip, useTripDays, useTripItems } from '@/lib/queries/trips';
import { toTripItemColumns, tripItemRowToForm, TripItemFormOutput } from '@/lib/validation/tripItem';

export default function EditTripItemScreen() {
  const { id, dayId, itemId } = useLocalSearchParams<{ id: string; dayId: string; itemId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const invalidateTrip = useInvalidateTrip();

  // Usually already cached by the day screen, so the form opens instantly.
  const itemsQuery = useTripItems(id);
  const daysQuery = useTripDays(id);
  const item = itemsQuery.data?.find((i) => i.id === itemId && i.trip_day_id === dayId);
  const day = daysQuery.data?.find((d) => d.id === dayId);

  // Form defaults are taken once; later cache refreshes don't reset what the user typed.
  const initialValues = useMemo(() => (item ? tripItemRowToForm(item) : null), [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const loading = itemsQuery.isPending || daysQuery.isPending;
  const loadError = !loading && (!item || !day) ? t('item.fetchError') : null;

  const handleUpdate = async (values: TripItemFormOutput) => {
    if (!day) return;

    const { data: updatedRows, error: updateError } = await supabase
      .from('trip_items')
      .update(toTripItemColumns(values, day.day_date))
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

    await invalidateTrip(id);

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/trips/${id}/days/${dayId}` as RelativePathString);
    }
  };

  return (
    <Screen scrollable safeArea="bottom" padded={false}>
      <Stack.Screen options={{ title: t('item.editPlan') }} />
      {initialValues && day ? (
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
