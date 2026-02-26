import { Stack } from "expo-router";

const PRIMARY = "#14b8a6";

export default function RiderRootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: PRIMARY,
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "700",
        },
      }}
    >

      {/* TABS */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      {/* MEDICINE ORDERS */}
      <Stack.Screen
        name="medicine/order/index"
        options={{
          title: "Medicine Orders",
        }}
      />

      {/* TRACK ORDER */}
      <Stack.Screen
        name="medicine/order/track"
        options={{
          title: "Track Order",
        }}
      />

      {/* FACE ATTENDANCE */}
      <Stack.Screen
        name="face-verification"
        options={{
          title: "Check-In Attendance",
        }}
      />

    </Stack>
  );
}