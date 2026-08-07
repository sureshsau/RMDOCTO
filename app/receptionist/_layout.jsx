import { Stack } from 'expo-router'

const _layout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="medicine" options={{ headerShown: false }} />
      <Stack.Screen name="create-order" options={{ title: "New Order" }} />
      <Stack.Screen name="appointments" options={{ title: "Appointments" }} />
    </Stack>
  )
}
export default _layout