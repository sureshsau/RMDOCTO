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
          title: "Medicines",
        }}
      />

      {/* MEDICINE LIST */}
      <Stack.Screen
        name="medicine-list"
        options={{
          title: "Medicine List",
        }}
      />

      {/* MEDICINE DETAILS */}
      <Stack.Screen
        name="details"
        options={{
          title: "Medicine Details",
        }}
      />

      {/* UPLOAD MEDICINE */}
      <Stack.Screen
        name="upload"
        options={{
          title: "Add Medicine",
        }}
      />
    </Stack>
  );
}
