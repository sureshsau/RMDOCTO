import { Stack } from 'expo-router'

const _layout = () => {
  return (
    <Stack
      screenOptions={{
      }}
    >
        <Stack.Screen name='index' options={{headerShown:false}}/>
    </Stack>
  )
}

export default _layout