import { Stack } from "expo-router";

export default function _layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#6b6dbf",
        },
        headerTintColor: "#ffffff", // back arrow + title color
        headerTitleStyle: {
          fontWeight: "700",
        },
      }}
    >
      {/* TABS (NO HEADER) */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      {/* ROLES */}
      <Stack.Screen
        name="roles"
        options={{
          title: "Roles",
          headerShown: false,
        }}
      />

      {/* MEDICINE */}
      <Stack.Screen
        name="medicine"
        options={{
          title: "Medicines",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="employee"
        options={{
          headerShown: false,
        }}
      />

      {/* OTHER ADMIN SCREENS */}
      <Stack.Screen
        name="addpatient"
        options={{
          title: "Add Patient",
        }}
      />
      <Stack.Screen
        name="appointments"
        options={{
          title: "Appointments",
        }}
      />
      <Stack.Screen
        name="rmcoin/index"
        options={{
          title: "RM Coin",
        }}
      />

    </Stack>
  );
}
