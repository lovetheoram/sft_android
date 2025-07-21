import React from "react";
import { View, Text } from "react-native";

const HomePage = () => {
  return (
    <View className="flex-1 items-center justify-center p-4 bg-white">
      <Text className="text-2xl font-bold mb-4 text-center">
        Welcome to Society Finance Tracker
      </Text>

      <Text className="text-gray-700 mb-2 text-center">
        🔒 Securely manage your society's finances.
      </Text>

      <Text className="text-gray-700 mb-2 text-center">
        💰 Track income, expenses, member contributions, and more.
      </Text>

      <Text className="text-gray-700 mb-2 text-center">
        📊 Visualize reports and export summaries to Excel.
      </Text>

      <Text className="text-gray-700 text-center">
        👥 Login or Signup to get started.
      </Text>
    </View>
  );
};

export default HomePage;
