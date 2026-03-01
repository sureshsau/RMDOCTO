import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const PRIMARY = "#14b8a6";
const BG = "#f8fafc";

export default function UserDashboard() {

  const router = useRouter();
  const { user } = useAuth();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>

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
      <Text style={styles.name}>{user?.name || "User"}</Text>
      <Text style={styles.date}>{formattedDate}</Text>
    </View>

  </View>
</View>

{/* ================= APPOINTMENT SECTION ================= */}

<View style={styles.appointmentCard}>

  <Ionicons name="calendar-outline" size={34} color="#94a3b8" />

  <Text style={styles.appointmentTitle}>
    No Upcoming Appointments
  </Text>

  <Text style={styles.appointmentSub}>
    Book an appointment with a doctor
  </Text>

  <TouchableOpacity
    style={styles.bookBtn}
    
  >
    <Text style={styles.bookBtnText}>
      Book Appointment
    </Text>
  </TouchableOpacity>

</View>

{/* ================= DASHBOARD GRID ================= */}

<View style={styles.grid}>

  <DashboardCard
    icon="storefront-outline"
    label="Medicine Store"
    onPress={() => router.push("/medicine-store")}
  />

  <DashboardCard
    icon="cube-outline"
    label="My Orders"
    onPress={() => router.push("/mymedicineorder")}
  />

  <DashboardCard
    icon="wallet-outline"
    label="RM Coins"
    onPress={() => router.push("/rmcoin")}
  />

  <DashboardCard
    icon="person-circle-outline"
    label="My Profile"
    onPress={() => router.push("/root/profile")}
  />

</View>

<View style={{ height: 40 }} />

      </ScrollView>
    </View>
  );
}

/* ================= CARD COMPONENT ================= */

function DashboardCard({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={PRIMARY} />
      </View>

      <Text style={styles.cardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({

container: {
  flex: 1,
  backgroundColor: BG,
},

/* HEADER */

header: {
  backgroundColor: PRIMARY,
  padding: 20,
  borderBottomLeftRadius: 26,
  borderBottomRightRadius: 26,
  paddingTop: 50,
},

headerRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
},

avatar: {
  width: 60,
  height: 60,
  borderRadius: 30,
},

avatarPlaceholder: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: "#F1F5F9",
  justifyContent: "center",
  alignItems: "center",
},

greeting: {
  fontSize: 12,
  color: "#ccfbf1",
},

name: {
  fontSize: 18,
  fontWeight: "800",
  color: "#fff",
},

date: {
  fontSize: 11,
  color: "#ccfbf1",
  marginTop: 2,
},

/* APPOINTMENT */

appointmentCard: {
  backgroundColor: "#ffffff",
  marginHorizontal: 20,
  marginTop: 20,
  padding: 20,
  borderRadius: 20,
  alignItems: "center",
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: "#cbd5e1",
},

appointmentTitle: {
  marginTop: 10,
  fontSize: 14,
  fontWeight: "700",
  color: "#0f172a",
},

appointmentSub: {
  fontSize: 11,
  color: "#64748b",
  marginTop: 4,
},

bookBtn: {
  backgroundColor: PRIMARY,
  paddingHorizontal: 18,
  paddingVertical: 8,
  borderRadius: 12,
  marginTop: 12,
},

bookBtnText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 12,
},

/* GRID */

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

});