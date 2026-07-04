import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { TouchableOpacity } from "react-native";

const PRIMARY = "#14b8a6";

export default function Layout() {
  return (
    <Stack
      initialRouteName="login"
      screenOptions={{
        headerStyle: {
          backgroundColor: PRIMARY,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        headerLeft: ({ canGoBack, tintColor }) =>
          canGoBack ? (
            <TouchableOpacity style={{ marginLeft: 12 }} onPress={()=>router.back()}>
              <Ionicons
                name="chevron-back"
                size={28}
                color={tintColor}
              />
            </TouchableOpacity>
          ) : null,
      }}
    >
      {/* Register → NO header */}
      {/* <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      /> */}

      {/* Verify OTP */}
      {/* <Stack.Screen
        name="VerifyOtp"
        options={{
          title: "Verify OTP",
        }}
      /> */}

      {/* Login */}
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
