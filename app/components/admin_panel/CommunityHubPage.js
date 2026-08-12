/**
 * CommunityHubPage — Unified Community Hub (React Native)
 * Tabs: Notifications | Complaints | Announcements | Documents
 * Replaces the old AdminHome.js — unified entry via Bell icon
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
} from 'react-native';
import { useAuth } from '../../user_utils/AuthContext';
import NotificationPage from './NotificationPage';
import AdminComplaintPage from './AdminComplaintPage';
import AnnouncementPage from './AnnouncementPage';
import DocumentPage from './DocumentPage';

const TABS = [
  { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
  { id: 'complaints', label: '⚠️ Complaints', icon: '⚠️' },
  { id: 'announcements', label: '📢 Announcements', icon: '📢' },
  { id: 'documents', label: '📄 Documents', icon: '📄' },
];

const CommunityHubPage = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');

  const renderTab = () => {
    switch (activeTab) {
      case 'notifications': return <NotificationPage />;
      case 'complaints': return isAdmin ? <AdminComplaintPage /> : <ComplaintViewUser />;
      case 'announcements': return <AnnouncementPage />;
      case 'documents': return <DocumentPage />;
      default: return <NotificationPage />;
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Tab bar */}
      <View className="bg-white border-b border-slate-200 px-2 py-1.5">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className="flex-row items-center gap-1 px-3.5 py-1.5 rounded-full border"
                style={{
                  backgroundColor: isActive ? '#0284c7' : '#f8fafc',
                  borderColor: isActive ? '#0284c7' : '#e2e8f0',
                }}>
                <Text style={{ fontSize: 12 }}>{tab.icon}</Text>
                <Text
                  className="font-semibold text-xs"
                  style={{ color: isActive ? '#ffffff' : '#475569' }}>
                  {tab.label.split(' ')[1]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View className="flex-1">
        {renderTab()}
      </View>
    </View>
  );
};

// Simple resident complaint view (redirects to complaint form)
const ComplaintViewUser = () => (
  <View className="flex-1 items-center justify-center p-8">
    <Text style={{ fontSize: 40 }}>📬</Text>
    <Text className="text-slate-700 font-bold text-base mt-3">Complaint Tickets</Text>
    <Text className="text-slate-400 text-sm mt-1 text-center">
      Use the "File Complaint" button in Notifications to submit a ticket.
    </Text>
  </View>
);

export default CommunityHubPage;
