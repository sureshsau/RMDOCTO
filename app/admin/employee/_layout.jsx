import { Stack } from "expo-router";

export default function MedicineLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#6b6dbf",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "700",
        },
      }}
    >
      {/* INDEX */}
      <Stack.Screen
        name="add"
        options={{
          title: "Add User",
        }}
      />

      {/* EMPLOYEE INNER PAGES */}
      <Stack.Screen
        name="[id]/attendance"
        options={{
          title: "Attendance Setup",
        }}
      />
      <Stack.Screen
        name="[id]/attendanceLog"
        options={{
          title: "Attendance Log",
        }}
      />
      <Stack.Screen
        name="[id]/face-capture"
        options={{
          title: "Face Capture",
        }}
      />
      <Stack.Screen
        name="[id]/profile"
        options={{
          title: "Employee Profile",
        }}
      />
      <Stack.Screen
        name="[id]/rmcredit/index"
        options={{
          title: "RM Credit",
        }}
      />
    </Stack>
  );
}
