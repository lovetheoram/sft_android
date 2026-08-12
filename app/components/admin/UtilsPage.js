/**
 * UtilsPage — Property & Utilities Management (React Native)
 * Sub-tabs: Buildings (SuperAdmin only) | Flats | Categories | Special Charges
 * Full CRUD for each with Modal forms and ConfirmModal deletions
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, FlatList, Alert, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../user_utils/AuthContext';
import buildingService from '../../user_utils/services/buildingService';
import ConfirmModal from '../common/ConfirmModal';

// ─── Reusable form input ──────────────────────────────────────────────────────
const FormInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 5 }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || label}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      style={{
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0f172a',
        backgroundColor: '#fff',
        textAlignVertical: multiline ? 'top' : 'center',
        minHeight: multiline ? 80 : undefined,
      }}
      returnKeyType={multiline ? 'default' : 'done'}
      autoCapitalize="sentences"
    />
  </View>
);

// ─── Generic CRUD item row ────────────────────────────────────────────────────
const ItemRow = ({ title, subtitle, onEdit, onDelete }) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  }}>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{subtitle}</Text> : null}
    </View>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TouchableOpacity
        onPress={onEdit}
        style={{ padding: 8, borderRadius: 10, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }}
        activeOpacity={0.7}
      >
        <Ionicons name="pencil-outline" size={15} color="#2563eb" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDelete}
        style={{ padding: 8, borderRadius: 10, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3' }}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={15} color="#e11d48" />
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Modal Form Shell ─────────────────────────────────────────────────────────
const FormModal = ({ visible, title, onClose, onSave, saving, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, justifyContent: 'flex-end' }}
    >
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      <View style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        maxHeight: '90%',
      }}>
        {/* Handle */}
        <View style={{ width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 16 }}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, paddingBottom: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              disabled={saving}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: saving ? '#94a3b8' : '#0284c7', alignItems: 'center' }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

// ─── Section Panel: Buildings ─────────────────────────────────────────────────
const BuildingsPanel = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await buildingService.getBuildings();
      setBuildings(Array.isArray(res) ? res : (res?.results || []));
      setFetched(true);
    } catch { Alert.alert('Error', 'Failed to load buildings.'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditItem(null); setFormName(''); setFormAddress(''); setShowForm(true); };
  const openEdit = (b) => { setEditItem(b); setFormName(b.name); setFormAddress(b.address || ''); setShowForm(true); };

  const save = async () => {
    if (!formName.trim()) return Alert.alert('Validation', 'Building name is required.');
    setSaving(true);
    try {
      const payload = { name: formName.trim(), address: formAddress.trim() };
      if (editItem) await buildingService.updateBuilding(editItem.id, payload);
      else await buildingService.createBuilding(payload);
      setShowForm(false);
      load();
    } catch { Alert.alert('Error', 'Failed to save building.'); }
    finally { setSaving(false); }
  };

  const deleteB = async () => {
    try { await buildingService.deleteBuilding(deleteTarget.id); setDeleteTarget(null); load(); }
    catch { Alert.alert('Error', 'Failed to delete building.'); }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>🏢 Buildings</Text>
        <TouchableOpacity onPress={fetched ? openAdd : load} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0284c7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }} activeOpacity={0.7}>
          <Ionicons name={fetched ? 'add' : 'download-outline'} size={16} color="#fff" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{fetched ? 'Add' : 'Load'}</Text>
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color="#0284c7" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={buildings}
          keyExtractor={(b) => String(b.id)}
          renderItem={({ item }) => (
            <ItemRow
              title={item.name}
              subtitle={item.address || 'No address'}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          ListEmptyComponent={fetched ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🏢</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>No buildings yet. Tap Add to create one.</Text>
            </View>
          ) : null}
        />
      )}
      <FormModal visible={showForm} title={editItem ? 'Edit Building' : 'Add Building'} onClose={() => setShowForm(false)} onSave={save} saving={saving}>
        <FormInput label="Building Name *" value={formName} onChangeText={setFormName} />
        <FormInput label="Address" value={formAddress} onChangeText={setFormAddress} multiline />
      </FormModal>
      <ConfirmModal visible={!!deleteTarget} title="Delete Building" message={`Delete "${deleteTarget?.name}"? This will remove all flats and data.`} confirmLabel="Delete" destructive onConfirm={deleteB} onCancel={() => setDeleteTarget(null)} />
    </View>
  );
};

