import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from '@/localization';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { ThemedText } from '@/components/themed-text';

const schema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'auth.emailRequired').email('auth.emailInvalid'),
});

type Values = z.input<typeof schema>;
type Output = z.output<typeof schema>;

/** Step 1 of the reset flow (#52): email a reset link that opens /reset-password in the app. */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Must match Supabase Auth > Redirect URLs (travelplannermobileapp://** is allowed).
      redirectTo: Linking.createURL('/reset-password'),
    });

    if (error) {
      // "No such user" is not reported by Supabase. A rate limit (429) is expected
      // with the built-in mailer, so it isn't logged as an error.
      if (error.status === 429) {
        setServerError(t('auth.rateLimit'));
      } else {
        console.error('RESET_PASSWORD_EMAIL_ERROR', error);
        setServerError(t('auth.error'));
      }
      return;
    }
    // Same message whether or not the account exists (no account enumeration).
    setSent(true);
  });

  return (
    <Screen scrollable safeArea style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" themeColor="primary">Travel Planner</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {t('auth.forgotTitle')}
        </ThemedText>
      </View>

      <Card>
        {sent ? (
          <ThemedText themeColor="success" type="smallBold" style={styles.centerText}>
            {t('auth.resetEmailSent')}
          </ThemedText>
        ) : (
          <>
            <ThemedText themeColor="textSecondary" style={styles.hint}>
              {t('auth.forgotHint')}
            </ThemedText>

            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <TextInput
                  label={t('auth.email')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="mail@example.com"
                />
              )}
            />
            <FieldError message={errors.email?.message} />

            {serverError && (
              <ThemedText themeColor="error" type="smallBold" style={styles.centerText}>
                {serverError}
              </ThemedText>
            )}

            <Button
              title={t('auth.sendResetLink')}
              onPress={submit}
              loading={isSubmitting}
              style={styles.button}
            />
          </>
        )}

        <Button title={t('auth.backToLogin')} variant="ghost" onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    marginTop: 8,
  },
  hint: {
    marginBottom: 16,
    lineHeight: 22,
  },
  centerText: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
});
