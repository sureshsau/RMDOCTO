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
        name="add"
        options={{
          title: "Add User",
        }}
      />
    </Stack>
  );
}
