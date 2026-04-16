import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../data';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { login, registerUser, checkUsernameAvailability } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'customer',
  });
  const [status, setStatus] = useState({ loading: false, error: '', availability: '' });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  useEffect(() => {
    if (mode !== 'register') return;
    const username = form.username.trim();
    if (username.length < 3) {
      setStatus((prev) => ({ ...prev, availability: '' }));
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(username);
        setStatus((prev) => ({
          ...prev,
          availability: result.available ? 'Username available' : 'Username already taken',
        }));
      } catch (_error) {
        setStatus((prev) => ({ ...prev, availability: 'Availability check failed' }));
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [mode, form.username, checkUsernameAvailability]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      if (mode === 'login') {
        await login(form.username || form.email, form.password);
      } else {
        if (!emailRegex.test(form.email.trim().toLowerCase())) {
          throw new Error('Invalid email format');
        }
        if (!passwordRegex.test(form.password)) {
          throw new Error('Password must be at least 8 chars, include 1 uppercase and 1 number');
        }

        await registerUser(form);
        setMode('login');
        setForm((prev) => ({
          ...prev,
          name: '',
          email: '',
          password: '',
          role: 'customer',
        }));
        setStatus((prev) => ({
          ...prev,
          availability: '',
          error: 'Registration successful. Please login now.',
        }));
      }
    } catch (error) {
      const reason = error?.response?.data?.message || error?.message || 'Authentication failed';
      console.error(`Auth submit failed: ${reason}`);
      setStatus((prev) => ({
        ...prev,
        error: reason,
      }));
    } finally {
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>RentGear</Text>
        <Text style={styles.subtitle}>Secure access to your rentals</Text>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={form.name}
            onChangeText={(value) => update('name', value)}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder={mode === 'login' ? 'Username or email' : 'Username'}
          autoCapitalize="none"
          value={form.username}
          onChangeText={(value) => update('username', value)}
        />

        {mode === 'register' && !!status.availability && (
          <Text
            style={[
              styles.hint,
              status.availability.includes('available') ? styles.ok : styles.bad,
            ]}
          >
            {status.availability}
          </Text>
        )}

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(value) => update('email', value)}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={form.password}
          onChangeText={(value) => update('password', value)}
        />

        {mode === 'register' && (
          <View style={styles.roleRow}>
            {['customer', 'owner'].map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleChip, form.role === role && styles.roleChipActive]}
                onPress={() => update('role', role)}
              >
                <Text style={[styles.roleText, form.role === role && styles.roleTextActive]}>
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!!status.error && <Text style={styles.error}>{status.error}</Text>}

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={status.loading}>
          {status.loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {mode === 'login' ? 'Login to RentGear' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  subtitle: { marginTop: 4, marginBottom: 18, color: COLORS.gray500 },
  modeRow: { flexDirection: 'row', marginBottom: 14, backgroundColor: COLORS.gray100, borderRadius: 10, padding: 4 },
  modeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  modeBtnActive: { backgroundColor: '#fff' },
  modeText: { color: COLORS.gray500, fontWeight: '700' },
  modeTextActive: { color: COLORS.primary },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  hint: { marginTop: 6, fontSize: 12, fontWeight: '600' },
  ok: { color: '#065f46' },
  bad: { color: COLORS.danger },
  roleRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  roleChip: { flex: 1, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
  roleChipActive: { borderColor: COLORS.primary, backgroundColor: '#dbeafe' },
  roleText: { color: COLORS.gray700, textTransform: 'capitalize', fontWeight: '600' },
  roleTextActive: { color: COLORS.primary },
  error: { color: COLORS.danger, marginTop: 10, fontWeight: '600' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 10, marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
});
