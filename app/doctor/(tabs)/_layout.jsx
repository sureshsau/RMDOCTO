import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function Layout() {
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
          backgroundColor: "#14b8a6",
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },

        tabBarIcon: ({ focused, color }) => {
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
                ? "calendar"
                : "calendar-outline";
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

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />

    </Tabs>
  );
}