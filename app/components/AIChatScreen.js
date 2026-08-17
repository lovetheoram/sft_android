/**
 * AIChatScreen — Ultra-Friendly Mobile Financial Assistant (React Native)
 * - Warm, welcoming conversational interface
 * - Friendly Hero Welcome Banner & Interactive Category Cards
 * - Formatted rich text bubble parsing (bold, bullet lists, currency badges)
 * - One-tap Copy to Clipboard & Feedback buttons (👍 Helpful / 👎 Not quite)
 * - Horizontal & vertical quick suggestion chips with icons
 * - Optimized Android KeyboardAvoidingView & smooth scrolling
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Animated, Easing, Alert, Share, StyleSheet,
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#0284c7',
            transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
          }}
        />
      ))}
    </View>
  );
};

// ─── Rich Formatted Text Renderer ─────────────────────────────────────────────
const FormattedText = ({ content, isUser }) => {
  if (!content) return null;
  const lines = content.split('\n');

  return (
    <View style={{ gap: 4 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={idx} style={{ height: 4 }} />;

        // Check if line is bullet point (starts with •, *, -, or digit.)
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('- ');
        const isHeader = trimmed.startsWith('###') || trimmed.startsWith('##') || (trimmed.endsWith(':') && !isBullet && trimmed.length < 40);

        const cleanLine = isBullet ? trimmed.replace(/^[\bullet\*\-]\s*/, '') : trimmed.replace(/^#{1,4}\s*/, '');
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

        return (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: isBullet ? 6 : 0, marginVertical: 1 }}>
            {isBullet && (
              <Text style={{ fontSize: 12, color: isUser ? '#e0f2fe' : '#0284c7', marginTop: 2 }}>
                •
              </Text>
            )}
            <Text
              style={{
                flex: 1,
                fontSize: isHeader ? 14 : 13.5,
                fontWeight: isHeader ? '700' : '400',
                color: isUser ? '#ffffff' : '#0f172a',
                lineHeight: 20,
              }}
            >
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <Text key={pIdx} style={{ fontWeight: '700', color: isUser ? '#ffffff' : '#0284c7' }}>
                      {part.slice(2, -2)}
                    </Text>
                  );
                }
                return part;
              })}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ─── Message Bubble Component ──────────────────────────────────────────────────
const MessageBubble = ({ item, onCopy }) => {
  const isUser = item.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null

  const handleCopy = () => {
    onCopy(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={{
      flexDirection: isUser ? 'row-reverse' : 'row',
      marginVertical: 6,
      marginHorizontal: 12,
      alignItems: 'flex-end',
      gap: 8,
    }}>
      {/* Bot Avatar */}
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={{ fontSize: 16 }}>🤖</Text>
        </View>
      )}

      {/* Bubble Container */}
      <View style={{
        maxWidth: '82%',
        backgroundColor: isUser ? '#0284c7' : '#ffffff',
        borderRadius: 20,
        borderBottomRightRadius: isUser ? 4 : 20,
        borderBottomLeftRadius: isUser ? 20 : 4,
        paddingHorizontal: 15,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: isUser ? '#0284c7' : '#e2e8f0',
        shadowColor: '#000',
        shadowOpacity: isUser ? 0.08 : 0.04,
        shadowRadius: 6,
        elevation: 2,
      }}>
        {/* Formatted Content */}
        <FormattedText content={item.content} isUser={isUser} />

        {/* Footer actions for assistant */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: isUser ? 'flex-end' : 'space-between',
          marginTop: 8,
          paddingTop: 6,
          borderTopWidth: isUser ? 0 : 0.8,
          borderTopColor: '#f1f5f9',
        }}>
          {!isUser && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={handleCopy}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                activeOpacity={0.7}
              >
                <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={13} color={copied ? "#10b981" : "#94a3b8"} />
                <Text style={{ fontSize: 10, color: copied ? "#10b981" : "#94a3b8", fontWeight: '600' }}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={() => setFeedback('up')} activeOpacity={0.7}>
                  <Ionicons name={feedback === 'up' ? "thumbs-up" : "thumbs-up-outline"} size={13} color={feedback === 'up' ? "#0284c7" : "#94a3b8"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFeedback('down')} activeOpacity={0.7}>
                  <Ionicons name={feedback === 'down' ? "thumbs-down" : "thumbs-down-outline"} size={13} color={feedback === 'down' ? "#ef4444" : "#94a3b8"} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={{ fontSize: 9.5, color: isUser ? 'rgba(255,255,255,0.7)' : '#94a3b8', fontWeight: '500' }}>
            {item.time}
          </Text>
        </View>
      </View>

      {/* User Avatar */}
      {isUser && (
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={14} color="#ffffff" />
        </View>
      )}
    </View>
  );
};

