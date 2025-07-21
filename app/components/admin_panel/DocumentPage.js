import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
// import { API_BASE_URL } from "../../api"; // Update path as needed
import { API_BASE_URL } from "@/app/user_utils/api";
const DocumentPage = ({ authHeader }) => {
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/documents/`, authHeader);
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load documents.");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });

      if (result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        setFile({
          uri: pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.mimeType || "application/octet-stream",
        });
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to pick file.");
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      Alert.alert("Please provide a title and select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    });

    try {
      await axios.post(`${API_BASE_URL}/api/documents/`, formData, {
        ...authHeader,
        headers: {
          ...authHeader.headers,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("✅ Document uploaded.");
      setTitle("");
      setFile(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed. (Admins only)");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Confirm Delete", "Delete this document?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/api/documents/${id}/`, authHeader);
            setDocuments((prev) => prev.filter((doc) => doc.id !== id));
            setMessage("🗑️ Deleted successfully.");
          } catch (err) {
            console.error(err);
            setMessage("❌ Delete failed. (Admins only)");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>📄 Society Documents</Text>
      <Text style={{ color: "#6b7280", marginBottom: 12 }}>View and manage society-related documents.</Text>

      <View style={{ backgroundColor: "#f3f4f6", padding: 12, borderRadius: 8, marginBottom: 20 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 6 }}>📤 Upload New Document</Text>
        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 8,
            borderRadius: 6,
            marginBottom: 10,
          }}
        />

        <Button title={file ? `Selected: ${file.name}` : "Select File"} onPress={pickDocument} />

        <View style={{ marginTop: 10 }}>
          <Button title="Upload" color="#2563eb" onPress={handleUpload} />
        </View>
      </View>

      {documents.length === 0 ? (
        <Text style={{ color: "#6b7280" }}>No documents found.</Text>
      ) : (
        documents.map((doc) => (
          <View
            key={doc.id}
            style={{
              backgroundColor: "#ffffff",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ fontWeight: "600" }}>{doc.title}</Text>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>
              Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
            </Text>

            <TouchableOpacity
              onPress={() => Linking.openURL(doc.file)}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: "#2563eb", textDecorationLine: "underline" }}>View Document</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(doc.id)}
              style={{
                marginTop: 8,
                backgroundColor: "#ef4444",
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 4,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {message ? <Text style={{ marginTop: 20, color: "#2563eb" }}>{message}</Text> : null}
    </ScrollView>
  );
};

export default DocumentPage;
