import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import api from "../../services/axios";

const PURPLE = "#6b6dbf";
const TEAL = "#14b8a6";
const BG = "#f8fafc";
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

const fmtMoney = (v) => `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
    : "—";

export default function UserOrderDetail() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchOrder = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await api.get(`/lab/order/${orderId}`);
      setOrder(res.data?.data ?? null);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load order" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => { if (orderId) fetchOrder(); }, [orderId]);

  const deletePrescription = () => {
    Alert.alert("Delete Prescription", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/lab/order/${orderId}/prescription`);
            Toast.show({ type: "success", text1: "Prescription deleted" });
            fetchOrder(true);
          } catch (e) {
            Toast.show({ type: "error", text1: e?.response?.data?.message || "Delete failed" });
          }
        },
      },
    ]);
  };

  const openReport = () => {
    if (order?.reportUrl) {
      Linking.openURL(order.reportUrl).catch(() =>
        Toast.show({ type: "error", text1: "Could not open report" })
      );
    }
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color={PURPLE} /></View>;
  if (!order) return null;

  const sCfg = STATUS_CFG[order.orderStatus] || STATUS_CFG.INITIATED;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrder(true)} colors={[PURPLE]} />}
    >
      {/* Hero */}
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.orderId}>#{String(order.orderId).slice(-6).toUpperCase()}</Text>
          <Text style={styles.heroDate}>{fmtDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: sCfg.bg }]}>
          <Text style={[styles.statusTxt, { color: sCfg.color }]}>{sCfg.label}</Text>
        </View>
      </View>

      {/* Lab */}
      {order.lab && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lab</Text>
          <Row icon="business-outline" label={order.lab.name ?? "—"} bold />
          {order.lab.address?.city ? <Row icon="location-outline" label={order.lab.address.city} /> : null}
          {order.lab.phone ? <Row icon="call-outline" label={order.lab.phone} /> : null}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <View style={styles.collBadge}>
              <Text style={styles.collBadgeTxt}>{order.collectionType}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Collection Details */}
      {order.collectionAddress && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collection Details</Text>
          <Row icon="person-outline" label={order.collectionAddress?.fullName ?? "—"} />
          <Row icon="call-outline" label={order.collectionAddress?.phone ?? "—"} />
          <Row icon="location-outline" label={order.collectionAddress?.addressLine1 ?? "—"} />
          <Row icon="time-outline" label={`Scheduled: ${fmtDate(order.scheduledAt)}`} />
        </View>
      )}

      {/* OTP */}
      {order.otp && !order.otpVerified && (
        <View style={[styles.card, { backgroundColor: "#ede9fe", borderWidth: 1.5, borderColor: PURPLE }]}>
          <Text style={styles.cardTitle}>Sample Collection OTP</Text>
          <Text style={{ fontSize: 36, fontWeight: "900", color: PURPLE, textAlign: "center", letterSpacing: 8, marginVertical: 8 }}>
            {order.otp}
          </Text>
          <Text style={{ fontSize: 12, color: TEXT_M, textAlign: "center" }}>
            Share this OTP with the collection agent to confirm sample pickup.
          </Text>
        </View>
      )}

      {/* Tests */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tests ({order.items?.length ?? 0})</Text>
        {order.items?.map((item, i) => (
          <View key={i} style={styles.testRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.testName}>{item.test?.name ?? "—"}</Text>
              <Text style={styles.testMeta}>{item.test?.category} · {item.test?.sampleType}</Text>
              <Text style={styles.testMeta}>₹{item.unitPrice} × {item.quantity}</Text>
            </View>
            <Text style={styles.testTotal}>₹{item.totalPrice}</Text>
          </View>
        ))}
      </View>

      {/* Payment */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment</Text>
        <PriceRow label="Subtotal" value={fmtMoney(order.pricing?.subtotal)} />
        <PriceRow label="GST" value={fmtMoney(order.pricing?.gstTotal)} />
        <PriceRow label="Collection" value={fmtMoney(order.pricing?.homeCollectionCharge)} />
        <View style={styles.divider} />
        <PriceRow label="Total" value={fmtMoney(order.pricing?.payableAmount)} bold />
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <View style={styles.payBadge}><Text style={styles.payBadgeTxt}>{order.paymentMode}</Text></View>
          <View style={[styles.payBadge, { backgroundColor: order.paymentStatus === "PAID" ? "#d1fae5" : "#fef9c3" }]}>
            <Text style={[styles.payBadgeTxt, { color: order.paymentStatus === "PAID" ? GREEN : AMBER }]}>
              {order.paymentStatus}
            </Text>
          </View>
        </View>
      </View>

      {/* Prescription */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prescription</Text>
        {order.prescription?.url ? (
          <>
            <Row icon="document-outline" label="Prescription uploaded" />
            <Text style={styles.metaSmall}>Uploaded: {fmtDate(order.prescription.uploadedAt)}</Text>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#fef2f2", borderColor: "#fca5a5" }]} onPress={deletePrescription}>
              <Ionicons name="trash-outline" size={16} color={RED} />
              <Text style={{ color: RED, fontWeight: "700", fontSize: 14 }}>Delete Prescription</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.emptyNote}>No prescription uploaded yet.</Text>
        )}
      </View>

      {/* Report */}
      {order.reportUrl && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lab Report</Text>
          <Row icon="document-text-outline" label="Your report is ready!" bold />
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#f0fdf4", borderColor: "#6ee7b7" }]} onPress={openReport}>
            <Ionicons name="download-outline" size={16} color={GREEN} />
            <Text style={{ color: GREEN, fontWeight: "700", fontSize: 14 }}>View / Download Report</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Collection Agent */}
      {order.collectionAgent && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collection Agent</Text>
          <Row icon="person-circle-outline" label={order.collectionAgent.name} bold />
          <Row icon="call-outline" label={order.collectionAgent.phone} />
        </View>
      )}

    </ScrollView>
  );
}

