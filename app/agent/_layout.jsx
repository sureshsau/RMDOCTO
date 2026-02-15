import { Stack } from "expo-router";
import { RMCreditProvider } from "../../context/RMCreditContext";

export default function MedicineLayout() {
  return (
    <RMCreditProvider>

     
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


    </RMCreditProvider>

  );
}
