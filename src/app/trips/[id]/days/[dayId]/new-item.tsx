import React from 'react';
import { Stack, useRouter, useLocalSearchParams, RelativePathString } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { TripItemForm } from '@/components/TripItemForm';
import { useTranslation } from '@/localization';
import { supabase } from '@/lib/supabaseClient';
import { emptyTripItemForm, toTripItemColumns, TripItemFormOutput } from '@/lib/validation/tripItem';
import { useInvalidateTrip } from '@/lib/queries/trips';

export default function AddTripItemScreen() {
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const invalidateTrip = useInvalidateTrip();

  const handleCreate = async (values: TripItemFormOutput) => {
    // Make sure the day belongs to this trip (RLS also enforces membership).
    const { data: day, error: dayError } = await supabase
      .from('trip_days')
      .select('id, day_date')
      .eq('id', dayId)
      .eq('trip_id', id)
      .single();

    if (dayError || !day) {
      throw new Error(t('common.invalidTripDay'));
    }

    // New plans go to the end of the day
    const { data: last, error: lastError } = await supabase
      .from('trip_items')
      .select('sort_order')
      .eq('trip_day_id', dayId)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (lastError) {
      console.error('CREATE_TRIP_ITEM_ERROR', lastError);
      throw new Error(t('item.createError'));
    }

    const { error: insertError } = await supabase.from('trip_items').insert({
      ...toTripItemColumns(values, day.day_date),
      trip_id: id,
      trip_day_id: dayId,
      sort_order: last.length > 0 ? last[0].sort_order + 1 : 0,
    });

    if (insertError) {
      console.error('CREATE_TRIP_ITEM_ERROR', insertError);
      throw new Error(t('item.createError'));
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
      <Stack.Screen options={{ title: t('item.createPlan') }} />
      <TripItemForm
        defaultValues={emptyTripItemForm}
        submitLabel={t('item.createPlan')}
        onSubmit={handleCreate}
      />
    </Screen>
  );
}
