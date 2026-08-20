import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from '@/localization';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { t } = useTranslation();
  const router = useRouter();

  const validate = () => {
    setErrorMsg('');
    
    const trimmedUsername = username.trim().toLowerCase();
    
    if (!trimmedUsername) {
      setErrorMsg(t('auth.usernameRequired'));
      return false;
    }
    
    if (!/^[a-z0-9_]{3,24}$/.test(trimmedUsername)) {
      setErrorMsg(t('auth.usernameInvalid'));
      return false;
    }

    if (!email) {
      setErrorMsg(t('auth.emailRequired'));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setErrorMsg(t('auth.emailInvalid'));
      return false;
    }
    if (!password || password.length < 8) {
      setErrorMsg(t('auth.passwordLength'));
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwordMatch'));
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    
    // Optional: Pre-check if username exists in public.profiles here to give early feedback,
    // but we'll rely on the DB unique constraint for now to keep it simple.

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: 'travelplannermobileapp://login',
        data: {
          username: username.trim().toLowerCase(),
        }
      }
    });

    setLoading(false);

    if (error) {
      if (__DEV__) {
        console.error('SIGNUP_ERROR', {
          message: error.message,
          name: error.name,
          status: error.status,
          code: error.code,
        });
      }

      const errorCode = error.code;
      const errorMessage = error.message?.toLowerCase() || '';
      let userMessage = t('auth.error');

      if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('already registered')) {
        if (errorMessage.includes('username')) {
          userMessage = t('auth.usernameTaken');
        } else {
          userMessage = t('auth.emailTaken');
        }
      } else if (errorCode === 'invalid_credentials' || errorMessage.includes('invalid')) {
        userMessage = t('auth.emailInvalid');
      } else if (errorMessage.includes('password') && errorMessage.includes('short')) {
        userMessage = t('auth.passwordTooShort');
      } else if (errorCode === '429' || errorMessage.includes('rate limit')) {
        userMessage = t('auth.rateLimit');
      } else if (errorMessage.includes('redirect')) {
        userMessage = t('auth.configError');
      } else if (errorMessage.includes('trigger') || errorMessage.includes('database')) {
        userMessage = t('auth.dbError');
      }

      setErrorMsg(userMessage);
    } else {
      if (data.user && !data.session) {
        Alert.alert('Success', t('auth.checkEmail'));
        router.push('/(auth)/login');
      }
      // If session exists, AuthContext will automatically redirect to (tabs)
    }
  };

  return (
    <Screen scrollable safeArea>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <ThemedText type="title" themeColor="primary">Travel Planner</ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
            {t('auth.register')}
          </ThemedText>
        </View>

        <Card>
          <TextInput
            label={t('auth.username')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="johndoe"
          />
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
          <TextInput
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="********"
          />

          {errorMsg ? (
            <ThemedText style={styles.errorText} themeColor="error" type="smallBold">
              {errorMsg}
            </ThemedText>
          ) : null}

          <Button 
            title={t('auth.signUp')} 
            onPress={handleRegister} 
            loading={loading}
            style={styles.button}
          />

          <Button 
            title={t('auth.hasAccount')} 
            variant="ghost" 
            onPress={() => router.back()} 
          />
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
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
  }
});
