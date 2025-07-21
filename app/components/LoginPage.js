import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { API_BASE_URL } from "../api";
import { API_BASE_URL } from "../user_utils/api";
const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLogin = async () => {
    setError("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/token/`, {
        username,
        password,
      });
      const { access, refresh } = response.data;
      await AsyncStorage.setItem("accessToken", access);
      await AsyncStorage.setItem("refreshToken", refresh);
      setShowSuccess(true);
    } catch (err) {
      setError("❌ Invalid username or password");
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onLoginSuccess && onLoginSuccess();
  };

  return (
    <View className="flex-1 justify-center items-center bg-gradient-to-br from-purple-500 to-indigo-600 px-4">
      <View className="bg-white rounded-2xl shadow-lg p-6 w-11/12 max-w-md">
        <Text className="text-3xl font-bold text-center text-indigo-700 mb-6">
          🔐 Welcome Back
        </Text>

        {error !== "" && (
          <Text className="text-red-600 text-center mb-4">{error}</Text>
        )}

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Username
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 text-black"
              placeholder="your_username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Password
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 text-black"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            className="bg-indigo-600 py-2 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">🚀 Login</Text>
          </TouchableOpacity>
        </View>

        <Text className="mt-6 text-sm text-center text-gray-500">
          Don't have an account?{" "}
          <Text className="text-indigo-600 font-medium underline">Sign up</Text>
        </Text>
      </View>

      {/* ✅ Success Modal */}
      <Modal transparent visible={showSuccess} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-xl p-6 w-11/12 max-w-sm items-center">
            <Text className="text-2xl font-bold text-green-600 mb-2">
              🎉 Login Successful!
            </Text>
            <Text className="mb-4 text-gray-700">
              Welcome, <Text className="font-semibold">{username}</Text>!
            </Text>
            <Pressable
              onPress={handleSuccessClose}
              className="bg-green-600 px-6 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Go to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LoginPage;
