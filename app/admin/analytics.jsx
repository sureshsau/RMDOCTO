import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import api from "../../services/axios";

const PRIMARY = "#4f46e5";
const BG = "#f8fafc";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";

const FILTER_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "All Time", value: "all" },
];

export default function AnalyticsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("30d");

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      let startDate = "";
      const now = new Date();
      if (filter === "today") {
        now.setHours(0, 0, 0, 0);
        startDate = now.toISOString();
      } else if (filter === "7d") {
        now.setDate(now.getDate() - 7);
        startDate = now.toISOString();
      } else if (filter === "30d") {
        now.setDate(now.getDate() - 30);
        startDate = now.toISOString();
      }

      const params = startDate ? { startDate } : {};
      const res = await api.get("/admin/analytics", { params });
      
      setData(res.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const fmtMoney = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics & Reports</Text>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.filterBtn, filter === opt.value && styles.filterBtnActive]}
              onPress={() => setFilter(opt.value)}
            >
              <Text style={[styles.filterTxt, filter === opt.value && styles.filterTxtActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : data ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAnalytics(true)} />}
        >
          {/* Overall Stats */}
          <View style={[styles.card, { backgroundColor: PRIMARY, borderColor: PRIMARY }]}>
            <Text style={styles.cardTitleWhite}>Total Revenue</Text>
            <Text style={styles.cardValueWhite}>{fmtMoney(data.overall.totalRevenue)}</Text>
            
            <View style={styles.dividerWhite} />
            
            <Text style={styles.cardTitleWhite}>Total Bookings / Orders</Text>
            <Text style={[styles.cardValueWhite, { fontSize: 22 }]}>{data.overall.totalBookings}</Text>
          </View>

          {/* Department Breakdown */}
          <Text style={styles.sectionTitle}>Department Breakdown</Text>

          <StatCard
            icon="medkit"
            color="#6b6dbf"
            title="Doctor Appointments"
            count={data.doctors.count}
            revenue={data.doctors.revenue}
            onPress={() => router.push(`/admin/analytics/appointments?filter=${filter}`)}
          />

          <StatCard
            icon="storefront"
            color="#14b8a6"
            title="Medicine Orders"
            count={data.medicines.count}
            revenue={data.medicines.revenue}
            onPress={() => router.push(`/admin/analytics/medicines?filter=${filter}`)}
          />

          <StatCard
            icon="flask"
            color="#ec4899"
            title="Lab Bookings"
            count={data.labs.count}
            revenue={data.labs.revenue}
            onPress={() => router.push(`/admin/analytics/labs?filter=${filter}`)}
          />

        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyTxt}>Failed to load analytics</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function StatCard({ icon, color, title, count, revenue, onPress }) {
  const fmtMoney = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;
  return (
    <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statCount}>{count} total</Text>
      </View>
      <View style={{ alignItems: "flex-end", marginRight: 8 }}>
        <Text style={styles.statRevLabel}>Revenue</Text>
        <Text style={[styles.statRevenue, { color }]}>{fmtMoney(revenue)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={TEXT_S} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTxt: { color: TEXT_M, fontSize: 14 },
  
  header: { padding: 20, backgroundColor: CARD },
  headerTitle: { fontSize: 22, fontWeight: "900", color: TEXT_D },

  filterWrap: { backgroundColor: CARD, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  filterScroll: { paddingHorizontal: 16, gap: 10 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f1f5f9" },
  filterBtnActive: { backgroundColor: PRIMARY },
  filterTxt: { fontSize: 13, fontWeight: "700", color: TEXT_M },
  filterTxtActive: { color: "#ffffff" },

  sectionTitle: { fontSize: 15, fontWeight: "800", color: TEXT_D, marginVertical: 14 },

  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
    marginBottom: 8
  },
  cardTitleWhite: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  cardValueWhite: { fontSize: 32, fontWeight: "900", color: "#ffffff", marginTop: 4 },
  dividerWhite: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 16 },

  statCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  iconBox: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  statTitle: { fontSize: 14, fontWeight: "800", color: TEXT_D },
  statCount: { fontSize: 12, color: TEXT_M, marginTop: 2, fontWeight: "600" },
  statRevLabel: { fontSize: 11, color: TEXT_S, fontWeight: "600", marginBottom: 2 },
  statRevenue: { fontSize: 16, fontWeight: "900" },
});
