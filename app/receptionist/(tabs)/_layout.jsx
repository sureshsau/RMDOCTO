import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function ReceptionistTabs() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#1BA6A6",
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

        /* ===== ICON SWITCH ===== */
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {

            /* HOME */
            case "index":
              iconName = focused
                ? "home"
                : "home-outline";
              break;

            /* ATTENDANCE */
            case "attendance":
              iconName = focused
                ? "time"
                : "time-outline";
              break;

            /* MEDICINE ORDERS */
            case "medicineorder":
              iconName = focused
                ? "medkit"
                : "medkit-outline";
              break;

            /* PROFILE */
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

      {/* ATTENDANCE */}
      <Tabs.Screen
        name="attendance"
        options={{ title: "Attendance" }}
      />

      {/* MEDICINE ORDERS */}
      <Tabs.Screen
        name="medicineorder"
        options={{ title: "Orders" }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />

    </Tabs>
  );
}