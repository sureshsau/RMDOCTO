import { Stack } from 'expo-router'

const _layout = () => {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1BA6A6",
          elevation: 4,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
        },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "RM Coins" }}
      />
    </Stack>
  )
}

export default _layout