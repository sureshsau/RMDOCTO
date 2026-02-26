import { Stack } from 'expo-router'
import { Component } from 'react'

export class _layout extends Component {
  render() {
    return (
      <Stack
      screenOptions={{
        headerShown:false
      }}
      initialRouteName='index'
      >
        <Stack.Screen name='index'/>
      </Stack>
    )
  }
}

export default _layout