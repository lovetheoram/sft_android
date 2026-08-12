/**
 * AdminDashboard — Full Admin Suite (React Native)
 * Tabs: Overview | Users | Income Audit | Expenses | Utilities | Complaints
 * - SuperAdmin sees all including Building management in Utilities
 * - Building Admin sees flats/categories/special charges in Utilities
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../user_utils/AuthContext';
import AdminUserPanel from './AdminUserPanel';
import AdminIncomePanel from './AdminIncomePanel';
import AdminExpensePanel from './AdminExpensePanel';
import AdminComplaintPage from '../admin_panel/AdminComplaintPage';
import UtilsPage from './UtilsPage';

const TABS = [
  { key: 'overview',    label: 'Overview',    icon: 'grid-outline',           iconActive: 'grid' },
  { key: 'users',       label: 'Users',       icon: 'people-outline',         iconActive: 'people' },
  { key: 'income',      label: 'Income',      icon: 'card-outline',           iconActive: 'card' },
  { key: 'expenses',    label: 'Expenses',    icon: 'receipt-outline',        iconActive: 'receipt' },
  { key: 'utilities',   label: 'Utilities',   icon: 'construct-outline',      iconActive: 'construct' },
  { key: 'complaints',  label: 'Complaints',  icon: 'alert-circle-outline',   iconActive: 'alert-circle' },
];

const OVERVIEW_CARDS = [
  { key: 'users',      emoji: '👥', icon: 'people-outline',       title: 'User Management',    desc: 'Edit, delete, assign flats, collect cash payments' },
  { key: 'income',     emoji: '💳', icon: 'card-outline',         title: 'Income Audit',       desc: 'Verify/reject/edit member payment submissions' },
  { key: 'expenses',   emoji: '🧾', icon: 'receipt-outline',      title: 'Expense Ledger',     desc: 'Add/edit society expenses by category' },
  { key: 'utilities',  emoji: '🏗️', icon: 'construct-outline',    title: 'Utilities & Setup',  desc: 'Manage buildings, flats, categories & special charges' },
  { key: 'complaints', emoji: '⚠️', icon: 'alert-circle-outline', title: 'Complaint Helpdesk', desc: 'Resolve tickets and post admin remarks' },
];

const AdminDashboard = () => {
  const { user, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const renderTab = () => {
    switch (activeTab) {
      case 'users':      return <AdminUserPanel />;
      case 'income':     return <AdminIncomePanel />;
      case 'expenses':   return <AdminExpensePanel />;
      case 'utilities':  return <UtilsPage />;
      case 'complaints': return <AdminComplaintPage />;
      default:
        return (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 16, gap: 12 }}>
              {/* Welcome Card */}
              <View style={{
                borderRadius: 18,
                backgroundColor: '#0f172a',
                padding: 20,
                overflow: 'hidden',
              }}>
                <View style={{
                  position: 'absolute', top: -24, right: -24,
                  width: 100, height: 100, borderRadius: 50,
                  backgroundColor: 'rgba(14,165,233,0.15)',
                }} />
                <Text style={{ fontSize: 11, color: '#38bdf8', fontWeight: '700', marginBottom: 6 }}>
                  ⚙️ ADMIN CONTROL CENTER
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#f8fafc', lineHeight: 26, marginBottom: 6 }}>
                  {isSuperAdmin ? 'Super Admin' : 'Building Admin'}
                </Text>
                <Text style={{ fontSize: 13, color: '#94a3b8', lineHeight: 18 }}>
                  {isSuperAdmin
                    ? 'Full system access — manage all buildings globally'
                    : `Managing ${user?.flat?.building?.name || 'your building'}`
                  }
                </Text>
              </View>

              {/* Quick Action Cards */}
              {OVERVIEW_CARDS.map((card) => (
                <TouchableOpacity
                  key={card.key}
                  onPress={() => setActiveTab(card.key)}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 46, height: 46, borderRadius: 14,
                    backgroundColor: '#f0f9ff',
                    borderWidth: 1,
                    borderColor: '#bae6fd',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 22 }}>{card.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 2 }}>
                      {card.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748b', lineHeight: 17 }}>
                      {card.desc}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}

              <View style={{ height: 16 }} />
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Tab bar */}
      <View style={{
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        elevation: 1,
      }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1,
                  backgroundColor: isActive ? '#0284c7' : '#f8fafc',
                  borderColor: isActive ? '#0284c7' : '#e2e8f0',
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={14}
                  color={isActive ? '#fff' : '#64748b'}
                />
                <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : '#475569' }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>
    </View>
  );
};

export default AdminDashboard;
