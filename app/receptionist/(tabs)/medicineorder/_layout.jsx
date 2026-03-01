import { Stack } from 'expo-router'

const _layout = () => {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='[orderId]' options={{ headerShown: true, title: "Order Details" }} />
    </Stack>
  )
}

export default _layout