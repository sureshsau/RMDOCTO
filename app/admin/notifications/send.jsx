import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import Toast from "react-native-toast-message";

import { useNotifications } from "../../../context/NotificationContext";
import api from "../../../services/axios";
import { dashboardLabel } from "../../../utils/roleLabels";

const PRIMARY = "#6b6dbf";

/* Must stay in sync with TARGETABLE_ROLES in the backend notification service. */
const ROLE_OPTIONS = [
  { key: "doctor", label: "Doctors", icon: "medkit-outline" },
  { key: "receptionist", label: "Receptionists", icon: "people-outline" },
  { key: "employee", label: "Employees", icon: "briefcase-outline" },
  { key: "agent", label: "RM Members", icon: "person-outline" },
  { key: "marketing_agent", label: "Marketing Executives", icon: "megaphone-outline" },
  { key: "rmrider", label: "RM Riders", icon: "bicycle-outline" },
  { key: "user", label: "Patients / Users", icon: "person-circle-outline" },
  { key: "admin", label: "Admins", icon: "shield-outline" },
];

const SEVERITY_OPTIONS = [
  { key: "info", label: "Info", color: "#3b82f6" },
  { key: "warning", label: "Warning", color: "#f59e0b" },
  { key: "critical", label: "Critical", color: "#ef4444" },
];

