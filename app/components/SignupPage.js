/**
 * SignupPage — Modern Sky Blue Redesign (React Native)
 * - Clean sectioned card layout (Personal Details, Security, Role & Property Association)
 * - Interactive Role Pills (Resident vs Building Admin)
 * - Password visibility toggle
 * - Uses updated CustomSelect (ScrollView map — zero VirtualizedList nesting warnings)
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import buildingService from '../user_utils/services/buildingService';
import apiClient from '../user_utils/api';
import CustomSelect from './common/CustomSelect';

const SignupPage = ({ onSignupSuccess, onGoLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('resident');
  const [buildings, setBuildings] = useState([]);
  const [flats, setFlats] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFlat, setSelectedFlat] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch building directory on mount
  useEffect(() => {
    let isMounted = true;
    buildingService.getBuildings()
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.results || []);
        if (isMounted) setBuildings(list);
      })
      .catch(() => { /* silent fallback */ });
    return () => { isMounted = false; };
  }, []);

  // Fetch flats when building selection changes
  useEffect(() => {
    let isMounted = true;
    if (selectedBuilding) {
      buildingService.getFlats({ building_id: selectedBuilding })
        .then(res => {
          const list = Array.isArray(res) ? res : (res?.results || []);
          if (isMounted) setFlats(list);
        })
        .catch(() => {
          if (isMounted) setFlats([]);
        });
    } else {
      setFlats([]);
      setSelectedFlat('');
    }
    return () => { isMounted = false; };
  }, [selectedBuilding]);

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password || !password2 || !firstName.trim() || !lastName.trim() || !phone.trim()) {
      setErrorMsg('Please complete all standard fields.');
      return;
    }
    if (password !== password2) {
      setErrorMsg('Passwords do not match. Please verify both entries.');
      return;
    }
    if (role === 'resident' && (!selectedBuilding || !selectedFlat)) {
      setErrorMsg('Please select your Building and Flat number.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    const payload = {
      username: username.trim(),
      email: email.trim(),
      password,
      password2,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      role,
      building_id: selectedBuilding ? parseInt(selectedBuilding, 10) : null,
      flat_id: selectedFlat ? parseInt(selectedFlat, 10) : null,
      invite_code: inviteCode.trim(),
    };

    try {
      await apiClient.post('/signup/', payload);
      Alert.alert('Registration Successful 🎉', 'Your account has been created! Please sign in with your credentials.', [
        {
          text: 'Sign In Now',
          onPress: () => {
            onSignupSuccess?.();
            onGoLogin?.();
          }
        }
      ]);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.username?.[0] || 'Registration failed. Please check details.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const isResident = role === 'resident';
  const isAdmin = role === 'admin';

  const buildingOptions = buildings.map((b) => ({ label: b.name, value: String(b.id) }));
  const flatOptions = flats.map((f) => ({ label: `Flat ${f.number}`, value: String(f.id) }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#f8fafc' }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── Header Hero Banner ── */}
        <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 }}>
          <View style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            borderRadius: 80, backgroundColor: 'rgba(14,165,233,0.15)',
          }} />
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 54, height: 54, borderRadius: 16, backgroundColor: '#0284c7',
              alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              shadowColor: '#0284c7', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
            }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>SF</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#f8fafc', textAlign: 'center' }}>
              Create Your Account
            </Text>
            <Text style={{ fontSize: 12.5, color: '#94a3b8', textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
              Join your society portal to manage dues, complaints & notices.
            </Text>
          </View>
        </View>

        {/* ── Form Body ── */}
        <View style={{ paddingHorizontal: 16, marginTop: -16 }}>

          {/* Global Error Banner */}
          {errorMsg !== '' && (
            <View style={{
              backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
              borderRadius: 14, padding: 12, marginBottom: 14,
            }}>
              <Text style={{ color: '#b91c1c', fontWeight: '700', fontSize: 12.5, textAlign: 'center' }}>
                ⚠️ {errorMsg}
              </Text>
            </View>
          )}

          {/* ── Section 1: Role Selection ── */}
          <View style={{
            backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0',
            padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              1. Account Type
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setRole('resident')}
                activeOpacity={0.8}
                style={{
                  flex: 1, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5,
                  alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
                  backgroundColor: isResident ? '#f0f9ff' : '#f8fafc',
                  borderColor: isResident ? '#0284c7' : '#cbd5e1',
                }}>
                <Ionicons name="home" size={16} color={isResident ? '#0284c7' : '#64748b'} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: isResident ? '#0284c7' : '#475569' }}>
                  Resident
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('admin')}
                activeOpacity={0.8}
                style={{
                  flex: 1, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5,
                  alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
                  backgroundColor: isAdmin ? '#fffbeb' : '#f8fafc',
                  borderColor: isAdmin ? '#d97706' : '#cbd5e1',
                }}>
                <Ionicons name="shield-checkmark" size={16} color={isAdmin ? '#d97706' : '#64748b'} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: isAdmin ? '#d97706' : '#475569' }}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Section 2: Personal Profile ── */}
          <View style={{
            backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0',
            padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              2. Personal Details
            </Text>

            {/* First + Last Name row */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155', marginBottom: 4 }}>First Name</Text>
                <TextInput
                  style={{
                    borderWidth: 1.2, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12,
                    paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc',
                  }}
                  placeholder="John"
                  placeholderTextColor="#94a3b8"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155', marginBottom: 4 }}>Last Name</Text>
                <TextInput
                  style={{
                    borderWidth: 1.2, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12,
                    paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc',
                  }}
                  placeholder="Doe"
                  placeholderTextColor="#94a3b8"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Username */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155', marginBottom: 4 }}>Username</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderColor: '#cbd5e1',
                borderRadius: 12, backgroundColor: '#f8fafc', paddingHorizontal: 12,
              }}>
                <Ionicons name="at" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: '#0f172a' }}
                  placeholder="johndoe123"
                  placeholderTextColor="#94a3b8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155', marginBottom: 4 }}>Email Address</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderColor: '#cbd5e1',
                borderRadius: 12, backgroundColor: '#f8fafc', paddingHorizontal: 12,
              }}>
                <Ionicons name="mail-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: '#0f172a' }}
                  placeholder="john@example.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone */}
            <View>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155', marginBottom: 4 }}>Phone Number</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderColor: '#cbd5e1',
                borderRadius: 12, backgroundColor: '#f8fafc', paddingHorizontal: 12,
              }}>
                <Ionicons name="call-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: '#0f172a' }}
                  placeholder="9876543210"
                  placeholderTextColor="#94a3b8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* ── Section 3: Security Credentials ── */}
          <View style={{
            backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0',
            padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              3. Password Credentials
            </Text>

            {/* Password */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155', marginBottom: 4 }}>Password</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderColor: '#cbd5e1',
                borderRadius: 12, backgroundColor: '#f8fafc', paddingHorizontal: 12,
              }}>
                <Ionicons name="lock-closed-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: '#0f172a' }}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155', marginBottom: 4 }}>Confirm Password</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderColor: '#cbd5e1',
                borderRadius: 12, backgroundColor: '#f8fafc', paddingHorizontal: 12,
              }}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: '#0f172a' }}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password2}
                  onChangeText={setPassword2}
                  secureTextEntry={!showPass2}
                />
                <TouchableOpacity onPress={() => setShowPass2(!showPass2)}>
                  <Ionicons name={showPass2 ? "eye-off-outline" : "eye-outline"} size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Section 4: Property & Building Details ── */}
          <View style={{
            backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0',
            padding: 16, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              4. Property & Society Details
            </Text>

            {isAdmin && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#d97706', marginBottom: 4 }}>
                  Admin Passcode (Invite Code)
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1.2, borderColor: '#fcd34d', borderRadius: 12, paddingHorizontal: 12,
                    paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#fffbeb',
                  }}
                  placeholder="Enter admin invite code"
                  placeholderTextColor="#94a3b8"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {(isResident || (isAdmin && inviteCode.trim() === 'BUILDINGADMIN123')) && (
              <>
                <CustomSelect
                  label="Select Building / Tower"
                  value={selectedBuilding}
                  options={buildingOptions}
                  onValueChange={(val) => setSelectedBuilding(val)}
                  placeholder="Choose Building..."
                  icon="business-outline"
                />

                <CustomSelect
                  label="Select Flat / Unit Number"
                  value={selectedFlat}
                  options={flatOptions}
                  onValueChange={(val) => setSelectedFlat(val)}
                  placeholder={selectedBuilding ? "Choose Flat..." : "Select building first"}
                  disabled={!selectedBuilding}
                  icon="home-outline"
                />
              </>
            )}
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
            style={{
              backgroundColor: loading ? '#7dd3fc' : '#0284c7',
              borderRadius: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
              shadowColor: '#0284c7', shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
            }}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '900' }}>
                🚀 Complete Registration
              </Text>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <TouchableOpacity
            onPress={onGoLogin}
            style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>
              Already registered?{' '}
              <Text style={{ color: '#0284c7', fontWeight: '800' }}>Sign In →</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupPage;