function Row({ icon, label, bold }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <Ionicons name={icon} size={14} color="#94a3b8" />
      <Text style={{ fontSize: 13, color: bold ? "#0f172a" : "#475569", fontWeight: bold ? "700" : "400", flex: 1 }}>
        {label}
      </Text>
    </View>
  );
}

function PriceRow({ label, value, bold }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
      <Text style={{ fontSize: 13, color: bold ? "#0f172a" : "#475569", fontWeight: bold ? "800" : "400" }}>{label}</Text>
      <Text style={{ fontSize: 13, color: bold ? "#0f172a" : "#475569", fontWeight: bold ? "900" : "500" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },

  heroCard: {
    backgroundColor: CARD, margin: 16, padding: 20, borderRadius: 20,
    elevation: 3, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  orderId: { fontSize: 18, fontWeight: "900", color: TEXT_D },
  heroDate: { fontSize: 12, color: TEXT_S, marginTop: 3 },
  statusPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  statusTxt: { fontWeight: "800", fontSize: 13 },

  card: {
    backgroundColor: CARD, marginHorizontal: 16, marginBottom: 14,
    padding: 16, borderRadius: 18, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: TEXT_D, marginBottom: 12 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 8 },
  metaSmall: { fontSize: 11, color: TEXT_S, marginTop: 4 },
  emptyNote: { fontSize: 13, color: TEXT_S, fontStyle: "italic" },

  testRow: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#f8fafc", borderRadius: 12, padding: 10, marginBottom: 8,
  },
  testName: { fontSize: 13, fontWeight: "700", color: TEXT_D },
  testMeta: { fontSize: 11, color: TEXT_S, marginTop: 2 },
  testTotal: { fontSize: 14, fontWeight: "800", color: PURPLE, marginLeft: 8 },

  payBadge: { backgroundColor: "#f1f5f9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  payBadgeTxt: { fontSize: 12, fontWeight: "700", color: TEXT_M },

  collBadge: { backgroundColor: "#ede9fe", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  collBadgeTxt: { fontSize: 12, fontWeight: "700", color: PURPLE },

  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1,
  },
});
