/**
 * FloatingChatWidget.js — Floating AI Chatbot Widget (React Native)
 * - Anchored at bottom-right of mobile screen (above safe area)
 * - Tapping opens slide-up modal with full AIChatScreen
 * - Completely removes static bottom tab clutter
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated, Easing,
  Platform, StatusBar, SafeAreaView, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AIChatScreen from './AIChatScreen';

const FloatingChatWidget = () => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for AI trigger button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => setModalVisible(true));
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(false);
  };

  const bottomOffset = Math.max(insets.bottom, 10) + 64;

  return (
    <>
      {/* ── Floating Action Button (Bottom Right) ──────────────────── */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: bottomOffset,
          right: 18,
          zIndex: 999,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPress={handleOpen}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#0284c7',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 30,
            shadowColor: '#0284c7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
            borderWidth: 1.5,
            borderColor: '#38bdf8',
          }}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons name="sparkles" size={18} color="#ffffff" />
          </Animated.View>
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>
            Ask AI
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Dynamic Keyboard-Avoiding Floating AI Chat Modal ────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' }}
        >
          <View style={{
            flex: 1,
            justifyContent: 'flex-end',
            paddingHorizontal: 10,
            paddingBottom: Math.max(insets.bottom, 10) + 56,
          }}>
            {/* Backdrop Touch Handler to dismiss */}
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={handleClose}
            />

            {/* Floating Popup Card */}
            <View style={{
              height: '65%',
              maxHeight: 540,
              backgroundColor: '#0f172a',
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation: 24,
              borderWidth: 1,
              borderColor: '#1e293b',
            }}>
              {/* Top Drag Handle Bar */}
              <View style={{
                height: 14,
                backgroundColor: '#0f172a',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <View style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#334155',
                }} />
              </View>

              {/* AI Chat Body */}
              <View style={{ flex: 1 }}>
                <AIChatScreen onClose={handleClose} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default FloatingChatWidget;
