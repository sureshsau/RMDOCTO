import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import Toast from "react-native-toast-message";
import * as DocumentPicker from "expo-document-picker";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/axios";

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

const VALID_TRANSITIONS = {
  INITIATED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SAMPLE_COLLECTED", "CANCELLED"],
  SAMPLE_COLLECTED: ["REPORT_PENDING"],
  REPORT_PENDING: ["REPORT_READY"],
  REPORT_READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const fmtMoney = (v) => `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function LabOrderDetail() {
  const { orderId } = useLocalSearchParams();
  const { getRMRiders } = useUser();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* Status modal */
  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  /* Assign collector modal */
  const [collectModal, setCollectModal] = useState(false);
  const [riders, setRiders] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  /* OTP verify */
  const [otpModal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

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

  /* ── Change Status ── */
  const changeStatus = async () => {
    setModalError("");
    if (!selectedStatus) return setModalError("Select a status");
    if (selectedStatus === "CANCELLED" && !cancelReason) return setModalError("Enter cancel reason");
    try {
      setStatusLoading(true);
      await api.patch(`/lab/order/${orderId}/status`, { newStatus: selectedStatus, cancelReason });
      Toast.show({ type: "success", text1: `Status → ${selectedStatus}` });
      setStatusModal(false);
      fetchOrder(true);
    } catch (e) {
      setModalError(e?.response?.data?.message || "Update failed");
    } finally {
      setStatusLoading(false);
    }
  };

  /* ── Upload Lab Report ── */
  const [reportUploading, setReportUploading] = useState(false);
  const uploadReport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      setReportUploading(true);
      const formData = new FormData();
      formData.append("report", {
        uri: file.uri,
        name: file.name || "report.pdf",
        type: file.mimeType || "application/pdf",
      });

      await api.post(`/lab/order/${orderId}/report`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Toast.show({ type: "success", text1: "Report uploaded successfully!" });
      fetchOrder(true);
    } catch (e) {
      Toast.show({ type: "error", text1: e?.response?.data?.message || "Report upload failed" });
    } finally {
      setReportUploading(false);
    }
  };

  /* ── Assign Collector ── */
  const loadRiders = async () => {
    const res = await getRMRiders();
    if (res.success) { setRiders(res.data); setCollectModal(true); }
    else Toast.show({ type: "error", text1: "Failed to load riders" });
  };

  const assignCollector = async (userId) => {
    try {
      setAssignLoading(true);
      await api.patch(`/lab/order/assign-collector/${orderId}`, { userId });
      Toast.show({ type: "success", text1: "Collector assigned!" });
      setCollectModal(false);
      fetchOrder(true);
    } catch {
      Toast.show({ type: "error", text1: "Assign failed" });
    } finally {
      setAssignLoading(false);
    }
  };

  /* ── Verify OTP ── */
  const verifyOtp = async () => {
    if (!otp) return Toast.show({ type: "error", text1: "Enter OTP" });
    try {
      setOtpLoading(true);
      await api.post("/lab/order/verify-otp", { orderId, otp });
      Toast.show({ type: "success", text1: "Sample collection confirmed!" });
      setOtpModal(false);
      fetchOrder(true);
    } catch (e) {
      Toast.show({ type: "error", text1: e?.response?.data?.message || "OTP failed" });
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color={PURPLE} /></View>;
  if (!order) return null;

  const sCfg = STATUS_CFG[order.orderStatus] || STATUS_CFG.INITIATED;
  const nextStatuses = VALID_TRANSITIONS[order.orderStatus] || [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrder(true)} colors={[PURPLE]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.orderId}>#{String(order.orderId).slice(-6).toUpperCase()}</Text>
            <Text style={styles.heroDate}>{fmtDate(order.createdAt)}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: sCfg.bg }]}>
            <Text style={[styles.statusTxt, { color: sCfg.color }]}>{sCfg.label}</Text>
          </View>
        </View>

        {/* ── Lab Info ── */}
        {order.lab && (
          <View style={styles.card}>
            <Row icon="business-outline" label={order.lab.name ?? "Lab"} bold />
            {order.lab.address?.city ? <Row icon="location-outline" label={order.lab.address.city} /> : null}
            {order.lab.phone ? <Row icon="call-outline" label={order.lab.phone} /> : null}
          </View>
        )}

        {/* ── User ── */}
        {order.collectionAddress && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Collection Details</Text>
            <Row icon="person-outline" label={order.collectionAddress?.fullName ?? "—"} />
            <Row icon="call-outline" label={order.collectionAddress?.phone ?? "—"} />
            <Row icon="location-outline" label={order.collectionAddress?.addressLine1 ?? "—"} />
            <Row icon="time-outline" label={`Scheduled: ${fmtDate(order.scheduledAt)}`} />
            <Row icon="car-outline" label={`Collection: ${order.collectionType}`} />
          </View>
        )}

        {/* ── Tests ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tests ({order.items?.length ?? 0})</Text>
          {order.items?.map((item, i) => (
            <View key={i} style={styles.testRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.testName}>{item.test?.name ?? "—"}</Text>
                <Text style={styles.testMeta}>{item.test?.category} · {item.test?.sampleType}</Text>
                <Text style={styles.testMeta}>₹{item.unitPrice} × {item.quantity} + GST {item.gstPercentage}% = ₹{item.gstAmount}</Text>
              </View>
              <Text style={styles.testTotal}>₹{item.totalPrice}</Text>
            </View>
          ))}
        </View>

        {/* ── Pricing ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <PriceRow label="Subtotal" value={fmtMoney(order.pricing?.subtotal)} />
          <PriceRow label="GST" value={fmtMoney(order.pricing?.gstTotal)} />
          <PriceRow label="Collection Charge" value={fmtMoney(order.pricing?.homeCollectionCharge)} />
          <View style={styles.divider} />
          <PriceRow label="Total" value={fmtMoney(order.pricing?.payableAmount)} bold />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View style={styles.payBadge}>
              <Text style={styles.payBadgeTxt}>{order.paymentMode}</Text>
            </View>
            <View style={[styles.payBadge, { backgroundColor: order.paymentStatus === "PAID" ? "#d1fae5" : "#fef9c3" }]}>
              <Text style={[styles.payBadgeTxt, { color: order.paymentStatus === "PAID" ? GREEN : AMBER }]}>
                {order.paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Collection Agent ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collection Agent</Text>
          {order.collectionAgent ? (
            <>
              <Row icon="person-circle-outline" label={order.collectionAgent.name} bold />
              <Row icon="call-outline" label={order.collectionAgent.phone} />
            </>
          ) : (
            <Text style={styles.emptyNote}>No collector assigned</Text>
          )}
          <TouchableOpacity style={styles.btnPrimary} onPress={loadRiders}>
            <Text style={styles.btnPrimaryTxt}>{order.collectionAgent ? "Change Collector" : "Assign Collector"}</Text>
          </TouchableOpacity>
        </View>

        {/* ── OTP ── */}
        {order.otp && !order.otpVerified && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>OTP Verification</Text>
            <Text style={styles.otpHint}>OTP is shared with the customer to confirm sample collection.</Text>
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: TEAL }]} onPress={() => setOtpModal(true)}>
              <Text style={styles.btnPrimaryTxt}>Verify OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Prescription ── */}
        {order.prescription?.url && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Prescription</Text>
            <Row icon="document-outline" label="Prescription uploaded" />
            <Text style={styles.metaSmall}>Uploaded: {fmtDate(order.prescription.uploadedAt)}</Text>
          </View>
        )}

        {/* ── Report ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lab Report</Text>
          {order.reportUrl ? (
            <>
              <Row icon="document-text-outline" label="Report available" />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity style={[styles.btnPrimary, { flex: 1, backgroundColor: "#f0fdf4", borderColor: "#6ee7b7", borderWidth: 1 }]} onPress={() => Linking.openURL(order.reportUrl)}>
                  <Text style={{ color: GREEN, fontWeight: "700", fontSize: 14 }}>View Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnPrimary, { flex: 1, marginTop: 0 }]} onPress={uploadReport} disabled={reportUploading}>
                  <Text style={styles.btnPrimaryTxt}>{reportUploading ? "Uploading..." : "Replace Report"}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.emptyNote}>No report uploaded yet.</Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={uploadReport} disabled={reportUploading}>
                <Text style={styles.btnPrimaryTxt}>{reportUploading ? "Uploading..." : "Upload Lab Report"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Change Status ── */}
        {nextStatuses.length > 0 && (
          <View style={styles.card}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => { setSelectedStatus(""); setCancelReason(""); setModalError(""); setStatusModal(true); }}>
              <Text style={styles.btnPrimaryTxt}>Change Order Status</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ── Status Modal ── */}
      <Modal visible={statusModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Update Status</Text>
            {nextStatuses.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOpt, selectedStatus === s && styles.statusOptActive]}
                onPress={() => setSelectedStatus(s)}
              >
                <Text style={{ fontWeight: selectedStatus === s ? "800" : "600", color: selectedStatus === s ? PURPLE : TEXT_D }}>{s}</Text>
              </TouchableOpacity>
            ))}
            {selectedStatus === "CANCELLED" && (
              <TextInput
                style={styles.input}
                placeholder="Cancel reason"
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholderTextColor={TEXT_S}
              />
            )}
            {modalError ? <Text style={styles.errTxt}>{modalError}</Text> : null}
            <TouchableOpacity style={styles.btnPrimary} onPress={changeStatus} disabled={statusLoading}>
              <Text style={styles.btnPrimaryTxt}>{statusLoading ? "Updating…" : "Confirm"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setStatusModal(false)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Assign Collector Modal ── */}
      <Modal visible={collectModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Collector</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {riders.map((r) => (
                <View key={r._id} style={styles.riderCard}>
                  <View>
                    <Text style={styles.riderName}>{r.name}</Text>
                    <Text style={{ fontSize: 12, color: TEXT_S }}>{r.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.assignBtn}
                    onPress={() => assignCollector(r._id)}
                    disabled={assignLoading}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Assign</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setCollectModal(false)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── OTP Modal ── */}
      <Modal visible={otpModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Verify Sample Collection OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP from customer"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              placeholderTextColor={TEXT_S}
            />
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: TEAL }]} onPress={verifyOtp} disabled={otpLoading}>
              <Text style={styles.btnPrimaryTxt}>{otpLoading ? "Verifying…" : "Verify OTP"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setOtpModal(false)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ── Sub-components ── */
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
  emptyNote: { fontSize: 13, color: TEXT_S, fontStyle: "italic" },
  metaSmall: { fontSize: 11, color: TEXT_S, marginTop: 4 },
  otpHint: { fontSize: 12, color: TEXT_M, marginBottom: 12 },

  testRow: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#f8fafc", borderRadius: 12, padding: 10, marginBottom: 8,
  },
  testName: { fontSize: 13, fontWeight: "700", color: TEXT_D },
  testMeta: { fontSize: 11, color: TEXT_S, marginTop: 2 },
  testTotal: { fontSize: 14, fontWeight: "800", color: PURPLE, marginLeft: 8 },

  payBadge: { backgroundColor: "#f1f5f9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  payBadgeTxt: { fontSize: 12, fontWeight: "700", color: TEXT_M },

  btnPrimary: { backgroundColor: PURPLE, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 12 },
  btnPrimaryTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  cancelBtn: { backgroundColor: RED, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 10 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center" },
  modalBox: { backgroundColor: CARD, margin: 20, padding: 20, borderRadius: 20, maxHeight: "75%" },
  modalTitle: { fontSize: 16, fontWeight: "800", color: TEXT_D, marginBottom: 16 },
  statusOpt: { backgroundColor: "#f1f5f9", borderRadius: 10, padding: 12, marginBottom: 8 },
  statusOptActive: { backgroundColor: PURPLE + "22", borderWidth: 1, borderColor: PURPLE },
  input: {
    borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12,
    padding: 12, marginTop: 10, fontSize: 14, color: TEXT_D,
  },
  errTxt: { color: RED, fontSize: 13, marginTop: 6 },

  riderCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, marginBottom: 8,
  },
  riderName: { fontSize: 14, fontWeight: "700", color: TEXT_D },
  assignBtn: { backgroundColor: TEAL, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
});
