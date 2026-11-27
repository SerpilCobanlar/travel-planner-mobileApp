/**
 * Plan (trip item) add/edit form (#34). Validation lives in
 * src/lib/validation/tripItem.ts; the screen only loads data and saves.
 */
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { RelativePathString, useFocusEffect, useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ThemedText } from '@/components/themed-text';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { TimePickerField } from '@/components/ui/TimePickerField';
import { FieldError } from '@/components/ui/FieldError';
import { useTranslation, TranslationKey } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { getCurrencyOptions } from '@/constants/currencies';
import { getPickedLocation } from '@/lib/locationStore';
import {
  ITEM_TYPES,
  parseCost,
  tripItemFormSchema,
  TripItemFormOutput,
  TripItemFormValues,
} from '@/lib/validation/tripItem';

interface TripItemFormProps {
  defaultValues: TripItemFormValues;
  submitLabel: string;
  /** Save the validated values. Throw an Error with a user-facing message to show it. */
  onSubmit: (values: TripItemFormOutput) => Promise<void>;
}

export function TripItemForm({ defaultValues, submitLabel, onSubmit }: TripItemFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TripItemFormValues, unknown, TripItemFormOutput>({
    resolver: zodResolver(tripItemFormSchema),
    defaultValues,
  });

  const [cost, latitude, longitude, placeName, placeAddress] = useWatch({
    control,
    name: ['cost', 'latitude', 'longitude', 'placeName', 'placeAddress'],
  });
  const parsedCost = parseCost(cost);
  const hasPositiveCost = parsedCost !== null && parsedCost > 0;
  const hasLocation = latitude !== null && longitude !== null;

  // Pick up the location chosen on the location picker screen when we come back.
  useFocusEffect(
    useCallback(() => {
      const picked = getPickedLocation();
      if (picked) {
        setValue('latitude', picked.lat, { shouldDirty: true });
        setValue('longitude', picked.lng, { shouldDirty: true });
        setValue('placeName', picked.name ?? null, { shouldDirty: true });
        setValue('placeAddress', picked.address ?? null, { shouldDirty: true });
        // A searched place names the plan if the user hasn't typed a title yet.
        if (picked.name && !getValues('title').trim()) {
          setValue('title', picked.name, { shouldDirty: true, shouldValidate: true });
        }
      }
    }, [setValue, getValues])
  );

  const openLocationPicker = () => {
    router.push({
      pathname: '/trips/location-picker' as RelativePathString,
      params: hasLocation
        ? {
            lat: String(latitude),
            lng: String(longitude),
            ...(placeName ? { name: placeName, address: placeAddress ?? '' } : {}),
          }
        : {},
    });
  };

  const clearLocation = () => {
    setValue('latitude', null, { shouldDirty: true });
    setValue('longitude', null, { shouldDirty: true });
    setValue('placeName', null, { shouldDirty: true });
    setValue('placeAddress', null, { shouldDirty: true });
  };

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setServerError(err instanceof Error && err.message ? err.message : t('auth.error'));
    }
  });

  return (
    <View style={styles.container}>
      {serverError && (
        <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
          <ThemedText style={styles.errorText} themeColor="error">
            {serverError}
          </ThemedText>
        </View>
      )}

      <ThemedText style={styles.label}>{t('item.planType')}</ThemedText>
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
            style={styles.chipsScroll}
          >
            {ITEM_TYPES.map((type) => {
              const isSelected = field.value === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.border,
                      borderColor: isSelected ? theme.primary : 'transparent',
                    },
                  ]}
                  onPress={() => field.onChange(type)}
                >
                  <ThemedText style={[styles.chipText, { color: isSelected ? theme.background : theme.text }]}>
                    {t(`item.types.${type}` as TranslationKey)}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      />

      <ThemedText style={styles.label}>{t('item.title')}</ThemedText>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextInput
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('item.title')}
            maxLength={120}
          />
        )}
      />
      <FieldError message={errors.title?.message} />

      <ThemedText style={styles.label}>{t('item.notes')}</ThemedText>
      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <TextInput
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('item.notes')}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        )}
      />

      <View style={styles.row}>
        <View style={styles.halfCol}>
          <ThemedText style={styles.label}>{t('item.cost')}</ThemedText>
          <Controller
            control={control}
            name="cost"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            )}
          />
          <FieldError message={errors.cost?.message} />
        </View>
        <View style={styles.halfCol}>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <SelectField
                label={t('item.currency')}
                value={field.value}
                options={getCurrencyOptions(t)}
                onChange={field.onChange}
                disabled={!hasPositiveCost}
              />
            )}
          />
          <FieldError message={errors.currency?.message} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Controller
            control={control}
            name="startTime"
            render={({ field }) => (
              <TimePickerField label={t('item.startTime')} value={field.value} onChange={field.onChange} />
            )}
          />
          <FieldError message={errors.startTime?.message} />
        </View>
        <View style={styles.halfCol}>
          <Controller
            control={control}
            name="endTime"
            render={({ field }) => (
              <TimePickerField label={t('item.endTime')} value={field.value} onChange={field.onChange} />
            )}
          />
          <FieldError message={errors.endTime?.message} />
        </View>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationHeader}>
          <ThemedText style={styles.label}>{t('item.location')}</ThemedText>
          {hasLocation && (
            <TouchableOpacity onPress={clearLocation} hitSlop={8}>
              <ThemedText style={[styles.removeLocation, { color: theme.error }]}>
                {t('item.removeLocation')}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {hasLocation && placeName ? (
          <View style={styles.placeInfo}>
            <ThemedText type="smallBold" numberOfLines={1}>
              📍 {placeName}
            </ThemedText>
            {placeAddress ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                {placeAddress}
              </ThemedText>
            ) : null}
          </View>
        ) : (
          <ThemedText style={styles.locationText}>
            {hasLocation
              ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              : t('item.noLocationSelected')}
          </ThemedText>
        )}

        <Button
          title={t('item.chooseOnMap')}
          onPress={openLocationPicker}
          variant="outline"
          style={styles.mapButton}
        />
      </View>

      <Button
        title={isSubmitting ? t('common.loading') : submitLabel}
        onPress={submit}
        disabled={isSubmitting}
        style={styles.submitButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
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
  locationContainer: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  removeLocation: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeInfo: {
    marginBottom: 8,
    gap: 2,
  },
  locationText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  mapButton: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 24,
  },
});