// ─── Friendly Category Cards ──────────────────────────────────────────────────
const CATEGORY_CARDS = [
  { icon: 'wallet-outline', color: '#0284c7', title: 'Pending Dues', subtitle: 'Check my unpaid bills', query: 'What is my pending balance?' },
  { icon: 'trending-up-outline', color: '#10b981', title: 'Financial Summary', subtitle: 'Annual ledger snapshot', query: 'Show income summary for this year' },
  { icon: 'pie-chart-outline', color: '#e11d48', title: 'Major Expenses', subtitle: 'Where money was spent', query: 'What are top society expenses?' },
  { icon: 'people-outline', color: '#8b5cf6', title: 'Defaulter List', subtitle: 'Unpaid flat members', query: 'How many members have paid this month?' },
];

// ─── Main Screen Component ─────────────────────────────────────────────────────
const AIChatScreen = ({ onClose }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.first_name || 'Friend'}! 😊\n\nI'm your **Society Finance AI Assistant**. How can I help you today? Tap any topic card below or type your question!`,
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
        content: '⚠️ Unable to reach the AI service right now. Please check backend server connection.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert('Reset Conversation', 'Would you like to start a fresh chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: 'Chat reset! 😊 What would you like to check next?',
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          }]);
        },
      },
    ]);
  };

  const handleCopyText = (text) => {
    Share.share({ message: text }).catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── Friendly Top Header ── */}
      <View style={styles.headerBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.headerAvatar}>
            <Text style={{ fontSize: 18 }}>🤖</Text>
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#f8fafc' }}>Finance Assistant</Text>
              <View style={{ backgroundColor: '#22c55e20', borderWidth: 1, borderColor: '#22c55e60', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 9, color: '#4ade80', fontWeight: '800' }}>ONLINE</Text>
              </View>
            </View>
            <Text style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: '500', marginTop: 1 }}>Always ready to help 😊</Text>
          </View>
        </View>

        {/* Action Header Buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={clearChat} style={styles.resetButton} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={14} color="#cbd5e1" />
            <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '700' }}>Reset</Text>
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.exitButton} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Messages Stream List ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble item={item} onCopy={handleCopyText} />}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={
          isLoading ? (
            <View style={{ flexDirection: 'row', marginHorizontal: 12, marginVertical: 6, alignItems: 'flex-end', gap: 8 }}>
              <View style={styles.botAvatar}>
                <Text style={{ fontSize: 15 }}>🤖</Text>
              </View>
              <View style={styles.typingCard}>
                <TypingIndicator />
              </View>
            </View>
          ) : null
        }
      />

      {/* ── Friendly Welcome Category Cards (When chat is starting) ── */}
      {messages.length <= 1 && (
        <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 8, marginLeft: 4 }}>
            💡 Tap a category to ask immediately:
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORY_CARDS.map((card, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => sendMessage(card.query)}
                disabled={isLoading}
                style={[styles.categoryCard, { borderColor: card.color + '40' }]}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: card.color + '15' }]}>
                  <Ionicons name={card.icon} size={16} color={card.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0f172a' }}>{card.title}</Text>
                  <Text style={{ fontSize: 10, color: '#64748b' }}>{card.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Bottom Text Input Bar ── */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything about society finances... 😊"
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={500}
          style={styles.textInput}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />

        <TouchableOpacity
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || isLoading}
          style={[
            styles.sendButton,
            { backgroundColor: (!inputText.trim() || isLoading) ? '#e2e8f0' : '#0284c7' },
          ]}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator size="small" color="#ffffff" />
            : <Ionicons name="send" size={16} color={(!inputText.trim()) ? '#94a3b8' : '#ffffff'} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    elevation: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0284c7',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  exitButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    maxHeight: 90,
    lineHeight: 18,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AIChatScreen;
