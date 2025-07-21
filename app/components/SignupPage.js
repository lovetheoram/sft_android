import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, Pressable } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
// import { API_BASE_URL } from '../api';
import { API_BASE_URL } from "../user_utils/api";
const SignupPage = ({ onSignupSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('resident');
  const [inviteCode, setInviteCode] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [flats, setFlats] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFlat, setSelectedFlat] = useState('');

  const isAdmin = role === 'admin';
  const isResident = role === 'resident';

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/building/`)
      .then((res) => setBuildings(res.data))
      .catch((err) => console.error('Failed to load buildings', err));
  }, []);

  useEffect(() => {
    if (!selectedBuilding) {
      setFlats([]);
      setSelectedFlat('');
      return;
    }

    axios
      .get(`${API_BASE_URL}/api/flat/?building_id=${selectedBuilding}`)
      .then((res) => setFlats(res.data))
      .catch((err) => console.error('Failed to load flats', err));
  }, [selectedBuilding]);

  const handleSignup = async () => {
    if (password !== password2) {
      Alert.alert('❌ Passwords do not match');
      return;
    }

    const payload = {
      username,
      email,
      password,
      password2,
      first_name: firstName,
      last_name: lastName,
      phone,
      role,
    };

    if (isAdmin) {
      payload.invite_code = inviteCode;
    }

    if (isResident || (isAdmin && inviteCode === 'BUILDINGADMIN123')) {
      if (!selectedBuilding || !selectedFlat) {
        Alert.alert('Please select building and flat');
        return;
      }
      payload.building_id = selectedBuilding;
      payload.flat_id = selectedFlat;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/signup/`, payload);
      Alert.alert('✅ Signup successful!');
      onSignupSuccess?.();
    } catch (err) {
      console.error('Signup error:', err.response?.data);
      const errorMsg =
        err.response?.data?.invite_code?.[0] ||
        err.response?.data?.username?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.detail ||
        'Signup failed';
      Alert.alert('❌ ' + errorMsg);
    }
  };

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-4 text-center">📝 Signup</Text>

      <Text className="mb-1 font-semibold">Username</Text>
      <TextInput className="border rounded px-3 py-2 mb-3" value={username} onChangeText={setUsername} />

      <Text className="mb-1 font-semibold">Email</Text>
      <TextInput className="border rounded px-3 py-2 mb-3" value={email} onChangeText={setEmail} keyboardType="email-address" />

      <Text className="mb-1 font-semibold">Password</Text>
      <TextInput className="border rounded px-3 py-2 mb-3" value={password} onChangeText={setPassword} secureTextEntry />

      <Text className="mb-1 font-semibold">Confirm Password</Text>
      <TextInput className="border rounded px-3 py-2 mb-3" value={password2} onChangeText={setPassword2} secureTextEntry />

      <Text className="mb-1 font-semibold">First Name</Text>
      <TextInput className="border rounded px-3 py-2 mb-3" value={firstName} onChangeText={setFirstName} />

      <Text className="mb-1 font-semibold">Last Name</Text>
      <TextInput className="border rounded px-3 py-2 mb-3" value={lastName} onChangeText={setLastName} />

      <Text className="mb-1 font-semibold">Phone</Text>
      <TextInput className="border rounded px-3 py-2 mb-3" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text className="mb-1 font-semibold">Role</Text>
      <View className="border rounded mb-3">
        <Picker selectedValue={role} onValueChange={(val) => setRole(val)}>
          <Picker.Item label="Resident" value="resident" />
          <Picker.Item label="Admin" value="admin" />
        </Picker>
      </View>

      {isAdmin && (
        <>
          <Text className="mb-1 font-semibold">Invite Code (for Admin)</Text>
          <TextInput className="border rounded px-3 py-2 mb-3" value={inviteCode} onChangeText={setInviteCode} />
        </>
      )}

      {(isResident || (isAdmin && inviteCode === 'BUILDINGADMIN123')) && (
        <>
          <Text className="mb-1 font-semibold">Building</Text>
          <View className="border rounded mb-3">
            <Picker selectedValue={selectedBuilding} onValueChange={(val) => setSelectedBuilding(val)}>
              <Picker.Item label="-- Select Building --" value="" />
              {buildings.map((b) => (
                <Picker.Item key={b.id} label={b.name} value={b.id} />
              ))}
            </Picker>
          </View>

          <Text className="mb-1 font-semibold">Flat</Text>
          <View className="border rounded mb-3">
            <Picker selectedValue={selectedFlat} onValueChange={(val) => setSelectedFlat(val)} enabled={!!selectedBuilding}>
              <Picker.Item label="-- Select Flat --" value="" />
              {flats.map((f) => (
                <Picker.Item key={f.id} label={f.number} value={f.id} />
              ))}
            </Picker>
          </View>
        </>
      )}

      <Pressable onPress={handleSignup} className="bg-purple-600 rounded py-3 mt-4">
        <Text className="text-white text-center font-bold">Signup</Text>
      </Pressable>
    </ScrollView>
  );
};

export default SignupPage;
