import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import Toast from "react-native-toast-message";

import { useRBAC } from "../../../context/RABACContext";
import { useUser } from "../../../context/UserContext";

/* ================= CONSTANTS ================= */

const DASHBOARDS = [
  { key: "admin", label: "Admin Dashboard" },
  { key: "doctor", label: "Doctor Dashboard" },
  { key: "employee", label: "Employee Dashboard" },
  { key: "marketing_agent", label: "Marketing Dashboard" },
  { key: "agent", label: "Agent Dashboard" },
  { key: "receptionist", label: "Reception Dashboard" },
  { key: "rmrider", label: "rmrider Dashboard" },
];

/* ================= MAIN ================= */

export default function AddEmployee() {
  const router = useRouter();
  const { fetchRoles } = useRBAC();
  const { createUser, loading } = useUser();

  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState(null);
  const [showPermission, setShowPermission] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const [permissions, setPermissions] = useState({});

  /* ================= LOAD ROLES ================= */

  useEffect(() => {
    (async () => {
      const res = await fetchRoles();
      if (!res.success) {
        Toast.show({
          type: "error",
          text1: "Failed to load roles",
          text2: res.error,
        });
        return;
      }
      setRoles(res.data);
    })();
  }, []);

  /* ================= ROLE SELECT ================= */

  const selectRole = (r) => {
    setRole(r);
    setShowPermission(true);

    const map = {};
    r.permissions.forEach((p) => (map[p] = true));
    setPermissions(map);

    if (!dashboard) {
      setDashboard(r.key);
    }
  };

  const togglePermission = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!form.name || !form.phone || !role || !dashboard) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Name, phone, role and dashboard are required",
      });
      return;
    }

    const payload = {
      name: form.name,
      phone: form.phone,
      roles: [role.key],
      permissions: Object.keys(permissions).filter(
        (p) => permissions[p]
      ),
      dashboard,
      isActive: true,
    };

    const res = await createUser(payload);

    if (!res.success) {
      Toast.show({
        type: "error",
        text1: "Create Failed",
        text2: res.error,
      });
      return;
    }

    Toast.show({
      type: "success",
      text1: "Employee Added",
      text2: "User created successfully",
    });

    router.back();
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* BASIC INFO */}
          <Section title="Basic Information" />

          <Input
            label="Full Name"
            value={form.name}
            onChangeText={(v) =>
              setForm((p) => ({ ...p, name: v }))
            }
          />

          <Input
            label="Phone Number"
            value={form.phone}
            keyboardType="phone-pad"
            onChangeText={(v) =>
              setForm((p) => ({ ...p, phone: v }))
            }
          />

          {/* ROLE */}
          <Section title="Role & Permissions" />

          <View style={styles.roleWrap}>
            {roles.map((r) => (
              <RoleChip
                key={r._id}
                label={r.name}
                selected={role?.key === r.key}
                onPress={() => selectRole(r)}
              />
            ))}
          </View>

          {showPermission && role && (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionTitle}>
                {role.name} Permissions
              </Text>

              {role.permissions.map((p) => (
                <PermissionItem
                  key={p}
                  label={p}
                  value={permissions[p]}
                  onToggle={() => togglePermission(p)}
                />
              ))}
            </View>
          )}

          {/* DASHBOARD */}
          <Section title="Dashboard Access" />

          <View style={styles.roleWrap}>
            {DASHBOARDS.map((d) => (
              <RoleChip
                key={d.key}
                label={d.label}
                selected={dashboard === d.key}
                onPress={() => setDashboard(d.key)}
              />
            ))}
          </View>

          <Text style={styles.dashboardNote}>
            This decides which dashboard UI the user can access
          </Text>

          {/* SAVE */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveText}>
              {loading ? "Saving..." : "Save Employee"}
            </Text>
            <Text style={styles.saveSub}>
              Added to RMDoctor system
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  container: { flex: 1, backgroundColor: "#eef0fa" },
  content: { padding: 24, paddingBottom: 80 },

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

  inputWrap: { marginBottom: 16 },
  label: { fontWeight: "600", marginBottom: 6, color: "#334155" },
  input: {
    color: "#343a44",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
  },

  roleWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e6e7f5",
    borderWidth: 1,
    borderColor: "#d5d7f0",
  },
  roleChipActive: { backgroundColor: "#6b6dbf" },
  roleText: { fontWeight: "600", color: "#6b6dbf" },

  permissionBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  permissionTitle: { fontWeight: "800", marginBottom: 10 },

  permissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  permissionLabel: { fontWeight: "600", color: "#334155" },

  switch: {
    width: 42,
    height: 22,
    backgroundColor: "#cbd5e1",
    borderRadius: 20,
    padding: 3,
  },
  switchActive: { backgroundColor: "#6b6dbf" },
  knob: {
    width: 16,
    height: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
  },

  dashboardNote: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 6,
    marginBottom: 16,
  },

  saveBtn: {
    backgroundColor: "#6b6dbf",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  saveSub: {
    color: "#e0e7ff",
    fontSize: 12,
    marginTop: 4,
  },
});
