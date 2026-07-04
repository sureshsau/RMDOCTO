import { Ionicons } from "@expo/vector-icons";
import { Tabs, Redirect } from "expo-router";
import { useAuth } from "../../../context/AuthContext";

const PRIMARY = "#14b8a6";

export default function RiderTabsLayout() {
  const { user } = useAuth();

  if (user && user.kycStatus !== "verified") {
    return <Redirect href="/rmrider/kyc" />;
  }

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      sceneContainerStyle={{ backgroundColor: "#ffffff" }}
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.7)",

        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopWidth: 0,
          borderTopColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: PRIMARY,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >

      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />

      {/* ATTENDANCE */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color }) => (
            <Ionicons name="finger-print-outline" size={22} color={color} />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={22} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}