/**
 * AdminExpensePanel — Full CRUD (React Native)
 * - Expense list with category badges, pagination
 * - Add/Edit expense modal
 * - Delete with confirmation
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert, FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import financeService from '../../user_utils/services/financeService';
import buildingService from '../../user_utils/services/buildingService';

const LIMIT = 10;

const AdminExpensePanel = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Add/Edit modal
  const [editItem, setEditItem] = useState(null); // null = add mode, object = edit mode
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formProof, setFormProof] = useState(null);
  const [formSaving, setFormSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchExpenses = async (page = 1, overrideCategory) => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset: (page - 1) * LIMIT };
      const cat = overrideCategory !== undefined ? overrideCategory : categoryFilter;
      if (cat) params.category_id = cat;
      const res = await financeService.getExpenses(params);
      const items = Array.isArray(res) ? res : (res?.results || []);
      setExpenses(items);
      setTotalCount(res?.count || items.length);
      setCurrentPage(page);
    } catch { Alert.alert('Error', 'Failed to load expenses.'); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await buildingService.getCategories();
      setCategories(Array.isArray(res) ? res : (res?.results || []));
    } catch { /* silent */ }
  };

  useEffect(() => { fetchExpenses(1); fetchCategories(); }, []);

  const openAddForm = () => {
    setEditItem(null);
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(categories[0]?.id || '');
    setFormDescription('');
    setFormProof(null);
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditItem(item);
    setFormAmount(String(item.amount));
    setFormDate(item.date);
    setFormCategory(item.category?.id || '');
    setFormDescription(item.description || '');
    setFormProof(null);
    setShowForm(true);
  };

  const pickProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) setFormProof(result.assets[0]);
  };

  const handleSave = async () => {
    if (!formAmount.trim()) { Alert.alert('Required', 'Amount is required.'); return; }
    setFormSaving(true);
    try {
      const formData = new FormData();
      formData.append('amount', formAmount);
      formData.append('date', formDate);
      if (formCategory) formData.append('category_id', formCategory);
      if (formDescription.trim()) formData.append('description', formDescription.trim());
      if (formProof) {
        formData.append('bill_attachment', { uri: formProof.uri, name: 'bill.jpg', type: 'image/jpeg' });
      }

      if (editItem) {
        await financeService.updateExpense(editItem.id, formData);
        Alert.alert('Success', 'Expense updated.');
      } else {
        await financeService.createExpense(formData);
        Alert.alert('Success', 'Expense recorded.');
      }
      setShowForm(false);
      fetchExpenses(currentPage);
    } catch { Alert.alert('Error', 'Failed to save expense.'); }
    finally { setFormSaving(false); }
  };

  const confirmDelete = (item) => {
    Alert.alert('Delete Expense', `Delete expense of ₹${item.amount} on ${item.date}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await financeService.deleteExpense(item.id);
          fetchExpenses(currentPage);
        } catch { Alert.alert('Error', 'Failed to delete.'); }
      }},
    ]);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-4">

          {/* Header */}
          <View className="bg-white rounded-2xl border border-slate-200 p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-lg font-bold text-slate-900">🧾 Expense Ledger</Text>
                <Text className="text-slate-500" style={{ fontSize: 11 }}>Track society expenditures by category</Text>
              </View>
              <TouchableOpacity onPress={openAddForm} className="px-3 py-2 rounded-xl" style={{ backgroundColor: '#0284c7' }}>
                <Text className="text-white font-bold text-xs">+ Add Expense</Text>
              </TouchableOpacity>
            </View>

            {/* Category filter */}
            <View className="flex-row items-center gap-2">
              <View className="flex-1 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden" style={{ height: 40 }}>
                <Picker
                  selectedValue={categoryFilter}
                  onValueChange={(v) => { setCategoryFilter(v); fetchExpenses(1, v); }}
                  style={{ height: 40 }}>
                  <Picker.Item label="All Categories" value="" />
                  {categories.map((c) => (
                    <Picker.Item key={c.id} label={c.name} value={c.id} />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity onPress={() => fetchExpenses(currentPage)} className="p-2.5 border border-slate-200 rounded-xl bg-slate-50">
                <Text>🔄</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View className="items-center py-12"><ActivityIndicator size="large" color="#0284c7" /></View>
          ) : expenses.length === 0 ? (
            <View className="bg-white border border-slate-200 rounded-2xl p-10 items-center">
              <Text style={{ fontSize: 36 }}>🧾</Text>
              <Text className="text-slate-500 mt-2 text-sm">No expenses found</Text>
            </View>
          ) : (
            expenses.map((item) => (
              <View key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 }}>
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-slate-900">₹{item.amount}</Text>
                    <Text className="text-slate-500" style={{ fontSize: 12 }}>{item.date}</Text>
                  </View>
                  <View className="px-2 py-0.5 rounded-full border border-sky-200" style={{ backgroundColor: '#f0f9ff' }}>
                    <Text style={{ color: '#0369a1', fontSize: 10, fontWeight: '700' }}>
                      {item.category?.name || 'General'}
                    </Text>
                  </View>
                </View>
                {item.description && (
                  <Text className="text-slate-600 text-xs mb-2">{item.description}</Text>
                )}
                <View className="flex-row gap-2 pt-2 border-t border-slate-100">
                  <TouchableOpacity onPress={() => openEditForm(item)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
                    <Text className="text-slate-700 font-bold text-xs">✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item)} className="px-3 py-2 rounded-xl border border-rose-200" style={{ backgroundColor: '#fff1f2' }}>
                    <Text style={{ color: '#e11d48', fontSize: 12, fontWeight: '700' }}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* Pagination */}
          {!loading && expenses.length > 0 && (
            <View className="flex-row items-center justify-between gap-2">
              <TouchableOpacity
                onPress={() => fetchExpenses(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 items-center bg-white"
                style={{ opacity: currentPage === 1 ? 0.4 : 1 }}>
                <Text className="text-slate-700 font-semibold text-xs">← Previous</Text>
              </TouchableOpacity>
              <View className="px-3 py-2.5 rounded-xl bg-slate-100">
                <Text className="text-slate-700 font-bold font-mono text-xs">
                  {currentPage}/{totalPages}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => fetchExpenses(currentPage + 1)}
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

      {/* Add/Edit Expense Modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl p-5 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-slate-900">
                {editItem ? `✏️ Edit Expense #${editItem.id}` : '+ Add Expense'}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text className="text-slate-400 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-bold text-slate-700 mb-1">Amount (₹) *</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-3"
              keyboardType="numeric" value={formAmount} onChangeText={setFormAmount}
              placeholder="e.g. 500" placeholderTextColor="#94a3b8" style={{ fontSize: 14 }} />

            <Text className="text-xs font-bold text-slate-700 mb-1">Date (YYYY-MM-DD) *</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-3"
              value={formDate} onChangeText={setFormDate}
              placeholder="2026-01-01" placeholderTextColor="#94a3b8" style={{ fontSize: 14 }} />

            {categories.length > 0 && (
              <>
                <Text className="text-xs font-bold text-slate-700 mb-1">Category</Text>
                <View className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden mb-3" style={{ height: 48 }}>
                  <Picker selectedValue={formCategory} onValueChange={setFormCategory} style={{ height: 48 }}>
                    <Picker.Item label="— Select Category —" value="" />
                    {categories.map((c) => (
                      <Picker.Item key={c.id} label={c.name} value={c.id} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <Text className="text-xs font-bold text-slate-700 mb-1">Description</Text>
            <TextInput
              className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-3"
              value={formDescription} onChangeText={setFormDescription}
              placeholder="Optional description..." placeholderTextColor="#94a3b8"
              style={{ fontSize: 14 }} />

            <TouchableOpacity onPress={pickProof} className="border-dashed border-2 border-slate-300 rounded-xl py-3 items-center mb-4" style={{ backgroundColor: '#f8fafc' }}>
              <Text className="text-slate-600 font-semibold text-sm">
                {formProof ? '✅ Bill attached' : '📎 Attach Bill (optional)'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setShowForm(false)} className="flex-1 py-3 rounded-xl items-center border border-slate-200 bg-slate-100">
                <Text className="text-slate-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={formSaving} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: formSaving ? '#7dd3fc' : '#0284c7' }}>
                {formSaving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Save Expense</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminExpensePanel;
