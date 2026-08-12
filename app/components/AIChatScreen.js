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
  View, Text, TextInput, TouchableOpacity, FlatList,
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
const AIChatScreen = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.first_name || 'there'}! 👋\n\nI'm your Society Finance AI assistant. I can help you with:\n• Payment & income queries\n• Expense analysis\n• Financial summaries\n• Member balance status\n\nWhat would you like to know?`,
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
        content: '⚠️ Unable to reach the AI service right now. Please try again.',
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* ── Header ── */}
      <View style={{
        backgroundColor: '#0f172a',
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: '#1e293b',
            borderWidth: 1.5, borderColor: '#334155',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#f8fafc' }}>Society Finance AI</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
              <Text style={{ fontSize: 11, color: '#94a3b8' }}>AI-powered financial assistant</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={clearChat}
          style={{ padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)' }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble item={item} />}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 8 }}
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
                <Text style={{ fontSize: 14 }}>🤖</Text>
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

      {/* ── Quick Prompts ── */}
      {messages.length <= 1 && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>
            💡 Quick questions:
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {QUICK_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                onPress={() => sendMessage(prompt)}
                style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#bae6fd',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: '600' }}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Input Bar ── */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
      }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me about your finances..."
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={500}
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: inputText ? '#0284c7' : '#e2e8f0',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 14,
            color: '#0f172a',
            backgroundColor: '#f8fafc',
            maxHeight: 100,
            lineHeight: 20,
          }}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || isLoading}
          style={{
            width: 44, height: 44,
            borderRadius: 22,
            backgroundColor: (!inputText.trim() || isLoading) ? '#e2e8f0' : '#0284c7',
            alignItems: 'center', justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          {isLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color={(!inputText.trim()) ? '#94a3b8' : '#fff'} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AIChatScreen;
