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
    return <SignupPage onSignupSuccess={onLoginSuccess} onGoLogin={() => setSection('login')} />;
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
        </View>
      </View>

      {/* Feature list */}
      <View className="p-6 space-y-4">
        {[
          { emoji: '💳', title: 'Income Tracking', desc: 'Submit maintenance payments with proof, view history, and track status.' },
          { emoji: '📊', title: 'Financial Reports', desc: 'Monthly balance sheets, member collection summaries, and expense audit.' },
          { emoji: '🔔', title: 'Smart Notifications', desc: 'Real-time alerts for payment verifications, complaint updates, and announcements.' },
          { emoji: '⚠️', title: 'Complaint Redressal', desc: 'File tickets, track resolution status, and communicate directly with admin.' },
        ].map((feature) => (
          <View key={feature.title} className="flex-row items-start gap-3">
            <Text style={{ fontSize: 24 }}>{feature.emoji}</Text>
            <View className="flex-1">
              <Text className="font-bold text-slate-900 text-sm">{feature.title}</Text>
              <Text className="text-slate-500 mt-0.5" style={{ fontSize: 12, lineHeight: 18 }}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="h-8" />
    </ScrollView>
  );
};

export default HomePage;
