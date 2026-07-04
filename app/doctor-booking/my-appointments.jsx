import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../services/axios";

const PURPLE = "#6b6dbf";
const TEAL   = "#14b8a6";
const BG     = "#f1f5f9";
const CARD   = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";

const STATUS_COLORS = {
  PENDING: { bg: "#fef3c7", color: "#d97706" },
  CONFIRMED: { bg: "#dcfce7", color: "#16a34a" },
  COMPLETED: { bg: "#e0e7ff", color: "#4f46e5" },
  CANCELLED: { bg: "#fee2e2", color: "#dc2626" },
};

export default function MyAppointments() {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get("/appointment/bookings/me");
      setAppointments(res.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAppointments(true)} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={54} color={TEXT_S} />
              <Text style={styles.emptyTitle}>No Appointments Yet</Text>
              <Text style={styles.emptyTxt}>You haven't booked any doctor consultations.</Text>
            </View>
          }
          renderItem={({ item }) => <AppointmentCard appointment={item} />}
        />
      )}
    </View>
  );
}

function AppointmentCard({ appointment }) {
  const statusCfg = STATUS_COLORS[appointment.status] || STATUS_COLORS.PENDING;
  
  const d = new Date(appointment.appointmentDate);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.docName}>{appointment.doctorId?.name || "Doctor"}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusTxt, { color: statusCfg.color }]}>{appointment.status}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color={PURPLE} />
          <Text style={styles.detailTxt}>{dateStr}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={PURPLE} />
          <Text style={styles.detailTxt}>{appointment.appointmentTime}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.patientRow}>
        <Text style={styles.patientName}>{appointment.patientName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  safe: { flex: 1, backgroundColor: BG },
  header: { padding: 20, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: TEXT_D },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: TEXT_D },
  emptyTxt: { fontSize: 13, color: TEXT_M, textAlign: "center" },

  card: { backgroundColor: CARD, borderRadius: 16, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  docName: { fontSize: 16, fontWeight: "800", color: TEXT_D, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusTxt: { fontSize: 10, fontWeight: "800" },

  detailsRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f8fafc", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  detailTxt: { fontSize: 13, fontWeight: "600", color: TEXT_M },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 12 },

  patientRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  patientName: { fontSize: 14, fontWeight: "600", color: TEXT_M },
  fee: { fontSize: 16, fontWeight: "900", color: TEAL },
});
