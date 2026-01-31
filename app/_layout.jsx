import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import Toast from "react-native-toast-message";
import { AuthProvider } from "../context/AuthContext";
import { toastConfig } from "../utils/toastConfig";


export default function RootLayout() {
  return (

      <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <Toast config={toastConfig} position="bottom" bottomOffset={70} />
    </AuthProvider>
    
  );
}
