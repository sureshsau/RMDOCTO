import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/axios";

/* =========================
   DATE HELPERS
========================= */

const today = new Date();

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const monthYear = today.toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
});

/* =========================
   MAIN SCREEN
========================= */

export default function Attendance() {
  const router = useRouter();
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [overview, setOverview] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const LIMIT = 5;

  useEffect(() => {
    fetchAttendanceLogs(1);
  }, []);

  const fetchAttendanceLogs = async (page = 1, isRefresh = false) => {
    try {
      if (page === 1 && !isRefresh) setLoading(true);

      const today = new Date();
      const from = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];

      const to = today.toISOString().split("T")[0];

      const res = await api.get("/attendance/log/me", {
        params: {
          from,
          to,
          page,
          limit: LIMIT,
        },
      });
      if (res.data.success) {
        const newLogs = res.data.logs || [];

        if (page === 1) {
          setLogs(newLogs);
        } else {
          setLogs((prev) => [...prev, ...newLogs]);
        }

        setOverview(res.data.overview);

        setPagination({
          page: res.data.pagination.page,
          totalPages: res.data.pagination.totalPages,
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to load logs",
        text2:
          err.response?.data?.message ||
          "Could not fetch attendance logs",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    fetchAttendanceLogs(1, true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14b8a6"
            colors={["#14b8a6"]}
          />
        }
        onMomentumScrollEnd={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent;

          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 20 &&
            pagination.page < pagination.totalPages &&
            !loadingMore
          ) {
            setLoadingMore(true);
            fetchAttendanceLogs(pagination.page + 1);
          }
        }}
      >
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerGreeting}>Attendance</Text>
              <Text style={styles.headerName}>
                {user?.name}
              </Text>
            </View>
            <View style={styles.headerBadge}>
              <Ionicons name="calendar" size={20} color="#14b8a6" />
              <Text style={styles.headerBadgeText}>
                {monthYear}
              </Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.metaText}>
                Today • {formatDate(today)}
              </Text>
            </View>
          </View>
        </View>

        {/* FACE CARD */}
        <View style={styles.faceCard}>
          <View style={styles.faceCardHeader}>
            <View>
              <Text style={styles.faceCardTitle}>
                Mark today's attendance
              </Text>
              <Text style={styles.faceCardSubtitle}>
                Face verification required
              </Text>
            </View>
          </View>

          <View style={styles.faceImageContainer}>
            <View style={styles.faceImageWrapper}>
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.faceImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={60} color="#d1d5db" />
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/receptionist/face-verification")}
            style={styles.verifyBtn}
          >
            <Ionicons name="scan" size={20} color="#fff" />
            <Text style={styles.verifyBtnText}>
              Start Face Verification
            </Text>
          </TouchableOpacity>
        </View>

        {/* OVERVIEW STATS */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Stat
              label="Working Days"
              value={overview?.totalDays || 0}
              sub={`Late: ${overview?.lateMinutes || 0}m`}
            />

            <Stat
              label="Present"
              value={overview?.presentFull || 0}
              sub={`Half: ${overview?.presentHalf || 0}`}
            />

            <Stat
              label="Hours"
              value={overview?.totalHours || 0}
              sub={`OT: ${overview?.overtimeHours || 0}`}
            />
          </View>
        </View>

        {/* RECENT LOGS */}
        <Text style={styles.recentLogsTitle}>
          Recent logs
        </Text>

        {loading && logs.length === 0 ? (
          <ActivityIndicator size="large" color="#14b8a6" />
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <LogItem key={log._id} log={log} />
          ))
        ) : (
          <Text style={styles.noLogsText}>
            No attendance logs found
          </Text>
        )}

        {loadingMore && (
          <ActivityIndicator
            size="small"
            color="#14b8a6"
            style={{ marginTop: 20 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

const Stat = ({ label, value, sub }) => (
  <View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statSub}>{sub}</Text>
  </View>
);

const LogItem = ({ log }) => {
  const formatTime = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      : "--:--";

  const statusMap = {
    PRESENT_FULL: {
      bg: "#dcfce7",
      text: "#15803d",
      label: "Present",
      icon: "checkmark-circle",
    },
    PRESENT_HALF: {
      bg: "#fef3c7",
      text: "#b45309",
      label: "Half Day",
      icon: "time",
    },
    ABSENT: {
      bg: "#fee2e2",
      text: "#b91c1c",
      label: "Absent",
      icon: "close-circle",
    },
    LEAVE: {
      bg: "#e0e7ff",
      text: "#4f46e5",
      label: "Leave",
      icon: "airplane",
    },
    WORKING: {
      bg: "#e0f2fe",
      text: "#0284c7",
      label: "Working",
      icon: "pulse-outline",
    }

  };

  const status = statusMap[log.status] || {
    bg: "#f3f4f6",
    text: "#6b7280",
    label: "working",
    icon: "help-circle",
  };

  return (
    <View style={styles.logCard}>
      {/* LEFT SIDE */}
      <View style={styles.logLeft}>
        <View style={styles.dateCircle}>
          <Text style={styles.dateDay}>
            {new Date(log.attendanceDate).getDate()}
          </Text>
          <Text style={styles.dateMonth}>
            {new Date(log.attendanceDate)
              .toLocaleDateString("en-US", { month: "short" })
              .toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.logTitle}>
            {new Date(log.attendanceDate).toLocaleDateString(
              "en-US",
              { weekday: "long" }
            )}
          </Text>

          {/* TIME ROW */}
          <View style={styles.timeRow}>
            <Ionicons
              name="log-in-outline"
              size={14}
              color="#14b8a6"
            />
            <Text style={styles.timeText}>
              {formatTime(log.checkIn?.time)}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={12}
              color="#9ca3af"
              style={{ marginHorizontal: 6 }}
            />

            <Ionicons
              name="log-out-outline"
              size={14}
              color="#f97316"
            />
            <Text style={styles.timeText}>
              {formatTime(log.checkOut?.time)}
            </Text>
          </View>

          {/* EXTRA INFO */}
          <View style={styles.extraRow}>
            {log.lateByMinutes > 0 && (
              <View style={styles.extraBadge}>
                <Ionicons
                  name="alert-circle-outline"
                  size={12}
                  color="#b45309"
                />
                <Text style={styles.extraText}>
                  Late {log.lateByMinutes}m
                </Text>
              </View>
            )}

            {log.overtimeHours > 0 && (
              <View style={styles.extraBadgeGreen}>
                <Ionicons
                  name="trending-up-outline"
                  size={12}
                  color="#15803d"
                />
                <Text style={styles.extraTextGreen}>
                  +{log.overtimeHours}h OT
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* STATUS BADGE */}
      <View
        style={[
          styles.statusBadgeNew,
          { backgroundColor: status.bg },
        ]}
      >
        <Ionicons
          name={status.icon}
          size={14}
          color={status.text}
        />
        <Text
          style={[
            styles.statusTextNew,
            { color: status.text },
          ]}
        >
          {status.label}
        </Text>
      </View>
    </View>
  );
};


/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  logCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    marginHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },

  logLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  dateCircle: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#f0fdfa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  dateDay: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },

  dateMonth: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  timeText: {
    fontSize: 12,
    color: "#475569",
    marginLeft: 4,
  },

  extraRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },

  extraBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  extraBadgeGreen: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  extraText: {
    fontSize: 10,
    color: "#b45309",
    marginLeft: 4,
    fontWeight: "600",
  },

  extraTextGreen: {
    fontSize: 10,
    color: "#15803d",
    marginLeft: 4,
    fontWeight: "600",
  },

  statusBadgeNew: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusTextNew: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },


  headerContainer: { backgroundColor: "#fff", marginBottom: 20 },
  headerContent: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerGreeting: { fontSize: 13, color: "#6b7280" },
  headerName: { fontSize: 24, fontWeight: "700" },
  headerBadge: {
    backgroundColor: "#f0fdfa",
    padding: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerBadgeText: { marginLeft: 6, color: "#14b8a6" },
  headerMeta: { paddingHorizontal: 20, paddingBottom: 16 },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { marginLeft: 6, color: "#6b7280" },

  faceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    margin: 20,
  },
  faceCardTitle: { fontSize: 18, fontWeight: "600" },
  faceCardSubtitle: { color: "#9ca3af" },

  faceImageContainer: { alignItems: "center", marginVertical: 20 },
  faceImageWrapper: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 4,
    borderColor: "#14b8a6",
    alignItems: "center",
    justifyContent: "center",
  },
  faceImage: { width: 144, height: 144, borderRadius: 72 },
  placeholderImage: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  verifyBtn: {
    backgroundColor: "#14b8a6",
    padding: 16,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
  },
  verifyBtnText: { color: "#fff", marginLeft: 8 },

  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    margin: 20,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statLabel: { fontSize: 12, color: "#9ca3af" },
  statValue: { fontSize: 20, fontWeight: "600" },
  statSub: { fontSize: 12, color: "#9ca3af" },

  recentLogsTitle: {
    fontSize: 18,
    fontWeight: "600",
    margin: 20,
  },

  logItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logItemLeft: { flexDirection: "row", alignItems: "center" },
  logDateBox: {
    width: 48,
    height: 48,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  logDate: { fontWeight: "600" },
  logTitle: { fontWeight: "600" },
  logTime: { color: "#9ca3af" },
  logStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  logStatusText: { color: "#fff", fontSize: 12 },
  noLogsText: {
    textAlign: "center",
    marginTop: 20,
    color: "#9ca3af",
  },
});
