import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, FlatList, ActivityIndicator } from "react-native";
import axios from "axios";
// import { API_BASE_URL } from "../api";
import { API_BASE_URL } from "../user_utils/api";
const AdminPanel = () => {
  const [members, setMembers] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = ""; // Replace with SecureStore or AsyncStorage
  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [mRes, iRes, eRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/members/`, authHeader),
        axios.get(`${API_BASE_URL}/api/income/`, authHeader),
        axios.get(`${API_BASE_URL}/api/expense/`, authHeader),
      ]);
      setMembers(mRes.data);
      setIncomes(iRes.data);
      setExpenses(eRes.data);
    } catch (error) {
      console.error("Failed to load admin data", error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = incomes.reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <ScrollView className="p-4 bg-white">
      <Text className="text-2xl font-bold text-center mb-6">👑 Admin Panel Overview</Text>

      {loading ? (
        <ActivityIndicator size="large" color="black" />
      ) : (
        <>
          {/* Summary Cards */}
          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="bg-purple-200 rounded-lg p-4 w-[100%] md:w-[32%] mb-4">
              <Text className="text-lg font-medium text-center">Total Members</Text>
              <Text className="text-3xl font-bold text-center">{members.length}</Text>
            </View>
            <View className="bg-green-200 rounded-lg p-4 w-[100%] md:w-[32%] mb-4">
              <Text className="text-lg font-medium text-center">Total Income</Text>
              <Text className="text-3xl font-bold text-center">₹{totalIncome}</Text>
            </View>
            <View className="bg-red-200 rounded-lg p-4 w-[100%] md:w-[32%] mb-4">
              <Text className="text-lg font-medium text-center">Total Expense</Text>
              <Text className="text-3xl font-bold text-center">₹{totalExpense}</Text>
            </View>
          </View>

          {/* Recent Income Entries */}
          <Text className="text-lg font-semibold mb-2">Recent Income Entries</Text>
          <View className="bg-gray-50 rounded-lg mb-6">
            <FlatList
              data={incomes.slice(-5).reverse()}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View className="flex-row justify-between border-b px-3 py-2">
                  <Text className="w-1/3">{item.member?.user?.username || "N/A"}</Text>
                  <Text className="w-1/3 text-center">₹{item.amount}</Text>
                  <Text className="w-1/3 text-right">{item.date}</Text>
                </View>
              )}
            />
          </View>

          {/* Recent Expense Entries */}
          <Text className="text-lg font-semibold mb-2">Recent Expense Entries</Text>
          <View className="bg-gray-50 rounded-lg mb-6">
            <FlatList
              data={expenses.slice(-5).reverse()}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View className="flex-row justify-between border-b px-3 py-2">
                  <Text className="w-1/3">{item.category?.name || "N/A"}</Text>
                  <Text className="w-1/3 text-center">₹{item.amount}</Text>
                  <Text className="w-1/3 text-right">{item.date}</Text>
                </View>
              )}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default AdminPanel;
