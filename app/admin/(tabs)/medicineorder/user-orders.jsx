import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../../services/axios";

/* ─── BRAND ─────────────────────────────────────── */
const TEAL      = "#14b8a6";
const BG        = "#f1f5f9";
const CARD      = "#ffffff";
const TEXT_DARK = "#0f172a";
const TEXT_MID  = "#475569";
const TEXT_SOFT = "#94a3b8";
const GREEN     = "#10b981";
const RED       = "#ef4444";
const AMBER     = "#f59e0b";
const PURPLE    = "#6b6dbf";

const RANGE_OPTIONS = ["today", "week", "month", "year", "all"];

const STATUS_CFG = {
  INITIATED: { color: TEXT_SOFT, bg: "#f1f5f9", label: "Initiated" },
  CONFIRMED: { color: "#3b82f6", bg: "#eff6ff", label: "Confirmed" },
  SHIPPED:   { color: AMBER,     bg: "#fffbeb", label: "Shipped"   },
  DELIVERED: { color: GREEN,     bg: "#f0fdf4", label: "Delivered" },
  CANCELLED: { color: RED,       bg: "#fef2f2", label: "Cancelled" },
};

const PAYMENT_CFG = {
  PAID:    { color: GREEN, bg: "#f0fdf4" },
  PENDING: { color: AMBER, bg: "#fffbeb" },
  FAILED:  { color: RED,   bg: "#fef2f2" },
};

const fmtMoney = (v) =>
  `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

/* ─── SUMMARY CHIPS ─────────────────────────────── */
function SummaryRow({ summary }) {
  const chips = [
    { label: "Orders",    value: summary.totalOrders,            color: PURPLE, icon: "receipt-outline" },
    { label: "Revenue",   value: fmtMoney(summary.totalRevenue), color: TEAL,   icon: "cash-outline" },
    { label: "Delivered", value: summary.delivered,              color: GREEN,  icon: "checkmark-circle-outline" },
    { label: "Pending",   value: summary.pending,                color: AMBER,  icon: "time-outline" },
    { label: "Cancelled", value: summary.cancelled,              color: RED,    icon: "close-circle-outline" },
  ];
  return (
    <View style={styles.summaryGrid}>
      {chips.map((c) => (
        <View key={c.label} style={[styles.summaryChip, { borderColor: c.color + "30" }]}>
          <Ionicons name={c.icon} size={15} color={c.color} />
          <Text style={[styles.summaryVal, { color: c.color }]}>{String(c.value)}</Text>
          <Text style={styles.summaryLabel}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ─── ORDER CARD ─────────────────────────────────── */
function OrderCard({ order }) {
  const sCfg = STATUS_CFG[order.orderStatus]    || STATUS_CFG.INITIATED;
  const pCfg = PAYMENT_CFG[order.paymentStatus] || PAYMENT_CFG.PENDING;

  return (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.8}
      onPress={() =>
        // navigate within the same medicineorder stack → gets back button automatically
        router.push({
          pathname: "/admin/(tabs)/medicineorder/[orderId]",
          params: { orderId: order._id },
        })
      }
    >
      {/* Top row */}
      <View style={styles.orderTop}>
        <View>
          <Text style={styles.orderId}>#{String(order._id).slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{fmtDate(order.createdAt)}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 5 }}>
          <View style={[styles.badge, { backgroundColor: sCfg.bg }]}>
            <Text style={[styles.badgeText, { color: sCfg.color }]}>{sCfg.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: pCfg.bg }]}>
            <Text style={[styles.badgeText, { color: pCfg.color }]}>{order.paymentStatus}</Text>
          </View>
        </View>
      </View>

      {/* Bottom row */}
      <View style={styles.orderBottom}>
        <View style={styles.orderMeta}>
          <Ionicons name="card-outline" size={12} color={TEXT_SOFT} />
          <Text style={styles.orderMetaTxt}>{order.paymentMode}</Text>
        </View>
        <Text style={styles.orderAmt}>{fmtMoney(order.pricing?.payableAmount)}</Text>
        <Ionicons name="chevron-forward" size={16} color={TEXT_SOFT} />
      </View>
    </TouchableOpacity>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────── */
export default function UserOrdersPage() {
  const { userId, userName } = useLocalSearchParams();

  const [range,      setRange]      = useState("month");
  const [summary,    setSummary]    = useState(null);
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const rangeParam = range === "all" ? "" : `range=${range}`;
      const res = await api.get(
        `/medicine/order/stats/user/${userId}${rangeParam ? `?${rangeParam}` : ""}`
      );
      setSummary(res.data?.summary ?? null);
      setOrders(res.data?.orders ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, range]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>

      {/* Range Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, maxHeight: 60 }}
        contentContainerStyle={styles.rangePills}
      >
        {RANGE_OPTIONS.map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRange(r)}
            style={[
              styles.rangePill,
              range === r && { backgroundColor: TEAL, borderColor: TEAL },
            ]}
          >
            <Text style={[styles.rangePillText, range === r && { color: "#fff" }]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.centerText}>Loading orders…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={46} color={TEXT_SOFT} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[TEAL]} />
          }
          ListHeaderComponent={
            summary ? <SummaryRow summary={summary} /> : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={46} color={TEXT_SOFT} />
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptyText}>No orders in the selected range.</Text>
            </View>
          }
          renderItem={({ item }) => <OrderCard order={item} />}
        />
      )}
    </SafeAreaView>
  );
}

/* ─── STYLES ─────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  /* range pills — key fix: flexShrink:0 prevents stretching */
  rangePills: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  rangePill: {
    flexShrink: 0,           // ← prevents pills from stretching
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: CARD,
  },
  rangePillText: { fontSize: 13, fontWeight: "600", color: TEXT_MID },

  summaryGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
    marginBottom: 16, marginTop: 8,
  },
  summaryChip: {
    width: "29%", backgroundColor: CARD, borderRadius: 14, borderWidth: 1,
    padding: 12, alignItems: "center", gap: 4, elevation: 1,
  },
  summaryVal:   { fontSize: 16, fontWeight: "900" },
  summaryLabel: { fontSize: 10, color: TEXT_SOFT, fontWeight: "600", textAlign: "center" },

  /* order card */
  orderCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 14, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  orderTop:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  orderId:   { fontSize: 14, fontWeight: "800", color: TEXT_DARK },
  orderDate: { fontSize: 12, color: TEXT_SOFT, marginTop: 2 },
  badge:     { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  orderBottom: {
    flexDirection: "row", alignItems: "center",
    borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10,
  },
  orderMeta:    { flex: 1, flexDirection: "row", alignItems: "center", gap: 5 },
  orderMetaTxt: { fontSize: 12, color: TEXT_MID, fontWeight: "600" },
  orderAmt:     { fontSize: 15, fontWeight: "900", color: TEXT_DARK, marginRight: 8 },

  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerText: { color: TEXT_MID, fontSize: 14 },
  errorText:  { color: RED, fontSize: 14, textAlign: "center", fontWeight: "500" },
  retryBtn:   { backgroundColor: TEAL, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryText:  { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: TEXT_DARK },
  emptyText:  { fontSize: 13, color: TEXT_MID, textAlign: "center" },
});
