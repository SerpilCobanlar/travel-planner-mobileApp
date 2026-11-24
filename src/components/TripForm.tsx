/**
 * Trip create/edit form (#34). Validation lives in src/lib/validation/trip.ts;
 * the screen only loads data and saves the validated values.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ThemedText } from '@/components/themed-text';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { FieldError } from '@/components/ui/FieldError';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import {
  tripFormSchema,
  TripFormOutput,
  TripFormValues,
} from '@/lib/validation/trip';

interface TripFormProps {
  defaultValues: TripFormValues;
  submitLabel: string;
  /** Save the validated values. Throw an Error with a user-facing message to show it. */
  onSubmit: (values: TripFormOutput) => Promise<void>;
}

export function TripForm({ defaultValues, submitLabel, onSubmit }: TripFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues, unknown, TripFormOutput>({
    resolver: zodResolver(tripFormSchema),
    defaultValues,
  });

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

      <ThemedText style={styles.label}>{t('trip.title')}</ThemedText>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextInput
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('trip.titlePlaceholder')}
            maxLength={100}
          />
        )}
      />
      <FieldError message={errors.title?.message} />

      <ThemedText style={styles.label}>{t('trip.description')}</ThemedText>
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextInput
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('trip.descPlaceholder')}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        )}
      />

      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <DatePickerField label={t('trip.startDate')} value={field.value} onChange={field.onChange} />
            )}
          />
          <FieldError message={errors.startDate?.message} />
        </View>
        <View style={styles.halfCol}>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <DatePickerField label={t('trip.endDate')} value={field.value} onChange={field.onChange} />
            )}
          />
          <FieldError message={errors.endDate?.message} />
        </View>
      </View>

      <Controller
        control={control}
        name="isPublic"
        render={({ field }) => (
          <ToggleRow
            labelFalse={t('trip.isPrivate')}
            labelTrue={t('trip.isPublic')}
            value={field.value}
            onValueChange={field.onChange}
          />
        )}
      />

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
  submitButton: {
    marginTop: 24,
  },
});
