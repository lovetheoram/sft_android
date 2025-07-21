import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from "@/app/user_utils/api";
const CategoryManager = ({ authHeader }) => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const categoryInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [buildingId, setBuildingId] = useState(0);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories/`, authHeader);
      setCategories(res.data);
    } catch (err) {
      setMessage("❌ Error fetching categories.");
    }
  };

  const fetchBuilding = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/building/my_building`, authHeader);
      setBuildingId(res.data.id);
    } catch (err) {
      console.error("Error fetching building", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBuilding();
  }, []);

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/categories/`,
        { name: newCategoryName, building_id: buildingId },
        authHeader
      );
      setCategories([...categories, res.data]);
      setNewCategoryName("");
      categoryInputRef.current?.focus();
      setMessage("✅ Category added.");
    } catch {
      setMessage("❌ Could not add category.");
    }
  };

  const deleteCategory = async (id) => {
    Alert.alert("Delete", "Are you sure you want to delete this category?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/api/categories/${id}/`, authHeader);
            setCategories(categories.filter((c) => c.id !== id));
            setMessage("🗑️ Category deleted.");
          } catch {
            setMessage("❌ Could not delete category.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View className="flex-row items-center justify-between border-b border-gray-300 py-2 px-3">
      <View className="flex-1">
        <Text className="text-base">{item.name}</Text>
      </View>
      <Pressable
        onPress={() => deleteCategory(item.id)}
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
      <Text className="text-lg font-bold mb-4">📁 Categories</Text>

      <View className="flex-row space-x-2 mb-4">
        <TextInput
          value={newCategoryName}
          ref={categoryInputRef}
          onChangeText={setNewCategoryName}
          placeholder="New category name"
          className="border border-gray-300 rounded px-3 py-2 flex-1"
        />
        <Pressable
          onPress={addCategory}
          className="bg-green-600 px-4 py-2 rounded justify-center items-center"
        >
          <Text className="text-white font-medium">Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-10">No categories found.</Text>
        }
      />

      {message && (
        <Text className="text-center text-blue-700 mt-4 font-medium">{message}</Text>
      )}
    </KeyboardAvoidingView>
  );
};

export default CategoryManager;
