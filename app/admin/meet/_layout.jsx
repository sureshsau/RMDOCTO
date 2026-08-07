import { Stack } from "expo-router";

export default function MeetLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#14b8a6" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[agentProfileId]"
        options={{ title: "Track RM Member" }}
      />
    </Stack>
  );
}
