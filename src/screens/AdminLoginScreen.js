import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

async function verifyAdminAccess() {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { data, error } = await supabase.rpc('is_menu_admin');
  if (error) return { error: error.message };
  if (!data) return { error: 'This account is not authorized to manage the menu.' };
  return { success: true };
}

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && window.location.hash.includes('type=recovery')) {
      setResetMode(true);
    }
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!isSupabaseConfigured || !supabase) {
      setError('Set up Supabase in the project .env file before signing in.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Enter your admin email and password.');
      return;
    }

    setBusy(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (loginError) {
      setError(loginError.message);
      setBusy(false);
      return;
    }

    const access = await verifyAdminAccess();
    if (access.error) {
      await supabase.auth.signOut();
      setError(access.error);
      setBusy(false);
      return;
    }
    setBusy(false);
    navigation.replace('MenuAdmin');
  };

  const handleSendPasswordReset = async () => {
    setError('');
    setResetSent(false);
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured.');
      return;
    }
    if (!email.trim()) {
      setError('Enter your admin email first.');
      return;
    }

    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin`,
    });
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetSent(true);
  };

  const handleUpdatePassword = async () => {
    setError('');
    if (newPassword.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }
    const access = await verifyAdminAccess();
    if (access.error) {
      await supabase.auth.signOut();
      setError(access.error);
      setBusy(false);
      return;
    }
    setBusy(false);
    window.history.replaceState(null, '', '/admin');
    navigation.replace('MenuAdmin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <TouchableOpacity
            accessibilityRole="link"
            onPress={() => window.location.assign('/')}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹ Customer app</Text>
          </TouchableOpacity>
          <Text style={styles.emoji}>🧑‍🍳</Text>
          <Text style={styles.title}>Parantha House admin</Text>
          <Text style={styles.subtitle}>
            {resetMode
              ? 'Choose a password for your admin account.'
              : 'Sign in to manage today’s breakfast menu.'}
          </Text>

          {!resetMode && (
            <TextInput
              style={styles.input}
              placeholder="Admin email"
              placeholderTextColor="#A99B8F"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder={resetMode ? 'New password (at least 8 characters)' : 'Password'}
            placeholderTextColor="#A99B8F"
            value={resetMode ? newPassword : password}
            onChangeText={resetMode ? setNewPassword : setPassword}
            secureTextEntry
            autoComplete={resetMode ? 'new-password' : 'password'}
            onSubmitEditing={resetMode ? handleUpdatePassword : handleLogin}
          />

          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {resetSent && (
            <Text style={styles.success}>
              Password reset email sent. Open it on this computer while the app is running.
            </Text>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.primaryButton, busy && styles.disabledButton]}
            onPress={resetMode ? handleUpdatePassword : handleLogin}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryButtonText}>
                {resetMode ? 'Set admin password' : 'Sign in to admin'}
              </Text>}
          </TouchableOpacity>
          {!resetMode && (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.resetButton}
              onPress={handleSendPasswordReset}
              disabled={busy}
            >
              <Text style={styles.resetText}>Set or reset admin password</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F1' },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  backButton: { position: 'absolute', left: 24, top: 18 },
  backText: { fontSize: 15, color: '#A94425', fontWeight: '700' },
  emoji: { fontSize: 54, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 23, fontWeight: '800', color: '#30241D', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8F8176', textAlign: 'center', marginTop: 7, marginBottom: 28 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#EFE5D9',
    color: '#30241D',
    marginBottom: 12,
  },
  error: { color: '#B42318', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 10 },
  success: { color: '#26734D', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 10 },
  primaryButton: { backgroundColor: '#A94425', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 6 },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  resetButton: { paddingVertical: 14, alignItems: 'center' },
  resetText: { color: '#8D4B2D', fontSize: 13, fontWeight: '700' },
});
