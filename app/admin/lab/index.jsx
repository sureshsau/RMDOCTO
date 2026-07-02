import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../services/axios";

const PURPLE = "#6b6dbf";
const TEAL   = "#14b8a6";
const BG     = "#e6e9f8";
const CARD   = "#ffffff";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";
const RED    = "#ef4444";

export default function LabManagement() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [labsRes, testsRes, ordersRes] = await Promise.all([
          api.get("/labs?limit=1"),
          api.get("/labs/tests/list?limit=1"),
          api.get("/lab/order/view/all?limit=1"),
        ]);
        setStats({
          labs:   labsRes.data?.pagination?.total  ?? 0,
          tests:  testsRes.data?.pagination?.total ?? 0,
          orders: ordersRes.data?.pagination?.total ?? 0,
        });
      } catch {
        setStats({ labs: 0, tests: 0, orders: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const actions = [
    { icon: "business-outline",   label: "All Labs",       route: "/admin/lab/labs-list",  color: PURPLE },
    { icon: "add-circle-outline", label: "Add Lab",        route: "/admin/lab/add-lab",    color: TEAL   },
    { icon: "flask-outline",      label: "Lab Tests",      route: "/admin/lab/tests-list", color: GREEN  },
    { icon: "add-circle",         label: "Add Test",       route: "/admin/lab/add-test",   color: AMBER  },
    { icon: "receipt-outline",    label: "Lab Orders",     route: "/admin/lab/lab-orders", color: RED    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── OVERVIEW CARD ── */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Lab Overview</Text>
          <Text style={styles.overviewSub}>Live diagnostic statistics</Text>
          <View style={styles.statsRow}>
            <StatBadge label="Labs"   value={loading ? "—" : stats?.labs}   />
            <StatBadge label="Tests"  value={loading ? "—" : stats?.tests}  />
            <StatBadge label="Orders" value={loading ? "—" : stats?.orders} />
          </View>
        </View>

        {/* ── QUICK ACCESS ── */}
        <Text style={styles.section}>Quick Access</Text>
        <View style={styles.grid}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionCard}
              onPress={() => router.push(a.route)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: a.color + "22" }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionSub}>Manage {a.label.toLowerCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatBadge({ label, value }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 60 },

  overviewCard: {
    backgroundColor: PURPLE, borderRadius: 24, padding: 22, marginBottom: 28,
  },
  overviewTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  overviewSub:   { color: "rgba(255,255,255,0.75)", fontSize: 12, marginBottom: 20 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statVal:  { color: "#fff", fontSize: 22, fontWeight: "900" },
  statLbl:  { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },

  section: {
    fontSize: 12, fontWeight: "700", color: "#475569",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 14,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  actionCard: {
    width: "47%", backgroundColor: CARD, borderRadius: 20,
    padding: 16, marginBottom: 4, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  actionLabel: { fontWeight: "700", color: "#1e293b", fontSize: 14 },
  actionSub:   { fontSize: 11, color: "#64748b", marginTop: 3 },
});
