import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { ThemedText } from '@/components/themed-text';

const schema = z
  .object({
    password: z.string().min(8, 'auth.passwordLength'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'auth.passwordMatch',
  });

type Values = z.input<typeof schema>;
type Output = z.output<typeof schema>;
type LinkState = 'checking' | 'ready' | 'invalid' | 'done';

/**
 * Supabase appends the recovery session to the redirect URL:
 * implicit flow → `#access_token=…&refresh_token=…&type=recovery`,
 * PKCE flow → `?code=…`, failures → `#error=…&error_code=otp_expired`.
 */
function parseRecoveryUrl(url: string) {
  const [beforeHash, hash = ''] = url.split('#');
  const query = new URLSearchParams(beforeHash.split('?')[1] ?? '');
  const fragment = new URLSearchParams(hash);
  return {
    accessToken: fragment.get('access_token'),
    refreshToken: fragment.get('refresh_token'),
    code: query.get('code'),
    error: fragment.get('error') ?? query.get('error'),
  };
}

/** Step 2 of the reset flow (#52): opened from the email link; outside the auth guards. */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const url = Linking.useURL();
  const handledUrl = useRef<string | null>(null);
  const [linkState, setLinkState] = useState<LinkState>('checking');
  const [serverError, setServerError] = useState<string | null>(null);

  // No usable link after a few seconds (e.g. screen opened without one): show the error state.
  useEffect(() => {
    const timer = setTimeout(() => {
      setLinkState((state) => (state === 'checking' ? 'invalid' : state));
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Turn the link into a session so updateUser() is allowed.
  useEffect(() => {
    if (!url || handledUrl.current === url) return;
    handledUrl.current = url;

    // TEMP DEBUG (#52): URL shape with secrets masked
    console.log('RESET_URL_DEBUG', url.replace(/(access_token|refresh_token|code|token)=[^&#]+/g, '$1=***'));

    (async () => {
      const { accessToken, refreshToken, code, error } = parseRecoveryUrl(url);
      if (error) {
        console.log('RESET_URL_DEBUG link error:', error);
        setLinkState('invalid');
        return;
      }

      let sessionError: unknown = null;
      if (accessToken && refreshToken) {
        ({ error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }));
      } else if (code) {
        ({ error: sessionError } = await supabase.auth.exchangeCodeForSession(code));
      } else {
        // Opened without tokens (e.g. typed URL); fine only if already signed in via the link.
        const { data } = await supabase.auth.getSession();
        console.log('RESET_URL_DEBUG no tokens, session:', !!data.session);
        setLinkState(data.session ? 'ready' : 'invalid');
        return;
      }

      if (sessionError) {
        console.error('RESET_PASSWORD_SESSION_ERROR', sessionError);
        setLinkState('invalid');
        return;
      }
      setLinkState('ready');
    })();
  }, [url]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async ({ password }) => {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error('RESET_PASSWORD_UPDATE_ERROR', error);
      setServerError(error.message.toLowerCase().includes('different') ? t('auth.passwordSameAsOld') : t('auth.error'));
      return;
    }
    setLinkState('done');
  });

  return (
    <Screen scrollable safeArea="bottom">
      <Stack.Screen options={{ title: t('auth.resetTitle') }} />

      <Card style={styles.card}>
        {linkState === 'checking' && <ActivityIndicator size="large" color={theme.primary} />}

        {linkState === 'invalid' && (
          <>
            <ThemedText themeColor="error" type="smallBold" style={styles.centerText}>
              {t('auth.resetLinkInvalid')}
            </ThemedText>
            <Button title={t('auth.backToLogin')} onPress={() => router.replace('/(auth)/login')} />
          </>
        )}

        {linkState === 'done' && (
          <>
            <ThemedText themeColor="success" type="smallBold" style={styles.centerText}>
              {t('auth.passwordUpdated')}
            </ThemedText>
            {/* The recovery link signed the user in, so continue into the app. */}
            <Button title={t('common.continue')} onPress={() => router.replace('/(tabs)')} />
          </>
        )}

        {linkState === 'ready' && (
          <>
            <ThemedText themeColor="textSecondary" style={styles.hint}>
              {t('auth.resetHint')}
            </ThemedText>

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextInput
                  label={t('auth.newPassword')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry
                  placeholder="********"
                />
              )}
            />
            <FieldError message={errors.password?.message} />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <TextInput
                  label={t('auth.confirmPassword')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry
                  placeholder="********"
                />
              )}
            />
            <FieldError message={errors.confirmPassword?.message} />

            {serverError && (
              <ThemedText themeColor="error" type="smallBold" style={styles.centerText}>
                {serverError}
              </ThemedText>
            )}

            <Button title={t('auth.saveNewPassword')} onPress={submit} loading={isSubmitting} />
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
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
});
