import { Stack, usePathname } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { AppointmentProvider } from "../context/AppointmentContext";
import { AuthProvider } from "../context/AuthContext";
import { MedicineCartProvider } from "../context/MedicineCartContext";
import { MedicineProvider } from "../context/MedicineContext";
import { NotificationProvider } from "../context/NotificationContext";
import { RBACProvider } from "../context/RABACContext";
import { RMCreditProvider } from "../context/RMCreditContext";
import { UserProvider } from "../context/UserContext";

import { toastConfig } from "../utils/toastConfig";

const TEAL = "#14b8a6";

/* Colour of the bottom safe-area strip, by section. Order matters only for
   readability — the roots are mutually exclusive. */
const SECTION_COLORS = [
  ["/admin", "#6b6dbf"],
  ["/receptionist", "#1BA6A6"],
  ["/agent", TEAL],
  ["/doctor", TEAL],
  ["/employee", TEAL],
  ["/marketing_agent", TEAL],
  ["/rmrider", TEAL],
];

/* Match the section root itself as well as its children: a section's index tab
   has the bare path ("/agent"), so a `startsWith("/agent/")` test misses it and
   leaves a white strip under that one screen's tab bar. The trailing slash on
   the child test keeps neighbours like "/doctor-booking" out of "/doctor". */
const inSection = (path, root) => path === root || !!path?.startsWith(`${root}/`);

export default function RootLayout() {
  const pathname = usePathname();
  const bottomColor =
    SECTION_COLORS.find(([root]) => inSection(pathname, root))?.[1] || "#ffffff";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: bottomColor }} edges={['bottom']}>
        <AuthProvider>
          <UserProvider>
            <NotificationProvider>
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
            </NotificationProvider>
          </UserProvider>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}