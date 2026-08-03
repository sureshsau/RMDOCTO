import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useNotifications } from "../../context/NotificationContext";

/* Severity drives the colour of the left accent bar and the icon bubble. */
const SEVERITY_STYLE = {
  info: { color: "#3b82f6", bg: "#dbeafe", icon: "information-circle" },
  warning: { color: "#f59e0b", bg: "#fef3c7", icon: "warning" },
  critical: { color: "#ef4444", bg: "#fee2e2", icon: "alert-circle" },
};

const formatWhen = (value) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString();
};

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAll = useCallback(async () => {
    if (unreadCount === 0) return;

    const res = await markAllAsRead();
    if (res.success) {
      Toast.show({ type: "success", text1: "All notifications marked as read" });
    } else {
      Toast.show({ type: "error", text1: res.error });
    }
  }, [unreadCount, markAllAsRead]);

  const handleDelete = useCallback(
    (item) => {
      Alert.alert("Delete notification", "Remove this notification?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteNotification(item._id);
            if (!res.success) {
              Toast.show({ type: "error", text1: res.error });
            }
          },
        },
      ]);
    },
    [deleteNotification]
  );

  const renderItem = ({ item }) => {
    const severity = SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.info;

    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        activeOpacity={0.85}
        onPress={() => {
          if (!item.isRead) markAsRead(item._id);
        }}
        onLongPress={() => handleDelete(item)}
      >
        <View style={[styles.accent, { backgroundColor: severity.color }]} />

        <View style={[styles.iconBubble, { backgroundColor: severity.bg }]}>
          <Ionicons name={severity.icon} size={20} color={severity.color} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={2}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.message}>{item.message}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.time}>{formatWhen(item.createdAt)}</Text>
            {item.source === "admin" && (
              <View style={styles.sourceTag}>
                <Text style={styles.sourceTagText}>ADMIN</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#334155" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>

        <TouchableOpacity onPress={handleMarkAll} disabled={unreadCount === 0}>
          <Text
            style={[styles.markAll, unreadCount === 0 && styles.markAllDisabled]}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={
          notifications.length === 0
            ? { flexGrow: 1, justifyContent: "center" }
            : { padding: 16, paddingBottom: 40 }
        }
        refreshing={loading}
        onRefresh={fetchNotifications}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color="#6b6dbf" />
          ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={54} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                Updates from the admin will show up here.
              </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#334155" },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  markAll: { fontSize: 13, fontWeight: "700", color: "#6b6dbf" },
  markAllDisabled: { color: "#cbd5e1" },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    paddingLeft: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  cardUnread: {
    borderColor: "#c7d2fe",
    backgroundColor: "#f8faff",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { flex: 1, fontSize: 15, fontWeight: "600", color: "#334155" },
  titleUnread: { fontWeight: "800", color: "#0f172a" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#6b6dbf",
  },

  message: { fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 19 },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  time: { fontSize: 11, color: "#94a3b8" },
  sourceTag: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6b6dbf",
    letterSpacing: 0.5,
  },

  empty: { alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginTop: 14,
  },
  emptyText: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 6,
  },
});
