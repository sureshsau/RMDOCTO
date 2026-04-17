import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const PRIMARY = "#14b8a6";

export default function EmployeeTabs() {
  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      sceneContainerStyle={{ backgroundColor: "#ffffff" }}
      screenOptions={({ route }) => ({
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

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case "index":
              iconName = focused ? "home" : "home-outline";
              break;
            case "attendance":
              iconName = focused ? "time" : "time-outline";
              break;
            case "profile":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      {/* HOME */}
      <Tabs.Screen name="index" options={{ title: "Home" }} />

      {/* ATTENDANCE */}
      <Tabs.Screen name="attendance" options={{ title: "Attendance" }} />

      {/* PROFILE */}
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
