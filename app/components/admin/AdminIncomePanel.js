import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import { API_BASE_URL } from '@/app/user_utils/api';
const screenWidth = Dimensions.get('window').width;

const AdminIncomePanel = ({authHeader}) => {
  const [incomes, setIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
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
    if (user) fetchIncomes();
  }, [user, selectedBuilding]);

  useEffect(() => {
    filterByYear(yearFilter);
  }, [incomes, yearFilter]);

  const getCurrentUser = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/currentUser/`, authHeader);
      setUser(res.data);
      if (res.data.flat === null) {
        setSelectedBuilding(null);
      } else {
        setSelectedBuilding(res.data.flat.building.id);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const getBuildings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/building/`, authHeader);
      setBuildings(res.data);
    } catch (err) {
      console.error("Error fetching buildings:", err);
    }
  };

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/income/`, authHeader);
      let data = res.data;
      if (user?.flat === null && selectedBuilding) {
        data = data.filter(i => i.building?.id === selectedBuilding);
      } else if (user?.flat?.building?.id) {
        data = data.filter(i => i.building?.id === user.flat.building.id);
      }
      setIncomes(data);
    } catch (err) {
      console.error("Error fetching income data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterByYear = (year) => {
    const parsedYear = parseInt(year);
    const filtered = incomes.filter(i => new Date(i.date).getFullYear() === parsedYear);
    setFilteredIncomes(filtered);
  };

  const chartData = {
    labels: filteredIncomes.map(i => new Date(i.date).toLocaleDateString().split('/').slice(0, 2).join('/')),
    datasets: [
      {
        data: filteredIncomes.map(i => i.amount),
        strokeWidth: 2,
      },
    ],
  };

  const years = [2025, 2024, 2023, 2022, 2021];

  const renderIncomeItem = ({ item }) => (
    <View className="flex-row justify-between px-4 py-2 border-b border-gray-300">
      <Text className="text-sm w-[20%]">{item.id}</Text>
      <Text className="text-sm w-[30%]">{item.amount}</Text>
      <Text className="text-sm w-[30%]">{item.date}</Text>
      <Text className="text-sm w-[20%]">{item.status}</Text>
    </View>
  );

  return (
    <ScrollView className="p-4 bg-white">
      <Text className="text-xl font-bold mb-4 text-center">Admin Income Overview</Text>

      {user?.flat === null && (
        <View className="mb-4">
          <Text className="font-medium mb-1">Select Building:</Text>
          <Picker
            selectedValue={selectedBuilding}
            onValueChange={(value) => setSelectedBuilding(value)}
          >
            {buildings.map((b) => (
              <Picker.Item key={b.id} label={b.name} value={b.id} />
            ))}
          </Picker>
        </View>
      )}

      <View className="mb-4">
        <Text className="font-medium mb-1">Filter by Year:</Text>
        <Picker
          selectedValue={yearFilter}
          onValueChange={(value) => setYearFilter(value)}
        >
          {years.map((y) => (
            <Picker.Item key={y} label={`${y}`} value={y} />
          ))}
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : filteredIncomes.length === 0 ? (
        <Text className="text-center text-gray-500 my-6">No income data for {yearFilter}</Text>
      ) : (
        <>
          <View className="flex-row justify-between bg-gray-200 px-4 py-2 rounded">
            <Text className="text-sm font-bold w-[20%]">ID</Text>
            <Text className="text-sm font-bold w-[30%]">Amount</Text>
            <Text className="text-sm font-bold w-[30%]">Date</Text>
            <Text className="text-sm font-bold w-[20%]">Status</Text>
          </View>
          <FlatList
            data={filteredIncomes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderIncomeItem}
            className="mb-6"
          />
        </>
      )}

      {filteredIncomes.length > 0 && (
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: () => "#333",
            strokeWidth: 2,
            decimalPlaces: 0,
          }}
          bezier
          style={{ borderRadius: 8 }}
        />
      )}
    </ScrollView>
  );
};

export default AdminIncomePanel;
