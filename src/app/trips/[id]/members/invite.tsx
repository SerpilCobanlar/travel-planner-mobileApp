import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { FieldError } from '@/components/ui/FieldError';
import { useTranslation } from '@/localization';
import { memberErrorKey, useAddTripMember } from '@/lib/queries/members';

// Same rule as registration (register.tsx / handle_new_user): lowercase, 3-24 chars.
const inviteSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, 'auth.usernameInvalid'),
  canEdit: z.boolean(),
});

type InviteValues = z.input<typeof inviteSchema>;
type InviteOutput = z.output<typeof inviteSchema>;

/** Owner only (RLS): add a friend to the trip by exact username (#16). */
export default function InviteMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const addMember = useAddTripMember(id);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues, unknown, InviteOutput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { username: '', canEdit: true },
  });

  const submit = handleSubmit(async ({ username, canEdit }) => {
    setSuccessMessage(null);
    try {
      const member = await addMember.mutateAsync({ username, role: canEdit ? 'editor' : 'viewer' });
      setSuccessMessage(t('members.invited').replace('{username}', member.username));
      // Keep the role choice; clear the name so the next friend can be added.
      resetField('username');
    } catch (err) {
      setError('username', { message: memberErrorKey(err) });
    }
  });

  return (
    <Screen scrollable safeArea="bottom">
      <Stack.Screen options={{ title: t('members.inviteTitle') }} />

      <ThemedText themeColor="textSecondary" style={styles.hint}>
        {t('members.inviteHint')}
      </ThemedText>

      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <TextInput
            label={t('members.usernameLabel')}
            value={field.value}
            onChangeText={(text) => {
              setSuccessMessage(null);
              field.onChange(text);
            }}
            onBlur={field.onBlur}
            placeholder={t('members.usernamePlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={24}
          />
        )}
      />
      <FieldError message={errors.username?.message} />

      <ThemedText style={styles.label}>{t('members.roleLabel')}</ThemedText>
      <Controller
        control={control}
        name="canEdit"
        render={({ field }) => (
          <ToggleRow
            labelFalse={t('members.roleViewer')}
            labelTrue={t('members.roleEditor')}
            value={field.value}
            onValueChange={field.onChange}
          />
        )}
      />

      {successMessage && (
        <ThemedText themeColor="success" type="smallBold" style={styles.success}>
          {successMessage}
        </ThemedText>
      )}

      <View style={styles.footer}>
        <Button
          title={isSubmitting ? t('common.loading') : t('members.invite')}
          onPress={submit}
          disabled={isSubmitting}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginBottom: 16,
    lineHeight: 22,
  },
  label: {
    marginBottom: 0,
    fontWeight: '600',
  },
  success: {
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    marginTop: 16,
  },
});
