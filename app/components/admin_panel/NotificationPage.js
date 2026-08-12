/**
 * NotificationPage — Full Feature Port (React Native)
 * - Pagination, search, filter (All/Unread/Verified/Rejected)
 * - Each card: income details, complaint ticket detail, thread comments
 * - Verify ✅ / Reject ❌ for admins on expanded income notifications
 * - File Complaint button + Create Announcement button (admin)
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, FlatList, Modal, Alert, Pressable, Linking,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../user_utils/AuthContext';
import societyService from '../../user_utils/services/societyService';
import financeService from '../../user_utils/services/financeService';
import ComplaintForm from '../../user_utils/ComplaintForm';

const StatusBadge = ({ status }) => {
  const styles = {
    verified: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', label: '✓ Verified' },
    fraud:    { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', label: '✕ Rejected' },
  };
  const s = styles[status] || { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: '◷ Pending' };
  return (
    <View className="px-2 py-0.5 rounded-full border" style={{ backgroundColor: s.bg, borderColor: s.border }}>
      <Text style={{ color: s.text, fontSize: 10, fontWeight: '800' }}>{s.label}</Text>
    </View>
  );
};

const NotificationPage = () => {
  const { isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annSubmitting, setAnnSubmitting] = useState(false);

  const loadNotifications = async (page = 1, overrideStatus) => {
    setLoading(true);
    setError(null);
    try {
      const activeStatus = overrideStatus !== undefined ? overrideStatus : statusFilter;
      const params = { limit: 10, offset: (page - 1) * 10 };
      if (activeStatus === 'unread') params.seen = false;
      else if (activeStatus !== 'all') params.income__status = activeStatus;

      const res = await societyService.getNotifications(params);
      if (res && Array.isArray(res.results)) {
        setNotifications(res.results);
        setTotalCount(res.count || res.results.length);
      } else if (Array.isArray(res)) {
        setNotifications(res);
        setTotalCount(res.length);
      } else {
        setNotifications([]); setTotalCount(0);
      }
      setCurrentPage(page);
    } catch {
      setError('Failed to load notifications inbox.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(1); }, []);

  const handleViewDetails = async (notifId) => {
    if (selectedId === notifId) { setSelectedId(null); setSelectedDetail(null); return; }
    try {
      const detail = await societyService.getNotification(notifId);
      setSelectedId(notifId);
      setSelectedDetail(detail);
    } catch {
      Alert.alert('Error', 'Failed to load notification details.');
    }
  };

  const handleVerifyOrReject = async (type) => {
    if (!selectedDetail?.income?.id) return;
    setActionLoading(true);
    try {
      if (type === 'verify') await financeService.verifyIncome(selectedDetail.income.id);
      else await financeService.rejectIncome(selectedDetail.income.id);
      Alert.alert('Success', type === 'verify' ? 'Payment verified!' : 'Payment rejected.');
      setSelectedDetail(null);
      setSelectedId(null);
      loadNotifications(currentPage);
    } catch {
      Alert.alert('Error', `Failed to ${type} payment.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim() || !annMessage.trim()) {
      Alert.alert('Validation', 'Title and message are required.'); return;
    }
    setAnnSubmitting(true);
    try {
      await societyService.createAnnouncement({ title: annTitle.trim(), message: annMessage.trim() });
      Alert.alert('Success', 'Announcement created!');
      setAnnTitle(''); setAnnMessage('');
      setShowAnnouncementModal(false);
    } catch {
      Alert.alert('Error', 'Failed to create announcement.');
    } finally {
      setAnnSubmitting(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const q = searchQuery.toLowerCase().trim();
    return notifications.filter((n) => {
      const msgMatch = (n.message || '').toLowerCase().includes(q);
      const memberMatch = (n.income?.member?.user?.username || '').toLowerCase().includes(q);
      const txnMatch = String(n.income?.id || '').includes(q);
      return msgMatch || memberMatch || txnMatch;
    });
  }, [notifications, searchQuery]);

  const unreadCount = notifications.filter((n) => !n.seen).length;
  const totalPages = Math.max(1, Math.ceil(totalCount / 10));

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-4">

          {/* Header Card */}
          <View className="bg-white rounded-2xl border border-slate-200 p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
            <View className="flex-row items-start justify-between gap-2 mb-3">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-extrabold text-slate-900">🔔 Notifications</Text>
                  {unreadCount > 0 && (
                    <View className="px-2 py-0.5 rounded-full border border-rose-200" style={{ backgroundColor: '#fff1f2' }}>
                      <Text style={{ color: '#be123c', fontSize: 10, fontWeight: '800' }}>{unreadCount} unread</Text>
                    </View>
                  )}
                </View>
                <Text className="text-slate-500 mt-0.5" style={{ fontSize: 11 }}>
                  Complaint updates, payment alerts, and announcements
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                onPress={() => setShowComplaintForm(true)}
                className="flex-1 py-2.5 rounded-xl items-center"
                style={{ backgroundColor: '#f59e0b' }}>
                <Text className="text-white font-bold text-xs">⚠️ File Complaint</Text>
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => setShowAnnouncementModal(true)}
                  className="flex-1 py-2.5 rounded-xl items-center"
                  style={{ backgroundColor: '#0284c7' }}>
                  <Text className="text-white font-bold text-xs">📢 Create Announcement</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Search + Filter */}
            <View className="flex-row items-center gap-2">
              <View className="flex-1 border border-slate-200 rounded-xl px-3 py-2 flex-row items-center bg-slate-50">
                <Text className="text-slate-400 mr-2">🔍</Text>
                <TextInput
                  placeholder="Search notifications..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 text-slate-900"
                  style={{ fontSize: 13 }}
                />
              </View>
              <TouchableOpacity onPress={() => loadNotifications(currentPage)} className="p-2.5 border border-slate-200 rounded-xl bg-slate-50">
                <Text>🔄</Text>
              </TouchableOpacity>
            </View>

            {/* Status Filter */}
            <View className="border border-slate-200 rounded-xl bg-slate-50 mt-2 overflow-hidden" style={{ height: 40 }}>
              <Picker
                selectedValue={statusFilter}
                onValueChange={(v) => { setStatusFilter(v); loadNotifications(1, v); }}
                style={{ height: 40 }}>
                <Picker.Item label="All Alerts" value="all" />
                <Picker.Item label="📬 Unread Only" value="unread" />
                <Picker.Item label="✓ Verified" value="verified" />
                <Picker.Item label="✕ Rejected" value="fraud" />
              </Picker>
            </View>
          </View>

          {error && (
            <View className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <Text className="text-rose-700 font-semibold text-sm">❌ {error}</Text>
            </View>
          )}

          {/* Notification Cards */}
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#0284c7" />
              <Text className="text-slate-400 mt-2 text-sm">Loading notifications...</Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View className="bg-white border border-slate-200 rounded-2xl p-10 items-center">
              <Text style={{ fontSize: 36 }}>📭</Text>
              <Text className="text-slate-600 font-semibold mt-2 text-sm">No notifications found</Text>
              <Text className="text-slate-400 mt-1" style={{ fontSize: 12 }}>All clear! New alerts will appear here.</Text>
            </View>
          ) : (
            filteredNotifications.map((n) => {
              const isSelected = selectedId === n.id;
              const isUnread = !n.seen;
              const isFraud = n.income?.status === 'fraud';
              const memberUsername = typeof n.income?.member === 'object'
                ? n.income.member?.user?.username || 'Resident'
                : n.income?.member || 'Resident';

              return (
                <View
                  key={n.id}
                  className="bg-white rounded-2xl border p-4"
                  style={{
                    borderColor: isFraud ? '#fecdd3' : isUnread ? '#bae6fd' : '#e2e8f0',
                    borderLeftWidth: (isFraud || isUnread) ? 4 : 1,
                    borderLeftColor: isFraud ? '#f43f5e' : isUnread ? '#0284c7' : '#e2e8f0',
                    shadowColor: '#000', shadowOpacity: 0.04, elevation: 1,
                  }}>
                  {/* Main notification row */}
                  <View className="flex-row items-start gap-2">
                    <View className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: isFraud ? '#f43f5e' : isUnread ? '#0284c7' : '#cbd5e1' }} />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold leading-relaxed"
                        style={{ color: isFraud ? '#881337' : '#0f172a' }}>
                        {n.message}
                      </Text>
                      <Text className="text-slate-400 font-mono mt-1" style={{ fontSize: 10 }}>
                        {new Date(n.created_at).toLocaleString()}
                      </Text>
                    </View>
                    {n.income && <StatusBadge status={n.income.status} />}
                  </View>

                  {/* Income detail row */}
                  {n.income && (
                    <View className="flex-row flex-wrap gap-3 mt-2.5 p-2 rounded-xl border border-slate-100" style={{ backgroundColor: '#f8fafc' }}>
                      <Text className="text-slate-500" style={{ fontSize: 11 }}>
                        👤 <Text className="font-bold text-slate-700">{memberUsername}</Text>
                      </Text>
                      <Text className="text-slate-500" style={{ fontSize: 11 }}>
                        💳 Txn: <Text className="font-mono font-bold text-sky-600">#{n.income.id}</Text>
                      </Text>
                      <Text className="text-slate-500" style={{ fontSize: 11 }}>
                        ₹<Text className="font-bold text-emerald-700">{n.income.amount}</Text>
                      </Text>
                    </View>
                  )}

                  {/* Complaint row */}
                  {n.complaint && (
                    <View className="flex-row items-center justify-between mt-2.5 p-2.5 rounded-xl border border-amber-200" style={{ backgroundColor: '#fffbeb' }}>
                      <View className="flex-row items-center gap-2 flex-1">
                        <Text className="font-bold text-amber-900" style={{ fontSize: 11 }}>🎟️ Ticket #{n.complaint.id}:</Text>
                        <Text className="font-semibold text-slate-900 flex-1" style={{ fontSize: 11 }} numberOfLines={1}>
                          {n.complaint.subject}
                        </Text>
                      </View>
                      <View className="px-2 py-0.5 rounded-full bg-white border border-amber-200">
                        <Text style={{ color: '#92400e', fontSize: 10, fontWeight: '700' }}>
                          {n.complaint.status_display || n.complaint.status}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* View Details toggle */}
                  <TouchableOpacity
                    onPress={() => handleViewDetails(n.id)}
                    className="mt-3 px-3 py-1.5 rounded-xl border border-sky-200 self-start"
                    style={{ backgroundColor: '#f0f9ff' }}>
                    <Text style={{ color: '#0284c7', fontSize: 12, fontWeight: '700' }}>
                      {isSelected ? 'Hide Details' : 'View Details'}
                    </Text>
                  </TouchableOpacity>

                  {/* Expanded Details */}
                  {isSelected && selectedDetail && (
                    <View className="mt-3 pt-3 border-t border-slate-100 rounded-xl p-3" style={{ backgroundColor: '#f8fafc' }}>
                      {selectedDetail.complaint ? (
                        <View className="space-y-2">
                          <View className="flex-row items-center justify-between">
                            <Text className="font-bold text-slate-900 text-sm">
                              {selectedDetail.complaint.subject}
                            </Text>
                            <View className="px-2 py-0.5 rounded-full bg-slate-200">
                              <Text className="text-slate-700 font-bold" style={{ fontSize: 10 }}>
                                {selectedDetail.complaint.status}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-slate-700 text-xs leading-relaxed p-2 rounded-lg border border-slate-100" style={{ backgroundColor: '#f1f5f9' }}>
                            {selectedDetail.complaint.description}
                          </Text>
                          {selectedDetail.complaint.admin_remark ? (
                            <View className="p-2.5 rounded-xl border border-amber-200" style={{ backgroundColor: '#fffbeb' }}>
                              <Text className="font-bold text-amber-900" style={{ fontSize: 11 }}>📌 Admin Remark:</Text>
                              <Text className="text-amber-800 mt-0.5" style={{ fontSize: 12 }}>{selectedDetail.complaint.admin_remark}</Text>
                            </View>
                          ) : null}
                          {/* Thread comments */}
                          {selectedDetail.complaint.comments?.length > 0 && (
                            <View>
                              <Text className="font-bold text-slate-600 mb-1" style={{ fontSize: 10 }}>RECENT MESSAGES:</Text>
                              {selectedDetail.complaint.comments.map((cm) => (
                                <View key={cm.id} className="p-2 rounded-lg border border-slate-100 mb-1" style={{ backgroundColor: '#fff' }}>
                                  <View className="flex-row justify-between">
                                    <Text className="font-bold text-slate-500" style={{ fontSize: 10 }}>{cm.sender?.username || 'User'}</Text>
                                    <Text className="text-slate-400 font-mono" style={{ fontSize: 10 }}>
                                      {new Date(cm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                  </View>
                                  <Text className="text-slate-800 mt-0.5" style={{ fontSize: 12 }}>{cm.message}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ) : selectedDetail.income ? (
                        <View className="space-y-2">
                          <View className="flex-row items-center gap-2">
                            <Text className="font-bold text-slate-700 text-xs">Payment Status:</Text>
                            <StatusBadge status={selectedDetail.income.status} />
                          </View>
                          {selectedDetail.income.payment_proof && (
                            <TouchableOpacity onPress={() => Linking.openURL(selectedDetail.income.payment_proof)}>
                              <Text style={{ color: '#0284c7', fontSize: 12, textDecorationLine: 'underline', fontWeight: '600' }}>
                                📄 View Payment Proof
                              </Text>
                            </TouchableOpacity>
                          )}
                          {isAdmin && (
                            <View className="flex-row gap-2 pt-2 border-t border-slate-100">
                              {selectedDetail.income.status !== 'verified' && (
                                <TouchableOpacity
                                  onPress={() => handleVerifyOrReject('verify')}
                                  disabled={actionLoading}
                                  className="flex-1 py-2 rounded-xl items-center"
                                  style={{ backgroundColor: '#059669', opacity: actionLoading ? 0.6 : 1 }}>
                                  <Text className="text-white font-bold text-xs">✅ Approve & Verify</Text>
                                </TouchableOpacity>
                              )}
                              {selectedDetail.income.status !== 'fraud' && (
                                <TouchableOpacity
                                  onPress={() => handleVerifyOrReject('reject')}
                                  disabled={actionLoading}
                                  className="flex-1 py-2 rounded-xl items-center"
                                  style={{ backgroundColor: '#e11d48', opacity: actionLoading ? 0.6 : 1 }}>
                                  <Text className="text-white font-bold text-xs">❌ Flag as Rejected</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                      ) : (
                        <Text className="text-slate-400 text-xs">System alert / update notice.</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Pagination */}
          {!loading && filteredNotifications.length > 0 && (
            <View className="flex-row items-center justify-between gap-2">
              <TouchableOpacity
                onPress={() => loadNotifications(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 items-center bg-white"
                style={{ opacity: currentPage === 1 ? 0.4 : 1 }}>
                <Text className="text-slate-700 font-semibold text-xs">← Previous</Text>
              </TouchableOpacity>
              <View className="px-3 py-2.5 rounded-xl bg-slate-100">
                <Text className="text-slate-700 font-bold font-mono text-xs">
                  Page {currentPage}/{totalPages}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => loadNotifications(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 items-center bg-white"
                style={{ opacity: currentPage >= totalPages ? 0.4 : 1 }}>
                <Text className="text-slate-700 font-semibold text-xs">Next →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View className="h-6" />
      </ScrollView>

      {/* Complaint Form Modal */}
      <Modal visible={showComplaintForm} animationType="slide" onRequestClose={() => setShowComplaintForm(false)}>
        <ComplaintForm onClose={() => { setShowComplaintForm(false); loadNotifications(1); }} />
      </Modal>

      {/* Create Announcement Modal */}
      <Modal visible={showAnnouncementModal} animationType="slide" transparent onRequestClose={() => setShowAnnouncementModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl p-5 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-slate-900">📢 New Announcement</Text>
              <TouchableOpacity onPress={() => setShowAnnouncementModal(false)}>
                <Text className="text-slate-400 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-xs font-bold text-slate-700 mb-1">Title</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-3"
              placeholder="Announcement title..."
              placeholderTextColor="#94a3b8"
              value={annTitle}
              onChangeText={setAnnTitle}
              style={{ fontSize: 14 }}
            />
            <Text className="text-xs font-bold text-slate-700 mb-1">Message</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-4"
              placeholder="Write your announcement..."
              placeholderTextColor="#94a3b8"
              value={annMessage}
              onChangeText={setAnnMessage}
              multiline
              numberOfLines={4}
              style={{ fontSize: 14, minHeight: 90, textAlignVertical: 'top' }}
            />
            <TouchableOpacity
              onPress={handleCreateAnnouncement}
              disabled={annSubmitting}
              className="py-3.5 rounded-xl items-center"
              style={{ backgroundColor: annSubmitting ? '#7dd3fc' : '#0284c7' }}>
              {annSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Post Announcement</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NotificationPage;
