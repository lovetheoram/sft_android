/**
 * ConfirmModal — Native confirmation dialog replacement for Alert.alert
 * Replaces Alert.alert() for destructive actions and rejection reason inputs
 * Usage:
 *   <ConfirmModal
 *     visible={showModal}
 *     title="Delete Payment"
 *     message="This cannot be undone."
 *     confirmLabel="Delete"
 *     destructive
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowModal(false)}
 *     requireInput="DELETE"          // if set, user must type this string
 *     inputLabel="Rejection reason"  // free text input label
 *   />
 */
import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';

const ConfirmModal = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  requireInput,      // if set, disables confirm until user types this string
  inputLabel,        // if set, shows free TextInput and passes value to onConfirm
  inputPlaceholder,
  loading = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  const isDisabled = loading ||
    (requireInput && inputValue.trim() !== requireInput) ||
    false;

  const confirmColor = destructive ? '#e11d48' : '#0284c7';

  const handleConfirm = () => {
    if (isDisabled) return;
    onConfirm(inputLabel ? inputValue.trim() : undefined);
    setInputValue('');
  };

  const handleCancel = () => {
    setInputValue('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
        onPress={handleCancel}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable>
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 360,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 12,
            }}>
              {/* Title */}
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 8 }}>
                {title}
              </Text>

              {/* Message */}
              {message ? (
                <Text style={{ fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 16 }}>
                  {message}
                </Text>
              ) : null}

              {/* Require string input (e.g. type "DELETE") */}
              {requireInput ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                    Type <Text style={{ fontWeight: '800', color: '#e11d48' }}>{requireInput}</Text> to confirm:
                  </Text>
                  <TextInput
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder={requireInput}
                    autoCapitalize="characters"
                    style={{
                      borderWidth: 1.5,
                      borderColor: inputValue === requireInput ? '#a7f3d0' : '#fecaca',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#0f172a',
                      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                    }}
                  />
                </View>
              ) : null}

              {/* Free text input (e.g. rejection reason) */}
              {inputLabel && !requireInput ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 }}>
                    {inputLabel}
                  </Text>
                  <TextInput
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder={inputPlaceholder || 'Enter reason...'}
                    multiline
                    numberOfLines={3}
                    style={{
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 14,
                      color: '#0f172a',
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>
              ) : null}

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: '#f1f5f9',
                    alignItems: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>{cancelLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={isDisabled}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: isDisabled ? '#cbd5e1' : confirmColor,
                    alignItems: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                    {loading ? 'Please wait...' : confirmLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

export default ConfirmModal;
