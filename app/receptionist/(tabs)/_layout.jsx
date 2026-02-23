import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function ReceptionistTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>

      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={22} color={color} />
          ),
        }}
      />

      {/* 👇 PUBLIC STORE TAB */}
      <Tabs.Screen
        name="medicine-store"
        options={{
          title: "Store",
          tabBarIcon: ({ color }) => (
            <Ionicons name="medkit" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={22} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
