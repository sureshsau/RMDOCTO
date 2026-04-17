import { Stack } from 'expo-router'

const _layout = () => {
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[orderId]"
        options={{
          title: "Order Details",
        }}
      />
      <Stack.Screen
        name="track"
        options={{
          title: "Track Order",
        }}
      />
      <Stack.Screen
        name="user-orders"
        options={{
          title: "Order History",
          headerStyle: { backgroundColor: "#6b6dbf" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
    </Stack>
  )
}

export default _layout