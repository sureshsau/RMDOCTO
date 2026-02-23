import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        /* ===== TAB COLORS ===== */
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#d6d7f2",

        /* ===== TAB BAR STYLE ===== */
        tabBarStyle: {
          backgroundColor: "#6b6dbf",
          borderTopWidth: 0,
          height: 64,
          paddingTop: 6,
        },

        /* ===== LABEL STYLE ===== */
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 6,
        },
      }}
    >
      {/* ================= HOME ================= */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ================= USERS / EMPLOYEES ================= */}
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ================= STORE ================= */}
      <Tabs.Screen
        name="store"
        options={{
          title: "Store",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medkit-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ================= PROFILE ================= */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ================= HIDDEN ROUTES ================= */}
      <Tabs.Screen name="add-employee" options={{ href: null }} />
      <Tabs.Screen name="employee-details" options={{ href: null }} />
      <Tabs.Screen name="edit-employee" options={{ href: null }} />
      <Tabs.Screen name="create-payroll" options={{ href: null }} />
      <Tabs.Screen name="reports-analysis" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="assign-task" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
