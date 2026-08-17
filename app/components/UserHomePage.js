/**
 * UserHomePage — Logged-in Home Dashboard (React Native Port)
 * - Personalized welcome hero banner
 * - Auto-sliding announcements carousel (4s interval)
 * - Priority badges + announcement origin badges
 * - Feature overview cards with navigation callbacks
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Pressable, Dimensions,
} from 'react-native';
import { useAuth } from '../user_utils/AuthContext';
import societyService from '../user_utils/services/societyService';

const { width: SCREEN_W } = Dimensions.get('window');

const UserHomePage = ({ onNavigate }) => {
  const { user, isSuperAdmin, isBuildingAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef(null);

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'Member';
  const buildingName = user?.flat?.building?.name || (isSuperAdmin ? 'Global Society' : 'Resident Portal');
  const flatLabel = user?.flat?.number
    ? `Flat ${user.flat.number}`
    : isSuperAdmin ? 'Super Admin' : isBuildingAdmin ? 'Building Admin' : '';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    let mounted = true;
    const fetchAnnouncements = async () => {
      try {
        const data = await societyService.getAnnouncements({ limit: 10 });
        const list = Array.isArray(data) ? data : (data.results || []);
        if (mounted) setAnnouncements(list);
      } catch { /* silent */ } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAnnouncements();
    return () => { mounted = false; };
  }, []);

  // Auto-slide timer
  useEffect(() => {
    if (announcements.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [announcements.length]);

  const getPriorityBadge = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'urgent' || p === 'emergency')
      return { emoji: '🚨', label: 'URGENT', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' };
    if (p === 'maintenance')
      return { emoji: '🛠️', label: 'MAINTENANCE', bg: '#fffbeb', border: '#fde68a', text: '#92400e' };
    return { emoji: '📢', label: 'GENERAL', bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' };
  };

  const slide = announcements[currentSlide];
  const badge = slide ? getPriorityBadge(slide.priority || slide.category) : null;

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="p-4 space-y-4">

        {/* ── Welcome Hero Banner ── */}
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
          {/* Decorative blobs */}
          <View style={{
            position: 'absolute', top: -30, right: -30, width: 120, height: 120,
            borderRadius: 60, backgroundColor: 'rgba(14,165,233,0.15)',
          }} />
          <View style={{
            position: 'absolute', bottom: -30, left: -30, width: 120, height: 120,
            borderRadius: 60, backgroundColor: 'rgba(37,99,235,0.15)',
          }} />
          <View className="p-5 z-10">
            {/* Location + Date row */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="px-3 py-1 rounded-full border border-sky-400/30"
                style={{ backgroundColor: 'rgba(14,165,233,0.2)' }}>
                <Text style={{ color: '#7dd3fc', fontSize: 11, fontWeight: '600' }}>
                  🏛️ {buildingName}{flatLabel ? ` • ${flatLabel}` : ''}
                </Text>
              </View>
              <Text style={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}>{today}</Text>
            </View>

            {/* Welcome message */}
            <Text className="font-extrabold leading-tight" style={{ color: '#f8fafc', fontSize: 22 }}>
              Welcome back,{'\n'}
              <Text style={{ color: '#38bdf8' }}>{displayName}</Text>
              <Text style={{ color: '#f8fafc' }}> 👋</Text>
            </Text>
            <Text className="mt-2" style={{ color: '#94a3b8', fontSize: 12, lineHeight: 18 }}>
              Your centralized society management hub. Track payments, file complaints, and stay informed with announcements.
            </Text>
          </View>
        </View>

        {/* ── Announcements Carousel ── */}
        <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
            <View>
              <Text className="text-base font-bold text-slate-900">📢 Announcements</Text>
              <Text className="text-slate-500 mt-0.5" style={{ fontSize: 11 }}>Official society broadcasts & notices</Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate?.('community')}>
              <Text style={{ color: '#0284c7', fontSize: 12, fontWeight: '700' }}>View All →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator color="#0284c7" />
              <Text className="text-slate-400 mt-2" style={{ fontSize: 12 }}>Loading announcements...</Text>
            </View>
          ) : announcements.length === 0 ? (
            <View className="items-center py-10">
              <Text style={{ fontSize: 28 }}>📢</Text>
              <Text className="text-slate-600 font-semibold mt-2 text-sm">No active announcements</Text>
              <Text className="text-slate-400 mt-1" style={{ fontSize: 11 }}>All quiet! Official notices will appear here.</Text>
            </View>
          ) : (
            <View className="p-4">
              {/* Slide card */}
              <View className="rounded-xl p-4 border"
                style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
                {/* Badge row */}
                <View className="flex-row flex-wrap items-center justify-between gap-2 mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: badge?.bg, borderWidth: 1, borderColor: badge?.border }}>
                      <Text style={{ color: badge?.text, fontSize: 10, fontWeight: '800' }}>
                        {badge?.emoji} {badge?.label}
                      </Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: !slide?.building ? '#f5f3ff' : '#eff6ff',
                        borderColor: !slide?.building ? '#c4b5fd' : '#bfdbfe',
                      }}>
                      <Text style={{
                        color: !slide?.building ? '#6d28d9' : '#1d4ed8',
                        fontSize: 10, fontWeight: '700',
                      }}>
                        {!slide?.building ? '👑 Super Admin' : `🏢 ${slide.building?.name || 'Building Admin'}`}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-slate-400 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-md"
                    style={{ fontSize: 10 }}>
                    {currentSlide + 1}/{announcements.length}
                  </Text>
                </View>

                {/* Title + Message */}
                <Text className="text-slate-900 font-bold text-base leading-snug mb-1">
                  {slide?.title || 'Notice Title'}
                </Text>
                <Text className="text-slate-600 text-sm leading-relaxed" numberOfLines={3}>
                  {slide?.message || slide?.content || 'No details provided.'}
                </Text>

                {/* Nav arrows + dots */}
                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-200">
                  <View className="flex-row gap-1.5 items-center">
                    {announcements.map((_, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => setCurrentSlide(idx)}
                        style={{
                          height: 6, borderRadius: 3,
                          width: currentSlide === idx ? 20 : 6,
                          backgroundColor: currentSlide === idx ? '#0284c7' : '#cbd5e1',
                        }}
                      />
                    ))}
                  </View>
                  <View className="flex-row gap-1">
                    <TouchableOpacity
                      onPress={() => setCurrentSlide((p) => (p - 1 + announcements.length) % announcements.length)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 items-center justify-center">
                      <Text className="text-slate-700 font-bold text-xs">←</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setCurrentSlide((p) => (p + 1) % announcements.length)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 items-center justify-center">
                      <Text className="text-slate-700 font-bold text-xs">→</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── Feature Cards ── */}
        <View className="gap-3">
          {isSuperAdmin ? (
            <>
              {/* Super Admin Card 1: System Admin Dashboard */}
              <View className="bg-white rounded-2xl p-4 border border-amber-200 flex-row items-start gap-3"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
                <View className="w-10 h-10 rounded-xl items-center justify-center border border-amber-200"
                  style={{ backgroundColor: '#fffbeb' }}>
                  <Text style={{ fontSize: 18 }}>⚙️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">Unified Admin Dashboard</Text>
                  <Text className="text-slate-500 mt-1" style={{ fontSize: 12, lineHeight: 18 }}>
                    Global multi-building management: users, property units, categories, and audit permissions.
                  </Text>
                  <TouchableOpacity onPress={() => onNavigate?.('admin-dashboard')} className="mt-2">
                    <Text style={{ color: '#d97706', fontSize: 12, fontWeight: '700' }}>Open Admin Panel →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Super Admin Card 2: Community Broadcasts */}
              <View className="bg-white rounded-2xl p-4 border border-slate-200 flex-row items-start gap-3"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
                <View className="w-10 h-10 rounded-xl items-center justify-center border border-sky-200"
                  style={{ backgroundColor: '#f0f9ff' }}>
                  <Text style={{ fontSize: 18 }}>📢</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">Community Hub & Broadcasts</Text>
                  <Text className="text-slate-500 mt-1" style={{ fontSize: 12, lineHeight: 18 }}>
                    Issue global society notices, monitor resident tickets, and review system alerts.
                  </Text>
                  <TouchableOpacity onPress={() => onNavigate?.('community')} className="mt-2">
                    <Text style={{ color: '#0284c7', fontSize: 12, fontWeight: '700' }}>View Community Hub →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Card 1: Income */}
              <View className="bg-white rounded-2xl p-4 border border-slate-200 flex-row items-start gap-3"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
                <View className="w-10 h-10 rounded-xl items-center justify-center border border-emerald-200"
                  style={{ backgroundColor: '#ecfdf5' }}>
                  <Text style={{ fontSize: 18 }}>💳</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">Income & Cash Auditing</Text>
                  <Text className="text-slate-500 mt-1" style={{ fontSize: 12, lineHeight: 18 }}>
                    Record maintenance payments online with proof, or pay cash directly to admin.
                  </Text>
                  <TouchableOpacity onPress={() => onNavigate?.('income')} className="mt-2">
                    <Text style={{ color: '#059669', fontSize: 12, fontWeight: '700' }}>Go to Income Ledger →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card 2: Financial Reports */}
              <View className="bg-white rounded-2xl p-4 border border-slate-200 flex-row items-start gap-3"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
                <View className="w-10 h-10 rounded-xl items-center justify-center border border-sky-200"
                  style={{ backgroundColor: '#f0f9ff' }}>
                  <Text style={{ fontSize: 18 }}>📊</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">Financial Reports</Text>
                  <Text className="text-slate-500 mt-1" style={{ fontSize: 12, lineHeight: 18 }}>
                    Complete transparency into monthly balances, member collections, and expenses.
                  </Text>
                  <TouchableOpacity onPress={() => onNavigate?.('dashboard')} className="mt-2">
                    <Text style={{ color: '#0284c7', fontSize: 12, fontWeight: '700' }}>View Balance Sheet →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card 3: Complaints */}
              <View className="bg-white rounded-2xl p-4 border border-slate-200 flex-row items-start gap-3"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}>
                <View className="w-10 h-10 rounded-xl items-center justify-center border border-amber-200"
                  style={{ backgroundColor: '#fffbeb' }}>
                  <Text style={{ fontSize: 18 }}>⚠️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">Complaint Redressal</Text>
                  <Text className="text-slate-500 mt-1" style={{ fontSize: 12, lineHeight: 18 }}>
                    Direct ticket logging for plumbing, electrical, or security issues to your admin.
                  </Text>
                  <TouchableOpacity onPress={() => onNavigate?.('community')} className="mt-2">
                    <Text style={{ color: '#d97706', fontSize: 12, fontWeight: '700' }}>File a Complaint →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        <View className="h-4" />
      </View>
    </ScrollView>
  );
};

export default UserHomePage;