// ─── Section Panel: Flats ─────────────────────────────────────────────────────
const FlatsPanel = () => {
  const { isSuperAdmin } = useAuth();
  const [flats, setFlats] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formNumber, setFormNumber] = useState('');
  const [formBuilding, setFormBuilding] = useState('');
  const [formOccupied, setFormOccupied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [flatRes, bldgRes] = await Promise.all([
        buildingService.getFlats(),
        buildingService.getBuildings(),
      ]);
      setFlats(Array.isArray(flatRes) ? flatRes : (flatRes?.results || []));
      const bldgs = Array.isArray(bldgRes) ? bldgRes : (bldgRes?.results || []);
      setBuildings(bldgs);
      if (bldgs.length > 0 && !formBuilding) setFormBuilding(String(bldgs[0].id));
      setFetched(true);
    } catch { Alert.alert('Error', 'Failed to load flats.'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditItem(null);
    setFormNumber('');
    setFormBuilding(buildings[0]?.id ? String(buildings[0].id) : '');
    setFormOccupied(false);
    setShowForm(true);
  };

  const openEdit = (f) => {
    setEditItem(f);
    setFormNumber(f.number);
    setFormBuilding(String(f.building?.id || f.building || ''));
    setFormOccupied(f.is_occupied);
    setShowForm(true);
  };

  const save = async () => {
    if (!formNumber.trim() || !formBuilding) return Alert.alert('Validation', 'Flat number and building are required.');
    setSaving(true);
    try {
      const payload = { number: formNumber.trim(), building: Number(formBuilding), is_occupied: formOccupied };
      if (editItem) await buildingService.updateFlat(editItem.id, payload);
      else await buildingService.createFlat(payload);
      setShowForm(false);
      load();
    } catch { Alert.alert('Error', 'Failed to save flat.'); }
    finally { setSaving(false); }
  };

  const deleteF = async () => {
    try { await buildingService.deleteFlat(deleteTarget.id); setDeleteTarget(null); load(); }
    catch { Alert.alert('Error', 'Failed to delete flat.'); }
  };

  const filtered = flats.filter((f) => !searchQuery.trim() || `${f.number} ${f.building?.name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>🚪 Flats</Text>
        <TouchableOpacity onPress={fetched ? openAdd : load} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0284c7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }} activeOpacity={0.7}>
          <Ionicons name={fetched ? 'add' : 'download-outline'} size={16} color="#fff" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{fetched ? 'Add' : 'Load'}</Text>
        </TouchableOpacity>
      </View>
      {fetched && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search flats..."
            style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#0f172a', backgroundColor: '#fff' }}
          />
        </View>
      )}
      {loading ? <ActivityIndicator color="#0284c7" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(f) => String(f.id)}
          renderItem={({ item }) => (
            <ItemRow
              title={`Flat ${item.number}`}
              subtitle={`${item.building?.name || 'Unknown Building'} • ${item.is_occupied ? '🟢 Occupied' : '⚪ Vacant'}`}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          ListEmptyComponent={fetched ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🚪</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>No flats found.</Text>
            </View>
          ) : null}
        />
      )}
      <FormModal visible={showForm} title={editItem ? 'Edit Flat' : 'Add Flat'} onClose={() => setShowForm(false)} onSave={save} saving={saving}>
        <FormInput label="Flat Number *" value={formNumber} onChangeText={setFormNumber} placeholder="e.g. 101, A-2" />
        {buildings.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 5 }}>Building *</Text>
            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden' }}>
              <Picker selectedValue={formBuilding} onValueChange={setFormBuilding} style={{ height: 48, color: '#0f172a' }}>
                {buildings.map((b) => <Picker.Item key={b.id} label={b.name} value={String(b.id)} />)}
              </Picker>
            </View>
          </View>
        )}
        <TouchableOpacity
          onPress={() => setFormOccupied(!formOccupied)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}
          activeOpacity={0.7}
        >
          <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: formOccupied ? '#0284c7' : '#cbd5e1', backgroundColor: formOccupied ? '#0284c7' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
            {formOccupied && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={{ fontSize: 14, color: '#334155', fontWeight: '600' }}>Mark as Occupied</Text>
        </TouchableOpacity>
      </FormModal>
      <ConfirmModal visible={!!deleteTarget} title="Delete Flat" message={`Delete Flat ${deleteTarget?.number}?`} confirmLabel="Delete" destructive onConfirm={deleteF} onCancel={() => setDeleteTarget(null)} />
    </View>
  );
};

// ─── Section Panel: Categories ────────────────────────────────────────────────
const CategoriesPanel = () => {
  const [cats, setCats] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formName, setFormName] = useState('');
  const [formBuilding, setFormBuilding] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, bldgRes] = await Promise.all([buildingService.getCategories(), buildingService.getBuildings()]);
      setCats(Array.isArray(catRes) ? catRes : (catRes?.results || []));
      const bldgs = Array.isArray(bldgRes) ? bldgRes : (bldgRes?.results || []);
      setBuildings(bldgs);
      if (bldgs.length > 0) setFormBuilding(String(bldgs[0].id));
      setFetched(true);
    } catch { Alert.alert('Error', 'Failed to load categories.'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditItem(null); setFormName(''); setFormBuilding(buildings[0]?.id ? String(buildings[0].id) : ''); setShowForm(true); };
  const openEdit = (c) => { setEditItem(c); setFormName(c.name); setFormBuilding(String(c.building?.id || c.building || '')); setShowForm(true); };

  const save = async () => {
    if (!formName.trim()) return Alert.alert('Validation', 'Category name is required.');
    setSaving(true);
    try {
      const payload = { name: formName.trim(), building: Number(formBuilding) };
      if (editItem) await buildingService.updateCategory(editItem.id, payload);
      else await buildingService.createCategory(payload);
      setShowForm(false);
      load();
    } catch { Alert.alert('Error', 'Failed to save category.'); }
    finally { setSaving(false); }
  };

  const deleteC = async () => {
    try { await buildingService.deleteCategory(deleteTarget.id); setDeleteTarget(null); load(); }
    catch { Alert.alert('Error', 'Failed to delete category.'); }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>🏷️ Expense Categories</Text>
        <TouchableOpacity onPress={fetched ? openAdd : load} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0284c7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }} activeOpacity={0.7}>
          <Ionicons name={fetched ? 'add' : 'download-outline'} size={16} color="#fff" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{fetched ? 'Add' : 'Load'}</Text>
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color="#0284c7" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={cats}
          keyExtractor={(c) => String(c.id)}
          renderItem={({ item }) => (
            <ItemRow
              title={item.name}
              subtitle={item.building?.name || 'Unknown Building'}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          ListEmptyComponent={fetched ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🏷️</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>No categories found.</Text>
            </View>
          ) : null}
        />
      )}
      <FormModal visible={showForm} title={editItem ? 'Edit Category' : 'Add Category'} onClose={() => setShowForm(false)} onSave={save} saving={saving}>
        <FormInput label="Category Name *" value={formName} onChangeText={setFormName} placeholder="e.g. Electricity, Water" />
        {buildings.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 5 }}>Building *</Text>
            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden' }}>
              <Picker selectedValue={formBuilding} onValueChange={setFormBuilding} style={{ height: 48, color: '#0f172a' }}>
                {buildings.map((b) => <Picker.Item key={b.id} label={b.name} value={String(b.id)} />)}
              </Picker>
            </View>
          </View>
        )}
      </FormModal>
      <ConfirmModal visible={!!deleteTarget} title="Delete Category" message={`Delete "${deleteTarget?.name}"? This may affect existing expenses.`} confirmLabel="Delete" destructive onConfirm={deleteC} onCancel={() => setDeleteTarget(null)} />
    </View>
  );
};

// ─── Section Panel: Special Charges ──────────────────────────────────────────
const SpecialChargesPanel = () => {
  const [charges, setCharges] = useState([]);
  const [members, setMembers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMember, setFormMember] = useState('');
  const [formBuilding, setFormBuilding] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [scRes, bldgRes] = await Promise.all([buildingService.getSpecialCharges(), buildingService.getBuildings()]);
      setCharges(Array.isArray(scRes) ? scRes : (scRes?.results || []));
      const bldgs = Array.isArray(bldgRes) ? bldgRes : (bldgRes?.results || []);
      setBuildings(bldgs);
      setFetched(true);
    } catch { Alert.alert('Error', 'Failed to load special charges.'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditItem(null); setFormTitle(''); setFormDesc(''); setFormAmount('');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormMember(''); setFormBuilding(buildings[0]?.id ? String(buildings[0].id) : '');
    setShowForm(true);
  };

  const save = async () => {
    if (!formTitle.trim() || !formAmount) return Alert.alert('Validation', 'Title and amount are required.');
    setSaving(true);
    try {
      const payload = {
        title: formTitle.trim(), description: formDesc.trim(),
        amount_expected: Number(formAmount), due_date: formDueDate,
        member: Number(formMember), building: Number(formBuilding),
      };
      if (editItem) await buildingService.updateSpecialCharge(editItem.id, payload);
      else await buildingService.createSpecialCharge(payload);
      setShowForm(false);
      load();
    } catch { Alert.alert('Error', 'Failed to save special charge.'); }
    finally { setSaving(false); }
  };

  const deleteSC = async () => {
    try { await buildingService.deleteSpecialCharge(deleteTarget.id); setDeleteTarget(null); load(); }
    catch { Alert.alert('Error', 'Failed to delete special charge.'); }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>⚡ Special Charges</Text>
        <TouchableOpacity onPress={fetched ? openAdd : load} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0284c7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }} activeOpacity={0.7}>
          <Ionicons name={fetched ? 'add' : 'download-outline'} size={16} color="#fff" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{fetched ? 'Add' : 'Load'}</Text>
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color="#0284c7" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={charges}
          keyExtractor={(c) => String(c.id)}
          renderItem={({ item }) => (
            <ItemRow
              title={item.title}
              subtitle={`₹${item.amount_expected} • Due: ${item.due_date} • ${item.building?.name || ''}`}
              onEdit={() => { setEditItem(item); setFormTitle(item.title); setFormDesc(item.description || ''); setFormAmount(String(item.amount_expected)); setFormDueDate(item.due_date); setShowForm(true); }}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          ListEmptyComponent={fetched ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>⚡</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>No special charges found.</Text>
            </View>
          ) : null}
        />
      )}
      <FormModal visible={showForm} title={editItem ? 'Edit Special Charge' : 'Add Special Charge'} onClose={() => setShowForm(false)} onSave={save} saving={saving}>
        <FormInput label="Title *" value={formTitle} onChangeText={setFormTitle} />
        <FormInput label="Description" value={formDesc} onChangeText={setFormDesc} multiline />
        <FormInput label="Amount Expected (₹) *" value={formAmount} onChangeText={setFormAmount} keyboardType="numeric" />
        <FormInput label="Due Date (YYYY-MM-DD) *" value={formDueDate} onChangeText={setFormDueDate} />
        {buildings.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 5 }}>Building *</Text>
            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden' }}>
              <Picker selectedValue={formBuilding} onValueChange={setFormBuilding} style={{ height: 48, color: '#0f172a' }}>
                {buildings.map((b) => <Picker.Item key={b.id} label={b.name} value={String(b.id)} />)}
              </Picker>
            </View>
          </View>
        )}
      </FormModal>
      <ConfirmModal visible={!!deleteTarget} title="Delete Special Charge" message={`Delete "${deleteTarget?.title}"?`} confirmLabel="Delete" destructive onConfirm={deleteSC} onCancel={() => setDeleteTarget(null)} />
    </View>
  );
};

// ─── UtilsPage Root ───────────────────────────────────────────────────────────
const UTIL_TABS = [
  { key: 'flats',           label: 'Flats',            icon: 'home-outline' },
  { key: 'categories',      label: 'Categories',       icon: 'pricetag-outline' },
  { key: 'special-charges', label: 'Special Charges',  icon: 'flash-outline' },
];

const UTIL_TABS_SUPER = [
  { key: 'buildings',       label: 'Buildings',        icon: 'business-outline' },
  ...UTIL_TABS,
];

const UtilsPage = () => {
  const { isSuperAdmin } = useAuth();
  const tabs = isSuperAdmin ? UTIL_TABS_SUPER : UTIL_TABS;
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'buildings' : 'flats');

  const renderPanel = () => {
    switch (activeTab) {
      case 'buildings':       return <BuildingsPanel />;
      case 'flats':           return <FlatsPanel />;
      case 'categories':      return <CategoriesPanel />;
      case 'special-charges': return <SpecialChargesPanel />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Sub-tab bar */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                  borderWidth: 1,
                  backgroundColor: isActive ? '#e0f2fe' : '#f8fafc',
                  borderColor: isActive ? '#0284c7' : '#e2e8f0',
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={tab.icon} size={13} color={isActive ? '#0284c7' : '#64748b'} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#0284c7' : '#475569' }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {renderPanel()}
      </View>
    </View>
  );
};

export default UtilsPage;
