import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { TripForm } from '@/components/TripForm';
import { useTranslation } from '@/localization';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { emptyTripForm, toTripColumns, TripFormOutput } from '@/lib/validation/trip';

export default function CreateTripScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleCreate = async (values: TripFormOutput) => {
    if (!user) throw new Error(t('auth.error'));

    // Days are created by the tr_trips_auto_days trigger.
    const { error } = await supabase.from('trips').insert({ ...toTripColumns(values), owner_id: user.id });

    if (error) {
      console.error('CREATE_TRIP_ERROR', error);
      throw new Error(t('trip.createError'));
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <Screen scrollable safeArea="bottom" padded={false}>
      <Stack.Screen options={{ title: t('trip.createTrip') }} />
      <TripForm defaultValues={emptyTripForm} submitLabel={t('trip.createTrip')} onSubmit={handleCreate} />
    </Screen>
  );
}
