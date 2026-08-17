/**
 * IncomePage — Payment Submission & History (React Native)
 * - Tab nav: Submit Payment | My History
 * - History: paginated list (Load More), status badges, date/amount filters
 * - Submit: amount, date, transaction ID, payment proof upload, special charge selector
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  ActivityIndicator, Alert, Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CustomSelect from './common/CustomSelect';
import financeService from '../user_utils/services/financeService';
import buildingService from '../user_utils/services/buildingService';

const LIMIT = 10;

const StatusBadge = ({ status }) => {
  const styles = {
    verified: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', label: '✓ Verified' },
    fraud:    { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', label: '✕ Rejected' },
  };
  const s = styles[status] || { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: '◷ Pending' };
  return (
    <View className="px-2 py-0.5 rounded-full border" style={{ backgroundColor: s.bg, borderColor: s.border }}>
      <Text style={{ color: s.text, fontSize: 10, fontWeight: '700' }}>{s.label}</Text>
    </View>
  );
};

const IncomePage = () => {
  const [activeSection, setActiveSection] = useState('form');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionId, setTransactionId] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [specialChargeId, setSpecialChargeId] = useState('');
  const [specialCharges, setSpecialCharges] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  // History
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchCharges = async () => {
      try {
        const res = await buildingService.getSpecialCharges();
        const list = Array.isArray(res) ? res : (res?.results || []);
        setSpecialCharges(list);
      } catch { /* silent */ }
    };
    fetchCharges();
  }, []);

  const fetchHistory = async (reset = true) => {
    const newOffset = reset ? 0 : offset;
    if (reset) {
      setLoadingHistory(true);
      setTransactions([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = { limit: LIMIT, offset: newOffset };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await financeService.getIncomes(params);
      const items = Array.isArray(res) ? res : (res?.results || []);
      const total = res?.count || items.length;

      setTransactions(reset ? items : [...transactions, ...items]);
      setTotalCount(total);
      setOffset(newOffset + items.length);
      setHasMore(newOffset + items.length < total);
      setHistoryLoaded(true);
    } catch {
      Alert.alert('Error', 'Could not load payment history.');
    } finally {
      setLoadingHistory(false);
      setLoadingMore(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPaymentProof(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!amount.trim()) { setFormError('Please enter an amount.'); return; }
    if (!paymentDate.trim()) { setFormError('Please enter a payment date.'); return; }
    setFormError('');
    setSubmitting(true);
    setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('date', paymentDate);
      if (transactionId.trim()) formData.append('transaction_id', transactionId.trim());
      if (specialChargeId) formData.append('special_charge_id', specialChargeId);
      if (paymentProof) {
        formData.append('payment_proof', {
          uri: paymentProof.uri,
          name: 'proof.jpg',
          type: 'image/jpeg',
        });
      }
      await financeService.createIncome(formData);
      setSuccessMsg('✅ Payment submitted successfully! Awaiting admin verification.');
      setAmount('');
      setTransactionId('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentProof(null);
      setSpecialChargeId('');
    } catch {
      setFormError('❌ Failed to submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Top Section Nav */}
      <View className="bg-white border-b border-slate-200 px-4 py-2 flex-row gap-3">
        {[{ id: 'form', label: '💸 Submit Payment' }, { id: 'history', label: '🧾 My History' }].map((s) => (
          <Pressable
            key={s.id}
            onPress={() => { setActiveSection(s.id); if (s.id === 'history' && !historyLoaded) fetchHistory(); }}
            className="flex-1 py-2 rounded-xl items-center border"
            style={{ backgroundColor: activeSection === s.id ? '#0284c7' : '#f8fafc', borderColor: activeSection === s.id ? '#0284c7' : '#e2e8f0' }}>
            <Text className="font-bold text-xs" style={{ color: activeSection === s.id ? '#fff' : '#64748b' }}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Submit Payment Form */}
      {activeSection === 'form' && (
        <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
          <View className="bg-white rounded-2xl border border-slate-200 p-5"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
            <Text className="text-lg font-bold text-slate-900 mb-1">💳 Make a Payment</Text>
            <Text className="text-slate-500 text-xs mb-4">Submit your maintenance or special charge payment</Text>

            {successMsg !== '' && (
              <View className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-emerald-700 font-semibold text-sm">{successMsg}</Text>
              </View>
            )}
            {formError !== '' && (
              <View className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-rose-700 font-semibold text-sm">{formError}</Text>
              </View>
            )}

            <View className="space-y-3">
              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Amount (₹) *</Text>
                <TextInput
                  className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                  placeholder="e.g. 2000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  style={{ fontSize: 15 }}
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Payment Date (YYYY-MM-DD) *</Text>
                <TextInput
                  className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                  placeholder="2026-01-01"
                  placeholderTextColor="#94a3b8"
                  value={paymentDate}
                  onChangeText={setPaymentDate}
                  style={{ fontSize: 15 }}
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Transaction ID (optional)</Text>
                <TextInput
                  className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                  placeholder="UPI ref / bank transfer ID"
                  placeholderTextColor="#94a3b8"
                  value={transactionId}
                  onChangeText={setTransactionId}
                  style={{ fontSize: 15 }}
                />
              </View>

              {specialCharges.length > 0 && (
                <CustomSelect
                  label="Special Charge (optional)"
                  value={specialChargeId}
                  options={[
                    { label: '— None (Regular Maintenance) —', value: '' },
                    ...specialCharges.map((sc) => ({
                      label: `${sc.title} (₹${sc.amount_expected})`,
                      value: sc.id,
                    })),
                  ]}
                  onValueChange={(v) => setSpecialChargeId(v)}
                  placeholder="Select special charge..."
                  icon="cash-outline"
                />
              )}

              <TouchableOpacity
                onPress={pickImage}
                className="border-2 border-dashed border-slate-300 rounded-xl py-4 items-center"
                style={{ backgroundColor: '#f8fafc' }}>
                <Text style={{ fontSize: 22 }}>📎</Text>
                <Text className="text-slate-600 font-semibold mt-1 text-sm">
                  {paymentProof ? '✅ Proof attached' : 'Attach Payment Proof'}
                </Text>
                <Text className="text-slate-400 mt-0.5" style={{ fontSize: 11 }}>Screenshot / receipt (optional)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className="rounded-xl py-4 items-center mt-2"
                style={{ backgroundColor: submitting ? '#7dd3fc' : '#0284c7' }}>
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-white font-bold text-base">Submit Payment →</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
          <View className="h-6" />
        </ScrollView>
      )}

      {/* Payment History */}
      {activeSection === 'history' && (
        <View className="flex-1">
          {/* Filter bar */}
          <View className="bg-white border-b border-slate-100 px-4 py-2 flex-row items-center gap-2">
            <View style={{ flex: 1 }}>
              <CustomSelect
                value={statusFilter}
                options={[
                  { label: 'All Payments', value: 'all' },
                  { label: '✓ Verified', value: 'verified' },
                  { label: '◷ Pending', value: 'pending' },
                  { label: '✕ Rejected', value: 'fraud' },
                ]}
                onValueChange={(v) => { setStatusFilter(v); fetchHistory(true); }}
                icon="funnel-outline"
                containerStyle={{ marginVertical: 0 }}
              />
            </View>
            <TouchableOpacity onPress={() => fetchHistory(true)} className="p-2 bg-slate-100 rounded-xl">
              <Text style={{ fontSize: 16 }}>🔄</Text>
            </TouchableOpacity>
          </View>

          {loadingHistory ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#0284c7" />
              <Text className="text-slate-400 mt-2 text-sm">Loading history...</Text>
            </View>
          ) : !historyLoaded ? (
            <View className="flex-1 items-center justify-center p-8">
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text className="text-slate-600 font-semibold mt-2 text-base">Load your payment history</Text>
              <TouchableOpacity onPress={() => fetchHistory(true)} className="mt-4 rounded-xl px-6 py-3" style={{ backgroundColor: '#0284c7' }}>
                <Text className="text-white font-bold">📥 Load History</Text>
              </TouchableOpacity>
            </View>
          ) : transactions.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text style={{ fontSize: 36 }}>💳</Text>
              <Text className="text-slate-500 mt-2 text-sm font-medium">No payments for this filter</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              renderItem={({ item }) => (
                <View className="bg-white rounded-2xl border border-slate-200 p-4"
                  style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 }}>
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-slate-900">₹{item.amount}</Text>
                      <Text className="text-slate-400 font-mono" style={{ fontSize: 11 }}>{item.date}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>
                  {item.transaction_id && (
                    <View className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mt-1">
                      <Text className="text-slate-500" style={{ fontSize: 11 }}>
                        Txn: <Text className="font-mono font-bold text-slate-700">{item.transaction_id}</Text>
                      </Text>
                    </View>
                  )}
                  {item.rejection_reason && (
                    <View className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 mt-2">
                      <Text className="text-rose-700 font-semibold" style={{ fontSize: 11 }}>
                        Rejection: {item.rejection_reason}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              ListFooterComponent={
                hasMore ? (
                  <TouchableOpacity
                    onPress={() => fetchHistory(false)}
                    disabled={loadingMore}
                    className="py-3 rounded-xl border border-sky-200 items-center mt-2"
                    style={{ backgroundColor: '#f0f9ff' }}>
                    {loadingMore
                      ? <ActivityIndicator color="#0284c7" />
                      : <Text style={{ color: '#0284c7', fontWeight: '700', fontSize: 13 }}>
                          ⬇ Load More ({totalCount - transactions.length} remaining)
                        </Text>
                    }
                  </TouchableOpacity>
                ) : (
                  <Text className="text-center text-slate-400 py-3" style={{ fontSize: 12 }}>
                    All {totalCount} payments loaded
                  </Text>
                )
              }
            />
          )}
        </View>
      )}
    </View>
  );
};

export default IncomePage;
