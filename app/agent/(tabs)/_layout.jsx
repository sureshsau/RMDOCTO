import { Ionicons } from "@expo/vector-icons";
import { Tabs, Redirect } from "expo-router";
import { useAuth } from "../../../context/AuthContext";

const PRIMARY = "#14b8a6";

/* The root layout (app/_layout.jsx) already wraps the app in a bottom-edge
   SafeAreaView and paints that strip teal, so the bar must NOT add the inset
   again — hence the fixed height and safeAreaInsets={{ bottom: 0 }} below. */
const BAR_H = 62;
const BAR_PAD_BOTTOM = 8;

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

        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: false,

        tabBarStyle: {
          height: BAR_H,
          paddingTop: 8,
          paddingBottom: BAR_PAD_BOTTOM,
          borderTopWidth: 0,
          borderTopColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: PRIMARY,
        },

        tabBarItemStyle: {
          paddingVertical: 0,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
          includeFontPadding: false,
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