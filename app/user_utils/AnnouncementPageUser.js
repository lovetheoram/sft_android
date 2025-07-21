import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import axios from "axios";
import { API_BASE_URL } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AnnouncementPageUser = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [feedback, setFeedback] = useState("");

  // Replace this with secure token handling (e.g. SecureStore or context)
  const getToken = async () => await AsyncStorage.getItem("accessToken");
  


  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
            const token = await getToken();

      const res = await axios.get(`${API_BASE_URL}/api/announcements/`,
        {headers: { Authorization: `Bearer ${token}` },}
      );
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
      setFeedback("❌ Failed to load announcements.");
    }
  };

  return (
    <ScrollView className="p-4 bg-white h-full">
      <Text className="text-2xl font-bold mb-4 text-center">📢 Announcements</Text>

      {announcements.length === 0 ? (
        <Text className="text-gray-600 text-center mt-4">No announcements available.</Text>
      ) : (
        announcements.map((a) => (
          <View key={a.id} className="mb-4 p-4 bg-white rounded-xl shadow border">
            <View className="flex-row justify-between mb-2">
              <Text className="font-semibold text-lg">{a.title}</Text>
              <Text className="text-xs text-gray-500">
                {new Date(a.created_at).toLocaleString()}
              </Text>
            </View>
            <Text className="text-gray-700 whitespace-pre-wrap">{a.message}</Text>
          </View>
        ))
      )}

      {feedback ? (
        <Text className="mt-4 text-center text-red-600 font-medium">{feedback}</Text>
      ) : null}
    </ScrollView>
  );
};

export default AnnouncementPageUser;
