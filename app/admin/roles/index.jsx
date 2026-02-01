import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useRBAC } from "../../../context/RABACContext";

/* ================= MAIN ================= */

export default function RolesList() {
  const router = useRouter();
  const { fetchRoles } = useRBAC();

  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [visible, setVisible] = useState(false);

  // ---------------- LOAD ROLES ----------------
  const loadRoles = async () => {
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
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // ---------------- SEARCH ----------------
  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.key.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, roles]);

  // ---------------- OPEN MODAL ----------------
  const openRole = (role) => {
    setSelectedRole(role);
    setVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* SEARCH + ADD */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search role..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/admin/roles/create")}
          activeOpacity={0.85}
        >
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ROLE LIST */}
      <ScrollView contentContainerStyle={styles.list}>
        {filteredRoles.map((role) => (
          <TouchableOpacity
            key={role._id}
            style={styles.roleCard}
            onPress={() => openRole(role)}
            activeOpacity={0.85}
          >
            <View>
              <Text style={styles.roleName}>{role.name}</Text>
              <Text style={styles.roleKey}>{role.key}</Text>
            </View>

            <Text style={styles.count}>
              {role.permissions.length} perms
            </Text>
          </TouchableOpacity>
        ))}

        {filteredRoles.length === 0 && (
          <Text style={styles.empty}>No roles found</Text>
        )}
      </ScrollView>

      {/* PERMISSIONS MODAL */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selectedRole?.name}
            </Text>
            <Text style={styles.modalSub}>
              {selectedRole?.key}
            </Text>

            <ScrollView>
              {selectedRole?.permissions.map((p) => (
                <View key={p} style={styles.permissionItem}>
                  <Text style={styles.permissionText}>{p}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef0fa",
  },

  /* SEARCH */

  searchRow: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    fontWeight: "500",
  },

  addBtn: {
    backgroundColor: "#6b6dbf",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },

  addText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  /* LIST */

  list: {
    padding: 16,
  },

  roleCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  roleName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },

  roleKey: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  count: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b6dbf",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#64748b",
  },

  /* MODAL */

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  modalSub: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 16,
  },

  permissionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },

  permissionText: {
    fontWeight: "600",
    color: "#0f172a",
  },

  closeBtn: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#6b6dbf",
    alignItems: "center",
  },

  closeText: {
    color: "#fff",
    fontWeight: "800",
  },
});
