import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from "../../user_utils/api";
const BuildingManager = ({ authHeader }) => {
  const [buildings, setBuildings] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  const fetchBuildings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/building/`, authHeader);
      setBuildings(res.data);
    } catch {
      setMessage("❌ Error fetching buildings.");
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const addBuilding = async () => {
    if (!name.trim()) return;
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/building/`,
        { name, address },
        authHeader
      );
      setBuildings([...buildings, res.data]);
      setName("");
      setAddress("");
      setMessage("✅ Building added.");
    } catch {
      setMessage("❌ Could not add building.");
    }
  };

  const deleteBuilding = async (id) => {
    Alert.alert("Delete", "Are you sure you want to delete this building?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/api/building/${id}/`, authHeader);
            setBuildings(buildings.filter((b) => b.id !== id));
            setMessage("🗑️ Building deleted.");
          } catch {
            setMessage("❌ Could not delete building.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View className="flex-row items-center justify-between border-b border-gray-300 py-2 px-3">
      <View className="flex-1">
        <Text className="text-base font-semibold">🏠 {item.name}</Text>
        <Text className="text-sm text-gray-600">{item.address}</Text>
      </View>
      <Pressable
        onPress={() => deleteBuilding(item.id)}
        className="bg-red-500 px-3 py-1 rounded"
      >
        <Text className="text-white text-xs font-semibold">Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 px-4 pt-6 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text className="text-lg font-bold mb-4">🏗️ Buildings</Text>

      <View className="space-y-2 mb-4">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          className="border border-gray-300 rounded px-3 py-2"
        />
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Address"
          className="border border-gray-300 rounded px-3 py-2"
        />
        <Pressable
          onPress={addBuilding}
          className="bg-green-600 py-2 rounded items-center"
        >
          <Text className="text-white font-medium">Add Building</Text>
        </Pressable>
      </View>

      <FlatList
        data={buildings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-10">No buildings found.</Text>
        }
      />

      {message ? (
        <Text className="text-center text-blue-700 mt-4 font-medium">{message}</Text>
      ) : null}
    </KeyboardAvoidingView>
  );
};

export default BuildingManager;
