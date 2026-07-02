import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import api from "../../../services/axios";

const PURPLE = "#6b6dbf";
const BG     = "#f1f5f9";
const CARD   = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const GREEN  = "#10b981";
const RED    = "#ef4444";
const AMBER  = "#f59e0b";
const BLUE   = "#3b82f6";

const STATUS_CFG = {
  INITIATED:        { color: TEXT_S, bg: "#f8fafc",  label: "Initiated"        },
  CONFIRMED:        { color: BLUE,   bg: "#eff6ff",  label: "Confirmed"        },
  SAMPLE_COLLECTED: { color: PURPLE, bg: "#ede9fe",  label: "Collected"        },
  REPORT_PENDING:   { color: AMBER,  bg: "#fffbeb",  label: "Report Pending"   },
  REPORT_READY:     { color: GREEN,  bg: "#f0fdf4",  label: "Report Ready"     },
  COMPLETED:        { color: GREEN,  bg: "#dcfce7",  label: "Completed"        },
  CANCELLED:        { color: RED,    bg: "#fef2f2",  label: "Cancelled"        },
};

const PAYMENT_CFG = {
  PAID:    { color: GREEN, bg: "#f0fdf4" },
  PENDING: { color: AMBER, bg: "#fffbeb" },
  FAILED:  { color: RED,   bg: "#fef2f2" },
};

const STATUS_FILTERS = ["ALL", "INITIATED", "CONFIRMED", "SAMPLE_COLLECTED", "REPORT_PENDING", "REPORT_READY", "COMPLETED", "CANCELLED"];

const fmtMoney = (v) => `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
const fmtDate  = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function LabOrders() {
  const [orders,     setOrders]     = useState([]);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [status,     setStatus]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [more,       setMore]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const LIMIT = 20;

  const load = useCallback(async (pg = 1, s = status, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pg === 1) setLoading(true);
      else setMore(true);

      const res = await api.get("/lab/order/view/all", {
        params: { page: pg, limit: LIMIT, orderStatus: s || undefined },
      });
      const incoming = res.data?.data ?? [];
      setOrders(pg === 1 ? incoming : (prev) => [...prev, ...incoming]);
      setTotal(res.data?.pagination?.total ?? 0);
      setPage(pg);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setMore(false);
      setRefreshing(false);
    }
  }, [status]);

  useEffect(() => { load(1); }, []);

  const pickStatus = (s) => { setStatus(s); load(1, s); };
  const loadMore   = () => { if (more || orders.length >= total) return; load(page + 1); };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* Status Filters */}
      <FlatList
        data={STATUS_FILTERS}
        horizontal
        keyExtractor={(i) => i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pill, (status === item || (item === "ALL" && !status)) && styles.pillActive]}
            onPress={() => pickStatus(item === "ALL" ? "" : item)}
          >
            <Text style={[(status === item || (item === "ALL" && !status)) ? styles.pillTxtA : styles.pillTxt]}>
              {STATUS_CFG[item]?.label ?? item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.centerTxt}>Loading orders…</Text>
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
          keyExtractor={(i) => i.orderId}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(1, status, true)} colors={[PURPLE]} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={more ? <ActivityIndicator color={PURPLE} style={{ marginVertical: 12 }} /> : null}
          ListHeaderComponent={<Text style={styles.totalTxt}>{total} order{total !== 1 ? "s" : ""}</Text>}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={46} color={TEXT_S} />
              <Text style={styles.emptyTitle}>No Orders</Text>
            </View>
          }
          renderItem={({ item }) => <OrderCard order={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function OrderCard({ order }) {
  const sCfg = STATUS_CFG[order.orderStatus]    || STATUS_CFG.INITIATED;
  const pCfg = PAYMENT_CFG[order.paymentStatus] || PAYMENT_CFG.PENDING;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() =>
        router.push({ pathname: "/admin/lab/lab-order-detail", params: { orderId: order.orderId } })
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

      <View style={styles.cardMid}>
        {order.user ? (
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={12} color={TEXT_S} />
            <Text style={styles.metaTxt}>{order.user.name} · {order.user.phone}</Text>
          </View>
        ) : null}
        {order.lab ? (
          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={12} color={TEXT_S} />
            <Text style={styles.metaTxt}>{order.lab.name}, {order.lab.city}</Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <Ionicons name="flask-outline" size={12} color={TEXT_S} />
          <Text style={styles.metaTxt}>{order.testsCount} test{order.testsCount !== 1 ? "s" : ""} · {order.collectionType}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.metaRow}>
          <Ionicons name="card-outline" size={12} color={TEXT_S} />
          <Text style={styles.metaTxt}>{order.paymentMode}</Text>
        </View>
        <Text style={styles.orderAmt}>{fmtMoney(order.payableAmount)}</Text>
        <Ionicons name="chevron-forward" size={16} color={TEXT_S} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  pills: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8 },
  pill: {
    flexShrink: 0, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: CARD,
  },
  pillActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  pillTxt:  { fontSize: 12, fontWeight: "600", color: TEXT_M },
  pillTxtA: { fontSize: 12, fontWeight: "600", color: "#fff" },

  totalTxt: { fontSize: 12, color: TEXT_M, fontWeight: "600", marginBottom: 10 },

  card: {
    backgroundColor: CARD, borderRadius: 16, padding: 14, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardTop:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  cardMid:  { gap: 4, marginBottom: 10 },
  cardBottom: {
    flexDirection: "row", alignItems: "center",
    borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10,
  },

  orderId:   { fontSize: 14, fontWeight: "800", color: TEXT_D },
  orderDate: { fontSize: 11, color: TEXT_S, marginTop: 2 },
  badge:     { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt:  { fontSize: 11, fontWeight: "700" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  metaTxt: { fontSize: 12, color: TEXT_M },
  orderAmt: { fontSize: 15, fontWeight: "900", color: TEXT_D, marginRight: 8 },

  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerTxt:  { color: TEXT_M, fontSize: 14 },
  errTxt:     { color: RED, fontSize: 14, textAlign: "center" },
  retryBtn:   { backgroundColor: PURPLE, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryTxt:   { color: "#fff", fontWeight: "700" },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: TEXT_D },
});
