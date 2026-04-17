import { Stack, usePathname } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { AppointmentProvider } from "../context/AppointmentContext";
import { AuthProvider } from "../context/AuthContext";
import { MedicineCartProvider } from "../context/MedicineCartContext";
import { MedicineProvider } from "../context/MedicineContext";
import { RBACProvider } from "../context/RABACContext";
import { RMCreditProvider } from "../context/RMCreditContext";
import { UserProvider } from "../context/UserContext";

import { toastConfig } from "../utils/toastConfig";

export default function RootLayout() {
  const pathname = usePathname();
  let bottomColor = "#ffffff";
  if (pathname?.startsWith("/admin")) bottomColor = "#6b6dbf";
  else if (pathname?.startsWith("/receptionist")) bottomColor = "#1BA6A6";
  else if (
    pathname?.startsWith("/agent") || 
    pathname?.startsWith("/doctor") || 
    pathname?.startsWith("/employee") || 
    pathname?.startsWith("/marketing_agent") || 
    pathname?.startsWith("/rmrider")
  ) {
    bottomColor = "#14b8a6";
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: bottomColor }} edges={['bottom']}>
        <AuthProvider>
          <UserProvider>
            <RBACProvider>
              <MedicineProvider>
                <MedicineCartProvider>
                  <RMCreditProvider>
                    <AppointmentProvider>

                      {/* 🔥 ALL NAVIGATION MUST BE INSIDE PROVIDERS */}
                      <Stack screenOptions={{ headerShown: false }} />

                      <StatusBar barStyle="dark-content" />
                      <Toast
                        config={toastConfig}
                        position="bottom"
                        bottomOffset={70}
                      />

                    </AppointmentProvider>
                  </RMCreditProvider>
                </MedicineCartProvider>
              </MedicineProvider>
            </RBACProvider>
          </UserProvider>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}