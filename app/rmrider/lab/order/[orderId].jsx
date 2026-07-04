import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking
} from "react-native";
import Toast from "react-native-toast-message";
import api from "../../../../services/axios";

const PRIMARY = "#14b8a6";

export default function RiderLabOrderDetail() {
  const { orderId } = useLocalSearchParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [modalError, setModalError] = useState("");

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lab/order/${orderId}`);
      setOrder(res?.data?.data);
    } catch (err) {
      console.log(err);
      Toast.show({
        type: "error",
        text1: "Failed to load order",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const openPhone = () => {
    const phone = order?.collectionAddress?.phone || order?.user?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const openMap = () => {
    const addr = order?.collectionAddress;
    if (addr?.location?.coordinates) {
      const lat = addr.location.coordinates[1];
      const lng = addr.location.coordinates[0];
      const url = Platform.select({
        ios: `maps:0,0?q=${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}`,
      });
      Linking.openURL(url);
    }
  };

  const verifyOtp = async () => {
    setModalError("");
    if (!otp) {
      setModalError("Enter OTP");
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/lab/order/verify-otp`, {
        orderId,
        otp: Number(otp),
      });

      Toast.show({ type: "success", text1: "Sample Collected!" });
      setOtpModalVisible(false);
      setOtp("");
      fetchOrderDetails();
    } catch (err) {
      setModalError(err?.response?.data?.message || "Failed to verify OTP");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!order) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.orderId}>Order #{order?.orderId?.slice(-6) || "----"}</Text>
          <Text style={styles.date}>
            {order?.createdAt ? new Date(order.createdAt).toDateString() : "-"}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{order?.orderStatus}</Text>
          </View>
        </View>

        {/* PATIENT INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Patient Details</Text>
          <Text style={styles.body}>{order?.collectionAddress?.fullName || order?.user?.name || "-"}</Text>
          <Text style={styles.meta}>{order?.collectionAddress?.phone || order?.user?.phone || "-"}</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={openPhone}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Call Patient</Text>
          </TouchableOpacity>
        </View>

        {/* COLLECTION INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Collection Information</Text>
          {order?.collectionType === "HOME" ? (
            <>
              <Text style={styles.body}>Home Collection</Text>
              <Text style={styles.meta}>{order?.collectionAddress?.addressLine1 || "-"}</Text>
              <Text style={styles.meta}>Pincode: {order?.collectionAddress?.pincode || "-"}</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={openMap}>
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>View on Map</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.body}>Walk In</Text>
              <Text style={styles.meta}>Lab: {order?.lab?.name || "-"}</Text>
            </>
          )}
          <Text style={[styles.meta, { marginTop: 10 }]}>Scheduled At: {order?.scheduledAt ? new Date(order.scheduledAt).toLocaleString() : "N/A"}</Text>
        </View>

        {/* TESTS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lab Tests</Text>
          {order?.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View>
                <Text style={styles.body}>{item?.test?.name || "-"}</Text>
                <Text style={styles.meta}>₹{item?.unitPrice} × {item?.quantity}</Text>
                <Text style={styles.meta}>GST {item?.gstPercentage}% = ₹{item?.gstAmount}</Text>
              </View>
              <Text style={styles.price}>₹{item?.totalPrice}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{order?.pricing?.payableAmount || 0}</Text>
          </View>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.meta}>Payment Mode: {order?.paymentMode}</Text>
            <Text style={[styles.meta, { color: order?.paymentStatus === "PAID" ? "#16a34a" : "#ca8a04", fontWeight: "700" }]}>
              Payment Status: {order?.paymentStatus}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* FLOATING ACTION */}
      {(order?.orderStatus === "CONFIRMED" || order?.orderStatus === "INITIATED") && (
        <View style={styles.floatingAction}>
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={() => setOtpModalVisible(true)}
          >
            <Text style={styles.updateBtnText}>Collect Sample (OTP)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* OTP MODAL */}
      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Sample Collection</Text>
            <Text style={styles.modalSubtitle}>Enter the OTP provided by the patient.</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />

            {modalError ? <Text style={styles.errorText}>{modalError}</Text> : null}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#f1f5f9" }]}
                onPress={() => { setOtpModalVisible(false); setModalError(""); }}
              >
                <Text style={[styles.modalBtnText, { color: "#475569" }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: PRIMARY }]}
                onPress={verifyOtp}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Verify OTP</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  
  header: { padding: 20, paddingTop: 40, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  orderId: { fontSize: 22, fontWeight: "800", color: "#0f172a", textTransform: "uppercase" },
  date: { fontSize: 13, color: "#64748b", marginTop: 4 },
  statusBadge: { alignSelf: "flex-start", backgroundColor: "#f0fdf4", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#bbf7d0", marginTop: 12 },
  statusText: { fontSize: 12, fontWeight: "700", color: "#16a34a" },
  
  card: { backgroundColor: "#fff", margin: 20, marginBottom: 0, padding: 16, borderRadius: 16, elevation: 1 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingBottom: 8 },
  body: { fontSize: 15, fontWeight: "600", color: "#334155", marginBottom: 4 },
  meta: { fontSize: 13, color: "#64748b", marginBottom: 2 },
  
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: PRIMARY, padding: 10, borderRadius: 10, marginTop: 12, gap: 8 },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  price: { fontSize: 15, fontWeight: "700", color: "#334155" },
  
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  totalValue: { fontSize: 18, fontWeight: "800", color: PRIMARY },
  
  floatingAction: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f1f5f9", elevation: 10 },
  updateBtn: { backgroundColor: PRIMARY, padding: 16, borderRadius: 12, alignItems: "center" },
  updateBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: "#64748b", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, fontSize: 16, color: "#0f172a", marginBottom: 10 },
  errorText: { color: "#ef4444", fontSize: 12, marginBottom: 10 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 10 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  modalBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" }
});
