/**
 * LoginPage — Sky Blue Design + AuthContext Login (React Native)
 * Fixes critical token key bug: uses 'access_token' (snake_case) via AuthContext
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../user_utils/AuthContext';

const LoginPage = ({ onLoginSuccess, onGoSignup }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      onLoginSuccess?.();
    } catch {
      setError('Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled">

        {/* Logo + Brand */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: '#0284c7', shadowColor: '#0284c7', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
            <Text className="text-white text-2xl font-black">SF</Text>
          </View>
          <Text className="text-2xl font-extrabold text-slate-900 tracking-tight">Society Finance</Text>
          <Text className="text-slate-500 text-sm mt-0.5">Sign in to your account</Text>
        </View>

        {/* Card */}
        <View className="bg-white rounded-2xl border border-slate-200 p-6"
          style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 }}>

          {/* Error banner */}
          {error !== '' && (
            <View className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-rose-700 font-semibold text-sm text-center">{error}</Text>
            </View>
          )}

          {/* Username */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-700 mb-1.5">Username</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-slate-50"
              placeholder="your_username"
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ fontSize: 15 }}
            />
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text className="text-xs font-bold text-slate-700 mb-1.5">Password</Text>
            <View className="border border-slate-300 rounded-xl bg-slate-50 flex-row items-center pr-3">
              <TextInput
                className="flex-1 px-4 py-3 text-slate-900"
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                style={{ fontSize: 15 }}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Text className="text-slate-400 text-sm">{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="rounded-xl py-3.5 items-center"
            style={{ backgroundColor: loading ? '#7dd3fc' : '#0284c7', opacity: loading ? 0.8 : 1 }}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base">🚀 Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Signup link */}
          <TouchableOpacity onPress={onGoSignup} className="mt-4 items-center">
            <Text className="text-sm text-slate-500">
              {"Don't have an account?"}{' '}
              <Text style={{ color: '#0284c7', fontWeight: '700' }}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── App Store Reviewer Quick Access ── */}
        <View className="mt-6 bg-sky-50 border border-sky-200 rounded-2xl p-4">
          <Text className="text-xs font-extrabold text-sky-900 text-center mb-1">
            ⚡ App Store Reviewer One-Tap Access
          </Text>
          <Text className="text-slate-500 text-center mb-3" style={{ fontSize: 11 }}>
            Tap a demo role below to sign in instantly with seeded demo accounts:
          </Text>
          <View className="flex-col gap-2">
            <TouchableOpacity
              onPress={async () => {
                setUsername('demoAdmin');
                setPassword('demo12345');
                setError('');
                setLoading(true);
                try {
                  await login({ username: 'demoAdmin', password: 'demo12345' });
                  onLoginSuccess?.();
                } catch {
                  setError('Demo admin login failed. Please check backend connection.');
                } finally {
                  setLoading(false);
                }
              }}
              className="py-2.5 bg-amber-600 rounded-xl items-center flex-row justify-center gap-1.5"
              activeOpacity={0.8}>
              <Text className="text-white font-bold text-xs">👑 Super Admin (demoAdmin)</Text>
            </TouchableOpacity>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={async () => {
                  setUsername('demoBuildingAdmin');
                  setPassword('demo12345');
                  setError('');
                  setLoading(true);
                  try {
                    await login({ username: 'demoBuildingAdmin', password: 'demo12345' });
                    onLoginSuccess?.();
                  } catch {
                    setError('Demo building admin login failed. Please check backend connection.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex-1 py-2.5 bg-sky-600 rounded-xl items-center"
                activeOpacity={0.8}>
                <Text className="text-white font-bold text-xs">🏢 Building Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  setUsername('demoResident');
                  setPassword('demo12345');
                  setError('');
                  setLoading(true);
                  try {
                    await login({ username: 'demoResident', password: 'demo12345' });
                    onLoginSuccess?.();
                  } catch {
                    setError('Demo resident login failed. Please check backend connection.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex-1 py-2.5 bg-emerald-600 rounded-xl items-center"
                activeOpacity={0.8}>
                <Text className="text-white font-bold text-xs">🏠 Resident</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text className="text-center text-slate-400 mt-6" style={{ fontSize: 11 }}>
          Society Finance Tracker v1.4 • Secure Login
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginPage;
