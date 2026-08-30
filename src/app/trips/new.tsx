import React, { useState } from 'react';
import { View, StyleSheet, Switch, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function CreateTripScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple validation for DD.MM.YYYY
  const parseDate = (dateStr: string) => {
    const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = dateStr.trim().match(regex);
    if (!match) return null;
    
    const [, d, m, y] = match;
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    
    // Check basic ranges
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    
    // Valid DB format
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleCreate = async () => {
    setError(null);
    
    if (!user) {
      setError(t('auth.error'));
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2) {
      setError(t('trip.titleTooShort'));
      return;
    }

    const parsedStart = parseDate(startDate);
    const parsedEnd = parseDate(endDate);

    if (!parsedStart || !parsedEnd) {
      setError(t('trip.invalidDate'));
      return;
    }

    if (new Date(parsedEnd) < new Date(parsedStart)) {
      setError(t('trip.endDateBeforeStart'));
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('trips')
        .insert({
          owner_id: user.id,
          title: trimmedTitle,
          description: description.trim() || null,
          start_date: parsedStart,
          end_date: parsedEnd,
          is_public: isPublic,
        });

      if (insertError) throw insertError;

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('CREATE_TRIP_ERROR', err);
      setError(t('trip.createError') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen safeArea>
      <Stack.Screen options={{ title: t('trip.createTrip'), headerBackTitle: 'Geri' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
              <ThemedText style={styles.errorText} themeColor="error">
                {error}
              </ThemedText>
            </View>
          )}

          <ThemedText style={styles.label}>{t('trip.title')}</ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('trip.titlePlaceholder')}
            maxLength={100}
            style={styles.input}
          />

          <ThemedText style={styles.label}>{t('trip.description')}</ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('trip.descPlaceholder')}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <ThemedText style={styles.label}>{t('trip.startDate')}</ThemedText>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder={t('trip.datePlaceholder')}
                keyboardType="numbers-and-punctuation"
                style={styles.input}
              />
            </View>
            <View style={styles.halfCol}>
              <ThemedText style={styles.label}>{t('trip.endDate')}</ThemedText>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder={t('trip.datePlaceholder')}
                keyboardType="numbers-and-punctuation"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <ThemedText style={styles.switchLabel}>
              {isPublic ? t('trip.isPublic') : t('trip.isPrivate')}
            </ThemedText>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.background}
            />
          </View>

          <Button
            title={loading ? t('common.loading') : t('trip.createTrip')}
            onPress={handleCreate}
            disabled={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    padding: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfCol: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
});
