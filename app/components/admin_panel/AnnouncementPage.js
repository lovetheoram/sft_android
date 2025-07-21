import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from "@/app/user_utils/api";

const AnnouncementPage = ({ authHeader }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/announcements/`, authHeader);
      setAnnouncements(res.data);
    } catch (err) {
      setFeedback("❌ Failed to load announcements.");
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) return;
    try {
      await axios.post(
        `${API_BASE_URL}/api/announcements/`,
        { title, message },
        authHeader
      );
      setTitle("");
      setMessage("");
      fetchAnnouncements();
      setFeedback("✅ Announcement posted.");
    } catch {
      setFeedback("❌ You may not have permission to post.");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete?", "Are you sure you want to delete this?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/api/announcements/${id}/`, authHeader);
            fetchAnnouncements();
            setFeedback("🗑️ Deleted.");
          } catch {
            setFeedback("❌ Delete failed.");
          }
        },
      },
    ]);
  };

  const openEdit = (a) => {
    setEditId(a.id);
    setEditTitle(a.title);
    setEditMessage(a.message);
    setEditMode(true);
  };

  const handleEditSave = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/announcements/${editId}/`,
        { title: editTitle, message: editMessage },
        authHeader
      );
      setEditMode(false);
      fetchAnnouncements();
      setFeedback("✏️ Edited successfully.");
    } catch {
      setFeedback("❌ Edit failed.");
    }
  };

  return (
    <ScrollView className="p-4 bg-gray-100 flex-1">
      <Text className="text-xl font-bold mb-3">📢 Announcements</Text>

      {/* Create Section */}
      <View className="bg-white p-4 rounded-lg mb-4 shadow">
        <Text className="font-bold mb-2">Create Announcement</Text>
        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          className="border rounded-md mb-2 px-3 py-2"
        />
        <TextInput
          placeholder="Message"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
          className="border rounded-md mb-2 px-3 py-2"
        />
        <TouchableOpacity
          onPress={handleCreate}
          className="bg-blue-600 px-4 py-3 rounded-md"
        >
          <Text className="text-white text-center">Post</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {announcements.length === 0 ? (
        <Text className="text-gray-500">No announcements yet.</Text>
      ) : (
        announcements.map((a) => (
          <View
            key={a.id}
            className="bg-white p-4 rounded-lg mb-3 shadow-md"
          >
            <View className="flex-row justify-between">
              <Text className="font-semibold text-base">{a.title}</Text>
              <Text className="text-xs text-gray-500">
                {new Date(a.created_at).toLocaleString()}
              </Text>
            </View>
            <Text className="mt-2">{a.message}</Text>
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
                onPress={() => openEdit(a)}
                className="bg-yellow-500 px-3 py-1 rounded mr-2"
              >
                <Text className="text-white text-xs">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(a.id)}
                className="bg-red-600 px-3 py-1 rounded"
              >
                <Text className="text-white text-xs">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Edit Modal */}
      <Modal visible={editMode} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white p-5 rounded-lg w-[90%] max-w-[400px]">
            <Text className="font-bold text-base mb-3">Edit Announcement</Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Title"
              className="border rounded-md mb-2 px-3 py-2"
            />
            <TextInput
              value={editMessage}
              onChangeText={setEditMessage}
              multiline
              numberOfLines={4}
              placeholder="Message"
              className="border rounded-md mb-3 px-3 py-2"
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setEditMode(false)}
                className="bg-gray-500 px-4 py-2 rounded-md mr-2"
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditSave}
                className="bg-green-600 px-4 py-2 rounded-md"
              >
                <Text className="text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {feedback ? <Text className="mt-4 text-blue-600">{feedback}</Text> : null}
    </ScrollView>
  );
};

export default AnnouncementPage;
