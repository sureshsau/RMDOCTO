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
import { useAuth } from "../../../context/AuthContext.jsx";

const PRIMARY = "#1BA6A6";
const BG = "#f8fafc";

export default function ReceptionistDashboard() {

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

      <View style={{ flex: 1 }}>
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
                <Text style={styles.name}>{user?.name || "Receptionist"}</Text>

                <Text style={styles.role}>
                  {user?.roles?.[0]?.toUpperCase() || "RECEPTIONIST"}
                </Text>

                <Text style={styles.date}>{formattedDate}</Text>
              </View>

            </View>
          </View>

          {/* ================= DASHBOARD GRID ================= */}

          <View style={styles.grid}>

            <DashboardCard
              icon="cube-outline"
              label="My Medicine Orders"
              onPress={() => router.push("/mymedicineorder")}
            />

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
              icon="people-outline"
              label="Patients"
              onPress={() => router.push("/receptionist/appointments")}
            />

            <DashboardCard
              icon="medkit-outline"
              label="Book Doctor"
              onPress={() => router.push("/doctor-booking")}
            />

            <DashboardCard
              icon="wallet-outline"
              label="RM Coins"
              onPress={() => router.push("/rmcoin")}
            />

            <DashboardCard
              icon="scan-outline"
              label="Check-In"
              onPress={() => router.push("/receptionist/face-verification")}
            />

            <DashboardCard
              icon="receipt-outline"
              label="Medicine Orders"
              onPress={() => router.push("/receptionist/(tabs)/medicineorder")}
            />

            <DashboardCard
              icon="medkit-outline"
              label="Medicine Management"
              onPress={() => router.push("/receptionist/medicine")}
            />

            <DashboardCard
              icon="pricetags-outline"
              label="Special Offers"
              onPress={() => router.push("/offers")}
            />

          </View>

        </ScrollView>
      </View>
    </View>
  );
}

/* ================= CARD ================= */

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

  role: {
    fontSize: 11,
    color: "#e0fdfa",
  },

  date: {
    fontSize: 11,
    color: "#ccfbf1",
    marginTop: 2,
  },

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