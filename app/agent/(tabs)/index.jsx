import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#14b8a6";
const BG = "#f1f5f9";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Agent Dashboard
          </Text>
          <Text style={styles.headerSub}>
            Manage Orders • Wallet • Network
          </Text>
        </View>

        {/* ================= QUICK STATS ================= */}
        {/* <View style={styles.statsWrapper}>
          <StatCard
            icon="wallet-outline"
            label="Wallet Balance"
            value="₹ 2,450"
          />

          <StatCard
            icon="cube-outline"
            label="Active Orders"
            value="12"
          />
        </View> */}

        {/* ================= ACTION GRID ================= */}
        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View style={styles.grid}>

          <ActionCard
            icon="cash-outline"
            title="RM Credit"
            subtitle="View balance & history"
            onPress={() => router.push("/agent/rmcredit")}
          />

          <ActionCard
            icon="logo-bitcoin"
            title="RM Coin"
            subtitle="Wallet transactions"
            onPress={() => router.push("/rmcoin")}
          />

          <ActionCard
            icon="person-add-outline"
            title="Register Agent"
            subtitle="Add new downline"
            onPress={() => router.push("/agent/register")}
          />

          <ActionCard
            icon="medkit-outline"
            title="Medicine Orders"
            subtitle="Customer orders"
            onPress={() => router.push("/mymedicineorder")}
          />

          <ActionCard
            icon="storefront-outline"
            title="Medicine Store"
            subtitle="Buy medicines"
            onPress={() => router.push("/medicine-store")}
          />

        </View>

      </ScrollView>
    </View>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={22} color={PRIMARY} />
      </View>

      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function ActionCard({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={styles.actionCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: 0
  },

  header: {
    backgroundColor: PRIMARY,
    padding: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    paddingTop: 50
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },

  headerSub: {
    color: "#ccfbf1",
    marginTop: 4,
    fontSize: 13,
  },

  statsWrapper: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 22,
  },

  statCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    elevation: 3,
    alignItems: "center",
  },

  statIcon: {
    backgroundColor: "#ecfeff",
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },

  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },

  sectionTitle: {
    paddingHorizontal: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingHorizontal: 16,
  },

  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    elevation: 4,
  },

  actionIcon: {
    backgroundColor: PRIMARY,
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },

  cardSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },

});