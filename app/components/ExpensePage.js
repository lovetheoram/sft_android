import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../user_utils/api";

const ExpensePage = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [buildingId, setBuildingId] = useState(null);
  const amountInputRef = useRef(null);
  const [authHeader, setAuthHeader] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTokenAndFetch = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) throw new Error("No token found");

        const header = { headers: { Authorization: `Bearer ${token}` } };
        setAuthHeader(header);

        await fetchBuilding(header);
        await fetchCategories(header);
        await fetchExpenses(header);
      } catch (err) {
        console.error("Auth error:", err);
        Alert.alert("Invalid token", "Please login again.");
      } finally {
        setLoading(false);
      }
    };

    getTokenAndFetch();
  }, []);

  const fetchBuilding = async (header) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/building/my_building/`, header);
      setBuildingId(res.data.id);
    } catch (err) {
      console.error("Building fetch error", err);
      setMessage("❌ You must be a building admin to add expenses.");
    }
  };

  const fetchCategories = async (header) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories/`, header);
      setCategories(res.data);
    } catch (err) {
      console.log("Failed to fetch categories", err);
    }
  };

  const fetchExpenses = async (header) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expense/`, header);
      setExpenses(res.data);
    } catch (err) {
      console.log("Failed to fetch expenses", err);
    }
  };

  const handleSubmit = async () => {
    if (!buildingId) {
      Alert.alert("Unauthorized", "You are not authorized to add expenses.");
      return;
    }

    if (!selectedCategory || !amount || !month) {
      Alert.alert("Missing Fields", "All fields except note are required.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/api/expense/`,
        {
          category_id: selectedCategory,
          amount,
          date: `${month}-01`,
          description: note,
          building_id: buildingId,
        },
        authHeader
      );

      setMessage("✅ Expense added successfully!");
      setAmount("");
      setSelectedCategory("");
      setMonth("");
      setNote("");
      fetchExpenses(authHeader);
    } catch (err) {
      console.log("Failed to add expense", err);
      Alert.alert("Error", "❌ Failed to add expense.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        Add Expense
      </Text>

      {message !== "" && (
        <Text
          style={{
            color: message.startsWith("✅") ? "green" : "red",
            marginBottom: 10,
          }}
        >
          {message}
        </Text>
      )}

      {buildingId && (
        <View>
          <Text style={{ marginBottom: 4 }}>Category</Text>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={{ marginBottom: 12 }}
          >
            <Picker.Item label="-- Select Category --" value="" />
            {categories.map((cat) => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
            ))}
          </Picker>

          <Text style={{ marginBottom: 4 }}>Amount (₹)</Text>
          <TextInput
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            ref={amountInputRef}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              marginBottom: 12,
              padding: 8,
              borderRadius: 6,
            }}
          />

          <Text style={{ marginBottom: 4 }}>Month</Text>
          <TextInput
            value={month}
            onChangeText={setMonth}
            placeholder="YYYY-MM"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              marginBottom: 12,
              padding: 8,
              borderRadius: 6,
            }}
          />

          <Text style={{ marginBottom: 4 }}>Note (Optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Note"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              marginBottom: 16,
              padding: 8,
              borderRadius: 6,
            }}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              backgroundColor: "#dc2626",
              padding: 12,
              borderRadius: 6,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Add Expense
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
        Expense Records
      </Text>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 10,
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              Category: {item.category?.name || item.category}
            </Text>
            <Text>Amount: ₹{item.amount}</Text>
            <Text>Date: {item.date}</Text>
            <Text>Note: {item.description}</Text>
          </View>
        )}
      />
    </ScrollView>
  );
};

export default ExpensePage;
