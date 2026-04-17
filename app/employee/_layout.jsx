import { Stack } from 'expo-router';
import { View } from "react-native";
import { useAuth } from "../../context/AuthContext";

const PRIMARY = "#14b8a6";

export default function EmployeeLayout() {
  const { user } = useAuth();

  if (!user) return <View style={{ flex: 1, backgroundColor: "#fff" }} />;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="face-verification" 
        options={{ headerShown: false, presentation: "modal" }} 
      />
    </Stack>
  );
}
