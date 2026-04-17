import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import InvoiceGenerator from "../../../../components/shared/medicine/InvoiceGenerator";
import api from "../../../../services/axios";

export default function OrderDetails() {
  const { orderId } = useLocalSearchParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to load order",
        text2: err?.response?.data?.message || "",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrderDetails(true);
  }, []);

  /* ================= TRACK ================= */

  const openTracker = () => {
    const coords =
      order?.deliveryAddress?.location?.coordinates;

    if (!coords) {
      Toast.show({
        type: "error",
        text1: "Location not available",
      });
      return;
    }

    router.push({
      pathname:
        "/marketing_agent/medicine/order/track",
      params: {
        destLat: String(coords[1]),
        destLng: String(coords[0]),
      },
    });
  };

  /* ================= STATUS UPDATE ================= */

  const changeStatus = async () => {
    setModalError("");

    if (!selectedStatus) {
      setModalError("Select status");
      return;
    }

    if (selectedStatus === "DELIVERED" && !otp) {
      setModalError("Enter OTP to deliver");
      return;
    }

    if (selectedStatus === "CANCELLED" && !cancelReason) {
      setModalError("Enter cancel reason");
      return;
    }

    try {
      setStatusLoading(true);

      await api.patch(
        `/medicine/order/${orderId}/status`,
        {
          newStatus: selectedStatus,
          cancelReason:
            selectedStatus === "CANCELLED"
              ? cancelReason
              : "",
          enteredOtp:
            selectedStatus === "DELIVERED"
              ? otp
              : "",
        }
      );

      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: `Order marked as ${selectedStatus}`,
      });

      setStatusModalVisible(false);
      setSelectedStatus("");
      setCancelReason("");
      setOtp("");
      fetchOrderDetails();
    } catch (err) {
      setModalError(
        err?.response?.data?.message || "Failed"
      );
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  if (!order) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.orderId}>
              #{order.orderId.slice(-6)}
            </Text>
            <Text style={styles.meta}>
              {new Date(order.createdAt).toDateString()}
            </Text>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusText}>
              {order.orderStatus}
            </Text>
          </View>
        </View>

        {/* ================= INVOICE GENERATOR ================= */}
        <View style={{ marginHorizontal: 16 }}>
          <InvoiceGenerator order={order} />
        </View>

        {/* CUSTOMER DETAILS */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.title}>Customer Details</Text>

          <Text style={styles.body}>
            👤 {order.deliveryAddress.fullName}
          </Text>
          <Text style={styles.body}>
            📞 {order.deliveryAddress.phone}
          </Text>
          <Text style={styles.meta}>
            📍 {order.deliveryAddress.addressLine1}
          </Text>
          <Text style={styles.meta}>
            Pincode: {order.deliveryAddress.pincode}
          </Text>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={openTracker}
          >
            <Text style={styles.btnPrimaryText}>
              Track Order
            </Text>
          </TouchableOpacity>
        </View>

        {/* DELIVERY AGENT */}
        <View style={styles.card}>
          <Text style={styles.title}>Delivery Agent</Text>
          <Text style={styles.body}>
            {order.deliveryAgent?.name}
          </Text>
          <Text style={styles.meta}>
            📞 {order.deliveryAgent?.phone}
          </Text>
        </View>

        {/* MEDICINES */}
        <View style={styles.card}>
          <Text style={styles.title}>Medicines</Text>

          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.body}>
                  {item.medicine?.name}
                </Text>
                <Text style={styles.meta}>
                  ₹{item.unitPrice} × {item.quantity}
                </Text>
                <Text style={styles.meta}>
                  GST {item.gstPercentage}% = ₹{item.gstAmount}
                </Text>
              </View>

              <Text style={styles.body}>
                ₹{item.totalPrice}
              </Text>
            </View>
          ))}
        </View>

        {/* PAYMENT + PRICING */}
        <View style={styles.card}>
          <Text style={styles.title}>Payment Details</Text>

          <Text>Mode: {order.paymentMode}</Text>
          <Text>Status: {order.paymentStatus}</Text>

          <View style={{ marginTop: 10 }}>
            <Text>Subtotal: ₹{order.pricing.subtotal}</Text>
            <Text>GST: ₹{order.pricing.gstTotal}</Text>
            <Text>Delivery: ₹{order.pricing.deliveryCharge}</Text>
            <Text style={{ fontWeight: "900", marginTop: 6 }}>
              Total: ₹{order.pricing.payableAmount}
            </Text>
          </View>
        </View>

        {/* UPDATE STATUS */}
        <View style={styles.card}>
          <Text style={styles.title}>Update Status</Text>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => setStatusModalVisible(true)}
          >
            <Text style={styles.btnPrimaryText}>
              Change Status
            </Text>
          </TouchableOpacity>
        </View>

        {/* STATUS MODAL */}
        <Modal visible={statusModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Select Status</Text>

              {["SHIPPED", "DELIVERED", "CANCELLED"].map(
                (status) => (
                  <View key={status}>
                    <TouchableOpacity
                      style={styles.statusOption}
                      onPress={() => {
                        setSelectedStatus(status);
                        setModalError("");
                      }}
                    >
                      <Text
                        style={{
                          fontWeight:
                            selectedStatus === status
                              ? "900"
                              : "600",
                        }}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>

                    {selectedStatus === "DELIVERED" &&
                      status === "DELIVERED" && (
                        <TextInput
                          style={styles.input}
                          placeholder="Enter OTP"
                          keyboardType="number-pad"
                          value={otp}
                          onChangeText={setOtp}
                        />
                      )}

                    {selectedStatus === "CANCELLED" &&
                      status === "CANCELLED" && (
                        <TextInput
                          style={styles.input}
                          placeholder="Enter cancel reason"
                          value={cancelReason}
                          onChangeText={setCancelReason}
                        />
                      )}
                  </View>
                )
              )}

              {modalError ? (
                <Text style={styles.errorText}>
                  {modalError}
                </Text>
              ) : null}

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={changeStatus}
              >
                <Text style={styles.btnPrimaryText}>
                  Confirm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.btnGhostText}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  heroCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    elevation: 2,
  },
  orderId: { fontSize: 16, fontWeight: "900" },
  statusPill: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: { fontWeight: "800" },
  title: { fontWeight: "800", marginBottom: 14 },
  body: { fontSize: 14 },
  meta: { fontSize: 12, color: "#64748b" },
  btnPrimary: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "900" },
  btnGhost: {
    backgroundColor: "#e5e7eb",
    padding: 12,
    borderRadius: 16,
    marginTop: 10,
    alignItems: "center",
  },
  btnGhostText: { fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  statusOption: { paddingVertical: 10 },
  errorText: { color: "red", marginTop: 10 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
