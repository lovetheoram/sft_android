import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Picker
} from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import axios from 'axios';
import { API_BASE_URL } from '@/app/user_utils/api';
const FlatManager = ({ authHeader }) => {
  const [flats, setFlats] = useState([]);
  const [newFlatNumber, setNewFlatNumber] = useState('');
  const [message, setMessage] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const flatInputRef = useRef(null);

  const fetchMyBuilding = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/building/my_building/`, authHeader);
      setBuildings([res.data]);
      setSelectedBuildingId(res.data.id);
      setIsSuperAdmin(false);
    } catch (err) {
      fetchAllBuildings();
    }
  };

  const fetchAllBuildings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/building/`, authHeader);
      setBuildings(res.data);
      setIsSuperAdmin(true);
    } catch (err) {
      setMessage('❌ Error fetching buildings.');
    }
  };

  useEffect(() => {
    fetchMyBuilding();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) fetchFlats(selectedBuildingId);
    else setFlats([]);
  }, [selectedBuildingId]);

  const fetchFlats = async (buildingId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/flat/?building_id=${buildingId}`, authHeader);
      setFlats(res.data);
    } catch (err) {
      setMessage('❌ Could not fetch flats.');
    }
  };

  const addFlat = async () => {
    if (!newFlatNumber.trim() || !selectedBuildingId) return;
    try {
      const payload = {
        number: newFlatNumber,
        is_occupied: false,
        building_id: selectedBuildingId
      };
      const res = await axios.post(`${API_BASE_URL}/api/flat/`, payload, authHeader);
      setFlats([...flats, res.data]);
      setNewFlatNumber('');
      flatInputRef.current?.focus();
      setMessage('✅ Flat added.');
    } catch (err) {
      setMessage('❌ Could not add flat.');
    }
  };

  const deleteFlat = async (id) => {
    Alert.alert('Delete Flat', 'Are you sure you want to delete this flat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/api/flat/${id}/`, authHeader);
            setFlats(flats.filter((f) => f.id !== id));
            setMessage('🗑️ Flat deleted.');
          } catch {
            setMessage('❌ Could not delete flat.');
          }
        }
      }
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 p-4 bg-white">
      <Text className="text-xl font-bold mb-4">🏠 Manage Flats</Text>

      {isSuperAdmin ? (
        <View className="mb-4">
          <Text className="text-base font-medium mb-1">Select Building</Text>
          <RNPicker
            selectedValue={selectedBuildingId}
            onValueChange={(value) => setSelectedBuildingId(value)}
            className="border border-gray-300 rounded"
          >
            <RNPicker.Item label="-- Select --" value="" />
            {buildings.map((b) => (
              <RNPicker.Item key={b.id} label={b.name} value={b.id} />
            ))}
          </RNPicker>
        </View>
      ) : (
        <Text className="text-base text-gray-600 mb-3">Managing flats for <Text className="font-bold">{buildings[0]?.name}</Text></Text>
      )}

      {selectedBuildingId && (
        <>
          <View className="flex-row space-x-2 mb-4">
            <TextInput
              value={newFlatNumber}
              ref={flatInputRef}
              onChangeText={setNewFlatNumber}
              placeholder="Flat number"
              className="border border-gray-300 rounded px-3 py-2 flex-1"
            />
            <Pressable
              onPress={addFlat}
              className="bg-green-600 px-4 py-2 rounded justify-center items-center"
            >
              <Text className="text-white font-medium">Add</Text>
            </Pressable>
          </View>

          <FlatList
            data={flats}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View className="flex-row justify-between items-center border-b border-gray-200 py-2">
                <Text>{item.number} - {item.is_occupied ? 'Occupied' : 'Vacant'}</Text>
                <Pressable
                  onPress={() => deleteFlat(item.id)}
                  className="bg-red-500 px-3 py-1 rounded"
                >
                  <Text className="text-white text-xs">Delete</Text>
                </Pressable>
              </View>
            )}
            ListEmptyComponent={<Text className="text-gray-500 text-center mt-10">No flats found.</Text>}
          />
        </>
      )}

      {message && <Text className="text-center text-blue-600 mt-4 font-medium">{message}</Text>}
    </KeyboardAvoidingView>
  );
};

export default FlatManager;
