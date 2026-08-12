/**
 * AdminComplaintPage — Threaded Helpdesk (React Native)
 * - Status filter + Load Complaints (lazy)
 * - Each ticket: sender, description, admin remark, threaded comments
 * - Reply input per ticket thread
 * - Bottom sheet modal for status + remark update
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert, FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import societyService from '../../user_utils/services/societyService';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'On-Going / In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'revoked', label: 'Revoked' },
];

const StatusBadge = ({ status }) => {
  const styles = {
    resolved:    { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', label: '✓ Resolved' },
    in_progress: { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1', label: '◷ On-Going' },
    closed:      { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', label: '🔒 Closed' },
    revoked:     { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', label: '✕ Revoked' },
  };
  const s = styles[status] || { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: '● Open' };
  return (
    <View className="px-2 py-0.5 rounded-full border" style={{ backgroundColor: s.bg, borderColor: s.border }}>
      <Text style={{ color: s.text, fontSize: 10, fontWeight: '800' }}>{s.label}</Text>
    </View>
  );
};

const AdminComplaintPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  // Remark modal state
  const [activeRemarkId, setActiveRemarkId] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [targetStatus, setTargetStatus] = useState('open');
  const [remarkSaving, setRemarkSaving] = useState(false);

  // Per-ticket reply state
  const [replyTextMap, setReplyTextMap] = useState({});
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchComplaints = async (reset = true) => {
    const newOffset = reset ? 0 : offset;
    setLoading(true);
    try {
      const params = { limit: 10, offset: newOffset };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await societyService.getComplaints(params);
      const items = Array.isArray(res) ? res : (res?.results || []);
      const totalCount = res?.count || items.length;
      setComplaints(reset ? items : [...complaints, ...items]);
      setTotal(totalCount);
      setOffset(newOffset + items.length);
      setHasMore(newOffset + items.length < totalCount);
      setFetched(true);
    } catch {
      Alert.alert('Error', 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (complaintId) => {
    const text = (replyTextMap[complaintId] || '').trim();
    if (!text) return;
    setSubmittingReply(true);
    try {
      await societyService.addComplaintComment({ complaint: complaintId, message: text });
      setReplyTextMap((prev) => ({ ...prev, [complaintId]: '' }));
      fetchComplaints(true);
    } catch {
      Alert.alert('Error', 'Failed to post comment.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleOpenRemarkModal = (c, newStatus) => {
    setActiveRemarkId(c.id);
    setTargetStatus(newStatus || c.status);
    setRemarkText(c.admin_remark || '');
  };

  const handleSaveRemark = async () => {
    if (!activeRemarkId) return;
    setRemarkSaving(true);
    try {
      await societyService.updateComplaint(activeRemarkId, {
        status: targetStatus,
        admin_remark: remarkText.trim(),
      });
      Alert.alert('Success', `Ticket updated to ${targetStatus.replace('_', ' ')}.`);
      setActiveRemarkId(null);
      fetchComplaints(true);
    } catch {
      Alert.alert('Error', 'Failed to update ticket.');
    } finally {
      setRemarkSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-4">

          {/* Header + Filter */}
          <View className="bg-white rounded-2xl border border-slate-200 p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
            <View className="flex-row items-start justify-between mb-3">
              <View>
                <Text className="text-lg font-bold text-slate-900">⚠️ Complaint Helpdesk</Text>
                <Text className="text-slate-500 mt-0.5" style={{ fontSize: 11 }}>
                  Audit tickets, post remarks, and track resolution threads
                </Text>
              </View>
              {fetched && total > 0 && (
                <Text className="text-slate-400 text-xs">{complaints.length}/{total}</Text>
              )}
            </View>

            <View className="flex-row items-center gap-2">
              <View className="flex-1 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden" style={{ height: 40 }}>
                <Picker
                  selectedValue={statusFilter}
                  onValueChange={(v) => { setStatusFilter(v); setFetched(false); }}
                  style={{ height: 40 }}>
                  {STATUS_OPTIONS.map((o) => (
                    <Picker.Item key={o.value} label={o.label} value={o.value} />
                  ))}
                </Picker>
              </View>
              {!fetched ? (
                <TouchableOpacity
                  onPress={() => fetchComplaints(true)}
                  className="px-4 py-2.5 rounded-xl"
                  style={{ backgroundColor: '#0284c7' }}>
                  <Text className="text-white font-bold text-xs">📥 Load</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => fetchComplaints(true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <Text className="text-slate-600 font-bold text-xs">🔄</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* States */}
          {loading && !fetched && (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#0284c7" />
            </View>
          )}

          {!fetched && !loading && (
            <View className="bg-white border border-slate-200 rounded-2xl p-12 items-center">
              <Text style={{ fontSize: 40 }}>📬</Text>
              <Text className="text-slate-600 font-semibold mt-2">Complaints not loaded yet</Text>
              <TouchableOpacity onPress={() => fetchComplaints(true)} className="mt-4 px-5 py-2.5 rounded-xl" style={{ backgroundColor: '#0284c7' }}>
                <Text className="text-white font-bold">📥 Load Complaints</Text>
              </TouchableOpacity>
            </View>
          )}

          {fetched && !loading && complaints.length === 0 && (
            <View className="bg-white border border-slate-200 rounded-2xl p-10 items-center">
              <Text style={{ fontSize: 36 }}>✅</Text>
              <Text className="text-slate-500 mt-2 text-sm">No complaints for this filter.</Text>
            </View>
          )}

          {/* Complaint Cards */}
          {fetched && complaints.map((c) => (
            <View key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 }}>
              {/* Header */}
              <View className="flex-row items-start justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <Text className="text-slate-400 font-mono" style={{ fontSize: 11 }}>#{c.id}</Text>
                    <Text className="text-sm font-bold text-slate-900">{c.subject}</Text>
                  </View>
                  <Text className="text-slate-400" style={{ fontSize: 11 }}>
                    Filed by <Text className="font-bold text-slate-600">{c.sender?.username || 'Resident'}</Text>
                    {' · '}{new Date(c.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <StatusBadge status={c.status} />
              </View>

              {/* Description */}
              <Text className="text-slate-700 text-xs leading-relaxed p-3 rounded-xl border border-slate-100 mb-2"
                style={{ backgroundColor: '#f8fafc' }}>
                {c.description}
              </Text>

              {/* Admin remark */}
              {c.admin_remark ? (
                <View className="p-3 rounded-xl border border-amber-200 mb-2" style={{ backgroundColor: '#fffbeb' }}>
                  <Text className="font-bold text-amber-900 mb-0.5" style={{ fontSize: 11 }}>📌 Admin Remark:</Text>
                  <Text className="text-amber-800 text-xs leading-relaxed">{c.admin_remark}</Text>
                </View>
              ) : null}

              {/* Status + Remark control */}
              <View className="flex-row items-center gap-2 py-2 border-t border-slate-100 mt-1 mb-2">
                <Text className="text-xs font-bold text-slate-700">Set Status:</Text>
                <View className="flex-1 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden" style={{ height: 36 }}>
                  <Picker
                    selectedValue={c.status}
                    onValueChange={(v) => handleOpenRemarkModal(c, v)}
                    style={{ height: 36 }}>
                    <Picker.Item label="Open" value="open" />
                    <Picker.Item label="On-Going" value="in_progress" />
                    <Picker.Item label="Resolved" value="resolved" />
                    <Picker.Item label="Closed" value="closed" />
                  </Picker>
                </View>
                <TouchableOpacity
                  onPress={() => handleOpenRemarkModal(c, c.status)}
                  className="px-3 py-2 rounded-xl border border-sky-200"
                  style={{ backgroundColor: '#f0f9ff' }}>
                  <Text style={{ color: '#0284c7', fontSize: 12, fontWeight: '700' }}>📝 Remark</Text>
                </TouchableOpacity>
              </View>

              {/* Thread Comments */}
              <View className="pt-2 border-t border-slate-100">
                <Text className="text-xs font-bold text-slate-700 mb-2">
                  💬 Thread ({c.comments?.length || 0})
                </Text>
                {c.comments?.length > 0 && (
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                    {c.comments.map((cm) => (
                      <View key={cm.id} className="p-2.5 rounded-xl mb-1.5"
                        style={{
                          backgroundColor: cm.sender?.id === c.sender?.id ? '#f1f5f9' : '#f0f9ff',
                          borderWidth: cm.sender?.id === c.sender?.id ? 0 : 1,
                          borderColor: '#bae6fd',
                        }}>
                        <View className="flex-row justify-between mb-0.5">
                          <Text className="font-bold text-slate-500" style={{ fontSize: 10 }}>{cm.sender?.username || 'User'}</Text>
                          <Text className="font-mono text-slate-400" style={{ fontSize: 10 }}>
                            {new Date(cm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <Text className="text-slate-800 text-xs leading-relaxed">{cm.message}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Reply input */}
                <View className="flex-row items-center gap-2 mt-2">
                  <TextInput
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900"
                    placeholder="Type a reply..."
                    placeholderTextColor="#94a3b8"
                    value={replyTextMap[c.id] || ''}
                    onChangeText={(v) => setReplyTextMap((prev) => ({ ...prev, [c.id]: v }))}
                    style={{ fontSize: 13 }}
                  />
                  <TouchableOpacity
                    onPress={() => handleSendComment(c.id)}
                    disabled={submittingReply || !replyTextMap[c.id]?.trim()}
                    className="px-4 py-2 rounded-xl"
                    style={{ backgroundColor: '#0284c7', opacity: submittingReply || !replyTextMap[c.id]?.trim() ? 0.4 : 1 }}>
                    <Text className="text-white font-bold text-xs">Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Load More */}
          {fetched && hasMore && (
            <TouchableOpacity
              onPress={() => fetchComplaints(false)}
              disabled={loading}
              className="py-3 rounded-xl border border-sky-200 items-center"
              style={{ backgroundColor: '#f0f9ff' }}>
              {loading
                ? <ActivityIndicator color="#0284c7" />
                : <Text style={{ color: '#0284c7', fontWeight: '700', fontSize: 13 }}>⬇ Load More ({total - complaints.length} remaining)</Text>
              }
            </TouchableOpacity>
          )}
          {fetched && !hasMore && complaints.length > 0 && (
            <Text className="text-center text-slate-400 py-2" style={{ fontSize: 12 }}>
              All {total} complaints loaded
            </Text>
          )}
        </View>
        <View className="h-6" />
      </ScrollView>

      {/* Admin Remark / Status Modal */}
      <Modal visible={!!activeRemarkId} animationType="slide" transparent onRequestClose={() => setActiveRemarkId(null)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl p-5 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-slate-900">Update Ticket #{activeRemarkId}</Text>
              <TouchableOpacity onPress={() => setActiveRemarkId(null)}>
                <Text className="text-slate-400 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-bold text-slate-700 mb-1">Ticket Status</Text>
            <View className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden mb-3" style={{ height: 48 }}>
              <Picker
                selectedValue={targetStatus}
                onValueChange={(v) => setTargetStatus(v)}
                style={{ height: 48 }}>
                <Picker.Item label="Open" value="open" />
                <Picker.Item label="On-Going / In Progress" value="in_progress" />
                <Picker.Item label="Resolved" value="resolved" />
                <Picker.Item label="Closed" value="closed" />
              </Picker>
            </View>

            <Text className="text-xs font-bold text-slate-700 mb-1">Official Admin Remark</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-4"
              placeholder="Explain resolution steps or current status..."
              placeholderTextColor="#94a3b8"
              value={remarkText}
              onChangeText={setRemarkText}
              multiline
              numberOfLines={4}
              style={{ fontSize: 13, minHeight: 90, textAlignVertical: 'top' }}
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setActiveRemarkId(null)}
                className="flex-1 py-3 rounded-xl items-center border border-slate-200 bg-slate-100">
                <Text className="text-slate-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveRemark}
                disabled={remarkSaving}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: remarkSaving ? '#7dd3fc' : '#0284c7' }}>
                {remarkSaving
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-white font-bold">Save Update</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminComplaintPage;
