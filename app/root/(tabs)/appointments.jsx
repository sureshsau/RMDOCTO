import { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "../../../services/axios";

const PRIMARY = "#14b8a6";

const STATUS_COLOR = {
  PENDING: { bg: "#fef3c7", text: "#b45309" },
  CONFIRMED: { bg: "#dcfce7", text: "#166534" },
  COMPLETED: { bg: "#dbeafe", text: "#1e40af" },
  CANCELLED: { bg: "#fee2e2", text: "#b91c1c" },
};

export default function AppointmentsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetch = async () => {
        try {
          setLoading(true);
          const res = await api.get("/appointment/bookings/me");
          if (active && res.data?.success) setAppointments(res.data.data || []);
        } catch (_) {}
        finally { if (active) setLoading(false); }
      };
      fetch();
      return () => { active = false; };
    }, [])
  );

  const renderItem = ({ item }) => {
    const sc = STATUS_COLOR[item.status] || STATUS_COLOR.PENDING;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={styles.avatarIcon}>
              <Ionicons name="person" size={22} color={PRIMARY} />
            </View>
            <View>
              <Text style={styles.doctorName}>{item.doctorId?.name || "Doctor"}</Text>
              <Text style={styles.spec}>{item.doctorId?.specialization || "Specialist"}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.infoText}>{new Date(item.appointmentDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            <Text style={styles.infoText}>{item.appointmentTime}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshing={loading}
          onRefresh={() => {}}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Appointments Yet</Text>
              <Text style={styles.emptySub}>Book a consultation with a doctor</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/doctor-booking")}>
                <Text style={styles.emptyBtnText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 20, paddingVertical: 18, backgroundColor: PRIMARY },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#fff" },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: "#f1f5f9" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#f0fdfa", justifyContent: "center", alignItems: "center" },
  doctorName: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  spec: { fontSize: 12, color: "#64748b" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "800" },
  cardBottom: { flexDirection: "row", gap: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontSize: 13, color: "#475569", fontWeight: "600" },

  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#334155", marginTop: 8 },
  emptySub: { fontSize: 13, color: "#94a3b8" },
  emptyBtn: { marginTop: 16, backgroundColor: PRIMARY, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
