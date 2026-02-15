import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../services/axios";

export default function DoctorDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  /* ================= FETCH TODAY PATIENTS ================= */

  const fetchTodayPatients = async () => {
    try {
      setLoadingPatients(true);

      const res = await api.get("/appointment/doctor/bookings", {
        params: {
          filterType: "today",
          page: 1,
          limit: 10,
        },
      });

      if (res.data?.success) {
        setPatients(res.data.data || []);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.log("Error loading patients:", err?.response?.data);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTodayPatients();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayPatients();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={26} color="#94A3B8" />
                </View>
              )}

              <View>
                <Text style={styles.greeting}>Welcome Back 👋</Text>
                <Text style={styles.name}>{user?.name || "Doctor"}</Text>

                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>DOCTOR</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================= DATE CARD ================= */}
          <View style={styles.dateCard}>
            <Ionicons name="calendar-outline" size={20} color="#1BA6A6" />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          {/* ================= QUICK ACTIONS ================= */}
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="calendar-outline"
              label="Appointments"
              bgColor="#ECFEFF"
              iconColor="#0891B2"
              onPress={() => router.push("/doctor/appointments")}
            />

            <QuickAction
              icon="medkit-outline"
              label="Medicine Orders"
              bgColor="#DCFCE7"
              iconColor="#16A34A"
              onPress={() => router.push("/mymedicineorder")}
            />

            <QuickAction
              icon="wallet-outline"
              label="RM Coins"
              bgColor="#FEF3C7"
              iconColor="#CA8A04"
              onPress={() => router.push("/rmcoin")}
            />

            <QuickAction
              icon="scan-outline"
              label="Check-In"
              bgColor="#D1F2EB"
              iconColor="#1BA6A6"
              onPress={() => router.push("/doctor/face-verification")}
            />
          </View>

          {/* ================= TODAY PATIENTS ================= */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today’s Patients</Text>

            <TouchableOpacity onPress={() => router.push("/doctor/appointments")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadingPatients ? (
            <ActivityIndicator size="large" color="#1BA6A6" style={{ marginTop: 20 }} />
          ) : patients.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>No appointments today</Text>
            </View>
          ) : (
            patients.map((item) => (
              <PatientCard key={item._id} patient={item} />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ================= PATIENT CARD ================= */

function PatientCard({ patient }) {
  return (
    <View style={styles.patientCard}>
      <View style={styles.patientAvatar}>
        <Ionicons name="person" size={20} color="#1BA6A6" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.patientName}>{patient.patientName}</Text>
        <Text style={styles.patientPhone}>{patient.patientPhone}</Text>
      </View>

      <View style={styles.timeBadge}>
        <Text style={styles.timeText}>{patient.appointmentTime}</Text>
      </View>
    </View>
  );
}

/* ================= QUICK ACTION ================= */

function QuickAction({ icon, label, bgColor, iconColor, onPress }) {
  return (
    <TouchableOpacity style={styles.quickActionItem} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.qaIconWrapper, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.qaText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: { marginBottom: 30 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },

  avatar: { width: 58, height: 58, borderRadius: 29 },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  greeting: { fontSize: 13, color: "#64748B" },
  name: { fontSize: 20, fontWeight: "700", color: "#0F172A", marginTop: 4 },

  roleBadge: {
    marginTop: 6,
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  roleText: { fontSize: 11, fontWeight: "600", color: "#1BA6A6" },

  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,
    elevation: 2,
  },

  dateText: { fontSize: 14, fontWeight: "600", color: "#0F172A" },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  quickActionItem: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },

  qaIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  qaText: { fontSize: 12, fontWeight: "600", color: "#334155" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },

  seeAll: { color: "#1BA6A6", fontWeight: "600" },

  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 2,
  },

  patientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ECFEFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  patientName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  patientPhone: { fontSize: 12, color: "#64748B", marginTop: 2 },

  timeBadge: {
    backgroundColor: "#1BA6A6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  timeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  emptyState: { alignItems: "center", marginTop: 30 },
  emptyText: { marginTop: 10, color: "#94A3B8" },
});
