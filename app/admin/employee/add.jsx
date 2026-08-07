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

/**
 * Mirrors ROLE_DASHBOARD_MAP in the backend's roleAssignments.service — the
 * server derives the dashboard from the role and ignores anything else we
 * send, so this is display only. Picking one by hand was just a way to get
 * the two out of sync (and to trip the "dashboard is required" error).
 */
const ROLE_DASHBOARD = {
  subadmin: "Admin Dashboard",
  doctor: "Doctor Dashboard",
  employee: "Employee Dashboard",
  agent: "RM Member Dashboard",
  marketing_agent: "Marketing Dashboard",
  receptionist: "Reception Dashboard",
  rmrider: "RM Rider Dashboard",
};

/* ================= MAIN ================= */

export default function AddEmployee() {
  const router = useRouter();
  const { fetchRoles } = useRBAC();
  const { createUser, loading } = useUser();

  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  // Both come from the role — shown so the admin can see what they're granting
  const dashboardLabel = role ? ROLE_DASHBOARD[role.key] || "User Dashboard" : null;
  const rolePermissions = role?.permissions || [];

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
      // The server refuses to assign the admin role, so offering it as a chip
      // only produces a "Create Failed" toast.
      setRoles((res.data || []).filter((r) => r.key !== "admin"));
    })();
  }, []);

  /* ================= ROLE SELECT ================= */

  const selectRole = (r) => setRole(r);

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !role) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Name, phone and role are required",
      });
      return;
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
      Toast.show({
        type: "error",
        text1: "Invalid phone",
        text2: "Enter exactly 10 digits",
      });
      return;
    }

    // Permissions and dashboard both come from the role on the server
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      roles: [role.key],
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

          {role && (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionTitle}>
                Granted automatically
              </Text>

              <View style={styles.grantRow}>
                <Text style={styles.grantLabel}>Dashboard</Text>
                <Text style={styles.grantValue}>{dashboardLabel}</Text>
              </View>

              <Text style={styles.grantLabel}>
                Permissions ({rolePermissions.length})
              </Text>

              {rolePermissions.length === 0 ? (
                <Text style={styles.dashboardNote}>
                  This role carries no extra permissions.
                </Text>
              ) : (
                <View style={styles.permTagWrap}>
                  {rolePermissions.map((p) => (
                    <Text key={p} style={styles.permTag}>
                      {p}
                    </Text>
                  ))}
                </View>
              )}

              <Text style={styles.dashboardNote}>
                The {role.name} role decides both. They apply as soon as the
                user is created.
              </Text>
            </View>
          )}

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
  permissionTitle: { fontWeight: "800", marginBottom: 12 },

  grantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  grantLabel: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  grantValue: { fontSize: 13, fontWeight: "800", color: "#6b6dbf" },

  permTagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  permTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6b6dbf",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
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
