import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import Toast from "react-native-toast-message";
import { AuthProvider } from "../context/AuthContext";
import { MedicineProvider } from "../context/MedicineContext";
import { RBACProvider } from '../context/RABACContext';
import { toastConfig } from "../utils/toastConfig";

export default function RootLayout() {
  return (

      <AuthProvider>
        <RBACProvider>
          <MedicineProvider>
                <Stack screenOptions={{ headerShown: false }} />
           <StatusBar barStyle="dark-content" />
           <Toast config={toastConfig} position="bottom" bottomOffset={70} />
          </MedicineProvider>
            
        </RBACProvider>
      
    </AuthProvider>
    
  );
}
