import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useRBAC } from "../../../context/RABACContext";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/axios.js";

/* =============== ACTIONS CONFIG =============== */
// Edit these arrays to change available actions per role
const ACTIONS_MAP = {
  admin: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "give-role", label: "Give Role", route: "/admin/employee/roles" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],

  marketing_agent: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],
  rmrider: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],
  subadmin: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],

  receptionist: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],
  employee: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],
  doctor: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],

  agent: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "rmcredit", label: "RM Credit", route: "/admin/rmcredit/details" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],

  default: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "give-role", label: "Give Role", route: "/admin/employee/add" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],
};

/* ================= MAIN ================= */

export default function Employees() {
  const { getUsers } = useUser();
  const { fetchRoles } = useRBAC();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(["All"]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [transferModal, setTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);



  const openActions = (user) => {
    setSelectedUser(user);
    setActionsModalVisible(true);
  };

  const closeActions = () => {
    setSelectedUser(null);
    setActionsModalVisible(false);
  };
  const handleAction = (action) => {
    if (!selectedUser) return;

    // ✅ VIEW ORDERS
    if (action.id === "view-orders") {
      router.push({
        pathname: "/admin/orders/user-orders",
        params: {
          userId: selectedUser._id,
          userName: selectedUser.name,
        },
      });
      setActionsModalVisible(false);
      return;
    }

    // ✅ OPEN TRANSFER MODAL
    if (action.id === "transfer-rmcoin") {
      setTransferModal(true);
      setActionsModalVisible(false);
      return;
    }

    if (action.route) {
      const route = action.route.includes(":id")
        ? action.route.replace(":id", selectedUser._id)
        : action.route;

      const faceUri =
        selectedUser?.faceImage?.url ||
        (typeof selectedUser?.faceImage === "string"
          ? selectedUser.faceImage
          : null) ||
        selectedUser?.faceUri ||
        "";

      if (
        action.id === "rmcredit" ||
        action.id === "rmcoin" ||
        route.includes("/rmcredit") ||
        route.includes("/rmcoin")
      ) {
        router.push({
          pathname: route,
          params: {
            id: selectedUser._id,
            name: selectedUser.name,
            phone: selectedUser.phone,
            email: selectedUser.email,
            role: selectedUser.roles?.[0] || "",
            faceUri,
          },
        });

        setActionsModalVisible(false);
        return;
      }

      router.push({ pathname: route });
    }

    setActionsModalVisible(false);
  };


  /* ================= LOAD ================= */

  const loadUsers = async () => {
    const res = await getUsers();
    if (!res.success) {
      Toast.show({
        type: "error",
        text1: "Failed to load users",
        text2: res.error,
      });
      return;
    }
    setUsers(res.data);
  };

  const loadRoles = async () => {
    const res = await fetchRoles();
    if (!res.success) return;

    setRoles(["All", ...res.data.map((r) => r.key)]);
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  /* ================= FILTER ================= */

  const filteredEmployees = useMemo(() => {
    return users.filter((u) => {
      const role = u.roles?.[0] || "";
      const dashboard = u.dashboard || "";

      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        role.toLowerCase().includes(search.toLowerCase()) ||
        dashboard.toLowerCase().includes(search.toLowerCase());

      const matchFilter =
        filter === "All" || role === filter;

      return matchSearch && matchFilter;
    });
  }, [users, search, filter]);

  const handleTransferSubmit = async () => {
    if (!transferAmount) {
      Toast.show({
        type: "error",
        text1: "Amount Required",
        text2: "Please enter transfer amount",
      });
      return;
    }

    try {
      setTransferLoading(true);

      const res = await api.post("/rmcoin/admin-transfer", {
        receiverId: selectedUser._id,
        amount: Number(transferAmount),
      });

      Toast.show({
        type: "success",
        text1: "Transfer Successful",
        text2: res?.data?.message || "RM Coins transferred successfully",
      });

      setTransferModal(false);
      setTransferAmount("");
      await loadUsers();

    } catch (error) {

      Toast.show({
        type: "error",
        text1: "Transfer Failed",
        text2:
          error?.response?.data?.message ||
          "Something went wrong",
      });
    } finally {
      setTransferLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={transferModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setTransferModal(false)}>
          <View style={styles.actionsOverlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.actionsBox}>
                <Text style={styles.sectionText}>Transfer RM Coins</Text>

                <Text style={{ marginTop: 10, fontWeight: "600" }}>
                  Name: {selectedUser?.name}
                </Text>

                <Text style={{ marginBottom: 12, color: "#64748b" }}>
                  Phone: {selectedUser?.phone}
                </Text>

                <TextInput
                  placeholder="Enter Amount"
                  keyboardType="numeric"
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16,
                  }}
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: "#6b6dbf",
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={handleTransferSubmit}
                  disabled={transferLoading}
                >
                  {transferLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Transfer
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 12, alignItems: "center" }}
                  onPress={() => setTransferModal(false)}
                >
                  <Text style={{ color: "#6b6dbf" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* SEARCH + ADD USER */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6b6dbf" />
          <TextInput
            placeholder="Search by name, role, department"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/admin/employee/add")}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* FILTER */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {roles.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setFilter(type)}
              style={[
                styles.filterChip,
                filter === type && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === type && styles.filterTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6b6dbf"
          />
        }
      >
        {/* STATS */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Employee Overview</Text>
          <Text style={styles.statsSubtitle}>
            Current staff summary
          </Text>

          <View style={styles.statsRow}>
            <Stat label="Total" value={users.length} />
            <Stat
              label="Active"
              value={users.filter((u) => u.isActive).length}
            />
            <Stat
              label="Inactive"
              value={users.filter((u) => !u.isActive).length}
            />
          </View>
        </View>

        <Section title="All Employees" />

        {filteredEmployees.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="people-outline"
              size={48}
              color="#94a3b8"
            />
            <Text style={styles.emptyText}>No employees found</Text>
          </View>
        )}

        {filteredEmployees.map((emp) => (
          <EmployeeCard key={emp._id} user={emp} onOpenActions={openActions} />
        ))}
      </ScrollView>

      {/* Actions Modal */}
      <Modal visible={actionsModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeActions}>
          <View style={styles.actionsOverlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.actionsBox}>
                <Text style={styles.sectionText}>Actions</Text>
                {(() => {
                  const roleRaw = selectedUser?.roles?.[0] || "";
                  const norm = roleRaw.toString().toLowerCase().replace(/\s+/g, "_");
                  const actions = ACTIONS_MAP[norm] || ACTIONS_MAP[roleRaw] || ACTIONS_MAP.default;
                  return actions.map((act) => (
                    <TouchableOpacity key={act.id} style={styles.actionItem} onPress={() => handleAction(act)}>
                      <Text style={styles.actionText}>{act.label}</Text>
                    </TouchableOpacity>
                  ));
                })()}

                <TouchableOpacity style={[styles.actionItem, styles.actionCancel]} onPress={closeActions}>
                  <Text style={[styles.actionText, { color: '#6b6dbf' }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );

}

/* ================= COMPONENTS ================= */

function Section({ title }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionText}>{title}</Text>
    </View>
  );
}
function Stat({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmployeeCard({ user, onOpenActions }) {
  const role = user.roles?.[0] || "Staff";
  const status = user.isActive ? "Active" : "Inactive";

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          router.push({
            pathname: `/admin/employee/${user._id}/profile`,
            params: {
              id: user._id,
              name: user.name,
              role: user.roles?.join(", ") || "No Role",
              department: user.department?.[0] || "General",
              status: user.isActive ? "Active" : "Inactive",
              faceUri:
                user.faceImage?.url ||
                (typeof user.faceImage === "string" ? user.faceImage : null) ||
                user.faceUri ||
                "",
            },
          });
        }}
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
      >
        {/* AVATAR */}
        {(user.faceImage?.url ||
          typeof user.faceImage === "string" ||
          user.faceUri) ? (
          <Image
            source={{
              uri:
                user.faceImage?.url ||
                (typeof user.faceImage === "string"
                  ? user.faceImage
                  : user.faceUri),
            }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color="#6b6dbf" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>
            {role} • {user.dashboard}
          </Text>
          <Text style={styles.meta}>
            {user.phone}
            {user.email ? ` • ${user.email}` : ""}
          </Text>

          {/* 🔥 WALLET SECTION */}
          <View style={styles.walletRow}>
            <Ionicons
              name="wallet"
              size={14}
              color="#1BA6A6"
            />
            <Text style={styles.walletText}>
              {user.rmCoinsBalance || 0} RM Coins
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionBtn}
        onPress={() => onOpenActions && onOpenActions(user)}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={18}
          color="#6b6dbf"
        />
      </TouchableOpacity>

      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: user.isActive
              ? "#dcfce7"
              : "#fee2e2",
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            {
              color: user.isActive
                ? "#15803d"
                : "#b91c1c",
            },
          ]}
        >
          {status}
        </Text>
      </View>
    </View>
  );
}





/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#ECFDF5",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  walletText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
    marginLeft: 6,
  },

  container: { flex: 1, backgroundColor: "#eef0fa" },

  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { marginLeft: 12, flex: 1, color: "#1e293b" },

  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#6b6dbf",
    alignItems: "center",
    justifyContent: "center",
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    marginRight: 10,
  },
  filterChipActive: { backgroundColor: "#6b6dbf" },
  filterText: { fontWeight: "600", color: "#334155" },
  filterTextActive: { color: "#fff" },

  scrollContent: { padding: 20, paddingBottom: 80 },

  statsCard: {
    backgroundColor: "#6b6dbf",
    borderRadius: 28,
    padding: 20,
    marginBottom: 28,
  },
  statsTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statsSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: { alignItems: "center" },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "800" },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },

  section: { marginBottom: 12 },
  sectionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: "#eef0fa",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 48, height: 48, borderRadius: 24, marginRight: 16 },
  name: { fontWeight: "600", color: "#0f172a" },
  meta: { fontSize: 12, color: "#64748b", marginTop: 2 },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontSize: 12, fontWeight: "700" },

  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { marginTop: 16, color: "#64748b", fontWeight: "600" },
  optionBtn: { padding: 8, marginRight: 8, borderRadius: 8, backgroundColor: '#fff' },

  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  actionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionText: { fontSize: 16 },
  actionCancel: { borderBottomWidth: 0, marginTop: 8 },
});
