import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Picker,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
import axios from "axios";
import { LineChart } from "react-native-chart-kit";
import { API_BASE_URL } from "@/app/user_utils/api";

const screenWidth = Dimensions.get("window").width;

const AdminExpensePanel = ({ authHeader }) => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
    getBuildings();
  }, []);

  useEffect(() => {
    if (user) fetchExpenses();
  }, [user, selectedBuilding]);

  useEffect(() => {
    filterByYear(yearFilter);
  }, [expenses, yearFilter]);

  const getCurrentUser = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/currentUser/`, authHeader);
      setUser(res.data);
      if (!res.data.flat) setSelectedBuilding(null);
      else setSelectedBuilding(res.data.flat.building.id);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const getBuildings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/building/`, authHeader);
      setBuildings(res.data);
      if (res.data.length > 0 && !selectedBuilding && user?.flat === null) {
        setSelectedBuilding(res.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching buildings:", err);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expense/`, authHeader);
      let data = res.data;

      if (!user?.flat && selectedBuilding) {
        data = data.filter((e) => e.building?.id === selectedBuilding);
      } else if (user?.flat) {
        data = data.filter((e) => e.building?.id === user.flat.building.id);
      }
      setExpenses(data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterByYear = (year) => {
    const filtered = expenses.filter((e) => new Date(e.date).getFullYear() === parseInt(year));
    setFilteredExpenses(filtered);
  };

  const chartData = {
    labels: filteredExpenses.map((e) => new Date(e.date).toLocaleDateString().slice(0, 5)),
    datasets: [{ data: filteredExpenses.map((e) => e.amount) }],
  };

  return (
    <ScrollView className="p-4">
      <Text className="text-xl font-bold mb-4">Admin Expense Overview</Text>

      {user && !user.flat && (
        <View className="mb-4">
          <Text className="font-semibold mb-1">Select Building:</Text>
          <Picker
            selectedValue={selectedBuilding}
            onValueChange={(val) => setSelectedBuilding(val)}
          >
            {buildings.map((b) => (
              <Picker.Item label={b.name} value={b.id} key={b.id} />
            ))}
          </Picker>
        </View>
      )}

      <View className="mb-4">
        <Text className="font-semibold mb-1">Filter by Year:</Text>
        <Picker
          selectedValue={yearFilter}
          onValueChange={(val) => setYearFilter(val)}
        >
          {[...Array(5)].map((_, i) => {
            const y = new Date().getFullYear() - i;
            return <Picker.Item key={y} label={`${y}`} value={y} />;
          })}
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" />
      ) : filteredExpenses.length === 0 ? (
        <Text>No data found for {yearFilter}</Text>
      ) : (
        <>
          <FlatList
            className="mb-6"
            data={filteredExpenses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View className="border border-gray-200 p-3 mb-2 rounded">
                <Text>ID: {item.id}</Text>
                <Text>Category: {item.category?.name}</Text>
                <Text>Amount: ₹{item.amount}</Text>
                <Text>Date: {item.date}</Text>
                <Text>Description: {item.description}</Text>
                <Text>Bill #: {item.bill_number}</Text>
              </View>
            )}
          />

          <Text className="font-semibold mb-2">Expense Chart:</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              labelColor: () => "#000",
            }}
            bezier
            style={{ borderRadius: 10 }}
          />
        </>
      )}
    </ScrollView>
  );
};

export default AdminExpensePanel;
