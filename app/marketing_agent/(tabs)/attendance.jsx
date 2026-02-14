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
   DATE HELPERSr
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAttendanceLogs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceLogs();
    setRefreshing(false);
  };

  const fetchAttendanceLogs = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const to = today.toISOString().split('T')[0];

      const res = await api.get("/attendance/log/me", {
        params: {
          from,
          to,
          page: 1,
          limit: 5,
        },
      });

      if (res.data?.data?.logs) {
        setLogs(res.data.data.logs);
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to load logs",
        text2: err.response?.data?.message || "Could not fetch attendance logs",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14b8a6"
            colors={["#14b8a6"]}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerBg} />
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerGreeting}>Attendance</Text>
              <Text style={styles.headerName}>{user?.name || "Dr. Sarah Jenkins"}</Text>
            </View>
            <View style={styles.headerBadge}>
              <Ionicons name="calendar" size={20} color="#14b8a6" />
              <Text style={styles.headerBadgeText}>{monthYear}</Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.metaText}>Today • {formatDate(today)}</Text>
            </View>
          </View>
        </View>

        {/* FACE VERIFICATION CARD */}
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

            <View style={styles.faceIdBadge}>
              <Ionicons name="scan-outline" size={16} color="#14b8a6" />
              <Text style={styles.faceIdText}>
                Face ID
              </Text>
            </View>
          </View>

          <View style={styles.faceImageContainer}>
            <View style={styles.faceImageWrapper}>
              {user?.profileImage ? (
                <Image
                  source={{
                    uri: user.profileImage,
                  }}
                  style={styles.faceImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={60} color="#d1d5db" />
                </View>
              )}
            </View>

            <View style={styles.faceAlertBadge}>
              <Ionicons
                name="pulse-outline"
                size={16}
                color="#14b8a6"
              />
              <Text style={styles.faceAlertText}>
                Align your face within the circle
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/marketing_agent/face-verification")}
            style={styles.verifyBtn}
          >
            <Ionicons name="scan" size={20} color="#fff" />
            <Text style={styles.verifyBtnText}>
              Start Face Verification
            </Text>
          </TouchableOpacity>
        </View>

        {/* MONTH STATS */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsLabel}>This month</Text>
            <Text style={styles.statsStatus}>
              On track
            </Text>
          </View>

          <View style={styles.statsRow}>
            <Stat label="Working days" value="22" sub="Out of 26" />
            <Stat label="Present" value="19" sub="2 late, 1 leave" />
            <Stat label="Punctuality" value="95%" sub="Avg 8:55 AM" />
          </View>
        </View>

        {/* CALENDAR */}
        <AttendanceCalendar />

        {/* RECENT LOGS */}
        <Text style={styles.recentLogsTitle}>
          Recent logs
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#14b8a6" />
          </View>
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <LogItem key={log._id} log={log} />
          ))
        ) : (
          <Text style={styles.noLogsText}>No attendance logs found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================
   COMPONENTS (SAME FILE)
========================= */

const Stat = ({ label, value, sub }) => (
  <View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>
      {value}
    </Text>
    <Text style={styles.statSub}>{sub}</Text>
  </View>
);

const LogItem = ({ log }) => {
  const getStatusColor = (status) => {
    if (status === "PRESENT_FULL") return { bgColor: "#dcfce7", textColor: "#15803d", label: "Present" };
    if (status === "PRESENT_HALF") return { bgColor: "#fef3c7", textColor: "#b45309", label: "Half Day" };
    if (status === "ABSENT") return { bgColor: "#fee2e2", textColor: "#b91c1c", label: "Absent" };
    if (status === "LEAVE") return { bgColor: "#e0e7ff", textColor: "#4f46e5", label: "Leave" };
    return { bgColor: "#f3f4f6", textColor: "#6b7280", label: "Unknown" };
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const colors = getStatusColor(log.status);
  const dateObj = new Date(log.attendanceDate);
  const dateStr = formatDate(log.attendanceDate).split(" ");
  const checkInTime = log.checkIn?.time ? formatTime(log.checkIn.time) : "N/A";
  const checkOutTime = log.checkOut?.time ? formatTime(log.checkOut.time) : "N/A";
  const timeRange = `${checkInTime} - ${checkOutTime}`;

  return (
    <View style={styles.logItem}>
      <View style={styles.logItemLeft}>
        <View style={styles.logDateBox}>
          <Text style={styles.logDate}>{dateStr[0]}</Text>
          <Text style={styles.logDateSub}>{dateStr[1]}</Text>
        </View>
        <View>
          <Text style={styles.logTitle}>
            {dateObj.toLocaleDateString("en-US", { weekday: "long" })}
          </Text>
          <Text style={styles.logTime}>
            {timeRange}
          </Text>
        </View>
      </View>

      <View style={[styles.logStatus, { backgroundColor: colors.bgColor }]}>
        <Text style={[styles.logStatusText, { color: colors.textColor }]}>
          {colors.label}
        </Text>
      </View>
    </View>
  );
};

const AttendanceCalendar = () => {
  const days = [
    { day: 21, status: "present" },
    { day: 22, status: "present" },
    { day: 23, status: "half" },
    { day: 24, status: "present" },
    { day: 25, status: "absent" },
    { day: 26, status: "present" },
    { day: 31, status: "present" },
    { day: 12, status: "present" },
    { day: 13, status: "half" },
    { day: 14, status: "present" },
    { day: 15, status: "absent" },
    { day: 16, status: "present" },
  ];

  const getDateCellStyle = (status) => {
    if (status === "present") return styles.dayPresent;
    if (status === "half") return styles.dayHalf;
    return styles.dayAbsent;
  };

  return (
    <View style={styles.calendarCard}>
      <Text style={styles.calendarTitle}>
        Attendance overview
      </Text>

      <View style={styles.calendarGrid}>
        {days.map((item) => (
          <View
            key={item.day}
            style={[styles.dayCell, getDateCellStyle(item.status)]}
          >
            <Text style={styles.dayNumber}>{item.day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.legendRow}>
        <Legend color="#dcfce7" label="Full Day" />
        <Legend color="#fef3c7" label="Half Day" />
        <Legend color="#fee2e2" label="Absent" />
      </View>
    </View>
  );
};

const Legend = ({ color, label }) => (
  <View style={styles.legend}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollView: { paddingHorizontal: 0, paddingTop: 0 },
  
  // Enhanced Header
  headerContainer: { backgroundColor: "#fff", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden", marginBottom: 20, elevation: 3, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  headerBg: { position: "absolute", top: 0, left: 0, right: 0, height: 120, backgroundColor: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" },
  headerContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 1 },
  headerGreeting: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  headerName: { fontSize: 24, fontWeight: "700", color: "#111827" },
  headerBadge: { backgroundColor: "#f0fdfa", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  headerBadgeText: { fontSize: 12, fontWeight: "600", color: "#14b8a6" },
  headerMeta: { paddingHorizontal: 20, paddingBottom: 16, zIndex: 1 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#6b7280" },

  // Face Card
  faceCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, marginHorizontal: 20, elevation: 2 },
  faceCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  faceCardTitle: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 4 },
  faceCardSubtitle: { fontSize: 14, color: "#9ca3af" },
  
  faceIdBadge: { backgroundColor: "#f0fdfa", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: "row", alignItems: "center" },
  faceIdText: { color: "#14b8a6", fontWeight: "600", marginLeft: 6 },
  
  faceImageContainer: { alignItems: "center", marginVertical: 24 },
  faceImageWrapper: { width: 176, height: 176, borderRadius: 88, borderWidth: 4, borderColor: "#14b8a6", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  faceImage: { width: 144, height: 144, borderRadius: 72 },
  placeholderImage: { width: 144, height: 144, borderRadius: 72, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  
  faceAlertBadge: { backgroundColor: "#f0fdfa", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, flexDirection: "row", alignItems: "center" },
  faceAlertText: { color: "#14b8a6", marginLeft: 8 },
  
  verifyBtn: { backgroundColor: "#14b8a6", paddingVertical: 16, borderRadius: 999, flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#14b8a6" },
  verifyBtnText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 8 },

  // Stats Card
  statsCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, marginHorizontal: 20, elevation: 2 },
  statsHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  statsLabel: { fontSize: 14, color: "#9ca3af" },
  statsStatus: { fontSize: 14, color: "#16a34a", fontWeight: "600" },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  
  statLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: "600", color: "#111827", marginBottom: 4 },
  statSub: { fontSize: 12, color: "#9ca3af" },

  // Calendar
  calendarCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, marginHorizontal: 20, elevation: 2 },
  calendarTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16, color: "#111827" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 },
  
  dayCell: { width: "13%", aspectRatio: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  dayPresent: { backgroundColor: "#dcfce7" },
  dayHalf: { backgroundColor: "#fef3c7" },
  dayAbsent: { backgroundColor: "#fee2e2" },
  dayNumber: { fontWeight: "600", color: "#111827" },
  
  legendRow: { flexDirection: "row", justifyContent: "space-between" },
  legend: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendLabel: { fontSize: 12, color: "#9ca3af" },

  // Recent Logs
  recentLogsTitle: { fontSize: 18, fontWeight: "600", marginTop: 24, marginBottom: 12, marginHorizontal: 20, color: "#111827" },
  
  loadingContainer: { paddingVertical: 20, alignItems: "center", marginHorizontal: 20 },
  noLogsText: { fontSize: 14, color: "#9ca3af", textAlign: "center", paddingVertical: 20, marginHorizontal: 20 },
  
  logItem: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, marginHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", elevation: 2 },
  logItemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  logDateBox: { width: 48, height: 48, backgroundColor: "#f3f4f6", borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 16 },
  logDate: { fontWeight: "600", fontSize: 12, color: "#6b7280" },
  logDateSub: { fontWeight: "400", fontSize: 10, color: "#9ca3af" },
  logTitle: { fontWeight: "600", color: "#111827", marginBottom: 2 },
  logTime: { fontSize: 14, color: "#9ca3af" },
  
  logStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  logStatusText: { fontWeight: "600", fontSize: 12 },
});
