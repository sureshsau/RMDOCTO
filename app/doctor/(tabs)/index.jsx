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
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../services/axios";

const PRIMARY = "#14b8a6";
const BG = "#f8fafc";

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

  /* ================= FETCH ================= */

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

      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* ================= HEADER ================= */}

        <View style={styles.header}>
          <View style={styles.headerRow}>

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
              <Text style={styles.role}>DOCTOR</Text>
              <Text style={styles.date}>{formattedDate}</Text>
            </View>

          </View>
        </View>

        {/* ================= DASHBOARD GRID ================= */}

        <View style={styles.grid}>

  <DashboardCard
    icon="calendar-outline"
    label="Appointments"
    onPress={() => router.push("/doctor/appointments")}
  />

  <DashboardCard
    icon="cube-outline"
    label="Medicine Orders"
    onPress={() => router.push("/mymedicineorder")}
  />

  <DashboardCard
    icon="wallet-outline"
    label="RM Coins"
    onPress={() => router.push("/rmcoin")}
  />

  {/* ✅ NEW MEDICINE STORE CARD */}
  <DashboardCard
    icon="storefront-outline"
    label="Medicine Store"
    onPress={() => router.push("/medicine-store")}
  />

  <DashboardCard
    icon="flask-outline"
    label="Lab Tests"
    onPress={() => router.push("/lab")}
  />

  <DashboardCard
    icon="receipt-outline"
    label="My Lab Orders"
    onPress={() => router.push("/lab/my-orders")}
  />

  <DashboardCard
    icon="scan-outline"
    label="Check-In"
    onPress={() => router.push("/doctor/face-verification")}
  />

  <DashboardCard
    icon="pricetags-outline"
    label="Special Offers"
    onPress={() => router.push("/offers")}
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
          <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 20 }} />
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

        <View style={{ height: 40 }} />

      </ScrollView>
    </View>
  );
}

/* ================= CARD ================= */

function DashboardCard({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={PRIMARY} />
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ================= PATIENT CARD ================= */

function PatientCard({ patient }) {
  return (
    <View style={styles.patientCard}>
      <View style={styles.patientAvatar}>
        <Ionicons name="person" size={20} color={PRIMARY} />
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

/* ================= STYLES ================= */

const styles = StyleSheet.create({

container: { flex: 1, backgroundColor: BG },

header: {
  backgroundColor: PRIMARY,
  padding: 20,
  paddingTop: 50,
  borderBottomLeftRadius: 26,
  borderBottomRightRadius: 26,
},

headerRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
},

avatar: { width: 60, height: 60, borderRadius: 30 },

avatarPlaceholder: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: "#F1F5F9",
  justifyContent: "center",
  alignItems: "center",
},

greeting: { fontSize: 12, color: "#ccfbf1" },
name: { fontSize: 18, fontWeight: "800", color: "#fff" },
role: { fontSize: 11, color: "#e0fdfa" },
date: { fontSize: 11, color: "#ccfbf1", marginTop: 2 },

grid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  padding: 20,
  marginTop: 10,
},

card: {
  width: "48%",
  backgroundColor: "#ffffff",
  borderRadius: 18,
  padding: 20,
  alignItems: "center",
  marginBottom: 14,
  elevation: 3,
},

iconBox: {
  width: 50,
  height: 50,
  borderRadius: 14,
  backgroundColor: "#ecfeff",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 10,
},

cardLabel: {
  fontSize: 13,
  fontWeight: "600",
  color: "#334155",
  textAlign: "center",
},

sectionHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingHorizontal: 20,
  marginBottom: 10,
},

sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
seeAll: { color: PRIMARY, fontWeight: "600" },

patientCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 18,
  marginHorizontal: 20,
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
  backgroundColor: PRIMARY,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 999,
},

timeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

emptyState: { alignItems: "center", marginTop: 30 },
emptyText: { marginTop: 10, color: "#94A3B8" },

});