import { Stack } from "expo-router";

export default function MedicineLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#6b6dbf",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "700",
        },
      }}
    >
      {/* INDEX */}
      <Stack.Screen
        name="index"
        options={{
          title: "All Roles",
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "Create Role",
        }}
      />
      <Stack.Screen
        name="assign"
        options={{
          title: "Assign Role",
        }}
      />


    </Stack>
  );
}
