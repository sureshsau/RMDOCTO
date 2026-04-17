import { Stack } from "expo-router";

export default function OrdersStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#6b6dbf" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen
        name="user-orders"
        options={{ title: "Order History" }}
      />
      <Stack.Screen
        name="[orderId]"
        options={{ title: "Order Details" }}
      />
    </Stack>
  );
}
