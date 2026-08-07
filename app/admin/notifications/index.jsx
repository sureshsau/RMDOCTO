import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useNotifications } from "../../../context/NotificationContext";

const PRIMARY = "#6b6dbf";

const SEVERITY_COLOR = {
  info: "#3b82f6",
  warning: "#f59e0b",
  critical: "#ef4444",
};

const ROLE_LABEL = {
  doctor: "Doctors",
  receptionist: "Receptionists",
  employee: "Employees",
  agent: "RM Members",
  marketing_agent: "Marketing Executives",
  rmrider: "RM Riders",
  user: "Patients / Users",
  admin: "Admins",
  subadmin: "Sub-admins",
};

const describeAudience = (item) => {
  if (item.audience === "ALL") return "Everyone";
  if (item.audience === "ROLES") {
    return (item.roles || []).map((r) => ROLE_LABEL[r] || r).join(", ");
  }
  return "Selected users";
};

export default function AdminNotificationHistory() {
  const { getSentNotifications } = useNotifications();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getSentNotifications(1);
    setLoading(false);

    if (res.success) {
      setItems(res.data);
    } else {
      Toast.show({ type: "error", text1: res.error });
    }
  }, [getSentNotifications]);

  // Re-read on focus so a push sent from the composer shows up on return.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View
          style={[
            styles.severityDot,
            { backgroundColor: SEVERITY_COLOR[item.severity] || SEVERITY_COLOR.info },
          ]}
        />
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
      </View>

      <Text style={styles.message}>{item.message}</Text>

      <View style={styles.metaRow}>
        <View style={styles.tag}>
          <Ionicons name="people-outline" size={12} color={PRIMARY} />
          <Text style={styles.tagText}>{describeAudience(item)}</Text>
        </View>

        <View style={styles.tag}>
          <Ionicons name="checkmark-done-outline" size={12} color={PRIMARY} />
          <Text style={styles.tagText}>{item.recipientCount} sent</Text>
        </View>
      </View>

      <Text style={styles.time}>
        {new Date(item.createdAt).toLocaleString()}
        {item.sentBy?.name ? ` · by ${item.sentBy.name}` : ""}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sent Notifications</Text>
        <TouchableOpacity
          onPress={() => router.push("/admin/notifications/send")}
          hitSlop={10}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={
          items.length === 0
            ? { flexGrow: 1, justifyContent: "center" }
            : { padding: 16, paddingBottom: 40 }
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Ionicons name="paper-plane-outline" size={54} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Nothing sent yet</Text>
              <Text style={styles.emptyText}>
                Push your first notification to the team.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/admin/notifications/send")}
              >
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Send Notification</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: PRIMARY,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  severityDot: { width: 10, height: 10, borderRadius: 999 },
  title: { flex: 1, fontSize: 15, fontWeight: "700", color: "#0f172a" },

  message: { fontSize: 13, color: "#64748b", marginTop: 8, lineHeight: 19 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: { fontSize: 11, fontWeight: "700", color: PRIMARY },

  time: { fontSize: 11, color: "#94a3b8", marginTop: 10 },

  empty: { alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#475569", marginTop: 14 },
  emptyText: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 6,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 18,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
