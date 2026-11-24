import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTranslation, TranslationKey } from '@/localization';

/** Inline validation message. `message` is a translation key from a zod schema. */
export function FieldError({ message }: { message?: string }) {
  const { t } = useTranslation();
  if (!message) return null;

  return (
    <ThemedText type="small" themeColor="error" style={styles.text}>
      {t(message as TranslationKey)}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  text: {
    marginTop: -8,
    marginBottom: 12,
  },
});
