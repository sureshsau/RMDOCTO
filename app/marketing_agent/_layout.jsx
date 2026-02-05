import { Stack } from "expo-router";
import { MedicineCartProvider } from "../../context/MedicineCartContext";

export default function MedicineLayout() {
  return (
    <MedicineCartProvider>
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
        name="(tabs)"
        options={{
          headerShown:false
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
    </MedicineCartProvider>

  );
}
