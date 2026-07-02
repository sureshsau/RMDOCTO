import { Stack } from "expo-router";

export default function LabAdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#6b6dbf" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index"           options={{ title: "Lab Management" }} />
      <Stack.Screen name="labs-list"       options={{ title: "All Labs" }} />
      <Stack.Screen name="add-lab"         options={{ title: "Add Lab" }} />
      <Stack.Screen name="tests-list"      options={{ title: "Lab Tests" }} />
      <Stack.Screen name="add-test"        options={{ title: "Add Lab Test" }} />
      <Stack.Screen name="lab-orders"      options={{ title: "Lab Orders" }} />
      <Stack.Screen name="lab-order-detail" options={{ title: "Order Detail" }} />
    </Stack>
  );
}
