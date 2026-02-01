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
      {/* ================= DASHBOARD ================= */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ================= EMPLOYEES ================= */}
      <Tabs.Screen
        name="employees"
        options={{
          title: "Employees",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ================= ATTENDANCE ================= */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ================= TASKS ================= */}
      <Tabs.Screen
        name="assign-task"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ================= SETTINGS ================= */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
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
    </Tabs>
  );
}
