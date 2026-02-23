import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#14b8a6";
const BG = "#f8fafc";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <Text style={styles.title}>Agent Dashboard</Text>
          <Text style={styles.subtitle}>
            Manage orders, wallet & agents
          </Text>
        </View>

        {/* ================= QUICK STATS ================= */}
        <View style={styles.statsRow}>
          <StatCard title="Wallet Balance" value="₹2,450" />
          <StatCard title="Active Orders" value="12" />
        </View>

        {/* ================= ACTION CARDS ================= */}
        <View style={styles.grid}>
          <ActionCard
            title="RMCREDIT"
            subtitle="Transactions & balance"
            emoji="💰"
            onPress={() => router.push("/agent/rmcredit")}
          />
          <ActionCard
            title="rmcoin"
            subtitle="Transactions & balance"
            emoji="💰"
            onPress={() => router.push("/rmcoin")}
          />

          {/* <ActionCard
            title="My Orders"
            subtitle="Track & manage orders"
            emoji="📦"
            onPress={() => router.push("/agent/(tabs)/medicine/")}
          /> */}

          <ActionCard
            title="Register Agent"
            subtitle="Add new agent"
            emoji="👤"
            onPress={() => router.push("/agent/register")}
          />

          <ActionCard
            title="Medicine Orders"
            subtitle="Customer medicine orders"
            emoji="💊"
            onPress={() => router.push("/mymedicineorder")}
          />
          <ActionCard
            title="Medicine store"
            subtitle="Customer medicine orders"
            emoji="  "
            onPress={() => router.push("/medicine-store")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= SUB COMPONENTS ================= */

const StatCard = ({ title, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const ActionCard = ({ title, subtitle, emoji, onPress }) => (
  <TouchableOpacity
    style={styles.actionCard}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSub}>{subtitle}</Text>
  </TouchableOpacity>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    padding: 20,
    paddingTop: 28,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },

  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  /* ===== STATS ===== */
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    elevation: 2,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: PRIMARY,
  },

  statTitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },

  /* ===== ACTION GRID ===== */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingHorizontal: 16,
  },

  actionCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    elevation: 3,
  },

  emoji: {
    fontSize: 26,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },

  cardSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
});
