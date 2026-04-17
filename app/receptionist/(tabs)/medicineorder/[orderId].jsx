import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import InvoiceGenerator from "../../../../components/shared/medicine/InvoiceGenerator";
import { useUser } from "../../../../context/UserContext";
import api from "../../../../services/axios";

export default function OrderDetails() {

  const { orderId } = useLocalSearchParams();
  const { getRMRiders,rmRiders} = useUser();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [riders, setRiders] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  /* ================= FETCH ORDER ================= */

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

  /* ================= LOAD RIDERS ================= */

  const loadRiders = async () => {
    // if(rmRiders){
    //   setRiders(rmRiders);
    //   return
    // }
    const res = await getRMRiders();
    if (res.success) {
      setRiders(res.data);
      setShowAssignModal(true);
    } else {
      Toast.show({
        type: "error",
        text1: "Failed to load riders",
      });
    }
  };

  /* ================= ASSIGN / CHANGE RIDER ================= */

  const assignRider = async (userId) => {
    try {
      setAssignLoading(true);

      const res=await api.patch(`/medicine/order/assign-rmrider/${orderId}`, {
        userId,
      });

      Toast.show({
        type: "success",
        text1: "Rider Updated Successfully",
        text2:res?.data?.message 
      });

      setShowAssignModal(false);
      fetchOrderDetails(true);

    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Assign failed",
      });
    } finally {
      setAssignLoading(false);
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

  const isAssigned = !!order.deliveryAgent;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* ================= HEADER ================= */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.orderId}>
              #{order.orderId.slice(-6)}
            </Text>
            <Text style={styles.meta}>
              Created: {new Date(order.createdAt).toDateString()}
            </Text>
            <Text style={styles.meta}>
              Updated: {new Date(order.updatedAt).toDateString()}
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

        {/* ================= CUSTOMER ================= */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.title}>Customer Details</Text>
          <Text style={styles.body}>👤 {order.deliveryAddress?.fullName}</Text>
          <Text style={styles.body}>📞 {order.deliveryAddress?.phone}</Text>
          <Text style={styles.meta}>📍 {order.deliveryAddress?.addressLine1}</Text>
          <Text style={styles.meta}>Pincode: {order.deliveryAddress?.pincode}</Text>
        </View>

        {/* ================= DELIVERY AGENT ================= */}
        <View style={styles.card}>
          <Text style={styles.title}>Delivery Agent</Text>

          {isAssigned ? (
            <>
              <Text style={styles.body}>
                {order.deliveryAgent.name}
              </Text>
              <Text style={styles.meta}>
                📞 {order.deliveryAgent.phone}
              </Text>

              <TouchableOpacity
                style={[styles.assignBtn, { backgroundColor: "#f59e0b" }]}
                onPress={loadRiders}
              >
                <Text style={styles.assignText}>
                  Change Rider
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.meta}>No rider assigned</Text>

              <TouchableOpacity
                style={styles.assignBtn}
                onPress={loadRiders}
              >
                <Text style={styles.assignText}>
                  Assign Rider
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ================= MEDICINES ================= */}
        <View style={styles.card}>
          <Text style={styles.title}>Medicines</Text>

          {order.items.map((item, index) => (
            <View key={index} style={styles.medicineCard}>
              {item.medicine?.image ? (
                <Image
                  source={{ uri: item.medicine.image }}
                  style={styles.medicineImage}
                />
              ) : (
                <View style={styles.imagePlaceholder} />
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.medicineName}>
                  {item.medicine?.name}
                </Text>

                <Text style={styles.meta}>
                  ₹{item.unitPrice} × {item.quantity}
                </Text>

                <Text style={styles.meta}>
                  GST {item.gstPercentage}% → ₹{item.gstAmount}
                </Text>

                <Text style={styles.totalItem}>
                  Total: ₹{item.totalPrice}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ================= PAYMENT ================= */}
        <View style={styles.card}>
          <Text style={styles.title}>Payment Details</Text>

          <Text style={styles.body}>Mode: {order.paymentMode}</Text>
          <Text style={styles.body}>Status: {order.paymentStatus}</Text>

          <View style={{ marginTop: 10 }}>
            <Text>Subtotal: ₹{order.pricing?.subtotal}</Text>
            <Text>GST: ₹{order.pricing?.gstTotal}</Text>
            <Text>Delivery: ₹{order.pricing?.deliveryCharge}</Text>
            <Text style={styles.finalAmount}>
              Total Payable: ₹{order.pricing?.payableAmount}
            </Text>
          </View>

          <Text style={styles.meta}>
            OTP Verified: {order.otpVerified ? "Yes" : "No"}
          </Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ================= RIDER MODAL ================= */}
      <Modal visible={showAssignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>Select Rider</Text>

            <ScrollView>
              {riders.map((r) => {
                const isCurrent = order.deliveryAgent?.id === r._id;

                return (
                  <View
                    key={r._id}
                    style={[
                      styles.riderCard,
                      isCurrent && { borderWidth: 2, borderColor: "#14b8a6" }
                    ]}
                  >
                    <View>
                      <Text style={styles.riderName}>
                        {r.name}
                      </Text>
                      <Text style={styles.riderPhone}>
                        {r.phone}
                      </Text>
                      {isCurrent && (
                        <Text style={{ color: "#14b8a6", fontSize: 11 }}>
                          Currently Assigned
                        </Text>
                      )}
                    </View>

                    {!isCurrent && (
                      <TouchableOpacity
                        style={styles.assignNowBtn}
                        onPress={() => assignRider(r._id)}
                      >
                        {assignLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.assignNowText}>
                            Assign
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowAssignModal(false)}
              style={styles.closeBtn}
            >
              <Text style={{ color: "#fff" }}>
                Close
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

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
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: { fontWeight: "800" },

  title: { fontWeight: "800", marginBottom: 14, fontSize: 15 },

  body: { fontSize: 14, marginBottom: 6 },

  meta: { fontSize: 12, color: "#64748b", marginBottom: 4 },

  medicineCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },

  medicineImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },

  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    marginRight: 12,
  },

  medicineName: { fontWeight: "700", fontSize: 14 },

  totalItem: { fontWeight: "800", marginTop: 4 },

  finalAmount: {
    fontWeight: "900",
    fontSize: 16,
    marginTop: 8,
  },

  assignBtn: {
    marginTop: 10,
    backgroundColor: "#14b8a6",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  assignText: { color: "#fff", fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
  },

  modalBox: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },

  riderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ecfeff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },

  riderName: { fontWeight: "700" },

  riderPhone: { fontSize: 12, color: "#64748b" },

  assignNowBtn: {
    backgroundColor: "#14b8a6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },

  assignNowText: { color: "#fff", fontWeight: "700" },

  closeBtn: {
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
});