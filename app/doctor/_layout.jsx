import { Stack } from "expo-router";
import { StatusBar } from "react-native";

const PRIMARY = "#14b8a6";

export default function Layout() {
  return (
    <>
      {/* STATUS BAR COLOR */}
      <StatusBar
        backgroundColor={PRIMARY}
        barStyle="light-content"
      />

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
          headerTitleAlign: "center",
        }}
      >

        {/* TABS */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        {/* APPOINTMENTS */}
        <Stack.Screen
          name="appointments"
          options={{ title: "Appointments" }}
        />

      </Stack>
    </>
  );
}