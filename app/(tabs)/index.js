/**
 * Root App Shell — Industry-standard Android/iOS navigation
 * - Persistent Bottom Tab Bar (Android Material Design standard)
 * - Header with brand, bell notification badge, avatar popover
 * - Role-based tab visibility
 * - Haptic feedback on tab press (expo-haptics)
 * - Ionicons for tab icons
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, SafeAreaView, TouchableOpacity,
  Modal, ScrollView, ActivityIndicator, StatusBar, Platform,
  Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../user_utils/AuthContext';
import societyService from '../user_utils/services/societyService';

// Screen components
import UserHomePage from '../components/UserHomePage';
import LoginPage from '../components/LoginPage';
import ProfilePage from '../components/ProfilePage';
import IncomePage from '../components/IncomePage';
import ExpensePage from '../components/ExpensePage';
import FinancialSummary from '../components/FinancialSummary';
import AdminDashboard from '../components/admin/AdminDashboard';
import CommunityHubPage from '../components/admin_panel/CommunityHubPage';
import AIChatScreen from '../components/AIChatScreen';
import HomePage from '../components/HomePage';

// ─── Tab definitions by role ─────────────────────────────────────────────────

const SUPER_ADMIN_TABS = [
  { id: 'user-home',       label: 'Home',       icon: 'home',           iconActive: 'home' },
  { id: 'admin-dashboard', label: 'Admin',       icon: 'settings-outline', iconActive: 'settings' },
  { id: 'notifications',   label: 'Community',   icon: 'notifications-outline', iconActive: 'notifications' },
  { id: 'ai-chat',         label: 'AI Chat',     icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
  { id: 'profile',         label: 'Profile',     icon: 'person-outline', iconActive: 'person' },
];

const BUILDING_ADMIN_TABS = [
  { id: 'user-home',       label: 'Home',       icon: 'home-outline',   iconActive: 'home' },
  { id: 'dashboard',       label: 'Finance',     icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { id: 'income',          label: 'Payments',    icon: 'card-outline',   iconActive: 'card' },
  { id: 'expenses',        label: 'Expenses',    icon: 'receipt-outline', iconActive: 'receipt' },
  { id: 'admin-dashboard', label: 'Admin',       icon: 'settings-outline', iconActive: 'settings' },
  { id: 'notifications',   label: 'Community',   icon: 'notifications-outline', iconActive: 'notifications' },
  { id: 'ai-chat',         label: 'AI Chat',     icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
];

const RESIDENT_TABS = [
  { id: 'user-home',   label: 'Home',     icon: 'home-outline',       iconActive: 'home' },
  { id: 'dashboard',   label: 'Finance',  icon: 'bar-chart-outline',  iconActive: 'bar-chart' },
  { id: 'income',      label: 'Payments', icon: 'card-outline',       iconActive: 'card' },
  { id: 'notifications', label: 'Community', icon: 'notifications-outline', iconActive: 'notifications' },
  { id: 'ai-chat',     label: 'AI Chat',  icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
  { id: 'profile',     label: 'Profile',  icon: 'person-outline',     iconActive: 'person' },
];

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────

const BottomTabBar = ({ tabs, activeTab, onTabPress, unreadCount }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#ffffff',
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      paddingBottom: insets.bottom || 8,
      paddingTop: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 8,
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const showBadge = tab.id === 'notifications' && unreadCount > 0;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabPress(tab.id)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}
            android_ripple={{ color: '#e0f2fe', radius: 28, borderless: true }}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={22}
                color={isActive ? '#0284c7' : '#94a3b8'}
              />
              {showBadge && (
                <View style={{
                  position: 'absolute', top: -3, right: -6,
                  backgroundColor: '#f43f5e', borderRadius: 8,
                  minWidth: 16, height: 16,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1.5, borderColor: '#fff',
                  paddingHorizontal: 3,
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{
              fontSize: 9.5,
              fontWeight: isActive ? '700' : '500',
              color: isActive ? '#0284c7' : '#94a3b8',
              marginTop: 3,
            }}>
              {tab.label}
            </Text>
            {isActive && (
              <View style={{
                position: 'absolute', bottom: -6, left: '50%',
                marginLeft: -12, width: 24, height: 3,
                backgroundColor: '#0284c7', borderRadius: 2,
              }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

// ─── Main App Shell ───────────────────────────────────────────────────────────

export default function RootIndex() {
  const { isAuthenticated, isSuperAdmin, isBuildingAdmin, user, logout, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('user-home');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuAnim = useRef(new Animated.Value(0)).current;

  // Fetch unread notifications once on login
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = async () => {
      try {
        const res = await societyService.getNotifications({ seen: false, limit: 20 });
        const list = Array.isArray(res) ? res : (res?.results || []);
        setUnreadCount(list.filter((n) => !n.seen).length);
      } catch { /* silent */ }
    };
    fetchUnread();
  }, [isAuthenticated]);

  // Auth redirect
  useEffect(() => {
    if (!isAuthenticated && activeTab !== 'home') setActiveTab('home');
    if (isAuthenticated && activeTab === 'home') setActiveTab('user-home');
  }, [isAuthenticated]);

  // Avatar menu animation
  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: userMenuOpen ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [userMenuOpen]);

  const handleTabPress = (tabId) => {
    if (tabId === activeTab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (tabId === 'notifications') setUnreadCount(0);
    setActiveTab(tabId);
  };

  // Role-based tabs
  const tabs = !isAuthenticated ? [] :
    isSuperAdmin ? SUPER_ADMIN_TABS :
    isBuildingAdmin ? BUILDING_ADMIN_TABS :
    RESIDENT_TABS;

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <HomePage
          onLoginSuccess={() => setActiveTab('user-home')}
          onSignupSuccess={() => {}}
        />
      );
    }
    switch (activeTab) {
      case 'user-home':
        return (
          <UserHomePage
            onNavigate={(target) => handleTabPress(target === 'community' ? 'notifications' : target)}
          />
        );
      case 'dashboard':    return <FinancialSummary />;
      case 'income':
      case 'payments':     return <IncomePage />;
      case 'expenses':     return <ExpensePage />;
      case 'notifications':
      case 'community':    return <CommunityHubPage onMarkRead={() => setUnreadCount(0)} />;
      case 'admin-dashboard': return <AdminDashboard />;
      case 'ai-chat':      return <AIChatScreen />;
      case 'profile':      return <ProfilePage onNavigateBack={() => handleTabPress('user-home')} />;
      default:             return <UserHomePage onNavigate={handleTabPress} />;
    }
  };

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || '';
  const initials = (user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase();
  const roleBadge = isSuperAdmin ? 'Super Admin' : isBuildingAdmin ? 'Bldg Admin' : 'Resident';
  const roleBadgeColor = isSuperAdmin ? '#92400e' : isBuildingAdmin ? '#075985' : '#065f46';
  const roleBadgeBg   = isSuperAdmin ? '#fef3c7' : isBuildingAdmin ? '#e0f2fe' : '#d1fae5';

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 64, height: 64, borderRadius: 20, backgroundColor: '#0284c7',
          alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          shadowColor: '#0284c7', shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
        }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>SF</Text>
        </View>
        <ActivityIndicator size="large" color="#0284c7" style={{ marginBottom: 12 }} />
        <Text style={{ color: '#64748b', fontSize: 13 }}>Initializing secure session...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Top Header ─────────────────────────────────────────────── */}
      <View style={{
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      }}>
        <View style={{
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
        }}>
          {/* Logo + Brand */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 34, height: 34, borderRadius: 10,
              backgroundColor: '#0284c7',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>SF</Text>
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', lineHeight: 18 }}>
                Society Finance
              </Text>
              <Text style={{ fontSize: 10, color: '#94a3b8', lineHeight: 14 }}>Tracker v1.4</Text>
            </View>
          </View>

          {/* Right: Bell + Avatar */}
          {isAuthenticated ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Notification Bell */}
              <TouchableOpacity
                onPress={() => handleTabPress('notifications')}
                style={{
                  padding: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: activeTab === 'notifications' ? '#bae6fd' : '#e2e8f0',
                  backgroundColor: activeTab === 'notifications' ? '#f0f9ff' : '#fff',
                  position: 'relative',
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={activeTab === 'notifications' ? 'notifications' : 'notifications-outline'}
                  size={20}
                  color={activeTab === 'notifications' ? '#0284c7' : '#64748b'}
                />
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute', top: -2, right: -2,
                    backgroundColor: '#f43f5e', borderRadius: 8,
                    minWidth: 16, height: 16,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1.5, borderColor: '#fff',
                  }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Avatar */}
              <TouchableOpacity
                onPress={() => setUserMenuOpen(true)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 8, paddingVertical: 5,
                  borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
                }}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: '#0284c7',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{initials}</Text>
                </View>
                <Ionicons name="chevron-down" size={12} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{ color: '#94a3b8', fontSize: 11 }}>SFT v1.4</Text>
          )}
        </View>
      </View>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* ── Bottom Tab Bar ───────────────────────────────────────────── */}
      {isAuthenticated && tabs.length > 0 && (
        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          unreadCount={unreadCount}
        />
      )}

      {/* ── User Avatar Popover ───────────────────────────────────────── */}
      <Modal
        visible={userMenuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setUserMenuOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setUserMenuOpen(false)}
        >
          <Animated.View
            style={{
              position: 'absolute',
              top: (Platform.OS === 'android' ? StatusBar.currentHeight : insets.top) + 56,
              right: 12,
              width: 260,
              backgroundColor: '#fff',
              borderRadius: 18,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 12,
              opacity: menuAnim,
              transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
            }}
          >
            {/* User info */}
            <View style={{ padding: 14, backgroundColor: '#f0f9ff', borderBottomWidth: 1, borderBottomColor: '#e0f2fe' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: '#0284c7', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    @{user?.username}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 3,
                  borderRadius: 20, borderWidth: 1,
                  backgroundColor: roleBadgeBg, borderColor: roleBadgeColor + '44',
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: roleBadgeColor }}>
                    {roleBadge}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: '#94a3b8' }} numberOfLines={1}>
                  {user?.flat?.building?.name || (isSuperAdmin ? 'Global' : 'Resident')}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={{ padding: 6 }}>
              <TouchableOpacity
                onPress={() => { setUserMenuOpen(false); handleTabPress('profile'); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12 }}
                activeOpacity={0.7}
              >
                <Ionicons name="person-outline" size={18} color="#475569" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>My Profile</Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 12 }} />
              <TouchableOpacity
                onPress={async () => { setUserMenuOpen(false); await logout(); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12 }}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={18} color="#e11d48" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#e11d48' }}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
