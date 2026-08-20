import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { usePreferences, ThemePreference, LanguagePreference } from '@/context/PreferencesContext';
import { useTranslation } from '@/localization';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { theme, setTheme, language, setLanguage } = usePreferences();
  const { t } = useTranslation();
  const colors = useTheme();
  
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUsername(data.username);
          }
        });
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Screen scrollable safeArea>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle} type="title">
          {t('profile.title')}
        </ThemedText>
      </View>

      <Card style={styles.infoCard}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('auth.email')}
        </ThemedText>
        <ThemedText type="default" style={styles.infoText}>
          {user?.email || '-'}
        </ThemedText>

        <View style={styles.spacer} />

        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('auth.username')}
        </ThemedText>
        <ThemedText type="default" style={styles.infoText}>
          {username || '-'}
        </ThemedText>
      </Card>

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t('profile.settings')}
      </ThemedText>
      
      <Card>
        <View style={styles.settingRow}>
          <ThemedText>{t('profile.theme')}</ThemedText>
          <View style={styles.buttonGroup}>
            {(['system', 'light', 'dark'] as ThemePreference[]).map((tOpt) => (
              <Button
                key={tOpt}
                title={t(`profile.theme${tOpt.charAt(0).toUpperCase() + tOpt.slice(1)}` as any)}
                variant={theme === tOpt ? 'primary' : 'outline'}
                onPress={() => setTheme(tOpt)}
                style={[styles.smallButton, theme !== tOpt && { borderColor: colors.border }] as any}
                textStyle={styles.smallButtonText}
              />
            ))}
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.settingRow}>
          <ThemedText>{t('profile.language')}</ThemedText>
          <View style={styles.buttonGroup}>
            {(['tr', 'en'] as LanguagePreference[]).map((lOpt) => (
              <Button
                key={lOpt}
                title={lOpt === 'tr' ? 'Türkçe' : 'English'}
                variant={language === lOpt ? 'primary' : 'outline'}
                onPress={() => setLanguage(lOpt)}
                style={[styles.smallButton, language !== lOpt && { borderColor: colors.border }] as any}
                textStyle={styles.smallButtonText}
              />
            ))}
          </View>
        </View>
      </Card>

      <Button 
        title={t('profile.logout')}
        onPress={handleLogout}
        style={styles.logoutButton}
        variant="ghost"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    marginBottom: 10,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoText: {
    marginTop: 4,
    fontSize: 18,
  },
  spacer: {
    height: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 20,
  },
  settingRow: {
    paddingVertical: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  smallButton: {
    height: 36,
    paddingHorizontal: 12,
    flex: 1,
  },
  smallButtonText: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB', // This should idealy use theme.border
    marginVertical: 12,
  },
  logoutButton: {
    marginTop: 20,
  }
});
