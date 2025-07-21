import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { API_BASE_URL } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ComplaintForm = () => {
  const [user, setUser] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/currentUser/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch {
      setFeedback("❌ Failed to load user info.");
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token || !user) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [buildingAdminRes, superAdminsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/buildingadmin/`, { headers }),
        axios.get(`${API_BASE_URL}/api/superadmin/`, { headers }),
      ]);

      const buildingAdmin = buildingAdminRes?.data ? [buildingAdminRes.data] : [];
      const superAdmins = superAdminsRes?.data ? [superAdminsRes.data] : [];

      setRecipients([...buildingAdmin, ...superAdmins]);
    } catch {
      setFeedback("❌ Failed to load admin recipients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAdmins();
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedRecipient || !subject.trim() || !description.trim()) {
      setFeedback("❌ All fields are required.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        `${API_BASE_URL}/api/complaints/`,
        {
          recipient: selectedRecipient,
          subject,
          description,
        },
        { headers }
      );

      setSelectedRecipient("");
      setSubject("");
      setDescription("");
      setFeedback("✅ Complaint submitted successfully.");
    } catch {
      setFeedback("❌ Failed to submit complaint.");
    }
  };

  return (
    <ScrollView className="p-4 bg-white h-full">
      <Text className="text-xl font-bold mb-4 text-center">📝 Submit a Complaint</Text>

      {loading ? (
        <View className="mt-10 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-2">Loading user and recipients...</Text>
        </View>
      ) : (
        <>
          <Text className="font-medium mb-1">Select Recipient</Text>
          <View className="border rounded mb-4 overflow-hidden">
            <Picker
              selectedValue={selectedRecipient}
              onValueChange={(value) => setSelectedRecipient(value)}
            >
              <Picker.Item label="-- Select Admin --" value="" />
              {recipients.map((r) => (
                <Picker.Item
                  key={r.id}
                  label={`${r.first_name || r.username} (${r.flat ? "Building Admin" : "Super Admin"})`}
                  value={r.id}
                />
              ))}
            </Picker>
          </View>

          <Text className="font-medium mb-1">Subject</Text>
          <TextInput
            className="border px-3 py-2 rounded mb-4"
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter subject"
          />

          <Text className="font-medium mb-1">Description</Text>
          <TextInput
            className="border px-3 py-2 rounded mb-4"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your issue..."
          />

          <TouchableOpacity
            className="bg-blue-600 rounded py-3"
            onPress={handleSubmit}
          >
            <Text className="text-white text-center font-semibold">Submit Complaint</Text>
          </TouchableOpacity>

          {feedback !== "" && (
            <Text className="text-center text-blue-700 mt-4">{feedback}</Text>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default ComplaintForm;