export default function SendNotification() {
  const { sendNotification, refreshUnreadCount } = useNotifications();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info");
  const [audience, setAudience] = useState("ALL");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sending, setSending] = useState(false);

  /* ---------------- USER PICKER (audience === "USERS") ---------------- */

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (audience !== "USERS" || users.length > 0) return;

    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const res = await api.get("/user");
        setUsers(res.data?.data || []);
      } catch {
        Toast.show({ type: "error", text1: "Failed to load users" });
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [audience, users.length]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const active = users.filter((u) => u.isActive && !u.isBlocked);

    if (!term) return active.slice(0, 50);

    return active
      .filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.phone?.includes(term) ||
          u.email?.toLowerCase().includes(term)
      )
      .slice(0, 50);
  }, [users, search]);

  /* ---------------- TOGGLES ---------------- */

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  /* ---------------- SUBMIT ---------------- */

  const audienceSummary = () => {
    if (audience === "ALL") return "every active user in the app";
    if (audience === "ROLES") {
      const labels = selectedRoles.map(
        (r) => ROLE_OPTIONS.find((o) => o.key === r)?.label || r
      );
      return labels.join(", ");
    }
    return `${selectedUserIds.length} selected user${selectedUserIds.length === 1 ? "" : "s"}`;
  };

  const validate = () => {
    if (!title.trim()) return "Please enter a title";
    if (!message.trim()) return "Please enter a message";
    if (audience === "ROLES" && selectedRoles.length === 0)
      return "Select at least one role";
    if (audience === "USERS" && selectedUserIds.length === 0)
      return "Select at least one user";
    return null;
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      Toast.show({ type: "error", text1: problem });
      return;
    }

    // A push cannot be recalled once it fans out, so confirm the audience first.
    Alert.alert(
      "Send notification?",
      `This will be sent to ${audienceSummary()}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            setSending(true);

            const res = await sendNotification({
              title: title.trim(),
              message: message.trim(),
              severity,
              audience,
              roles: audience === "ROLES" ? selectedRoles : undefined,
              userIds: audience === "USERS" ? selectedUserIds : undefined,
            });

            setSending(false);

            if (res.success) {
              Toast.show({
                type: "success",
                text1: res.message || "Notification sent",
              });

              setTitle("");
              setMessage("");
              setSeverity("info");
              setSelectedRoles([]);
              setSelectedUserIds([]);
              refreshUnreadCount();

              router.push("/admin/notifications");
            } else {
              Toast.show({ type: "error", text1: res.error });
            }
          },
        },
      ]
    );
  };

  /* ---------------- RENDER ---------------- */

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Notification</Text>
        <TouchableOpacity
          onPress={() => router.push("/admin/notifications")}
          hitSlop={10}
        >
          <Ionicons name="time-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---------- CONTENT ---------- */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Message</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Clinic closed on Friday"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write the notification the staff will see…"
              placeholderTextColor="#94a3b8"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>{message.length}/500</Text>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.row}>
              {SEVERITY_OPTIONS.map((opt) => {
                const active = severity === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.chip,
                      { borderColor: opt.color },
                      active && { backgroundColor: opt.color },
                    ]}
                    onPress={() => setSeverity(opt.key)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? "#fff" : opt.color },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ---------- AUDIENCE ---------- */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Send to</Text>

            <View style={styles.row}>
              <AudienceTab
                label="Everyone"
                active={audience === "ALL"}
                onPress={() => setAudience("ALL")}
              />
              <AudienceTab
                label="By Role"
                active={audience === "ROLES"}
                onPress={() => setAudience("ROLES")}
              />
              <AudienceTab
                label="Specific"
                active={audience === "USERS"}
                onPress={() => setAudience("USERS")}
              />
            </View>

            {audience === "ALL" && (
              <View style={styles.infoBox}>
                <Ionicons name="people" size={18} color={PRIMARY} />
                <Text style={styles.infoText}>
                  Every active user — doctors, receptionists, employees, RM Members,
                  riders and patients — will receive this.
                </Text>
              </View>
            )}

            {audience === "ROLES" && (
              <View style={styles.roleGrid}>
                {ROLE_OPTIONS.map((role) => {
                  const active = selectedRoles.includes(role.key);
                  return (
                    <TouchableOpacity
                      key={role.key}
                      style={[styles.roleCard, active && styles.roleCardActive]}
                      onPress={() => toggleRole(role.key)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={role.icon}
                        size={20}
                        color={active ? "#fff" : PRIMARY}
                      />
                      <Text
                        style={[
                          styles.roleLabel,
                          active && { color: "#fff" },
                        ]}
                        numberOfLines={1}
                      >
                        {role.label}
                      </Text>
                      {active && (
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {audience === "USERS" && (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Search by name, phone or email"
                  placeholderTextColor="#94a3b8"
                  value={search}
                  onChangeText={setSearch}
                />

                {selectedUserIds.length > 0 && (
                  <Text style={styles.selectedCount}>
                    {selectedUserIds.length} selected
                  </Text>
                )}

                {usersLoading ? (
                  <ActivityIndicator color={PRIMARY} style={{ marginTop: 16 }} />
                ) : (
                  filteredUsers.map((u) => {
                    const active = selectedUserIds.includes(u._id);
                    return (
                      <TouchableOpacity
                        key={u._id}
                        style={[styles.userRow, active && styles.userRowActive]}
                        onPress={() => toggleUser(u._id)}
                        activeOpacity={0.85}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.userName}>
                            {u.name || "Unnamed"}
                          </Text>
                          <Text style={styles.userMeta}>
                            {u.phone}
                            {u.dashboard ? ` · ${dashboardLabel(u.dashboard)}` : ""}
                          </Text>
                        </View>
                        <Ionicons
                          name={active ? "checkbox" : "square-outline"}
                          size={22}
                          color={active ? PRIMARY : "#cbd5e1"}
                        />
                      </TouchableOpacity>
                    );
                  })
                )}

                {!usersLoading && filteredUsers.length === 0 && (
                  <Text style={styles.noUsers}>No matching users</Text>
                )}
              </View>
            )}
          </View>

          {/* ---------- SUBMIT ---------- */}
          <TouchableOpacity
            style={[styles.sendBtn, sending && { opacity: 0.7 }]}
            onPress={submit}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.sendBtnText}>Push Notification</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function AudienceTab({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.audienceTab, active && styles.audienceTabActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.audienceTabText, active && { color: "#fff" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: PRIMARY,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#334155",
  },
  textArea: { minHeight: 110 },
  counter: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "right",
    marginTop: 4,
  },

  row: { flexDirection: "row", gap: 8, marginTop: 4 },

  chip: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  chipText: { fontSize: 13, fontWeight: "700" },

  audienceTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    alignItems: "center",
  },
  audienceTabActive: { backgroundColor: PRIMARY },
  audienceTabText: { fontSize: 13, fontWeight: "700", color: PRIMARY },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  infoText: { flex: 1, fontSize: 12, color: "#4c51bf", lineHeight: 18 },

  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "48%",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  roleCardActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  roleLabel: { flex: 1, fontSize: 12, fontWeight: "700", color: "#334155" },

  selectedCount: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
    marginTop: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  userRowActive: { backgroundColor: "#eef2ff" },
  userName: { fontSize: 14, fontWeight: "600", color: "#334155" },
  userMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  noUsers: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 20,
  },

  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 15,
  },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
