import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { RMCreditProvider } from "../../context/RMCreditContext";

const PRIMARY = "#14b8a6";

export default function AgentLayout() {
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

          {/* REGISTER AGENT */}
          <Stack.Screen
            name="register"
            options={{
              title: "Register Agent",
            }}
          />

          {/* RM CREDIT */}
          <Stack.Screen
            name="rmcredit"
            options={{
              title: "RM Credit",
            }}
          />
        </Stack>
      </View>
    </RMCreditProvider>
  );
}