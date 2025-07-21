import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
// import { API_BASE_URL } from "../../api";
import { API_BASE_URL } from "@/app/user_utils/api";
const NotificationPage = ({ authHeader }) => {
  const [notifications, setNotifications] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/notifications/`, authHeader);
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (notificationId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/notifications/${notificationId}/`, authHeader);
      setSelectedId(notificationId);
      setSelectedDetail(res.data);
    } catch (error) {
      console.error("Error retrieving notification:", error);
    }
  };

  const handleAction = async (type) => {
    if (!selectedDetail || !selectedDetail.income) return;

    const incomeId = selectedDetail.income.id;

    try {
      const url =
        type === "verify"
          ? `${API_BASE_URL}/api/income/${incomeId}/verify/`
          : `${API_BASE_URL}/api/income/${incomeId}/reject/`;

      await axios.post(url, {}, authHeader);
      setSelectedDetail(null);
      setSelectedId(null);
      fetchNotifications();
    } catch (error) {
      console.error(`Error during ${type}:`, error);
    }
  };

  const getStatusColor = (status) => {
    if (status === "verified") return "#16a34a";
    if (status === "fraud") return "#dc2626";
    return "#ca8a04";
  };

  const getStatusText = (status) => {
    if (status === "verified") return "Verified";
    if (status === "fraud") return "Rejected";
    return "Pending";
  };

  const filteredNotifications =
    filterStatus === "all"
      ? notifications
      : notifications.filter((n) => n.income?.status === filterStatus);

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>🔔 Notifications</Text>

      {/* Filter Dropdown */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ marginBottom: 4 }}>Filter by Status:</Text>
        <Picker
          selectedValue={filterStatus}
          onValueChange={(value) => setFilterStatus(value)}
          style={{
            height: 45,
            borderWidth: 1,
            borderColor: "#ccc",
            backgroundColor: "#f3f4f6",
          }}
        >
          <Picker.Item label="All" value="all" />
          <Picker.Item label="Pending" value="pending" />
          <Picker.Item label="Verified" value="verified" />
          <Picker.Item label="Rejected" value="fraud" />
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : filteredNotifications.length === 0 ? (
        <Text style={{ color: "#6b7280" }}>No notifications found for selected status.</Text>
      ) : (
        filteredNotifications.map((n) => (
          <View
            key={n.id}
            style={{
              backgroundColor: "#fff",
              padding: 12,
              marginBottom: 12,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: "#d1d5db",
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>{n.message}</Text>

            {n.income ? (
              <>
                <Text style={{ color: "#6b7280", marginTop: 4 }}>
                  From: {n.income.member?.user.username } | ID: {n.income.id}
                </Text>
                <Text style={{ color: getStatusColor(n.income.status), marginTop: 2 }}>
                  Status: {getStatusText(n.income.status)} | Seen: {n.seen ? "Yes" : "No"}
                </Text>
              </>
            ) : (
              <Text style={{ color: "#dc2626" }}>Related income record not found.</Text>
            )}

            <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
              {new Date(n.created_at).toLocaleString()}
            </Text>

            <TouchableOpacity
              onPress={() => handleView(n.id)}
              style={{
                marginTop: 8,
                backgroundColor: "#4f46e5",
                paddingVertical: 6,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>View Details</Text>
            </TouchableOpacity>

            {/* Detail Panel */}
            {selectedId === n.id && selectedDetail && (
              <View style={{ marginTop: 10 }}>
                <Text><Text style={{ fontWeight: "bold" }}>Message:</Text> {selectedDetail.message}</Text>
                {selectedDetail.income ? (
                  <>
                    <Text><Text style={{ fontWeight: "bold" }}>Income ID:</Text> {selectedDetail.income.id}</Text>
                    <Text><Text style={{ fontWeight: "bold" }}>Seen:</Text> {selectedDetail.seen ? "Yes" : "No"}</Text>
                    <Text>
                      <Text style={{ fontWeight: "bold" }}>Status:</Text>{" "}
                      {getStatusText(selectedDetail.income.status)}
                    </Text>

                    {selectedDetail.income.payment_proof && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(selectedDetail.income.payment_proof)}
                      >
                        <Text style={{ color: "#2563eb", textDecorationLine: "underline", marginTop: 4 }}>
                          View Payment Proof
                        </Text>
                      </TouchableOpacity>
                    )}

                    {selectedDetail.income.status === "pending" && (
                      <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }}>
                        <Button title="Verify" color="#16a34a" onPress={() => handleAction("verify")} />
                        <Button title="Reject" color="#dc2626" onPress={() => handleAction("reject")} />
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={{ color: "#dc2626" }}>Income not found.</Text>
                )}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default NotificationPage;
