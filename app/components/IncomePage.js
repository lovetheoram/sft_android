import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../user_utils/api";

const IncomePage = () => {
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [specialChargeId, setSpecialChargeId] = useState("");
  const [specialCharges, setSpecialCharges] = useState([]);
  const [message, setMessage] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [buildingId, setBuildingId] = useState(0);

  const getToken = async () => await AsyncStorage.getItem("accessToken");

  const fetchBuilding = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/building/my_building`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBuildingId(res.data.id);
      fetchSpecialCharges(res.data.id);
    } catch (err) {
      console.error("Error fetching building", err);
    }
  };

  const fetchSpecialCharges = async (buildingId) => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${API_BASE_URL}/api/specialcharges/?building=${buildingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSpecialCharges(res.data);
    } catch (err) {
      console.error("Error fetching special charges", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/notifications/?ordering=-created_at`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data
        .filter((n) => n.income !== null)
        .map((n) => ({ ...n.income, seen: n.seen }));
      setTransactions(data);
    } catch {
      setError("Could not fetch your transaction history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getToken().then((token) => {
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }
      fetchTransactions();
      fetchBuilding();
    });
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPaymentProof(result);
    }
  };

  const handleSubmit = async () => {
    const token = await getToken();
    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("date", `${month}-01`);
    formData.append("transaction_id", transactionId);
    formData.append("building_id", buildingId);
    if (specialChargeId) formData.append("special_charge_id", specialChargeId);
    if (paymentProof) {
      formData.append("payment_proof", {
        uri: paymentProof.uri,
        name: "proof.jpg",
        type: "image/jpeg",
      });
    }

    try {
      await axios.post(`${API_BASE_URL}/api/income/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("✅ Payment submitted successfully");
      setAmount("");
      setMonth("");
      setTransactionId("");
      setPaymentProof(null);
      setSpecialChargeId("");
      fetchTransactions();
    } catch {
      setMessage("❌ Failed to submit payment");
    }
  };

  return (
    <View className="p-4">
      <Text className="text-lg font-bold mb-2">💸 Make a Payment</Text>
      {message && <Text className="text-blue-500 mb-2">{message}</Text>}

      <TextInput
        className="border rounded p-2 mb-2"
        placeholder="Amount (₹)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        className="border rounded p-2 mb-2"
        placeholder="Month (YYYY-MM)"
        value={month}
        onChangeText={setMonth}
      />
      <TextInput
        className="border rounded p-2 mb-2"
        placeholder="Transaction ID"
        value={transactionId}
        onChangeText={setTransactionId}
      />

      <TouchableOpacity className="bg-blue-500 p-2 rounded mb-2" onPress={pickImage}>
        <Text className="text-white text-center">Upload Proof</Text>
      </TouchableOpacity>

      <TouchableOpacity className="bg-green-600 p-2 rounded mb-4" onPress={handleSubmit}>
        <Text className="text-white text-center">Submit Payment</Text>
      </TouchableOpacity>

      <Text className="text-lg font-bold mt-4">🧾 Payment History</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="border-b py-2">
              <Text>₹{item.amount} - {item.transaction_id}</Text>
              <Text>Status: {item.status}</Text>
              <Text>Seen: {item.seen ? "✅" : "❌"}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default IncomePage;
