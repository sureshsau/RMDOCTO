import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddEmployee() {
  const router = useRouter();

  const [role, setRole] = useState(null);
  const [showPermission, setShowPermission] = useState(false);

  const [permissions, setPermissions] = useState({
    viewPatients: false,
    editPatients: false,
    prescribeMedicine: false,
    viewReports: false,
    manageStaff: false,
  });

  const togglePermission = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* BASIC INFO */}
          <Section title="Basic Information" />

          <Input label="Full Name" placeholder="Enter employee name" />
          <Input label="Email Address" placeholder="example@email.com" />
          <Input label="Phone Number" placeholder="+91 XXXXX XXXXX" />


          {/* ROLE */}
          <Section title="Role & Department" />

          <View style={styles.roleWrap}>
            {["Doctor", "Nurse", "Reception", "Admin"].map((r) => (
              <RoleChip
                key={r}
                label={r}
                selected={role === r}
                onPress={() => {
                  setRole(r);
                  setShowPermission(true);
                }}
              />
            ))}
          </View>

          {/* PERMISSIONS DROPDOWN */}
          {showPermission && (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionTitle}>
                {role} Permissions
              </Text>

              <PermissionItem
                label="View Patients"
                value={permissions.viewPatients}
                onToggle={() => togglePermission("viewPatients")}
              />
              <PermissionItem
                label="Edit Patients"
                value={permissions.editPatients}
                onToggle={() => togglePermission("editPatients")}
              />
              <PermissionItem
                label="Prescribe Medicine"
                value={permissions.prescribeMedicine}
                onToggle={() => togglePermission("prescribeMedicine")}
              />
              <PermissionItem
                label="View Reports"
                value={permissions.viewReports}
                onToggle={() => togglePermission("viewReports")}
              />

              {role === "Admin" && (
                <PermissionItem
                  label="Manage Staff"
                  value={permissions.manageStaff}
                  onToggle={() => togglePermission("manageStaff")}
                />
              )}
            </View>
          )}

         

          {/* SAVE */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => alert("Employee Added Successfully")}
          >
            <Text style={styles.saveText}>Save Employee</Text>
            <Text style={styles.saveSub}>
              Added to RMDoctor system
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionText}>{title}</Text>
    </View>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

function RoleChip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.roleChip,
        selected && styles.roleChipActive,
      ]}
    >
      <Text
        style={[
          styles.roleText,
          selected && { color: "#fff" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PermissionItem({ label, value, onToggle }) {
  return (
    <TouchableOpacity
      style={styles.permissionRow}
      onPress={onToggle}
    >
      <Text style={styles.permissionLabel}>{label}</Text>
      <View
        style={[
          styles.switch,
          value && styles.switchActive,
        ]}
      >
        <View
          style={[
            styles.knob,
            value && { alignSelf: "flex-end" },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef0fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 12,
  },
  content: {
    padding: 24,
    paddingBottom: 80,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16,
  },
  sectionBar: {
    width: 6,
    height: 22,
    backgroundColor: "#6b6dbf",
    borderRadius: 4,
    marginRight: 10,
  },
  sectionText: {
    fontWeight: "800",
    fontSize: 13,
    textTransform: "uppercase",
  },
  inputWrap: {
    marginBottom: 16,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#334155",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
  },
  roleWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e6e7f5",
    borderWidth: 1,
    borderColor: "#d5d7f0",
  },
  roleChipActive: {
    backgroundColor: "#6b6dbf",
  },
  roleText: {
    fontWeight: "600",
    color: "#6b6dbf",
  },
  permissionBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  permissionTitle: {
    fontWeight: "800",
    marginBottom: 10,
  },
  permissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  permissionLabel: {
    fontWeight: "600",
    color: "#334155",
  },
  switch: {
    width: 42,
    height: 22,
    backgroundColor: "#cbd5e1",
    borderRadius: 20,
    padding: 3,
  },
  switchActive: {
    backgroundColor: "#6b6dbf",
  },
  knob: {
    width: 16,
    height: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  saveBtn: {
    backgroundColor: "#6b6dbf",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  saveSub: {
    color: "#e0e7ff",
    fontSize: 12,
    marginTop: 4,
  },
});