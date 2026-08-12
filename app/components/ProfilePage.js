/**
 * ProfilePage — User Profile & Settings (React Native)
 * - View/edit profile info
 * - Change password section
 * - Sign out
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../user_utils/AuthContext';
import apiClient from '../user_utils/api';
import ConfirmModal from './common/ConfirmModal';

const ProfilePage = ({ onNavigateBack }) => {
  const { user, setUser, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Change password state
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const handleChangePassword = async () => {
    setPwdError('');
    if (!pwdForm.old_password || !pwdForm.new_password || !pwdForm.confirm_password) {
      return setPwdError('All fields are required.');
    }
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      return setPwdError('New passwords do not match.');
    }
    if (pwdForm.new_password.length < 8) {
      return setPwdError('New password must be at least 8 characters.');
    }
    setPwdSaving(true);
    try {
      await apiClient.post('/auth/change-password/', {
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      Alert.alert('Success', 'Password changed successfully!');
      setPwdForm({ old_password: '', new_password: '', confirm_password: '' });
      setShowPwdSection(false);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.old_password?.[0] || 'Failed to change password.';
      setPwdError(msg);
    } finally {
      setPwdSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await apiClient.patch('/currentUser/', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
      });
      setUser({ ...user, ...data });
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '' });
    setEditMode(false);
  };

  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username;
  const initials = (user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase();
  const isSuperAdmin = user?.role === 'admin' && !user?.flat;
  const isBuildingAdmin = user?.role === 'admin' && !!user?.flat;
  const roleBadgeLabel = isSuperAdmin ? 'Super Admin' : isBuildingAdmin ? 'Building Admin' : 'Resident';
  const roleBadgeColor = isSuperAdmin ? '#92400e' : isBuildingAdmin ? '#075985' : '#065f46';
  const roleBadgeBg = isSuperAdmin ? '#fef3c7' : isBuildingAdmin ? '#e0f2fe' : '#d1fae5';

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="p-4 space-y-4">

        {/* Profile header card */}
        <View className="bg-white rounded-2xl border border-slate-200 p-5 items-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
          {/* Avatar circle */}
          <View className="w-20 h-20 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: '#0284c7' }}>
            <Text className="text-white text-3xl font-black">{initials}</Text>
          </View>
          <Text className="text-xl font-extrabold text-slate-900">{displayName}</Text>
          <Text className="text-slate-500 font-mono mt-0.5" style={{ fontSize: 13 }}>@{user?.username}</Text>
          {user?.email && <Text className="text-slate-400 mt-0.5" style={{ fontSize: 12 }}>{user.email}</Text>}

          <View className="flex-row items-center gap-2 mt-3">
            <View className="px-3 py-1 rounded-full border" style={{ backgroundColor: roleBadgeBg, borderColor: roleBadgeColor + '44' }}>
              <Text style={{ color: roleBadgeColor, fontSize: 11, fontWeight: '700' }}>{roleBadgeLabel}</Text>
            </View>
            {user?.flat && (
              <View className="px-3 py-1 rounded-full border border-sky-200" style={{ backgroundColor: '#f0f9ff' }}>
                <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '700' }}>
                  🏠 Flat {user.flat.number} · {user.flat.building?.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Editable Fields */}
        <View className="bg-white rounded-2xl border border-slate-200 p-5"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-slate-900">Profile Details</Text>
            {!editMode && (
              <TouchableOpacity onPress={() => setEditMode(true)} className="px-3 py-1.5 rounded-xl border border-sky-200" style={{ backgroundColor: '#f0f9ff' }}>
                <Text style={{ color: '#0284c7', fontSize: 12, fontWeight: '700' }}>✏️ Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Username & Email — read-only */}
          <ProfileField label="Username" value={`@${user?.username}`} />
          <ProfileField label="Email" value={user?.email || '—'} />

          {/* Editable fields */}
          <EditableField
            label="First Name"
            value={form.first_name}
            editable={editMode}
            onChangeText={(v) => setForm({ ...form, first_name: v })}
          />
          <EditableField
            label="Last Name"
            value={form.last_name}
            editable={editMode}
            onChangeText={(v) => setForm({ ...form, last_name: v })}
          />
          <EditableField
            label="Phone"
            value={form.phone}
            editable={editMode}
            keyboardType="phone-pad"
            onChangeText={(v) => setForm({ ...form, phone: v })}
          />

          {/* Save/Cancel */}
          {editMode && (
            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity onPress={handleCancel} className="flex-1 py-3 rounded-xl items-center border border-slate-200 bg-slate-100">
                <Text className="text-slate-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: saving ? '#7dd3fc' : '#0284c7' }}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Save Changes</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Change Password ── */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
          <TouchableOpacity
            onPress={() => setShowPwdSection(!showPwdSection)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="lock-closed-outline" size={18} color="#92400e" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>Change Password</Text>
            </View>
            <Ionicons name={showPwdSection ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
          </TouchableOpacity>

          {showPwdSection && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 12 }}>
              {pwdError ? (
                <View style={{ backgroundColor: '#fff1f2', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#fecdd3', marginTop: 12 }}>
                  <Text style={{ color: '#e11d48', fontSize: 12, fontWeight: '600' }}>⚠️ {pwdError}</Text>
                </View>
              ) : null}

              <View style={{ marginTop: pwdError ? 0 : 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 5 }}>Current Password</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' }}>
                  <TextInput
                    value={pwdForm.old_password}
                    onChangeText={(v) => setPwdForm({ ...pwdForm, old_password: v })}
                    placeholder="Enter current password"
                    secureTextEntry={!showOldPwd}
                    placeholderTextColor="#94a3b8"
                    style={{ flex: 1, paddingVertical: 11, fontSize: 14, color: '#0f172a' }}
                    returnKeyType="next"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowOldPwd(!showOldPwd)} activeOpacity={0.7}>
                    <Ionicons name={showOldPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 5 }}>New Password</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' }}>
                  <TextInput
                    value={pwdForm.new_password}
                    onChangeText={(v) => setPwdForm({ ...pwdForm, new_password: v })}
                    placeholder="At least 8 characters"
                    secureTextEntry={!showNewPwd}
                    placeholderTextColor="#94a3b8"
                    style={{ flex: 1, paddingVertical: 11, fontSize: 14, color: '#0f172a' }}
                    returnKeyType="next"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowNewPwd(!showNewPwd)} activeOpacity={0.7}>
                    <Ionicons name={showNewPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 5 }}>Confirm New Password</Text>
                <TextInput
                  value={pwdForm.confirm_password}
                  onChangeText={(v) => setPwdForm({ ...pwdForm, confirm_password: v })}
                  placeholder="Repeat new password"
                  secureTextEntry
                  placeholderTextColor="#94a3b8"
                  style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0f172a', backgroundColor: '#fff' }}
                  returnKeyType="done"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={pwdSaving}
                style={{ paddingVertical: 13, borderRadius: 12, backgroundColor: pwdSaving ? '#94a3b8' : '#0284c7', alignItems: 'center', marginTop: 4 }}
                activeOpacity={0.7}
              >
                {pwdSaving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Update Password</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={() => setShowSignOutModal(true)}
          style={{
            backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
            borderColor: '#fecdd3', padding: 16,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#e11d48" />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#e11d48' }}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </View>

      <ConfirmModal
        visible={showSignOutModal}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
        cancelLabel="Stay"
        destructive
        onConfirm={logout}
        onCancel={() => setShowSignOutModal(false)}
      />
    </ScrollView>
  );
};

const ProfileField = ({ label, value }) => (
  <View className="mb-4">
    <Text className="text-xs font-bold text-slate-500 mb-1">{label}</Text>
    <View className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
      <Text className="text-slate-700 font-medium text-sm">{value || '—'}</Text>
    </View>
  </View>
);

const EditableField = ({ label, value, editable, onChangeText, keyboardType }) => (
  <View className="mb-4">
    <Text className="text-xs font-bold text-slate-700 mb-1">{label}</Text>
    {editable ? (
      <TextInput
        className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        placeholder={label}
        placeholderTextColor="#94a3b8"
        style={{ fontSize: 14 }}
      />
    ) : (
      <View className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
        <Text className="text-slate-700 font-medium text-sm">{value || '—'}</Text>
      </View>
    )}
  </View>
);

export default ProfilePage;
