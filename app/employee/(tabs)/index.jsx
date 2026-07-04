import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";

/* ─── Theme ─── */
const PRIMARY   = "#14b8a6";
const BG        = "#f0fdfa";
const CARD      = "#ffffff";

/* ─── Animated Card ─── */
function AnimCard({ delay = 0, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ─── Dashboard Grid Card ─── */
function DashboardCard({ icon, label, onPress, color, delay = 0 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress && onPress();
  };
  return (
    <AnimCard delay={delay} style={{ width: "48%" }}>
      <TouchableOpacity activeOpacity={0.9} onPress={press}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <Text style={styles.cardLabel}>{label}</Text>
        </Animated.View>
      </TouchableOpacity>
    </AnimCard>
  );
}

/* ═══════════════════════════════════════════════
   EMPLOYEE DASHBOARD
═══════════════════════════════════════════════ */
export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ═══════════ HEADER ═══════════ */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color="#94A3B8" />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Welcome Back 👋</Text>
              <Text style={styles.name}>{user?.name || "Employee"}</Text>
              <Text style={styles.date}>{formattedDate}</Text>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="briefcase-outline" size={11} color="#fff" />
              <Text style={styles.badgeText}>  Employee / Staff</Text>
            </View>
          </View>
        </View>

        {/* ═══════════ APPOINTMENT CARD ═══════════ */}
        <AnimCard delay={120}>
          <View style={styles.appointmentCard}>
            <Ionicons name="calendar-outline" size={34} color="#94a3b8" />
            <Text style={styles.appointmentTitle}>No Upcoming Appointments</Text>
            <Text style={styles.appointmentSub}>Book an appointment with a doctor</Text>
            <TouchableOpacity style={styles.bookBtn} activeOpacity={0.85}>
              <Text style={styles.bookBtnText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        </AnimCard>

        {/* ═══════════ DASHBOARD GRID ═══════════ */}
        <View style={styles.grid}>
          <DashboardCard
            icon="scan-outline"
            label="Check-In"
            color="#ef4444"
            delay={150}
            onPress={() => router.push("/employee/face-verification")}
          />
          <DashboardCard
            icon="calendar-number-outline"
            label="Attendance"
            color="#ec4899"
            delay={400}
            onPress={() => router.push("/employee/(tabs)/attendance")}
          />
          <DashboardCard
            icon="storefront-outline"
            label="Medicine Store"
            color="#0ea5e9"
            delay={200}
            onPress={() => router.push("/medicine-store")}
          />
          <DashboardCard
            icon="flask-outline"
            label="Lab Tests"
            color="#6b21a8"
            onPress={() => router.push("/lab")}
            delay={600}
          />
          <DashboardCard
            icon="receipt-outline"
            label="My Lab Orders"
            color="#db2777"
            onPress={() => router.push("/lab/my-orders")}
            delay={700}
          />
          <DashboardCard
            icon="cube-outline"
            label="My Orders"
            color="#8b5cf6"
            delay={250}
            onPress={() => router.push("/mymedicineorder")}
          />
          <DashboardCard
            icon="wallet-outline"
            label="RM Coins"
            color="#f59e0b"
            delay={300}
            onPress={() => router.push("/rmcoin")}
          />
          <DashboardCard
            icon="person-circle-outline"
            label="My Profile"
            color={PRIMARY}
            delay={350}
            onPress={() => router.push("/employee/(tabs)/profile")}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  /* HEADER */
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "#fff" },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  greeting:  { fontSize: 12, color: "#ccfbf1" },
  name:      { fontSize: 18, fontWeight: "800", color: "#fff" },
  date:      { fontSize: 11, color: "#ccfbf1", marginTop: 2 },
  logoutBtn: { backgroundColor: "rgba(0,0,0,0.18)", padding: 10, borderRadius: 20 },

  badgeRow:  { flexDirection: "row", gap: 8, marginTop: 14 },
  badge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  /* APPOINTMENT */
  appointmentCard: {
    backgroundColor: CARD,
    marginHorizontal: 18,
    marginTop: -20,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    elevation: 3,
  },
  appointmentTitle: { marginTop: 10, fontSize: 14, fontWeight: "700", color: "#0f172a" },
  appointmentSub:   { fontSize: 11, color: "#64748b", marginTop: 4 },
  bookBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 12,
  },
  bookBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  /* GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 12,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 8,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardLabel: { fontSize: 13, fontWeight: "700", color: "#334155", textAlign: "center" },
});
