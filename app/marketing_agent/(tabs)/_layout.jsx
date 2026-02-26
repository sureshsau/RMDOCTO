import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#14b8a6",
        tabBarInactiveTintColor: "#94a3b8",

        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopWidth: 0.5,
          borderTopColor: "#e5e7eb",
          backgroundColor: "#ffffff",
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },

        /* ===== ICON LOGIC ===== */

        tabBarIcon: ({ focused, color }) => {

          let iconName;

          switch (route.name) {

            case "index":
              iconName = focused
                ? "home"
                : "home-outline";
              break;

            case "network":
              iconName = focused
                ? "git-network"
                : "git-network-outline";
              break;

            case "attendance":
              iconName = focused
                ? "calendar"
                : "calendar-outline";
              break;

            case "profile":
              iconName = focused
                ? "person"
                : "person-outline";
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

      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{ title: "Home" }}
      />

      {/* MY NETWORK */}
      <Tabs.Screen
        name="network"
        options={{ title: "My Network" }}
      />

      {/* ATTENDANCE */}
      <Tabs.Screen
        name="attendance"
        options={{ title: "Attendance" }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />

    </Tabs>
  );
}