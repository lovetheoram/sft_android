/**
 * AdminUserPanel — User Management (React Native)
 * - User list with role badges and flat info
 * - Edit user modal (role, flat assignment)
 * - Delete with "DELETE" string confirmation modal
 * - On-Behalf Payment modal for cash collection
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert, FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../../user_utils/api';
import financeService from '../../user_utils/services/financeService';

const RoleBadge = ({ role, hasFLat }) => {
  const isSuperAdmin = role === 'admin' && !hasFLat;
  const isBuildingAdmin = role === 'admin' && hasFLat;
  const s = isSuperAdmin
    ? { bg: '#fef3c7', border: '#fde68a', text: '#92400e', label: 'Super Admin' }
    : isBuildingAdmin
    ? { bg: '#e0f2fe', border: '#bae6fd', text: '#075985', label: 'Bldg Admin' }
    : { bg: '#d1fae5', border: '#a7f3d0', text: '#065f46', label: 'Resident' };
  return (
    <View className="px-2 py-0.5 rounded-full border" style={{ backgroundColor: s.bg, borderColor: s.border }}>
      <Text style={{ color: s.text, fontSize: 10, fontWeight: '800' }}>{s.label}</Text>
    </View>
  );
};

const AdminUserPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [flats, setFlats] = useState([]);

  // Edit modal
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('resident');
  const [editFlatId, setEditFlatId] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  // On-behalf payment modal
  const [payUser, setPayUser] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [paySubmitting, setPaySubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/users/', { params: { limit: 50 } });
      const list = Array.isArray(data) ? data : (data?.results || []);
      setUsers(list);
    } catch { Alert.alert('Error', 'Failed to load users.'); }
    finally { setLoading(false); }
  };

  const fetchFlats = async () => {
    try {
      const { data } = await apiClient.get('/flat/');
      setFlats(Array.isArray(data) ? data : (data?.results || []));
    } catch { /* silent */ }
  };

  useEffect(() => { fetchUsers(); fetchFlats(); }, []);

  const filteredUsers = users.filter((u) =>
    searchQuery.trim() === '' ||
    `${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      await apiClient.patch(`/users/${editUser.id}/`, { role: editRole, flat: editFlatId || null });
      Alert.alert('Success', 'User updated.');
      setEditUser(null);
      fetchUsers();
    } catch { Alert.alert('Error', 'Failed to update user.'); }
    finally { setEditSaving(false); }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget || deleteInput !== 'DELETE') return;
    setDeleting(true);
    try {
      await apiClient.delete(`/users/${deleteTarget.id}/`);
      Alert.alert('Deleted', `${deleteTarget.username} has been removed.`);
      setDeleteTarget(null);
      setDeleteInput('');
      fetchUsers();
    } catch { Alert.alert('Error', 'Failed to delete user.'); }
    finally { setDeleting(false); }
  };

  const handleOnBehalfPayment = async () => {
    if (!payUser || !payAmount.trim()) return;
    setPaySubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', payAmount);
      formData.append('date', payDate);
      formData.append('member_id', payUser.member?.id || payUser.id);
      await financeService.createIncome(formData);
      Alert.alert('Success', `Cash payment of ₹${payAmount} recorded for ${payUser.username}.`);
      setPayUser(null);
      setPayAmount('');
    } catch { Alert.alert('Error', 'Failed to record payment.'); }
    finally { setPaySubmitting(false); }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-4">

          {/* Header */}
          <View className="bg-white rounded-2xl border border-slate-200 p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-lg font-bold text-slate-900">👥 User Management</Text>
                <Text className="text-slate-500" style={{ fontSize: 11 }}>Manage resident and admin accounts</Text>
              </View>
              <TouchableOpacity onPress={fetchUsers} className="p-2 border border-slate-200 rounded-xl bg-slate-50">
                <Text>🔄</Text>
              </TouchableOpacity>
            </View>
            <View className="border border-slate-200 rounded-xl px-3 py-2 flex-row items-center bg-slate-50">
              <Text className="text-slate-400 mr-2">🔍</Text>
              <TextInput
                placeholder="Search users by name, username, email..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-slate-900"
                style={{ fontSize: 13 }}
              />
            </View>
          </View>

          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#0284c7" />
            </View>
          ) : filteredUsers.length === 0 ? (
            <View className="bg-white border border-slate-200 rounded-2xl p-10 items-center">
              <Text style={{ fontSize: 36 }}>👥</Text>
              <Text className="text-slate-500 mt-2 text-sm">No users found</Text>
            </View>
          ) : (
            filteredUsers.map((u) => (
              <View key={u.id} className="bg-white rounded-2xl border border-slate-200 p-4"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 }}>
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900">{u.first_name || u.username} {u.last_name || ''}</Text>
                    <Text className="text-slate-500 font-mono" style={{ fontSize: 11 }}>@{u.username}</Text>
                    {u.email && <Text className="text-slate-400" style={{ fontSize: 11 }}>{u.email}</Text>}
                    {u.flat && (
                      <Text className="text-slate-500 mt-0.5" style={{ fontSize: 11 }}>
                        🏠 {u.flat?.number || u.flat} · {u.flat?.building?.name || ''}
                      </Text>
                    )}
                  </View>
                  <RoleBadge role={u.role} hasFLat={!!u.flat} />
                </View>

                <View className="flex-row flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
                  <TouchableOpacity
                    onPress={() => { setEditUser(u); setEditRole(u.role); setEditFlatId(u.flat?.id || ''); }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
                    <Text className="text-slate-700 font-bold text-xs">✏️ Edit</Text>
                  </TouchableOpacity>
                  {u.flat && (
                    <TouchableOpacity
                      onPress={() => setPayUser(u)}
                      className="px-3 py-2 rounded-xl"
                      style={{ backgroundColor: '#059669' }}>
                      <Text className="text-white font-bold text-xs">💵 Make Payment</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => { setDeleteTarget(u); setDeleteInput(''); }}
                    className="px-3 py-2 rounded-xl border border-rose-200"
                    style={{ backgroundColor: '#fff1f2' }}>
                    <Text style={{ color: '#e11d48', fontSize: 12, fontWeight: '700' }}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        <View className="h-6" />
      </ScrollView>

      {/* Edit User Modal */}
      <Modal visible={!!editUser} animationType="slide" transparent onRequestClose={() => setEditUser(null)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl p-5 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-slate-900">✏️ Edit @{editUser?.username}</Text>
              <TouchableOpacity onPress={() => setEditUser(null)}>
                <Text className="text-slate-400 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-xs font-bold text-slate-700 mb-1">Role</Text>
            <View className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden mb-3" style={{ height: 48 }}>
              <Picker selectedValue={editRole} onValueChange={setEditRole} style={{ height: 48 }}>
                <Picker.Item label="Resident" value="resident" />
                <Picker.Item label="Admin" value="admin" />
              </Picker>
            </View>
            <Text className="text-xs font-bold text-slate-700 mb-1">Flat Assignment</Text>
            <View className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden mb-4" style={{ height: 48 }}>
              <Picker selectedValue={editFlatId} onValueChange={(v) => setEditFlatId(v)} style={{ height: 48 }}>
                <Picker.Item label="— No flat (Super Admin) —" value="" />
                {flats.map((f) => (
                  <Picker.Item key={f.id} label={`${f.building?.name || ''} - ${f.number}`} value={f.id} />
                ))}
              </Picker>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setEditUser(null)} className="flex-1 py-3 rounded-xl items-center border border-slate-200 bg-slate-100">
                <Text className="text-slate-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} disabled={editSaving} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: editSaving ? '#7dd3fc' : '#0284c7' }}>
                {editSaving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteTarget} animationType="slide" transparent onRequestClose={() => setDeleteTarget(null)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl p-5 pb-8">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold" style={{ color: '#e11d48' }}>🗑️ Delete User</Text>
              <TouchableOpacity onPress={() => setDeleteTarget(null)}>
                <Text className="text-slate-400 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            <View className="p-3 rounded-xl border border-rose-200 mb-4" style={{ backgroundColor: '#fff1f2' }}>
              <Text className="font-bold text-slate-900">@{deleteTarget?.username}</Text>
              <Text className="text-slate-500 text-xs">{deleteTarget?.email}</Text>
              <Text className="text-slate-500 text-xs">{deleteTarget?.role} · {deleteTarget?.flat?.number || 'No flat'}</Text>
            </View>
            <Text className="text-slate-700 text-sm font-semibold mb-2">
              Type <Text className="font-black" style={{ color: '#e11d48' }}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              className="border border-rose-300 rounded-xl px-4 py-3 bg-rose-50 text-slate-900 mb-4"
              placeholder="Type DELETE here..."
              placeholderTextColor="#94a3b8"
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="characters"
              style={{ fontSize: 15 }}
            />
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl items-center border border-slate-200 bg-slate-100">
                <Text className="text-slate-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteUser}
                disabled={deleteInput !== 'DELETE' || deleting}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: deleteInput === 'DELETE' ? '#e11d48' : '#f87171', opacity: deleteInput === 'DELETE' && !deleting ? 1 : 0.5 }}>
                {deleting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Delete User</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* On-Behalf Payment Modal */}
      <Modal visible={!!payUser} animationType="slide" transparent onRequestClose={() => setPayUser(null)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl p-5 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-slate-900">💵 Cash Collection</Text>
              <TouchableOpacity onPress={() => setPayUser(null)}>
                <Text className="text-slate-400 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            <View className="p-3 rounded-xl border border-sky-200 mb-4" style={{ backgroundColor: '#f0f9ff' }}>
              <Text className="font-bold text-slate-900 text-sm">Recording payment for:</Text>
              <Text className="text-slate-600 mt-0.5">@{payUser?.username} · {payUser?.flat?.number || ''}</Text>
            </View>
            <Text className="text-xs font-bold text-slate-700 mb-1">Amount (₹) *</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-3"
              keyboardType="numeric"
              placeholder="e.g. 2000"
              placeholderTextColor="#94a3b8"
              value={payAmount}
              onChangeText={setPayAmount}
              style={{ fontSize: 15 }}
            />
            <Text className="text-xs font-bold text-slate-700 mb-1">Payment Date</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-4"
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={payDate}
              onChangeText={setPayDate}
              style={{ fontSize: 15 }}
            />
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setPayUser(null)} className="flex-1 py-3 rounded-xl items-center border border-slate-200 bg-slate-100">
                <Text className="text-slate-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOnBehalfPayment} disabled={paySubmitting} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: paySubmitting ? '#7dd3fc' : '#059669' }}>
                {paySubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Record Payment</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminUserPanel;
