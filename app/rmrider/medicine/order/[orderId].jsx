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
import api from "../../../../services/axios";

const PRIMARY = "#14b8a6";

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
        text1: "Failed to load order"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrderDetails(true);
  }, []);

  /* ================= TRACK ================= */

  const openTracker = () => {
    const coords = order?.deliveryAddress?.location?.coordinates;

    if (!coords) {
      Toast.show({
        type: "error",
        text1: "Location not available"
      });
      return;
    }

    router.push({
      pathname: "/rmrider/medicine/order/track",
      params: {
        destLat: String(coords[1]),
        destLng: String(coords[0])
      }
    });
  }

  /* ================= STATUS ================= */

  const changeStatus = async () => {

    setModalError("");

    if (!selectedStatus) {
      setModalError("Select status");
      return;
    }

    if (selectedStatus === "DELIVERED" && !otp) {
      setModalError("Enter OTP");
      return;
    }

    if (selectedStatus === "CANCELLED" && !cancelReason) {
      setModalError("Enter cancel reason");
      return;
    }

    try {

      setStatusLoading(true);

      await api.patch(`/medicine/order/${orderId}/status`, {
        newStatus: selectedStatus,
        cancelReason: selectedStatus === "CANCELLED" ? cancelReason : "",
        enteredOtp: selectedStatus === "DELIVERED" ? otp : ""
      });

      Toast.show({
        type: "success",
        text1: "Status Updated"
      });

      setStatusModalVisible(false);
      setSelectedStatus("");
      setOtp("");
      setCancelReason("");
      fetchOrderDetails();

    } catch (err) {
      setModalError(err?.response?.data?.message || "Failed");
    }
    finally {
      setStatusLoading(false);
    }
  }

  /* ================= LOADER ================= */

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    )
  }

  if (!order) return null;

  /* ================= UI ================= */

  return (

    <View style={styles.container}>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >

        {/* HERO */}

        <View style={styles.heroCard}>

          <View>
            <Text style={styles.orderId}>
              Order #{order?.orderId?.slice(-6) ?? "------"}
            </Text>

            <Text style={styles.date}>
              {order?.createdAt ? new Date(order.createdAt).toDateString() : "-"}
            </Text>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusText}>
              {order?.orderStatus}
            </Text>
          </View>

        </View>

        {/* CUSTOMER */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer</Text>

          <Text style={styles.body}>
            {order?.deliveryAddress?.fullName || "-"}
          </Text>

          <Text style={styles.meta}>
            {order?.deliveryAddress?.phone || "-"}
          </Text>

          <Text style={styles.meta}>
            {order?.deliveryAddress?.addressLine1 || "-"}
          </Text>

          <TouchableOpacity
            style={styles.trackBtn}
            onPress={openTracker}
          >
            <Text style={styles.trackText}>
              Track Order
            </Text>
          </TouchableOpacity>

        </View>

        {/* AGENT */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Agent</Text>

          <Text style={styles.body}>
            {order?.deliveryAgent?.name || "-"}
          </Text>

          <Text style={styles.meta}>
            {order?.deliveryAgent?.phone || "-"}
          </Text>

        </View>

        {/* MEDICINES */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Medicines</Text>

          {order?.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>

              <View>
                <Text style={styles.body}>
                  {item?.medicine?.name || "-"}
                </Text>

                <Text style={styles.meta}>
                  ₹{item?.unitPrice ?? 0} × {item?.quantity ?? 0}
                </Text>

                <Text style={styles.meta}>
                  GST {item?.gstPercentage ?? 0}% = ₹{item?.gstAmount ?? 0}
                </Text>
              </View>

              <Text style={styles.price}>
                ₹{item?.totalPrice ?? 0}
              </Text>

            </View>
          ))}

        </View>

        {/* PAYMENT */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>

          <Text style={styles.meta}>
            Mode : {order?.paymentMode || "-"}
          </Text>

          <Text style={styles.meta}>
            Status : {order?.paymentStatus || "-"}
          </Text>

          <View style={styles.priceBox}>
            <Text>Subtotal : ₹{order?.pricing?.subtotal ?? 0}</Text>
            <Text>GST : ₹{order?.pricing?.gstTotal ?? 0}</Text>
            <Text>Delivery : ₹{order?.pricing?.deliveryCharge ?? 0}</Text>

            <Text style={styles.total}>
              Total : ₹{order?.pricing?.payableAmount ?? 0}
            </Text>
          </View>

        </View>

        {/* STATUS BTN */}

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStatusModalVisible(true)}
          >
            <Text style={styles.primaryText}>
              Change Status
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />

      </ScrollView>

      {/* ================= MODAL ================= */}

      <Modal visible={statusModalVisible} transparent animationType="slide">

        <View style={styles.modalOverlay}>

          <View style={styles.modalCard}>

            <Text style={styles.modalTitle}>
              Update Order Status
            </Text>

            {["SHIPPED", "DELIVERED", "CANCELLED"].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedStatus === status && styles.selectedStatus
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text style={styles.statusOptionText}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedStatus === "DELIVERED" && (
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
            )}

            {selectedStatus === "CANCELLED" && (
              <TextInput
                style={styles.input}
                placeholder="Cancel Reason"
                value={cancelReason}
                onChangeText={setCancelReason}
              />
            )}

            {modalError ?
              <Text style={styles.error}>
                {modalError}
              </Text> : null}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={changeStatus}
            >
              <Text style={styles.primaryText}>
                Confirm
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  )
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#f1f5f9" },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  heroCard: {
    backgroundColor: PRIMARY,
    margin: 16,
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between"
  },

  orderId: { color: "#fff", fontWeight: "900", fontSize: 16 },

  date: { color: "#ccfbf1", fontSize: 11, marginTop: 4 },

  statusPill: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20
  },

  statusText: { color: PRIMARY, fontWeight: "800" },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    elevation: 2
  },

  sectionTitle: { fontWeight: "800", marginBottom: 10, color: "#0f172a" },

  body: { fontSize: 14, fontWeight: "600" },

  meta: { fontSize: 12, color: "#64748b", marginTop: 2 },

  trackBtn: {
    backgroundColor: PRIMARY,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12
  },

  trackText: { color: "#fff", fontWeight: "700" },

  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },

  price: { fontWeight: "700" },

  priceBox: { marginTop: 10 },

  total: { marginTop: 6, fontWeight: "900", color: PRIMARY },

  primaryBtn: {
    backgroundColor: PRIMARY,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10
  },

  primaryText: { color: "#fff", fontWeight: "900" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20
  },

  modalTitle: { fontWeight: "900", fontSize: 16, marginBottom: 14 },

  statusOption: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    marginBottom: 10
  },

  selectedStatus: { backgroundColor: "#ccfbf1" },

  statusOptionText: { fontWeight: "700" },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginTop: 10
  },

  cancelBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    alignItems: "center"
  },

  cancelText: { fontWeight: "800" },

  error: { color: "red", marginTop: 8 }

});