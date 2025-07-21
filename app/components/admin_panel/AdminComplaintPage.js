import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; // install if not already
import axios from "axios";
import { API_BASE_URL } from "@/app/user_utils/api";

const AdminComplaintPage = ({ authHeader }) => {
  const [complaints, setComplaints] = useState([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/complaints/`, authHeader);
      setComplaints(res.data);
    } catch (err) {
      setFeedback("❌ Failed to load complaints.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/complaints/${id}/`,
        { status: newStatus },
        authHeader
      );
      setFeedback("✅ Status updated.");
      fetchComplaints();
    } catch {
      setFeedback("❌ Failed to update status.");
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <Text className="text-2xl font-bold mb-3">📬 All Complaints</Text>

      {feedback ? <Text className="text-blue-600 mb-2">{feedback}</Text> : null}

      {complaints.length === 0 ? (
        <Text className="text-gray-500">No complaints received.</Text>
      ) : (
        complaints.map((complaint) => (
          <View
            key={complaint.id}
            className="bg-white p-4 rounded-lg mb-4 shadow"
            style={
              Platform.OS === "web"
                ? { boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }
                : undefined
            }
          >
            <View className="flex-row justify-between">
              <Text className="font-semibold text-base">{complaint.subject}</Text>
              <Text className="text-xs text-gray-500">
                {new Date(complaint.created_at).toLocaleString()}
              </Text>
            </View>

            <Text className="mt-2 text-gray-900">{complaint.description}</Text>

            <View className="mt-2">
              <Text className="text-sm text-gray-700">
                <Text className="font-bold">Sender:</Text>{" "}
                {complaint.sender?.username || complaint.sender_name || "N/A"}
              </Text>
              <Text className="text-sm text-gray-700">
                <Text className="font-bold">Recipient:</Text>{" "}
                {complaint.recipient?.username || complaint.recipient_name || "N/A"}
              </Text>
            </View>

            <View className="mt-3">
              <Text className="font-bold mb-1">Status:</Text>
              <View className="border border-gray-300 rounded">
                <Picker
                  selectedValue={complaint.status}
                  onValueChange={(itemValue) =>
                    handleStatusChange(complaint.id, itemValue)
                  }
                  style={{ height: 40 }}
                >
                  <Picker.Item label="Open" value="open" />
                  <Picker.Item label="In Progress" value="in_progress" />
                  <Picker.Item label="Resolved" value="resolved" />
                </Picker>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default AdminComplaintPage;
