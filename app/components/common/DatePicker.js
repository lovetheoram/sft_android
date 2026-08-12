/**
 * DatePicker — Native Android/iOS date picker wrapper
 * - Android: shows dialog on button press
 * - iOS: shows inline picker
 * Usage: <DatePicker value={date} onChange={setDate} label="Payment Date" />
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const DatePicker = ({
  value,        // string 'YYYY-MM-DD' or Date object
  onChange,     // (isoString) => void
  label,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Parse value to Date
  const parsedDate = value ? (value instanceof Date ? value : new Date(value + 'T00:00:00')) : new Date();

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : placeholder;

  const handleConfirm = (date) => {
    setIsVisible(false);
    const iso = date.toISOString().split('T')[0];
    onChange(iso);
  };

  return (
    <View>
      {label ? (
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <TouchableOpacity
        onPress={() => !disabled && setIsVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: disabled ? '#f8fafc' : '#fff',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 11,
        }}
        activeOpacity={0.7}
      >
        <Text style={{
          fontSize: 14,
          color: value ? '#0f172a' : '#94a3b8',
          flex: 1,
        }}>
          📅 {displayValue}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>▾</Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isVisible}
        mode="date"
        date={parsedDate}
        onConfirm={handleConfirm}
        onCancel={() => setIsVisible(false)}
        minimumDate={minDate ? new Date(minDate) : undefined}
        maximumDate={maxDate ? new Date(maxDate) : undefined}
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        themeVariant="light"
        buttonTextColorIOS="#0284c7"
      />
    </View>
  );
};

export default DatePicker;
