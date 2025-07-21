import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "@/app/user_utils/api";

// Manager components (ensure these are properly built in native)
import BuildingManager from "./BuildingManager";
import CategoryManager from "./CategoryManager";
import FlatManager from "./FlatManager";
import SpecialChargeManager from "./SpecialChargeManager";

const UtilsPage = () => {
  const [buildings, setBuildings] = useState([]);
  const [activeTab, setActiveTab] = useState("buildings");
  const [authHeader, setAuthHeader] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
          const header = { headers: { Authorization: `Bearer ${token}` } };
          setAuthHeader(header);
          fetchBuildings(token); // Optional — only if needed in this component
        }
      } catch (err) {
        console.error("Failed to fetch token from storage", err);
      } finally {
        setLoading(false);
      }
    };

    getToken();
  }, []);

  const fetchBuildings = async (token) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/building`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBuildings(res.data);
    } catch (err) {
      console.error("Error fetching buildings", err);
    }
  };

  const tabs = [
    { id: "buildings", label: "Buildings" },
    { id: "categories", label: "Categories" },
    { id: "flats", label: "Flats" },
    { id: "special", label: "Special Charges" },
  ];

  return (
    <ScrollView className="p-4 bg-white flex-1">
      <Text className="text-2xl font-bold mb-4">🏗️ Setup Page</Text>

      {/* Tab Buttons */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded ${
              activeTab === tab.id ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`${
                activeTab === tab.id ? "text-white" : "text-black"
              } font-medium`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loader or Tab Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : authHeader ? (
        <View className="mt-4">
          {activeTab === "buildings" && (
            <BuildingManager authHeader={authHeader} />
          )}
          {activeTab === "categories" && (
            <CategoryManager authHeader={authHeader} />
          )}
          {activeTab === "flats" && <FlatManager authHeader={authHeader} />}
          {activeTab === "special" && (
            <SpecialChargeManager authHeader={authHeader} />
          )}
        </View>
      ) : (
        <Text className="text-red-500">Authentication not available.</Text>
      )}
    </ScrollView>
  );
};

export default UtilsPage;
