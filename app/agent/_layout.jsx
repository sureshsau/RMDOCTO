import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { RMCreditProvider } from "../../context/RMCreditContext";

const PRIMARY = "#14b8a6";

export default function MedicineLayout() {
  return (
    <RMCreditProvider>

      {/* 🔥 STATUS BAR COLOR */}
      <StatusBar
        style="light"
        backgroundColor={PRIMARY}
        translucent={false}
      />

      {/* 🔥 SAFE AREA HEADER BACKGROUND FIX */}
      <View style={{ flex: 1, backgroundColor: PRIMARY }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: PRIMARY,
            },

            headerTintColor: "#ffffff",

            headerTitleStyle: {
              fontWeight: "700",
            },

            headerShadowVisible: false,
          }}
        >
          {/* TABS */}
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          {/* MEDICINE LIST */}
          <Stack.Screen
            name="medicine-list"
            options={{
              title: "Medicine List",
            }}
          />

          {/* DETAILS */}
          <Stack.Screen
            name="details"
            options={{
              title: "Medicine Details",
            }}
          />

          {/* UPLOAD */}
          <Stack.Screen
            name="upload"
            options={{
              title: "Add Medicine",
            }}
          />
        </Stack>
      </View>
    </RMCreditProvider>
  );
}