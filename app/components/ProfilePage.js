import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Button,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { API_BASE_URL } from "../api";
import { API_BASE_URL } from "../user_utils/api";
const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        const res = await axios.get(`${API_BASE_URL}/api/members/profile/`, {
          headers,
        });
        setProfile(res.data);
        setForm(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (key, value) => {
    if (["first_name", "last_name", "phone"].includes(key)) {
      setForm({
        ...form,
        user: {
          ...form.user,
          [key]: value,
        },
      });
    } else {
      setForm({
        ...form,
        [key]: value,
      });
    }
  };

  const handleUpdate = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const payload = {
      move_in_date: form.move_in_date,
      user: {
        first_name: form.user.first_name,
        last_name: form.user.last_name,
        phone: form.user.phone,
      },
    };

    try {
      const res = await axios.put(`${API_BASE_URL}/api/members/profile/`, payload, { headers });
      setProfile(res.data);
      setForm(res.data);
      setEditMode(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  if (error) return <Text className="text-red-500 mt-10 text-center">{error}</Text>;
  if (!profile) return <ActivityIndicator className="mt-10" size="large" />;

  const { user } = form;

  return (
    <ScrollView className="p-4 bg-white">
      <Text className="text-2xl font-bold text-center mb-4">👤 My Profile</Text>

      <InputField label="Username" value={user?.username} editable={false} />
      <InputField label="Email" value={user?.email} editable={false} />
      <InputField
        label="First Name"
        value={user?.first_name}
        editable={editMode}
        onChangeText={(val) => handleChange("first_name", val)}
      />
      <InputField
        label="Last Name"
        value={user?.last_name}
        editable={editMode}
        onChangeText={(val) => handleChange("last_name", val)}
      />
      <InputField
        label="Phone"
        value={user?.phone}
        editable={editMode}
        onChangeText={(val) => handleChange("phone", val)}
      />
      <InputField label="Role" value={user?.role} editable={false} />
      <InputField
        label="Flat"
        value={`${user?.flat?.building?.name || ""} - ${user?.flat?.number || ""}`}
        editable={false}
      />
      <InputField
        label="Move-in Date"
        value={form.move_in_date}
        editable={editMode}
        onChangeText={(val) => handleChange("move_in_date", val)}
      />

      <View className="flex flex-row justify-between mt-6 space-x-4">
        {editMode ? (
          <>
            <View className="flex-1">
              <Button title="Save" color="green" onPress={handleUpdate} />
            </View>
            <View className="flex-1">
              <Button title="Cancel" color="gray" onPress={() => setEditMode(false)} />
            </View>
          </>
        ) : (
          <View className="flex-1">
            <Button title="Edit Profile" color="blue" onPress={() => setEditMode(true)} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const InputField = ({ label, value, editable, onChangeText }) => (
  <View className="mb-4">
    <Text className="text-sm font-semibold text-gray-700 mb-1">{label}</Text>
    {editable ? (
      <TextInput
        value={value || ""}
        onChangeText={onChangeText}
        className="border border-gray-300 p-2 rounded-md"
        placeholder={label}
      />
    ) : (
      <Text className="p-2 bg-gray-100 rounded">{value || "-"}</Text>
    )}
  </View>
);

export default ProfilePage;
