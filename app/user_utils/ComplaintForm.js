/**
 * ComplaintForm — Resident Complaint Submission (React Native)
 * - Subject, description, recipient (admin) picker
 * - Matches web CreateComplaintModal
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import societyService from './services/societyService';
import apiClient from './api';

const ComplaintForm = ({ onClose }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const { data } = await apiClient.get('/users/', { params: { role: 'admin' } });
        const list = Array.isArray(data) ? data : (data?.results || []);
        setRecipients(list);
        if (list.length > 0) setRecipientId(list[0].id);
      } catch { /* silent */ }
      finally { setLoadingRecipients(false); }
    };
    fetchRecipients();
  }, []);

  const handleSubmit = async () => {
    if (!subject.trim()) { Alert.alert('Required', 'Please enter a subject.'); return; }
    if (!description.trim()) { Alert.alert('Required', 'Please describe the issue.'); return; }
    setSubmitting(true);
    try {
      await societyService.createComplaint({
        subject: subject.trim(),
        description: description.trim(),
        recipient: recipientId || null,
      });
      Alert.alert('Success', 'Your complaint has been submitted! Admin will review it shortly.', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-slate-900">⚠️ File a Complaint</Text>
        <TouchableOpacity onPress={onClose} className="p-2">
          <Text className="text-slate-500 font-bold text-xl">✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <View className="bg-white rounded-2xl border border-slate-200 p-5"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
          <Text className="text-slate-500 text-xs mb-4 leading-relaxed">
            Lodge a maintenance request, raise a concern, or report an issue to your building admin.
          </Text>

          {/* Subject */}
          <Text className="text-xs font-bold text-slate-700 mb-1">Subject *</Text>
          <TextInput
            className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-3"
            placeholder="e.g. Water leakage in corridor..."
            placeholderTextColor="#94a3b8"
            value={subject}
            onChangeText={setSubject}
            style={{ fontSize: 14 }}
          />

          {/* Description */}
          <Text className="text-xs font-bold text-slate-700 mb-1">Detailed Description *</Text>
          <TextInput
            className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 text-slate-900 mb-3"
            placeholder="Describe the issue in detail — location, when it started, severity..."
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            style={{ fontSize: 14, minHeight: 120, textAlignVertical: 'top' }}
          />

          {/* Recipient */}
          <Text className="text-xs font-bold text-slate-700 mb-1">Send To (Admin)</Text>
          {loadingRecipients ? (
            <ActivityIndicator color="#0284c7" />
          ) : (
            <View className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden mb-5" style={{ height: 48 }}>
              <Picker
                selectedValue={recipientId}
                onValueChange={setRecipientId}
                style={{ height: 48 }}>
                <Picker.Item label="— Select admin recipient —" value="" />
                {recipients.map((r) => (
                  <Picker.Item
                    key={r.id}
                    label={`${r.first_name || ''} ${r.last_name || ''} (@${r.username})`}
                    value={r.id}
                  />
                ))}
              </Picker>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="py-3.5 rounded-xl items-center"
            style={{ backgroundColor: submitting ? '#7dd3fc' : '#f59e0b' }}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-bold text-base">Submit Complaint →</Text>
            }
          </TouchableOpacity>
        </View>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ComplaintForm;
