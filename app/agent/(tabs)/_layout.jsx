import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,

        // 🎨 COLORS
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

        // 🔥 ICON LOGIC
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case "index":
              iconName = focused
                ? "home"
                : "home-outline";
              break;

            case "medicine":
              iconName = focused
                ? "medkit"
                : "medkit-outline";
              break;

            case "store":
              iconName = focused
                ? "storefront"
                : "storefront-outline";
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

      {/* MEDICINE */}
      <Tabs.Screen
        name="medicine"
        options={{ title: "Medicines" }}
      />

      {/* STORE - Global Medicine Store */}
      <Tabs.Screen
        name="store"
        options={{ title: "Store" }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
    </Tabs>
  );
}
