import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { TripForm } from '@/components/TripForm';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabaseClient';
import { toTripColumns, TripFormOutput, TripFormValues } from '@/lib/validation/trip';

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const [initialValues, setInitialValues] = useState<TripFormValues | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.from('trips').select('*').eq('id', id).single();
      if (cancelled) return;
      if (error || !data) {
        console.error('FETCH_TRIP_EDIT_ERROR', error);
        setLoadError(t('trip.fetchError'));
        return;
      }
      setInitialValues({
        title: data.title,
        description: data.description ?? '',
        startDate: data.start_date,
        endDate: data.end_date,
        isPublic: data.is_public ?? false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const handleUpdate = async (values: TripFormOutput) => {
    const { data: updatedRows, error } = await supabase
      .from('trips')
      .update(toTripColumns(values))
      .eq('id', id)
      .select('id');

    if (error) {
      // Expected business rule from sync_trip_days_on_update: not a crash, no console error.
      if (error.message.includes('DATE_RANGE_REJECTED_HAS_ITEMS')) {
        throw new Error(t('trip.dateRangeRejectedItems'));
      }
      console.error('UPDATE_TRIP_ERROR', error);
      throw new Error(t('trip.updateError'));
    }
    // RLS-blocked updates don't error; they just affect 0 rows.
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error(t('common.noPermission'));
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/trips/${id}`);
    }
  };

  return (
    <Screen scrollable safeArea="bottom" padded={false}>
      <Stack.Screen options={{ title: t('trip.editTrip') }} />
      {initialValues ? (
        <TripForm defaultValues={initialValues} submitLabel={t('trip.saveChanges')} onSubmit={handleUpdate} />
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
