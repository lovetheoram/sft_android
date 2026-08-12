/**
 * Toast — Native auto-dismiss notification toast
 * Usage: import { ToastProvider, useToast } from './Toast';
 * Wrap root with <ToastProvider>
 * Then: const toast = useToast(); toast.success('Saved!');
 */
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, Text, Animated, Easing, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
const COLORS = {
  success: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
  error:   { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  info:    { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
};

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const insets = useSafeAreaInsets();

  const show = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const anim = new Animated.Value(0);

    setToasts(prev => [...prev.slice(-2), { id, message, type, anim }]);

    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.delay(duration),
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    });
  }, []);

  const success = useCallback((msg) => show(msg, 'success'), [show]);
  const error   = useCallback((msg) => show(msg, 'error'), [show]);
  const warning = useCallback((msg) => show(msg, 'warning'), [show]);
  const info    = useCallback((msg) => show(msg, 'info'), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      {/* Toast container — top of screen, above all content */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + (Platform.OS === 'android' ? 8 : 4),
          left: 16,
          right: 16,
          zIndex: 9999,
          gap: 8,
        }}
        pointerEvents="none"
      >
        {toasts.map(({ id, message, type, anim }) => {
          const c = COLORS[type] || COLORS.info;
          return (
            <Animated.View
              key={id}
              style={{
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                backgroundColor: c.bg,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 16 }}>{ICONS[type]}</Text>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 }}>
                {message}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
