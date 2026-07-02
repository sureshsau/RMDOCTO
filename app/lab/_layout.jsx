import { Stack } from "expo-router";

export default function LabLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#6b6dbf" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index"        options={{ title: "Book a Lab Test" }} />
      <Stack.Screen name="[labId]"      options={{ title: "Lab Details" }} />
      <Stack.Screen name="book"         options={{ title: "Book Tests" }} />
      <Stack.Screen name="my-orders"    options={{ title: "My Lab Orders" }} />
      <Stack.Screen name="order-detail" options={{ title: "Order Details" }} />
    </Stack>
  );
}
