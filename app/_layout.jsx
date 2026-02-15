import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import Toast from "react-native-toast-message";
import { AppointmentProvider } from "../context/AppointmentContext";
import { AuthProvider } from "../context/AuthContext";
import { MedicineCartProvider } from "../context/MedicineCartContext";
import { MedicineProvider } from "../context/MedicineContext";
import { RBACProvider } from '../context/RABACContext';
import { UserProvider } from "../context/UserContext";
import { toastConfig } from "../utils/toastConfig";

export default function RootLayout() {
  return (

      <AuthProvider>
        <UserProvider>
          <RBACProvider>
          <MedicineProvider>
               
          <MedicineCartProvider>

      
            <AppointmentProvider>
            <Stack screenOptions={{ headerShown: false }} />
            </AppointmentProvider>
                
           <StatusBar barStyle="dark-content" />
           <Toast config={toastConfig} position="bottom" bottomOffset={70} />
           </MedicineCartProvider>
          </MedicineProvider>
            
        </RBACProvider>

        </UserProvider>
        
      
    </AuthProvider>
    
  );
}
