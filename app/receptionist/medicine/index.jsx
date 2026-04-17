import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMedicine } from "../../../context/MedicineContext";

export default function ReceptionistMedicineManagement() {
  const { getMedicines } = useMedicine();
  const [stats, setStats] = useState({ total: 0, lowStock: 0, sold: 0, revenue: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const res = await getMedicines({ limit: 1000 });
      if (res.success && res.data) {
        let lowStockCount = 0, totalSold = 0, totalRevenue = 0;
        res.data.forEach((medicine) => {
          const qty = medicine.stock?.totalQuantity || 0;
          const minAlert = medicine.stock?.minAlertQuantity || 10;
          if (qty <= minAlert) lowStockCount++;
          const sold = medicine.sold || medicine.totalSold || 0;
          totalSold += sold;
          totalRevenue += sold * (medicine.pricing?.price || medicine.price || 0);
        });
        setStats({
          total: res.pagination?.totalItems || res.data.length,
          lowStock: lowStockCount,
          sold: totalSold,
          revenue: totalRevenue > 0 ? `₹${(totalRevenue / 1000).toFixed(1)}K` : "₹0",
        });
      }
    };
    fetchStats();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* OVERVIEW */}
        <View style={styles.overviewBox}>
          <Text style={styles.overviewTitle}>Pharmacy Overview</Text>
          <Text style={styles.overviewSub}>Today's medicine status</Text>
          <View style={styles.overviewRow}>
            <OverviewStat label="Medicines" value={stats.total} />
            <OverviewStat label="Low Stock" value={stats.lowStock} />
            <OverviewStat label="Sold" value={stats.sold} />
            <OverviewStat label="Revenue" value={stats.revenue} />
          </View>
        </View>

        <Section title="Quick Access" />

        <View style={styles.cardGrid}>
          {/* ✅ Navigate to receptionist's own medicine-list route */}
          <ActionCard icon="cube" label="All Medicines"
            onPress={() => router.push("/receptionist/medicine/medicine-list")} />
          <ActionCard icon="alert-circle" label="Low Stock" />
          <ActionCard icon="cart" label="Sales" />
          {/* ✅ Navigate to receptionist's own upload route */}
          <ActionCard icon="add-circle" label="Add Medicine"
            onPress={() => router.push("/receptionist/medicine/upload")} />
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

const Section = ({ title }) => <Text style={styles.section}>{title}</Text>;
const OverviewStat = ({ label, value }) => (
  <View style={{ alignItems: "center" }}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);
const ActionCard = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.iconBox}>
      <Ionicons name={icon} size={22} color="#14b8a6" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdfa" },
  scroll: { padding: 20, paddingBottom: 140 },
  overviewBox: { backgroundColor: "#14b8a6", borderRadius: 24, padding: 20, marginBottom: 24 },
  overviewTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  overviewSub: { color: "#ccfbf1", fontSize: 12, marginBottom: 16 },
  overviewRow: { flexDirection: "row", justifyContent: "space-between" },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLabel: { color: "#ccfbf1", fontSize: 11 },
  section: { marginTop: 28, marginBottom: 12, fontSize: 12, fontWeight: "700", color: "#475569" },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { backgroundColor: "#fff", width: "48%", padding: 16, borderRadius: 18, marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  cardTitle: { fontWeight: "600", color: "#1e293b" },
  cardSub: { fontSize: 11, color: "#64748b", marginTop: 4 },
  activity: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 12 },
  activityTitle: { fontWeight: "600", color: "#0f172a" },
  activitySub: { fontSize: 12, color: "#64748b", marginTop: 4 },
});
