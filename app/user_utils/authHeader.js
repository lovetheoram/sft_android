// user_utils/authHeader.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem("access_token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

export default function AuthHeaderRouteGuard() {
  return null;
}
