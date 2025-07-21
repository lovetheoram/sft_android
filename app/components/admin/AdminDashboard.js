import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";

import AdminUserPanel from "./AdminUserPanel";
import AdminIncomePanel from "./AdminIncomePanel";
import AdminExpensePanel from "./AdminExpensePanel";
import UtilsPage from "./UtilsPage";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [authHeader, setAuthHeader] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
          setAuthHeader({ headers: { Authorization: `Bearer ${token}` } });
        }
      } catch (err) {
        console.error("Failed to get token", err);
      }
    };
    getToken();
  }, []);

  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: "home" },
    { key: "users", label: "Users", icon: "user" },
    { key: "utility", label: "Utility", icon: "folder" },
    { key: "income", label: "Income", icon: "dollar-sign" },
    { key: "expenses", label: "Expenses", icon: "credit-card" },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "users":
        return <AdminUserPanel authHeader={authHeader} />;
      case "utility":
        return <UtilsPage authHeader={authHeader} />;
      case "income":
        return <AdminIncomePanel authHeader={authHeader} />;
      case "expenses":
        return <AdminExpensePanel authHeader={authHeader} />;
      default:
        return (
          <View className="items-center justify-center py-10">
            <Text className="text-2xl font-bold text-indigo-700 mb-2">
              🏢 Admin Dashboard
            </Text>
            <Text className="text-base text-gray-600 text-center px-4">
              Welcome, Admin! Choose a section to manage data.
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="py-3 bg-white shadow border-b border-gray-200 items-center">
        <Text className="text-xl font-bold text-indigo-700">
          Admin Dashboard
        </Text>
      </View>

      {/* Compact Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row bg-white px-2 py-1 border-b border-gray-200"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-row items-center h-[28px] px-2 py-[2px] rounded-md mr-2 ${
                isActive ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <Icon
                name={tab.icon}
                size={12}
                color={isActive ? "white" : "black"}
                style={{ marginRight: 4 }}
              />
              <Text
                className={`text-xs leading-none ${
                  isActive ? "text-white font-semibold" : "text-black"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4 py-4">
        <View className="bg-white p-4 rounded-xl shadow">{renderTab()}</View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboard;
