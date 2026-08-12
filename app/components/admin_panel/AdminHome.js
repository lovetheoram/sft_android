import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import NotificationPage from "./NotificationPage";
import AdminComplaintPage from "./AdminComplaintPage";
import AnnouncementPage from "./AnnouncementPage";
import DocumentPage from "./DocumentPage";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("notifications");
  const [authHeader, setAuthHeader] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
          setAuthHeader({ headers: { Authorization: `Bearer ${token}` } });
        }
      } catch (err) {
        console.error("Failed to fetch token from storage", err);
      }
    };

    getToken();
  }, []);

  const renderTab = () => {
    if (!authHeader) return <Text>Loading...</Text>;

    switch (activeTab) {
      case "notifications":
        return <NotificationPage authHeader={authHeader} />;
      case "complaints":
        return <AdminComplaintPage authHeader={authHeader} />;
      case "announcements":
        return <AnnouncementPage authHeader={authHeader} />;
      case "documents":
        return <DocumentPage authHeader={authHeader} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView className="bg-gray-100 h-full">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold mb-6 text-center">Admin Dashboard</Text>

        <View className="flex-row justify-around mb-6">
          <TabButton label="Notifications" tab="notifications" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Complaints" tab="complaints" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Announcements" tab="announcements" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Documents" tab="documents" activeTab={activeTab} setActiveTab={setActiveTab} />
        </View>

        <View className="bg-white p-4 rounded-lg shadow">{renderTab()}</View>
      </View>
    </ScrollView>
  );
};

const TabButton = ({ label, tab, activeTab, setActiveTab }) => {
  const isActive = activeTab === tab;
  return (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`px-3 py-2 rounded ${isActive ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <Text className={`${isActive ? "text-white font-semibold" : "text-gray-800"}`}>{label}</Text>
    </TouchableOpacity>
  );
};

export default AdminPanel;
