import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/auth/login" />;

   if (user.dashboard === "admin" || user.dashboard === "subadmin" ) return <Redirect href="/admin" />;

//   if (user.role === "doctor") return <Redirect href="/doctor" />;

  return <Redirect href="/auth/login" />;
}
