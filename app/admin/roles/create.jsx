import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useRBAC } from "../../../context/RABACContext";

/* ================= CONSTANTS ================= */

const ROLE_KEYS = [
  "subadmin",
  "marketing_agent",
  "doctor",
  "agent",
  "receptionist",
  "rmrider"
];

/* ================= MAIN ================= */

export default function CreateRole() {
  const router = useRouter();
  const { fetchPermissions, createRole, loading } = useRBAC();

  const [permissionsTree, setPermissionsTree] = useState({});
  const [permissions, setPermissions] = useState({});
  const [roleKey, setRoleKey] = useState("");
  const [showRoles, setShowRoles] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadPermissions = async () => {
    const res = await fetchPermissions();
    if (!res.success) {
      Toast.show({ type: "error", text1: res.error });
      return;
    }

    setPermissionsTree(res.data);

    const map = {};
    Object.values(res.data).forEach((m) =>
      Object.keys(m.permissions).forEach((p) => (map[p] = false))
    );
    setPermissions(map);
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRoleKey("");
    setRoleName("");
    setDescription("");
    setPermissions({});
    await loadPermissions();
    setRefreshing(false);
  }, []);

  const togglePermission = (key) => {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    if (!roleKey || !roleName) {
      Toast.show({
        type: "error",
        text1: "Role key & name required",
      });
      return;
    }

    const selectedPermissions = Object.keys(permissions).filter(
      (p) => permissions[p]
    );

    const res = await createRole({
      key: roleKey,
      name: roleName,
      description,
      permissions: selectedPermissions,
    });

    if (!res.success) {
      Toast.show({ type: "error", text1: res.error });
      return;
    }

    Toast.show({
      type: "success",
      text1: "Role created successfully",
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6b6dbf"
            />
          }
        >
          {/* ROLE KEY */}
          <Section title="Role Key" />

          <TouchableOpacity
            style={styles.iosSelect}
            activeOpacity={0.85}
            onPress={() => setShowRoles(!showRoles)}
          >
            <Text
              style={[
                styles.iosSelectText,
                !roleKey && styles.placeholder,
              ]}
            >
              {roleKey || "Select role"}
            </Text>
          </TouchableOpacity>

          {showRoles && (
            <View style={styles.iosDropdown}>
              {ROLE_KEYS.map((key, index) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    setRoleKey(key);
                    setShowRoles(false);
                  }}
                  style={[
                    styles.iosItem,
                    roleKey === key && styles.iosItemActive,
                    index !== ROLE_KEYS.length - 1 &&
                      styles.iosDivider,
                  ]}
                >
                  <Text
                    style={[
                      styles.iosItemText,
                      roleKey === key &&
                        styles.iosItemTextActive,
                    ]}
                  >
                    {key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ROLE INFO */}
          <Section title="Role Information" />

          <Input
            label="Role Name"
            value={roleName}
            onChangeText={setRoleName}
            placeholder="Marketing Agent"
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ height: 90, textAlignVertical: "top" }}
            placeholder="Describe role responsibilities"
          />

          {/* PERMISSIONS */}
          <Section title="Permissions" />

          {Object.entries(permissionsTree).map(
            ([_, module]) => (
              <View key={module.label} style={styles.permissionBox}>
                <Text style={styles.permissionTitle}>
                  {module.label}
                </Text>

                {Object.entries(module.permissions).map(
                  ([perm, label]) => (
                    <PermissionItem
                      key={perm}
                      label={label}
                      value={!!permissions[perm]}
                      onToggle={() => togglePermission(perm)}
                    />
                  )
                )}
              </View>
            )
          )}

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveText}>
              {loading ? "Saving..." : "Save Role"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
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

function Input({ label, style, ...props }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, style]} {...props} />
    </View>
  );
}

function PermissionItem({ label, value, onToggle }) {
  return (
    <TouchableOpacity
      style={styles.permissionRow}
      onPress={onToggle}
    >
      <Text style={styles.permissionLabel}>{label}</Text>
      <View style={[styles.switch, value && styles.switchActive]}>
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
  content: { paddingHorizontal: 10 },

  section: {
    flexDirection: "row",
    alignItems: "center",
    marginTop:0,
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

  /* iOS SELECT */

  /* iOS SELECT (FLAT) */

iosSelect: {
  backgroundColor: "#fff",
  borderRadius: 18,
  paddingVertical: 16,
  paddingHorizontal: 18,
},

iosSelectText: {
  fontSize: 16,
  fontWeight: "600",
  color: "#0f172a",
},

placeholder: {
  color: "#94a3b8",
  fontWeight: "500",
},

iosDropdown: {
  marginTop: 10,
  backgroundColor: "#fff",
  borderRadius: 20,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#e5e7eb",
},

iosItem: {
  paddingVertical: 18,
  paddingHorizontal: 20,
},

iosItemActive: {
  backgroundColor: "#f1f5ff",
},

iosItemText: {
  fontSize: 16,
  fontWeight: "600",
  color: "#0f172a",
},

iosItemTextActive: {
  color: "#6b6dbf",
},

iosDivider: {
  borderBottomWidth: 1,
  borderColor: "#f1f5f9",
},

  /* INPUTS */

  inputWrap: { marginBottom: 16 },
  label: { fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
  },

  /* PERMISSIONS */

  permissionBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  permissionTitle: { fontWeight: "800", marginBottom: 10 },

  permissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  permissionLabel: { fontWeight: "600" },

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

  saveBtn: {
    backgroundColor: "#6b6dbf",
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 24,
  },

  saveText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
