import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function MedicineManagement() {
  return (
    <View style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* OVERVIEW */}
        <View style={styles.overviewBox}>
          <Text style={styles.overviewTitle}>Pharmacy Overview</Text>
          <Text style={styles.overviewSub}>Today’s medicine status</Text>

          <View style={styles.overviewRow}>
            <OverviewStat label="Medicines" value="320" />
            <OverviewStat label="Low Stock" value="18" />
            <OverviewStat label="Sold" value="94" />
            <OverviewStat label="Revenue" value="₹45K" />
          </View>
        </View>

        <Section title="Quick Access" />

        <View style={styles.cardGrid}>
          <ActionCard icon="cube" label="All Medicines" onPress={() => router.push("/admin/medicine/medicine-list")} />
          <ActionCard icon="alert-circle" label="Low Stock" onPress={() => router.push("/(tabs)/medicine/low-stock")} />
          <ActionCard icon="cart" label="Sales" />
          <ActionCard icon="add-circle" label="Add Medicine" onPress={() => router.push("/admin/medicine/upload")} />
          <ActionCard icon="document-text" label="Invoices" />
          <ActionCard icon="people" label="Suppliers" />
        </View>

        <Section title="Recent Activity" />

        <ActivityCard title="Paracetamol sold" subtitle="10 strips • ₹250" />
        <ActivityCard title="New stock added" subtitle="Amoxicillin • 50 units" />
        <ActivityCard title="Low stock alert" subtitle="Insulin Injection" />
      </ScrollView>
    </View>
  );
}

/* COMPONENTS */

const Section = ({ title }) => (
  <Text style={styles.section}>{title}</Text>
);

const OverviewStat = ({ label, value }) => (
  <View style={{ alignItems: "center" }}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionCard = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.iconBox}>
      <Ionicons name={icon} size={22} color="#6b6dbf" />
    </View>
    <Text style={styles.cardTitle}>{label}</Text>
    <Text style={styles.cardSub}>Manage {label.toLowerCase()}</Text>
  </TouchableOpacity>
);

const ActivityCard = ({ title, subtitle }) => (
  <View style={styles.activity}>
    <Text style={styles.activityTitle}>{title}</Text>
    <Text style={styles.activitySub}>{subtitle}</Text>
  </View>
);

/* STYLES */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e6e9f8" },
  scroll: { padding: 20, paddingBottom: 140 },

  overviewBox: {
    backgroundColor: "#6b6dbf",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  overviewTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  overviewSub: { color: "#ddd", fontSize: 12, marginBottom: 16 },
  overviewRow: { flexDirection: "row", justifyContent: "space-between" },

  statValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLabel: { color: "#ddd", fontSize: 11 },

  section: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },

  cardGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#6b6dbf22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: { fontWeight: "600", color: "#1e293b" },
  cardSub: { fontSize: 11, color: "#64748b", marginTop: 4 },

  activity: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  activityTitle: { fontWeight: "600", color: "#0f172a" },
  activitySub: { fontSize: 12, color: "#64748b", marginTop: 4 },
});