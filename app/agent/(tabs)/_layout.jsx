import { Ionicons } from "@expo/vector-icons";
import { Tabs, Redirect } from "expo-router";
import { useAuth } from "../../../context/AuthContext";

export default function TabsLayout() {
  const { user } = useAuth();

  if (user && user.kycStatus !== "verified") {
    return <Redirect href="/agent/kyc" />;
  }

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      sceneContainerStyle={{ backgroundColor: "#ffffff" }}
      screenOptions={({ route }) => ({
        headerShown: false,

        /* 🎨 COLORS */
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
          backgroundColor: "#14b8a6",
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },

        /* 🔥 ICON LOGIC */
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          switch (route.name) {

            /* ===== HOME ===== */
            case "index":
              iconName = focused
                ? "home"
                : "home-outline";
              break;

            /* ===== NETWORK (AGENT TEAM) ===== */
            case "network":
              iconName = focused
                ? "people"
                : "people-outline";
              break;

            /* ===== PROFILE ===== */
            case "profile":
              iconName = focused
                ? "person-circle"
                : "person-circle-outline";
              break;

            default:
              iconName = "ellipse-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      {/* ===== HOME ===== */}
      <Tabs.Screen
        name="index"
        options={{ title: "Home" }}
      />

      {/* ===== NETWORK ===== */}
      <Tabs.Screen
        name="network"
        options={{ title: "Network" }}
      />

      {/* ===== PROFILE ===== */}
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />

    </Tabs>
  );
}