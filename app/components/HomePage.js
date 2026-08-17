/**
 * HomePage — Landing page for unauthenticated users (React Native)
 * Sky-blue gradient hero with Login/Signup tabs
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
} from 'react-native';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';

const HomePage = ({ onLoginSuccess }) => {
  const [section, setSection] = useState('landing'); // 'landing' | 'login' | 'signup'

  if (section === 'login') {
    return <LoginPage onLoginSuccess={onLoginSuccess} onGoSignup={() => setSection('signup')} />;
  }
  if (section === 'signup') {
    return <SignupPage onSignupSuccess={() => setSection('login')} onGoLogin={() => setSection('login')} />;
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ flexGrow: 1 }}>
      {/* Hero */}
      <View style={{ backgroundColor: '#0f172a', minHeight: 320 }} className="justify-center px-6 py-10">
        {/* Decorative blob */}
        <View style={{
          position: 'absolute', top: -60, right: -60, width: 200, height: 200,
          borderRadius: 100, backgroundColor: 'rgba(14,165,233,0.15)',
        }} />
        <View className="items-center">
          <View className="w-16 h-16 rounded-2xl items-center justify-center mb-5"
            style={{ backgroundColor: '#0284c7', shadowColor: '#0284c7', shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}>
            <Text className="text-white font-black text-2xl">SF</Text>
          </View>
          <Text className="text-3xl font-extrabold text-center leading-tight" style={{ color: '#f8fafc' }}>
            Society Finance{'\n'}<Text style={{ color: '#38bdf8' }}>Tracker</Text>
          </Text>
          <Text className="text-center mt-3" style={{ color: '#94a3b8', fontSize: 14, lineHeight: 22 }}>
            The complete society management platform — payments, complaints, announcements, and more.
          </Text>
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={() => setSection('login')}
              className="px-6 py-3 rounded-xl"
              style={{ backgroundColor: '#0284c7' }}>
              <Text className="text-white font-bold">Sign In →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSection('signup')}
              className="px-6 py-3 rounded-xl border border-slate-600">
              <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Reviewer Quick Access Prompt */}
          <View className="mt-6 bg-slate-800/80 border border-slate-700 rounded-xl p-3 w-full items-center">
            <Text className="text-sky-400 font-bold text-xs mb-1">⚡ App Reviewer One-Tap Entry</Text>
            <Text className="text-slate-400 text-center text-xs mb-2">Instant access for Indus Reviewers to test all functionalities:</Text>
            <TouchableOpacity
              onPress={() => setSection('login')}
              className="px-4 py-2 bg-sky-500 rounded-lg">
              <Text className="text-white font-extrabold text-xs">🚀 Launch Reviewer Demo Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Society Services & Product Dues Directory ── */}
      <View className="p-5 space-y-4">
        <View className="mb-2">
          <Text className="text-xs font-bold text-sky-600 uppercase tracking-wider">Product & Dues Directory</Text>
          <Text className="text-lg font-extrabold text-slate-900">Active Society Offerings & Levies</Text>
          <Text className="text-slate-500 text-xs mt-0.5">Accurate breakdown of maintenance tiers, levies, and document services:</Text>
        </View>

        {[
          { emoji: '🏢', title: 'Monthly Maintenance Dues', price: '₹2,500 / mo', desc: 'Standard monthly maintenance covers 24/7 security personnel, common lighting, lift operation, water supply, and daily waste collection.' },
          { emoji: '🛠️', title: 'Sinking & Elevator Repair Fund', price: '₹500 / mo', desc: 'Dedicated reserve fund for major building maintenance, elevator servicing, exterior painting, and structural repairs.' },
          { emoji: '💧', title: 'Water & Utility Meter Charge', price: '₹350 / mo', desc: 'Individual metered water consumption and shared pump station electricity charges calculated transparently.' },
          { emoji: '📜', title: 'NOC & Society Document Issuance', price: 'Free / Service', desc: 'Official Society No Objection Certificates (NOC), clearance certificates, possession records, and audit balance sheets.' },
          { emoji: '🏛️', title: 'Clubhouse & Hall Reservations', price: '₹1,000 / day', desc: 'Community hall and terrace reservation for resident private events, celebrations, and society meetings.' },
          { emoji: '🚨', title: 'Threaded Helpdesk & Security Tickets', price: 'Included', desc: 'Instant issue reporting for plumbing, electrical, gate pass security alerts, and administrative ticket tracking.' },
        ].map((item) => (
          <TouchableOpacity
            key={item.title}
            onPress={() => setSection('login')}
            className="bg-white rounded-2xl p-4 border border-slate-200"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 2 }}
            activeOpacity={0.8}>
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center gap-2">
                <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                <Text className="font-bold text-slate-900 text-sm">{item.title}</Text>
              </View>
              <View className="bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                <Text className="text-sky-700 font-extrabold text-xs">{item.price}</Text>
              </View>
            </View>
            <Text className="text-slate-500 text-xs leading-relaxed mt-1">{item.desc}</Text>
            <View className="flex-row items-center justify-end mt-2 pt-2 border-t border-slate-100">
              <Text className="text-sky-600 font-bold text-xs">View & Pay Dues →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View className="h-8" />
    </ScrollView>
  );
};

export default HomePage;
