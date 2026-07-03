import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/axios";

const PURPLE = "#6b6dbf";
const BG = "#f1f5f9";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const GREEN = "#10b981";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const BLUE = "#3b82f6";

const STATUS_CFG = {
  INITIATED: { color: TEXT_S, bg: "#f8fafc", label: "Initiated" },
  CONFIRMED: { color: BLUE, bg: "#eff6ff", label: "Confirmed" },
  SAMPLE_COLLECTED: { color: PURPLE, bg: "#ede9fe", label: "Sample Collected" },
  REPORT_PENDING: { color: AMBER, bg: "#fffbeb", label: "Report Pending" },
  REPORT_READY: { color: GREEN, bg: "#f0fdf4", label: "Report Ready" },
  COMPLETED: { color: GREEN, bg: "#dcfce7", label: "Completed" },
  CANCELLED: { color: RED, bg: "#fef2f2", label: "Cancelled" },
};

const PAYMENT_CFG = {
  PAID: { color: GREEN, bg: "#f0fdf4" },
  PENDING: { color: AMBER, bg: "#fffbeb" },
  FAILED: { color: RED, bg: "#fef2f2" },
};

const fmtMoney = (v) => `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function MyLabOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const LIMIT = 10;

  const load = useCallback(async (pg = 1, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pg === 1) setLoading(true);
      else setMore(true);

      const res = await api.get("/lab/order", { params: { page: pg, limit: LIMIT } });
      const incoming = res.data?.orders ?? [];
      setOrders(pg === 1 ? incoming : (prev) => [...prev, ...incoming]);
      setTotal(res.data?.pagination?.totalOrders ?? 0);
      setTotalPaid(res.data?.totalPaidAmount ?? 0);
      setPage(pg);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(1); }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.centerTxt}>Loading your orders…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={46} color={TEXT_S} />
          <Text style={styles.errTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(1)}>
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => String(i.orderId)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(1, true)} colors={[PURPLE]} />
          }
          onEndReached={() => { if (!more && orders.length < total) load(page + 1); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={more ? <ActivityIndicator color={PURPLE} style={{ marginVertical: 12 }} /> : null}
          ListHeaderComponent={
            <View>
              {/* Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.sumVal}>{total}</Text>
                  <Text style={styles.sumLbl}>Total Orders</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.sumVal}>{fmtMoney(totalPaid)}</Text>
                  <Text style={styles.sumLbl}>Amount Paid</Text>
                </View>
              </View>
              <Text style={styles.sectionLbl}>Recent Orders</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="flask-outline" size={54} color={TEXT_S} />
              <Text style={styles.emptyTitle}>No Lab Orders Yet</Text>
              <Text style={styles.emptyTxt}>Book a test to see your orders here.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => router.push("/lab")}>
                <Text style={styles.retryTxt}>Browse Labs</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => <OrderCard order={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function OrderCard({ order }) {
  const sCfg = STATUS_CFG[order.orderStatus] || STATUS_CFG.INITIATED;
  const pCfg = PAYMENT_CFG[order.paymentStatus] || PAYMENT_CFG.PENDING;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() =>
        router.push({ pathname: "/lab/order-detail", params: { orderId: order.orderId } })
      }
    >
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.orderId}>#{String(order.orderId).slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{fmtDate(order.createdAt)}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 5 }}>
          <View style={[styles.badge, { backgroundColor: sCfg.bg }]}>
            <Text style={[styles.badgeTxt, { color: sCfg.color }]}>{sCfg.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: pCfg.bg }]}>
            <Text style={[styles.badgeTxt, { color: pCfg.color }]}>{order.paymentStatus}</Text>
          </View>
        </View>
      </View>

      {order.lab && (
        <View style={styles.labRow}>
          <Ionicons name="business-outline" size={13} color={TEXT_S} />
          <Text style={styles.labName}>{order.lab.name}, {order.lab.city}</Text>
        </View>
      )}
      {order.test && (
        <Text style={styles.testName} numberOfLines={1}>{order.test.name}</Text>
      )}

      <View style={styles.cardBottom}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="card-outline" size={12} color={TEXT_S} />
          <Text style={styles.metaTxt}>{order.paymentMode}</Text>
        </View>
        <Text style={styles.amt}>{fmtMoney(order.payableAmount)}</Text>
        <Ionicons name="chevron-forward" size={16} color={TEXT_S} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  summaryCard: {
    backgroundColor: PURPLE, borderRadius: 20, padding: 20, marginBottom: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
  },
  summaryItem: { alignItems: "center" },
  summaryDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.3)" },
  sumVal: { color: "#fff", fontSize: 22, fontWeight: "900" },
  sumLbl: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },

  sectionLbl: { fontSize: 12, fontWeight: "700", color: TEXT_M, marginBottom: 10, textTransform: "uppercase" },

  card: {
    backgroundColor: CARD, borderRadius: 16, padding: 14, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  orderId: { fontSize: 14, fontWeight: "800", color: TEXT_D },
  orderDate: { fontSize: 11, color: TEXT_S, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: "700" },

  labRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  labName: { fontSize: 12, color: TEXT_M },
  testName: { fontSize: 13, fontWeight: "600", color: TEXT_D, marginBottom: 8 },

  cardBottom: {
    flexDirection: "row", alignItems: "center",
    borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10,
  },
  metaTxt: { flex: 1, fontSize: 12, color: TEXT_M },
  amt: { fontSize: 15, fontWeight: "900", color: TEXT_D, marginRight: 8 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerTxt: { color: TEXT_M, fontSize: 14 },
  errTxt: { color: RED, fontSize: 14, textAlign: "center" },
  retryBtn: { backgroundColor: PURPLE, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryTxt: { color: "#fff", fontWeight: "700" },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: TEXT_D },
  emptyTxt: { fontSize: 13, color: TEXT_M, textAlign: "center" },
});
