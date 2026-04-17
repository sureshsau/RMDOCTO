import { Stack } from "expo-router";

export default function RMCreditLayout() {
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
      <Stack.Screen
        name="index"
        options={{
          title: "RM Credit History",
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: "Credit Details",
        }}
      />
    </Stack>
  );
}
