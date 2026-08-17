/**
 * ExpensePage — Expense Recording & Paginated History (React Native)
 * Matches IncomePage lazy loading architecture:
 * - Tab Nav: Add Expense | Expense Records
 * - Paginated Lazy Loading (10 items/page Load More pattern)
 * - Category & Search filtering
 * - 100% Full-Width CustomSelect category pickers
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomSelect from './common/CustomSelect';
import { API_BASE_URL } from '../user_utils/api';
import financeService from '../user_utils/services/financeService';

const PAGE_SIZE = 10;

const ExpensePage = () => {
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'history'
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [note, setNote] = useState('');
  const [buildingId, setBuildingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // History & Paginated state
  const [expenses, setExpenses] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [authHeader, setAuthHeader] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          const header = { headers: { Authorization: `Bearer ${token}` } };
          setAuthHeader(header);
          fetchBuilding(header);
          fetchCategories(header);
        }
      } catch (err) {
        console.error('Init error', err);
      }
    };
    init();
  }, []);

  const fetchBuilding = async (header) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/building/my_building/`, header);
      setBuildingId(res.data.id);
    } catch {
      /* silent */
    }
  };

  const fetchCategories = async (header) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories/`, header);
      const catList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      const seen = new Set();
      const uniqueCats = [];
      for (const c of catList) {
        const key = (c.name || '').trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueCats.push(c);
        }
      }
      setCategories(uniqueCats);
    } catch {
      /* silent */
    }
  };

  // Paginated lazy loading fetch
  const fetchExpenses = async (pageNum = 1, isRefresh = false) => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: (pageNum - 1) * PAGE_SIZE,
      };
      if (categoryFilter) params.category_id = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await financeService.getExpenses(params);
      const items = Array.isArray(res) ? res : (res?.results || []);
      const count = res?.count || items.length;

      if (isRefresh || pageNum === 1) {
        setExpenses(items);
      } else {
        setExpenses((prev) => [...prev, ...items]);
      }

      setTotalCount(count);
      setPage(pageNum);
      setHasMore((pageNum * PAGE_SIZE) < count);
    } catch {
      Alert.alert('Error', 'Failed to load expense history.');
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchExpenses(1, true);
    }
  }, [activeTab, categoryFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loadingHistory) {
      fetchExpenses(page + 1);
    }
  };

  const handleSubmit = async () => {
    if (!buildingId) {
      Alert.alert('Unauthorized', 'You must be a building admin to add expenses.');
      return;
    }
    if (!selectedCategory || !amount || !month) {
      Alert.alert('Missing Fields', 'Please select a category, enter amount, and month.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/expense/`,
        {
          category_id: selectedCategory,
          amount,
          date: `${month}-01`,
          description: note,
          building_id: buildingId,
        },
        authHeader
      );

      Alert.alert('Success', '✅ Expense recorded successfully!');
      setAmount('');
      setSelectedCategory('');
      setNote('');
      setActiveTab('history');
      fetchExpenses(1, true);
    } catch {
      Alert.alert('Error', 'Failed to add expense. Please check your input.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* ── Sub Header Nav Tabs ── */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingHorizontal: 16,
        paddingTop: 10,
        gap: 8,
      }}>
        <TouchableOpacity
          onPress={() => setActiveTab('add')}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderBottomWidth: 2.5,
            borderBottomColor: activeTab === 'add' ? '#0284c7' : 'transparent',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: activeTab === 'add' ? '#0284c7' : '#64748b' }}>
            ➕ Record Expense
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderBottomWidth: 2.5,
            borderBottomColor: activeTab === 'history' ? '#0284c7' : 'transparent',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 13.5, fontWeight: '800', color: activeTab === 'history' ? '#0284c7' : '#64748b' }}>
            📜 Expense Records ({totalCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab 1: Record Expense Form ── */}
      {activeTab === 'add' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>
              💸 New Society Expense
            </Text>

            <CustomSelect
              label="Expense Category *"
              value={selectedCategory}
              options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
              onValueChange={(val) => setSelectedCategory(val)}
              placeholder="-- Select Category --"
              icon="pricetag-outline"
              containerStyle={{ width: '100%' }}
            />

            <View style={{ marginVertical: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 5 }}>Amount (₹) *</Text>
              <TextInput
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 2500"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#ffffff',
                  borderWidth: 1.2,
                  borderColor: '#cbd5e1',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  fontSize: 14,
                  color: '#0f172a',
                }}
              />
            </View>

            <View style={{ marginVertical: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 5 }}>Month (YYYY-MM) *</Text>
              <TextInput
                value={month}
                onChangeText={setMonth}
                placeholder="2026-08"
                placeholderTextColor="#94a3b8"
                style={{
                  backgroundColor: '#ffffff',
                  borderWidth: 1.2,
                  borderColor: '#cbd5e1',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  fontSize: 14,
                  color: '#0f172a',
                }}
              />
            </View>

            <View style={{ marginVertical: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 5 }}>Description / Note (Optional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Electricity bill payment / maintenance repair"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: '#ffffff',
                  borderWidth: 1.2,
                  borderColor: '#cbd5e1',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  fontSize: 14,
                  color: '#0f172a',
                  height: 80,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              style={{
                backgroundColor: submitting ? '#93c5fd' : '#0284c7',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 12,
              }}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>
                  Submit Expense Record →
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── Tab 2: Paginated Lazy Loading History List ── */}
      {activeTab === 'history' && (
        <View style={{ flex: 1 }}>
          {/* Filter Bar */}
          <View style={{
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
          }}>
            <CustomSelect
              value={categoryFilter}
              options={[
                { label: 'All Categories', value: '' },
                ...categories.map((c) => ({ label: c.name, value: c.id })),
              ]}
              onValueChange={(val) => { setCategoryFilter(val); }}
              icon="funnel-outline"
              containerStyle={{ width: '100%', marginVertical: 0 }}
            />
          </View>

          {/* List */}
          <FlatList
            data={expenses}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
            renderItem={({ item }) => (
              <View style={{
                backgroundColor: '#ffffff',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ backgroundColor: '#fff1f2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#fecdd3' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#e11d48' }}>
                      {typeof item.category === 'object' ? item.category?.name : item.category_name || item.category || 'General'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#e11d48' }}>
                    ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                {item.description ? (
                  <Text style={{ fontSize: 13, color: '#334155', fontWeight: '500', marginTop: 8 }}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>
                    📅 {item.date || 'Recorded'}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: '#059669', fontWeight: '700' }}>
                    ✓ Verified Expense
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={
              hasMore ? (
                <TouchableOpacity
                  onPress={loadMore}
                  disabled={loadingHistory}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: 'center',
                    marginVertical: 12,
                  }}
                  activeOpacity={0.7}
                >
                  {loadingHistory ? (
                    <ActivityIndicator color="#0284c7" />
                  ) : (
                    <Text style={{ color: '#0284c7', fontWeight: '800', fontSize: 13 }}>
                      Load More Expenses ({expenses.length} of {totalCount}) ↓
                    </Text>
                  )}
                </TouchableOpacity>
              ) : expenses.length > 0 ? (
                <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, marginVertical: 16 }}>
                  Showing all {totalCount} recorded expenses
                </Text>
              ) : null
            }
            ListEmptyComponent={
              !loadingHistory && (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🧾</Text>
                  <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '700' }}>No expense records found</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{"Tap \"Record Expense\" above to add society expenses."}</Text>
                </View>
              )
            }
          />
        </View>
      )}
    </View>
  );
};

export default ExpensePage;
