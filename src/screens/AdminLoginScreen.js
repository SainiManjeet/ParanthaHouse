import React, { useState } from 'react';
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
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
          <Text style={styles.subtitle}>Sign in to manage today's breakfast menu.</Text>

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
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#A99B8F"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            onSubmitEditing={handleLogin}
          />

          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.primaryButton, busy && styles.disabledButton]}
            onPress={handleLogin}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryButtonText}>Sign in to admin</Text>}
          </TouchableOpacity>
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
  primaryButton: { backgroundColor: '#A94425', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 6 },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
