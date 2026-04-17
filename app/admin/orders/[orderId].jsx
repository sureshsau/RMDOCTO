import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import InvoiceGenerator from "../../../components/shared/medicine/InvoiceGenerator";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/axios";

export default function OrderDetails() {

  const { orderId } = useLocalSearchParams();
  const { getRMRiders } = useUser();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [riders, setRiders] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [otp, setOtp] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  /* ================= FETCH ================= */

  const fetchOrderDetails = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await api.get(`/medicine/order/${orderId}`);
      setOrder(res.data.data);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load order" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (orderId) fetchOrderDetails(); }, [orderId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrderDetails(true);
  }, []);

  /* ================= TRACK ================= */

  const openTracker = () => {
    const coords = order?.deliveryAddress?.location?.coordinates;
    if (!coords) return Toast.show({ type: "error", text1: "Location not available" });
    router.push({
      pathname: "/admin/(tabs)/medicineorder/track",
      params: {
        destLat: String(coords[1]),
        destLng: String(coords[0]),
      },
    });
  };

  /* ================= RIDERS ================= */

  const loadRiders = async () => {
    const res = await getRMRiders();
    if (res.success) {
      setRiders(res.data);
      setShowAssignModal(true);
    }
  };

  const assignRider = async (userId) => {
    try {
      setAssignLoading(true);
      await api.patch(`/medicine/order/assign-rmrider/${orderId}`, { userId });
      Toast.show({ type: "success", text1: "Rider Assigned" });
      setShowAssignModal(false);
      fetchOrderDetails(true);
    } catch {
      Toast.show({ type: "error", text1: "Assign Failed" });
    } finally {
      setAssignLoading(false);
    }
  };

  /* ================= STATUS ================= */

  const changeStatus = async () => {
    setModalError("");

    if (!selectedStatus) return setModalError("Select Status");
    if (selectedStatus === "DELIVERED" && !otp) return setModalError("Enter OTP");
    if (selectedStatus === "CANCELLED" && !cancelReason) return setModalError("Enter Cancel Reason");

    try {
      setStatusLoading(true);

      await api.patch(`/medicine/order/${orderId}/status`, {
        newStatus: selectedStatus,
        cancelReason,
        enteredOtp: otp
      });

      Toast.show({ type: "success", text1: "Status Updated" });
      setStatusModalVisible(false);
      fetchOrderDetails(true);

    } catch (err) {
      setModalError(err?.response?.data?.message);
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );

  if (!order) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* ================= HEADER ================= */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.orderId}>#{order.orderId.slice(-6)}</Text>
            <Text style={styles.meta}>{new Date(order.createdAt).toDateString()}</Text>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{order.orderStatus}</Text>
          </View>
        </View>

        {/* ================= INVOICE GENERATOR ================= */}
        <View style={{ marginHorizontal: 16 }}>
          <InvoiceGenerator order={order} />
        </View>

        {/* ================= CUSTOMER ================= */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.title}>Customer Details</Text>
          <Text>👤 {order.deliveryAddress.fullName}</Text>
          <Text>📞 {order.deliveryAddress.phone}</Text>
          <Text style={styles.meta}>📍 {order.deliveryAddress.addressLine1}</Text>

          <TouchableOpacity style={styles.trackBtn} onPress={openTracker}>
            <Text style={styles.btnPrimaryText}>Track Order</Text>
          </TouchableOpacity>
        </View>

        {/* ================= DELIVERY AGENT ================= */}
        <View style={styles.card}>
          <Text style={styles.title}>Delivery Agent</Text>

          {order.deliveryAgent ?
            <>
              <Text>{order.deliveryAgent.name}</Text>
              <Text>{order.deliveryAgent.phone}</Text>
            </>
            : <Text style={styles.meta}>No rider assigned</Text>}

          <TouchableOpacity style={styles.btnPrimary} onPress={loadRiders}>
            <Text style={styles.btnPrimaryText}>
              {order.deliveryAgent ? "Change Rider" : "Assign Rider"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= MEDICINES ================= */}
        <View style={styles.card}>
          <Text style={styles.title}>Medicines</Text>

          {order.items.map((item, i) => (
            <View key={i} style={styles.medicineRow}>

              <Image
                source={{ uri: item.medicine?.image }}
                style={styles.medicineImage}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.medicineName}>{item.medicine?.name}</Text>
                <Text style={styles.meta}>₹{item.unitPrice} × {item.quantity}</Text>
                <Text style={styles.meta}>GST {item.gstPercentage}% = ₹{item.gstAmount}</Text>
              </View>

              <Text style={styles.totalItem}>₹{item.totalPrice}</Text>

            </View>
          ))}
        </View>

        {/* ================= PAYMENT ================= */}
        <View style={styles.card}>
          <Text style={styles.title}>Payment Details</Text>

          <Text>Mode: {order.paymentMode}</Text>
          <Text>Status: {order.paymentStatus}</Text>

          <View style={{ marginTop: 10 }}>
            <Text>Subtotal: ₹{order.pricing?.subtotal}</Text>
            <Text>GST: ₹{order.pricing?.gstTotal}</Text>
            <Text>Delivery: ₹{order.pricing?.deliveryCharge}</Text>
            <Text style={styles.finalAmount}>
              Total: ₹{order.pricing?.payableAmount}
            </Text>
          </View>
        </View>

        {/* ================= CHANGE STATUS ================= */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => setStatusModalVisible(true)}
          >
            <Text style={styles.btnPrimaryText}>Change Status</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />

      </ScrollView>

      {/* ================= RIDER MODAL ================= */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>Select Rider</Text>

            <ScrollView>
              {riders.map(r => (
                <View key={r._id} style={styles.riderCard}>
                  <View>
                    <Text style={styles.riderName}>{r.name}</Text>
                    <Text style={styles.meta}>{r.phone}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.assignNowBtn}
                    onPress={() => assignRider(r._id)}
                  >
                    <Text style={{ color: "#fff" }}>Assign</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowAssignModal(false)}
              style={styles.cancelBtn}
            >
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ================= STATUS MODAL ================= */}
      <Modal visible={statusModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            {["SHIPPED", "DELIVERED", "CANCELLED"].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOption, selectedStatus === s && styles.activeStatus]}
                onPress={() => setSelectedStatus(s)}
              >
                <Text>{s}</Text>
              </TouchableOpacity>
            ))}

            {selectedStatus === "DELIVERED" &&
              <TextInput
                placeholder="Enter OTP"
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
              />
            }

            {selectedStatus === "CANCELLED" &&
              <TextInput
                placeholder="Cancel Reason"
                style={styles.input}
                value={cancelReason}
                onChangeText={setCancelReason}
              />
            }

            {modalError && <Text style={styles.error}>{modalError}</Text>}

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={changeStatus}
            >
              <Text style={styles.btnPrimaryText}>
                {statusLoading ? "Updating..." : "Confirm"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusModalVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  heroCard: { backgroundColor: "#fff", margin: 16, padding: 20, borderRadius: 20, elevation: 3, flexDirection: "row", justifyContent: "space-between" },
  card: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 18, elevation: 2 },

  orderId: { fontSize: 16, fontWeight: "900" },
  statusPill: { backgroundColor: "#ecfeff", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontWeight: "800", color: "#14b8a6" },

  title: { fontWeight: "800", marginBottom: 14, fontSize: 15 },
  meta: { fontSize: 12, color: "#64748b" },

  trackBtn: { backgroundColor: "#14b8a6", padding: 10, borderRadius: 10, marginTop: 10, alignItems: "center" },
  btnPrimary: { backgroundColor: "#14b8a6", padding: 12, borderRadius: 12, alignItems: "center", marginTop: 10 },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },

  medicineRow: { flexDirection: "row", backgroundColor: "#F1F5F9", padding: 10, borderRadius: 14, marginBottom: 10, alignItems: "center" },
  medicineImage: { width: 60, height: 60, borderRadius: 12, marginRight: 12 },
  medicineName: { fontWeight: "700" },
  totalItem: { fontWeight: "800" },

  finalAmount: { fontWeight: "900", fontSize: 16, marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center" },
  modalBox: { backgroundColor: "#fff", margin: 20, padding: 20, borderRadius: 20, maxHeight: "70%" },
  modalTitle: { fontWeight: "800", fontSize: 16, marginBottom: 16 },

  riderCard: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#ecfeff", padding: 12, borderRadius: 12, marginBottom: 10 },
  riderName: { fontWeight: "700" },
  assignNowBtn: { backgroundColor: "#14b8a6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },

  cancelBtn: { backgroundColor: "#ef4444", padding: 12, borderRadius: 12, alignItems: "center", marginTop: 10 },

  statusOption: { padding: 10, borderRadius: 10, backgroundColor: "#f1f5f9", marginBottom: 8 },
  activeStatus: { backgroundColor: "#ccfbf1" },

  input: { borderWidth: 1, padding: 10, borderRadius: 12, marginTop: 10 },
  error: { color: "red", marginTop: 6 },
});
