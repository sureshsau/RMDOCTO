import { Stack } from "expo-router";

const PRIMARY = "#14b8a6";

export default function UserRootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: PRIMARY,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 16,
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerShown:false
      }}
    >

      {/* ================= TABS ================= */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      {/* ================= PROFILE ================= */}
      <Stack.Screen
        name="profile"
        options={{
          title: "My Profile",
        }}
      />

      {/* ================= MEDICINE STORE ================= */}
      <Stack.Screen
        name="medicine-store"
        options={{
          title: "Medicine Store",
        }}
      />

      {/* ================= MY ORDERS ================= */}
      <Stack.Screen
        name="mymedicineorder"
        options={{
          title: "My Orders",
        }}
      />

      {/* ================= RM COINS ================= */}
      <Stack.Screen
        name="rmcoin"
        options={{
          title: "RM Coins",
        }}
      />

    </Stack>
  );
}