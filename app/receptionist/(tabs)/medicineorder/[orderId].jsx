import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import api from "../../../../services/axios";

export default function OrderDetails() {
  const { orderId } = useLocalSearchParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        {/* ================= HEADER ================= */}
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

        {/* ================= CUSTOMER ================= */}
        <View style={styles.card}>
          <Text style={styles.title}>Customer Details</Text>

          <Text style={styles.body}>
            👤 {order.deliveryAddress?.fullName}
          </Text>
          <Text style={styles.body}>
            📞 {order.deliveryAddress?.phone}
          </Text>
          <Text style={styles.meta}>
            📍 {order.deliveryAddress?.addressLine1}
          </Text>
          <Text style={styles.meta}>
            Pincode: {order.deliveryAddress?.pincode}
          </Text>
        </View>

        {/* ================= DELIVERY AGENT ================= */}
        {order.deliveryAgent && (
          <View style={styles.card}>
            <Text style={styles.title}>Delivery Agent</Text>
            <Text style={styles.body}>
              {order.deliveryAgent.name}
            </Text>
            <Text style={styles.meta}>
              📞 {order.deliveryAgent.phone}
            </Text>
          </View>
        )}

        {/* ================= MEDICINES ================= */}
        <View style={styles.card}>
          <Text style={styles.title}>Medicines</Text>

          {order.items.map((item, index) => (
            <View key={index} style={styles.medicineCard}>
              {/* IMAGE */}
              {item.medicine?.image ? (
                <Image
                  source={{ uri: item.medicine.image }}
                  style={styles.medicineImage}
                />
              ) : (
                <View style={styles.imagePlaceholder} />
              )}

              {/* DETAILS */}
              <View style={{ flex: 1 }}>
                <Text style={styles.medicineName}>
                  {item.medicine?.name}
                </Text>

                <Text style={styles.meta}>
                  Brand: {item.medicine?.brandName}
                </Text>

                <Text style={styles.meta}>
                  Form: {item.medicine?.dosageForm}
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

          <Text style={styles.body}>
            Mode: {order.paymentMode}
          </Text>

          <Text style={styles.body}>
            Status: {order.paymentStatus}
          </Text>

          <View style={{ marginTop: 12 }}>
            <Text>
              Subtotal: ₹{order.pricing?.subtotal}
            </Text>
            <Text>
              GST: ₹{order.pricing?.gstTotal}
            </Text>
            <Text>
              Delivery: ₹{order.pricing?.deliveryCharge}
            </Text>

            <Text style={styles.finalAmount}>
              Total Payable: ₹{order.pricing?.payableAmount}
            </Text>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

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

  orderId: {
    fontSize: 16,
    fontWeight: "900",
  },

  statusPill: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    fontWeight: "800",
  },

  title: {
    fontWeight: "800",
    marginBottom: 14,
    fontSize: 15,
  },

  body: {
    fontSize: 14,
    marginBottom: 6,
  },

  meta: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },

  medicineCard: {
    flexDirection: "row",
    alignItems: "center",
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

  medicineName: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },

  totalItem: {
    fontWeight: "800",
    marginTop: 4,
    color: "#0F172A",
  },

  finalAmount: {
    fontWeight: "900",
    fontSize: 16,
    marginTop: 8,
  },
});
