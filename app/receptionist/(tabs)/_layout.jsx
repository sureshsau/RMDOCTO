import { Ionicons } from "@expo/vector-icons";
import { Tabs, Redirect } from "expo-router";
import { useAuth } from "../../../context/AuthContext";

export default function ReceptionistTabs() {
  const { user } = useAuth();

  if (user && user.kycStatus !== "verified") {
    return <Redirect href="/receptionist/kyc" />;
  }

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
          backgroundColor: "#1BA6A6",
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