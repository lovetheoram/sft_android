/**
 * AIChatScreen — Full AI Financial Chatbot (React Native)
 * Equivalent to web FloatingChatWidget + AIChatPage combined
 * - Bubble message UI (user right, AI left)
 * - Typing indicator animation
 * - Auto-scroll to bottom on new message
 * - Uses /api/ai/chat/ endpoint via aiService
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../user_utils/api';
import { useAuth } from '../user_utils/AuthContext';

// ─── Typing Dots Animation ────────────────────────────────────────────────────
const TypingIndicator = () => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 180),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8, height: 8, borderRadius: 4, backgroundColor: '#94a3b8',
            transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
          }}
        />
      ))}
    </View>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ item }) => {
  const isUser = item.role === 'user';

  return (
    <View style={{
      flexDirection: isUser ? 'row-reverse' : 'row',
      marginVertical: 4,
      marginHorizontal: 12,
      alignItems: 'flex-end',
      gap: 8,
    }}>
      {/* Avatar */}
      {!isUser && (
        <View style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: '#0f172a',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: '#334155',
        }}>
          <Text style={{ fontSize: 14 }}>🤖</Text>
        </View>
      )}

      {/* Bubble */}
      <View style={{
        maxWidth: '78%',
        backgroundColor: isUser ? '#0284c7' : '#fff',
        borderRadius: 18,
        borderBottomRightRadius: isUser ? 4 : 18,
        borderBottomLeftRadius: isUser ? 18 : 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: isUser ? '#0284c7' : '#e2e8f0',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
      }}>
        <Text style={{
          fontSize: 14,
          color: isUser ? '#fff' : '#0f172a',
          lineHeight: 20,
        }}>
          {item.content}
        </Text>
        <Text style={{
          fontSize: 10,
          color: isUser ? 'rgba(255,255,255,0.6)' : '#94a3b8',
          marginTop: 4,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {item.time}
        </Text>
      </View>

      {/* User Avatar */}
      {isUser && (
        <View style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: '#0284c7',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="person" size={16} color="#fff" />
        </View>
      )}
    </View>
  );
};

// ─── Quick Prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  'What is my pending balance?',
  'Show income summary for this year',
  'What are the top expenses?',
  'How many members have paid this month?',
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AIChatScreen = ({ onClose }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.first_name || 'there'}! 👋\n\nI'm your Society Finance AI assistant. I can help you with:\n• Payment & income queries\n• Expense breakdown & totals\n• Financial balance summary\n• Defaulters & pending dues\n\nWhat would you like to know?`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const sendMessage = async (text) => {
    const query = (text || inputText).trim();
    if (!query || isLoading) return;
    setInputText('');

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/ai/chat/', { query });
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data?.response || data?.reply || data?.message || 'I could not process that request.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Unable to reach the AI service right now. Please check server connection.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── Sleek Single Header ── */}
      <View style={{
        backgroundColor: '#0f172a',
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
        zIndex: 100,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 34, height: 34, borderRadius: 10,
            backgroundColor: '#0284c7',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#0284c7', shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
          }}>
            <Ionicons name="sparkles" size={17} color="#ffffff" />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#f8fafc' }}>Finance AI</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
              <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '500' }}>Active</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons: New Chat & Exit */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={clearChat}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderColor: '#334155',
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={14} color="#cbd5e1" />
            <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '700' }}>New Chat</Text>
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: '#e11d48',
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={16} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>Exit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Messages List ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble item={item} />}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={
          isLoading ? (
            <View style={{ flexDirection: 'row', marginHorizontal: 12, marginVertical: 4, alignItems: 'flex-end', gap: 8 }}>
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: '#334155',
              }}>
                <Ionicons name="sparkles" size={14} color="#38bdf8" />
              </View>
              <View style={{
                backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4,
                paddingHorizontal: 14, paddingVertical: 10,
                borderWidth: 1, borderColor: '#e2e8f0',
              }}>
                <TypingIndicator />
              </View>
            </View>
          ) : null
        }
      />

      {/* ── Vertical Quick Prompt Suggestion Cards ── */}
      {messages.length <= 1 && (
        <View style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '700', marginBottom: 6, marginLeft: 4 }}>
            💡 Tap a question to ask:
          </Text>
          <View style={{ gap: 6 }}>
            {QUICK_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                onPress={() => sendMessage(prompt)}
                style={{
                  backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: '#bae6fd',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 11.5, color: '#0369a1', fontWeight: '700', flex: 1 }}>
                  {prompt}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#0284c7" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Input Bar ── */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
      }}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your question..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={500}
            style={{
              flex: 1,
              borderWidth: 1.5,
              borderColor: inputText ? '#0284c7' : '#cbd5e1',
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 9,
              fontSize: 13.5,
              color: '#0f172a',
              backgroundColor: '#f8fafc',
              maxHeight: 90,
              lineHeight: 18,
            }}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
            style={{
              width: 40, height: 40,
              borderRadius: 20,
              backgroundColor: (!inputText.trim() || isLoading) ? '#e2e8f0' : '#0284c7',
              alignItems: 'center', justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={16} color={(!inputText.trim()) ? '#94a3b8' : '#fff'} />
            }
          </TouchableOpacity>
        </View>
    </KeyboardAvoidingView>
  );
};

export default AIChatScreen;
