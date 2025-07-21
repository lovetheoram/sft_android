import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { TouchableOpacity, TextInput } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/app/user_utils/api';
const AdminUserPanel = ({authHeader}) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then(t => {
      setToken(t);
    });
  }, []);

  useEffect(() => {
    if (token) {
      getCurrentUser();
      fetchBuildings();
    }
  }, [token]);

  useEffect(() => {
    if (user) fetchUsers();
  }, [user]);

  useEffect(() => {
    filterUsers();
  }, [users, selectedBuilding, roleFilter]);



  const getCurrentUser = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/currentUser/`, authHeader);
      setUser(res.data);
      if (res.data.flat === null) setSelectedBuilding('');
      else setSelectedBuilding(res.data.flat.building.id);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/building/`, authHeader);
      setBuildings(res.data);
    } catch (err) {
      console.error('Error fetching buildings:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/`, authHeader);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let data = [...users];
    if (selectedBuilding) {
      data = data.filter(u => u.flat?.building?.id === parseInt(selectedBuilding));
    }
    if (roleFilter) {
      data = data.filter(u => u.role === roleFilter);
    }
    setFilteredUsers(data);
  };

  const handleDelete = async userId => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/api/users/${userId}/`, authHeader);
            fetchUsers();
          } catch (err) {
            console.error('Error deleting user:', err);
          }
        },
      },
    ]);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/users/${userId}/`, { role: newRole }, authHeader);
      fetchUsers();
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const renderUser = ({ item }) => (
    <View className="border-b border-gray-300 px-4 py-2">
      <Text className="font-bold text-base">{item.username}</Text>
      <Text>Email: {item.email}</Text>
      <Text>Flat: {item.flat?.number || '-'}</Text>
      <Text>Building: {item.flat?.building?.name || '-'}</Text>
      <Text>Role:</Text>
      <Picker
        selectedValue={item.role}
        onValueChange={(value) => handleRoleChange(item.id, value)}
      >
        <Picker.Item label="Admin" value="admin" />
        <Picker.Item label="Member" value="member" />
      </Picker>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Text className="text-red-500 mt-2">Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView className="bg-white p-4">
      <Text className="text-xl font-bold mb-4">Admin User Panel</Text>

      {user?.flat === null && (
        <View className="mb-4">
          <Text className="font-medium">Filter By Building</Text>
          <Picker selectedValue={selectedBuilding} onValueChange={(val) => setSelectedBuilding(val)}>
            <Picker.Item label="All" value="" />
            {buildings.map(b => <Picker.Item key={b.id} label={b.name} value={b.id} />)}
          </Picker>

          <Text className="font-medium mt-2">Filter By Role</Text>
          <Picker selectedValue={roleFilter} onValueChange={(val) => setRoleFilter(val)}>
            <Picker.Item label="All" value="" />
            <Picker.Item label="Admin" value="admin" />
            <Picker.Item label="Member" value="member" />
          </Picker>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" />
      ) : filteredUsers.length === 0 ? (
        <Text className="text-gray-500">No users found.</Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUser}
        />
      )}
    </ScrollView>
  );
};

export default AdminUserPanel;
