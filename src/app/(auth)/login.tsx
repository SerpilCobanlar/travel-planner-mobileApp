import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from '@/localization';
import { usePreferences } from '@/context/PreferencesContext';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { t, language } = useTranslation();
  const { setLanguage } = usePreferences();
  const router = useRouter();

  const validate = () => {
    setErrorMsg('');
    if (!email) {
      setErrorMsg(t('auth.emailRequired'));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg(t('auth.emailInvalid'));
      return false;
    }
    if (!password) {
      setErrorMsg(t('auth.passwordRequired'));
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg(t('auth.invalidCredentials'));
      } else {
        console.error('Login error:', error);
        setErrorMsg(t('auth.error'));
      }
    }
    setLoading(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  };

  return (
    <Screen scrollable safeArea style={styles.container}>
      <View>
        <View style={styles.header}>
          <ThemedText type="title" themeColor="primary">Travel Planner</ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
            {t('auth.login')}
          </ThemedText>
        </View>

        <Card>
          <TextInput
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="mail@example.com"
          />
          <TextInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="********"
          />

          {errorMsg ? (
            <ThemedText style={styles.errorText} themeColor="error" type="smallBold">
              {errorMsg}
            </ThemedText>
          ) : null}

          <Button 
            title={t('auth.signIn')} 
            onPress={handleLogin} 
            loading={loading}
            style={styles.button}
          />

          <Button 
            title={t('auth.noAccount')} 
            variant="ghost" 
            onPress={() => router.push('/(auth)/register')} 
          />
        </Card>

        <View style={styles.footer}>
          <Button 
            title={language === 'tr' ? 'English' : 'Türkçe'} 
            variant="outline" 
            onPress={toggleLanguage} 
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  }
});
