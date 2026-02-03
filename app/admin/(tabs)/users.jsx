import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
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
import { useUser } from "../../../context/UserContext";

/* ================= MAIN ================= */

export default function Employees() {
  const { getUsers } = useUser();
  const { fetchRoles } = useRBAC();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(["All"]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

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

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
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
          <EmployeeCard key={emp._id} user={emp} />
        ))}
      </ScrollView>
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

function EmployeeCard({ user }) {
  const role = user.roles?.[0] || "Staff";
  const status = user.isActive ? "Active" : "Inactive";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/admin/employee/profile/abc",
          params: { id: user._id },
        })
      }
      style={styles.card}
    >
      {/* AVATAR (ICON FALLBACK, SAME SIZE) */}
      <View style={styles.avatar}>
        <Ionicons name="person" size={22} color="#6b6dbf" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meta}>
          {role} • {user.dashboard}
        </Text>
      </View>

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
    </TouchableOpacity>
  );
}

/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
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
});
