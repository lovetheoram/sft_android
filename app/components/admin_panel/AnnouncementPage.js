/**
 * AnnouncementPage — Priority badges, Create/Edit/Delete (React Native)
 * Uses centralized societyService — no more authHeader prop
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../user_utils/AuthContext';
import societyService from '../../user_utils/services/societyService';

const PRIORITIES = [
  { value: 'general', label: '📢 General', bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
  { value: 'maintenance', label: '🛠️ Maintenance', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  { value: 'urgent', label: '🚨 Urgent', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
];

const PriorityBadge = ({ priority }) => {
  const p = PRIORITIES.find((x) => x.value === (priority || 'general').toLowerCase()) || PRIORITIES[0];
  return (
    <View className="px-2 py-0.5 rounded-full border" style={{ backgroundColor: p.bg, borderColor: p.border }}>
      <Text style={{ color: p.text, fontSize: 10, fontWeight: '800' }}>{p.label}</Text>
    </View>
  );
};

const AnnouncementPage = () => {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formPriority, setFormPriority] = useState('general');
  const [formSaving, setFormSaving] = useState(false);

  // Edit state
  const [editItem, setEditItem] = useState(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await societyService.getAnnouncements({ limit: 30 });
      const list = Array.isArray(res) ? res : (res?.results || []);
      setAnnouncements(list);
    } catch { Alert.alert('Error', 'Failed to load announcements.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setFormTitle('');
    setFormMessage('');
    setFormPriority('general');
    setShowCreateModal(true);
  };

  const openEdit = (a) => {
    setEditItem(a);
    setFormTitle(a.title);
    setFormMessage(a.message || a.content || '');
    setFormPriority(a.priority || 'general');
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      Alert.alert('Required', 'Title and message are both required.'); return;
    }
    setFormSaving(true);
    try {
      const payload = { title: formTitle.trim(), message: formMessage.trim(), priority: formPriority };
      if (editItem) {
        await societyService.updateAnnouncement(editItem.id, payload);
        Alert.alert('Success', 'Announcement updated.');
      } else {
        await societyService.createAnnouncement(payload);
        Alert.alert('Success', 'Announcement posted!');
      }
      setShowCreateModal(false);
      fetchAnnouncements();
    } catch {
      Alert.alert('Error', editItem ? 'Failed to update.' : 'Failed to post announcement.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Announcement', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await societyService.deleteAnnouncement(id);
          fetchAnnouncements();
        } catch { Alert.alert('Error', 'Failed to delete.'); }
      }},
    ]);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-4">

          {/* Header */}
          <View className="bg-white rounded-2xl border border-slate-200 p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-slate-900">📢 Announcements</Text>
                <Text className="text-slate-500" style={{ fontSize: 11 }}>Official society broadcasts</Text>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={fetchAnnouncements} className="p-2 border border-slate-200 rounded-xl">
                  <Text>🔄</Text>
                </TouchableOpacity>
                {isAdmin && (
                  <TouchableOpacity
                    onPress={openCreate}
                    className="px-3 py-2 rounded-xl"
                    style={{ backgroundColor: '#0284c7' }}>
                    <Text className="text-white font-bold text-xs">+ Post</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {loading ? (
            <View className="items-center py-12"><ActivityIndicator size="large" color="#0284c7" /></View>
          ) : announcements.length === 0 ? (
            <View className="bg-white border border-slate-200 rounded-2xl p-10 items-center">
              <Text style={{ fontSize: 40 }}>📢</Text>
              <Text className="text-slate-600 font-semibold mt-2 text-sm">No announcements yet</Text>
              <Text className="text-slate-400 mt-1" style={{ fontSize: 11 }}>
                {isAdmin ? 'Post your first announcement above.' : 'No announcements for your building yet.'}
              </Text>
            </View>
          ) : (
            announcements.map((a) => (
              <View key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 }}>
                <View className="flex-row items-start justify-between gap-2 mb-2">
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900 text-sm">{a.title}</Text>
                    <Text className="text-slate-400 font-mono mt-0.5" style={{ fontSize: 10 }}>
                      {new Date(a.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-col items-end gap-1">
                    <PriorityBadge priority={a.priority} />
                    {!a.building && (
                      <View className="px-2 py-0.5 rounded-md border border-violet-200" style={{ backgroundColor: '#f5f3ff' }}>
                        <Text style={{ color: '#6d28d9', fontSize: 9, fontWeight: '700' }}>👑 Global</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text className="text-slate-700 text-xs leading-relaxed">{a.message || a.content}</Text>
                {isAdmin && (
                  <View className="flex-row gap-2 mt-3 pt-2.5 border-t border-slate-100">
                    <TouchableOpacity onPress={() => openEdit(a)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
                      <Text className="text-slate-700 font-bold text-xs">✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(a.id)} className="px-3 py-2 rounded-xl border border-rose-200" style={{ backgroundColor: '#fff1f2' }}>
                      <Text style={{ color: '#e11d48', fontSize: 12, fontWeight: '700' }}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
        <View className="h-6" />
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent onRequestClose={() => setShowCreateModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl p-5 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-slate-900">
                {editItem ? '✏️ Edit Announcement' : '📢 Post Announcement'}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text className="text-slate-400 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-bold text-slate-700 mb-1">Title *</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-3"
              placeholder="e.g. Water supply disruption on Tuesday..." placeholderTextColor="#94a3b8"
              value={formTitle} onChangeText={setFormTitle} style={{ fontSize: 14 }} />

            <Text className="text-xs font-bold text-slate-700 mb-1">Message *</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-3"
              placeholder="Write the full announcement..." placeholderTextColor="#94a3b8"
              value={formMessage} onChangeText={setFormMessage}
              multiline numberOfLines={4} style={{ fontSize: 14, minHeight: 90, textAlignVertical: 'top' }} />

            <Text className="text-xs font-bold text-slate-700 mb-1">Priority</Text>
            <View className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden mb-4" style={{ height: 48 }}>
              <Picker selectedValue={formPriority} onValueChange={setFormPriority} style={{ height: 48 }}>
                {PRIORITIES.map((p) => (
                  <Picker.Item key={p.value} label={p.label} value={p.value} />
                ))}
              </Picker>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl items-center border border-slate-200 bg-slate-100">
                <Text className="text-slate-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={formSaving} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: formSaving ? '#7dd3fc' : '#0284c7' }}>
                {formSaving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Post Announcement</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AnnouncementPage;
