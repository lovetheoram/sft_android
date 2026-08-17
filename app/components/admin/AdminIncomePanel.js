/**
 * AdminIncomePanel — Full Income Audit (React Native)
 * - Status filter (pending/verified/rejected/all)
 * - Search, date range, amount range filters
 * - Verify ✅ / Reject (with reason modal) ❌ / Edit ✏️ / Delete 🗑️
 * - Previous/Next server-side pagination
 * - Pull-to-refresh
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert, FlatList, RefreshControl,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomSelect from '../common/CustomSelect';
import financeService from '../../user_utils/services/financeService';
import ConfirmModal from '../common/ConfirmModal';

const StatusBadge = ({ status }) => {
  const s = {
    verified: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', label: '✓ Verified' },
    fraud:    { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', label: '✕ Rejected' },
  }[status] || { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: '◷ Pending' };
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, backgroundColor: s.bg, borderColor: s.border }}>
      <Text style={{ color: s.text, fontSize: 10, fontWeight: '800' }}>{s.label}</Text>
    </View>
  );
};

const LIMIT = 10;

const AdminIncomePanel = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Date range + amount range filters
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Edit modal
  const [editItem, setEditItem] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Reject reason modal
  const [rejectTarget, setRejectTarget] = useState(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchIncomes = async (page = 1, overrideStatus) => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset: (page - 1) * LIMIT };
      const activeStatus = overrideStatus !== undefined ? overrideStatus : statusFilter;
      if (activeStatus !== 'all') params.status = activeStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (minAmount) params.min_amount = minAmount;
      if (maxAmount) params.max_amount = maxAmount;

      const res = await financeService.getIncomes(params);
      const items = Array.isArray(res) ? res : (res?.results || []);
      setIncomes(items);
      setTotalCount(res?.count || items.length);
      setCurrentPage(page);
    } catch {
      Alert.alert('Error', 'Failed to load income data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchIncomes(1); }, []);

  const onRefresh = () => { setRefreshing(true); fetchIncomes(1); };

  const handleVerify = async (id) => {
    setActionLoading(id);
    try {
      await financeService.verifyIncome(id);
      fetchIncomes(currentPage);
    } catch {
      Alert.alert('Error', 'Failed to verify payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    setRejectTarget(null);
    try {
      await financeService.rejectIncome(rejectTarget.id, reason || '');
      fetchIncomes(currentPage);
    } catch {
      Alert.alert('Error', 'Failed to reject payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    setDeleteTarget(null);
    try {
      await financeService.deleteIncome(deleteTarget.id);
      fetchIncomes(currentPage);
    } catch {
      Alert.alert('Error', 'Failed to delete payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setEditSaving(true);
    try {
      await financeService.updateIncome(editItem.id, { amount: Number(editAmount), date: editDate });
      setEditItem(null);
      fetchIncomes(currentPage);
    } catch {
      Alert.alert('Error', 'Failed to update payment.');
    } finally {
      setEditSaving(false);
    }
  };

  const clearFilters = () => { setStartDate(''); setEndDate(''); setMinAmount(''); setMaxAmount(''); };
  const hasActiveFilters = startDate || endDate || minAmount || maxAmount;

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
      >
        <View style={{ padding: 16, gap: 12 }}>

          {/* ── Header + Search ── */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>💳 Income Audit Panel</Text>
            <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>Verify, reject, edit, or delete payment submissions</Text>

            {/* Search */}
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#f8fafc', marginBottom: 10 }}>
              <Ionicons name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search member, amount, date..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => fetchIncomes(1)}
                style={{ flex: 1, fontSize: 13, color: '#0f172a' }}
                returnKeyType="search"
              />
            </View>

            {/* Status filter row */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <CustomSelect
                  value={statusFilter}
                  options={[
                    { label: 'All Payments', value: 'all' },
                    { label: '◷ Pending (default)', value: 'pending' },
                    { label: '✓ Verified', value: 'verified' },
                    { label: '✕ Rejected', value: 'fraud' },
                  ]}
                  onValueChange={(v) => { setStatusFilter(v); fetchIncomes(1, v); }}
                  icon="funnel-outline"
                  containerStyle={{ marginVertical: 0 }}
                />
              </View>
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                style={{
                  padding: 10, borderRadius: 10, borderWidth: 1,
                  borderColor: hasActiveFilters ? '#0284c7' : '#e2e8f0',
                  backgroundColor: hasActiveFilters ? '#eff6ff' : '#f8fafc',
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="options-outline" size={18} color={hasActiveFilters ? '#0284c7' : '#64748b'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => fetchIncomes(1)}
                style={{ padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Advanced Filters */}
            {showFilters && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>📅 Date Range</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>From (YYYY-MM-DD)</Text>
                    <TextInput
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder="2025-01-01"
                      style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: '#0f172a', backgroundColor: '#fff' }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>To (YYYY-MM-DD)</Text>
                    <TextInput
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="2025-12-31"
                      style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: '#0f172a', backgroundColor: '#fff' }}
                    />
                  </View>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>💰 Amount Range</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={minAmount}
                    onChangeText={setMinAmount}
                    placeholder="Min ₹"
                    keyboardType="numeric"
                    style={{ flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: '#0f172a', backgroundColor: '#fff' }}
                  />
                  <TextInput
                    value={maxAmount}
                    onChangeText={setMaxAmount}
                    placeholder="Max ₹"
                    keyboardType="numeric"
                    style={{ flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: '#0f172a', backgroundColor: '#fff' }}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={clearFilters}
                    style={{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f1f5f9', alignItems: 'center' }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b' }}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setShowFilters(false); fetchIncomes(1); }}
                    style={{ flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: '#0284c7', alignItems: 'center' }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ── Results summary ── */}
          {!loading && (
            <Text style={{ fontSize: 11, color: '#64748b', paddingHorizontal: 2 }}>
              Showing {incomes.length} of {totalCount} records • Page {currentPage}/{totalPages}
            </Text>
          )}

          {/* ── Income Cards ── */}
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <ActivityIndicator size="large" color="#0284c7" />
              <Text style={{ color: '#64748b', marginTop: 12, fontSize: 13 }}>Loading records...</Text>
            </View>
          ) : incomes.length === 0 ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>📭</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#334155' }}>No records found</Text>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Try adjusting your filters</Text>
            </View>
          ) : (
            incomes.map((item) => {
              const memberName = item.member_name ||
                (typeof item.member === 'object'
                  ? `${item.member?.user?.first_name || ''} ${item.member?.user?.last_name || ''}`.trim()
                  : `Member #${item.member}`);
              const flatNum = item.flat_number || item.member?.user?.flat?.number || '';
              const isActing = actionLoading === item.id;

              return (
                <View key={item.id} style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  padding: 14,
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 1,
                }}>
                  {/* Top row */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#059669' }}>₹{item.amount?.toLocaleString('en-IN')}</Text>
                      <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginTop: 2 }}>
                        👤 {memberName || 'Resident'}{flatNum ? ` • Flat ${flatNum}` : ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                        📅 {item.date}
                      </Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>

                  {item.transaction_id ? (
                    <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' }}>
                      <Text style={{ fontSize: 11, color: '#64748b' }}>
                        Txn: <Text style={{ fontWeight: '800', color: '#334155', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>#{item.transaction_id}</Text>
                      </Text>
                    </View>
                  ) : null}

                  {item.description ? (
                    <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 8, lineHeight: 16 }} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  {/* Action buttons */}
                  {isActing ? (
                    <ActivityIndicator color="#0284c7" style={{ marginTop: 8 }} />
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                      {item.status !== 'verified' && (
                        <TouchableOpacity
                          onPress={() => handleVerify(item.id)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#059669' }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="checkmark-circle-outline" size={13} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Verify</Text>
                        </TouchableOpacity>
                      )}
                      {item.status !== 'fraud' && (
                        <TouchableOpacity
                          onPress={() => setRejectTarget(item)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#e11d48' }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle-outline" size={13} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Reject</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => { setEditItem(item); setEditAmount(String(item.amount)); setEditDate(item.date); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd' }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil-outline" size={13} color="#0284c7" />
                        <Text style={{ color: '#0284c7', fontSize: 11, fontWeight: '800' }}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setDeleteTarget(item)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3' }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={13} color="#e11d48" />
                        <Text style={{ color: '#e11d48', fontSize: 11, fontWeight: '800' }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* ── Pagination ── */}
          {!loading && incomes.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => fetchIncomes(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff', opacity: currentPage === 1 ? 0.4 : 1 }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>← Previous</Text>
              </TouchableOpacity>
              <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#475569' }}>{currentPage}/{totalPages}</Text>
              </View>
              <TouchableOpacity
                onPress={() => fetchIncomes(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff', opacity: currentPage >= totalPages ? 0.4 : 1 }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Edit Modal ── */}
      <Modal visible={!!editItem} animationType="slide" transparent onRequestClose={() => setEditItem(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setEditItem(null)} />
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, shadowColor: '#000', shadowOpacity: 0.15, elevation: 10 }}>
            <View style={{ width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 16 }}>✏️ Edit Payment #{editItem?.id}</Text>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Amount (₹)</Text>
            <TextInput
              keyboardType="numeric"
              value={editAmount}
              onChangeText={setEditAmount}
              style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: '#0f172a', backgroundColor: '#fff', marginBottom: 12 }}
            />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Payment Date (YYYY-MM-DD)</Text>
            <TextInput
              value={editDate}
              onChangeText={setEditDate}
              style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: '#0f172a', backgroundColor: '#fff', marginBottom: 16 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setEditItem(null)} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' }} activeOpacity={0.7}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} disabled={editSaving} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: editSaving ? '#94a3b8' : '#0284c7', alignItems: 'center' }} activeOpacity={0.7}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{editSaving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Rejection Reason Modal (replaces Alert.prompt) ── */}
      <ConfirmModal
        visible={!!rejectTarget}
        title="Reject Payment"
        message={`Reject ₹${rejectTarget?.amount} payment from ${rejectTarget?.member_name || 'member'}? They will be notified.`}
        confirmLabel="Reject Payment"
        cancelLabel="Cancel"
        destructive
        inputLabel="Rejection reason (optional)"
        inputPlaceholder="e.g. Duplicate submission, incorrect amount..."
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />

      {/* ── Delete Confirm ── */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Payment Record"
        message={`Permanently delete ₹${deleteTarget?.amount} payment? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
};

export default AdminIncomePanel;
