
import Toast from "react-native-toast-message";
import api from "../../services/axios.js";

/* ================= MAIN ================= */



import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import InvoiceGenerator from "../../components/shared/medicine/InvoiceGenerator";


/* ================= MAIN ================= */

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
        text2:
          err?.response?.data?.message ||
          "Something went wrong",
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

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  if (!order) return null;

  /* ================= STATUS MAP ================= */

  const steps = [
    "INITIATED",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
  ];

  const currentStep = steps.indexOf(order.orderStatus);

  /* ================= CALL ================= */

  const callPartner = () => {
    if (order.deliveryAgent?.phone) {
      Linking.openURL(`tel:${order.deliveryAgent.phone}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14b8a6"
          />
        }
      >
        {/* ===== SUMMARY ===== */}
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

        {/* ===== PROGRESS ===== */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.title}>Order Progress</Text>

          {steps.map((step, index) => {
            const completed = index < currentStep;
            const active = index === currentStep;

            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.dot,
                      completed && styles.dotDone,
                      active && styles.dotActive,
                    ]}
                  />
                  {index !== steps.length - 1 && (
                    <View
                      style={[
                        styles.line,
                        completed && styles.lineDone,
                      ]}
                    />
                  )}
                </View>

                <Text
                  style={[
                    styles.stepText,
                    completed && styles.stepDone,
                    active && styles.stepActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ===== OTP ===== */}
        {order.otp && !order.otpVerified && (
          <View style={styles.otpCard}>
            <Text style={styles.title}>Delivery OTP</Text>
            <Text style={styles.otp}>{order.otp}</Text>
            <Text style={styles.helper}>
              Share this OTP with delivery partner
            </Text>
          </View>
        )}

        {/* ===== PAYMENT ===== */}
        <View style={styles.cardAccent}>
          <Text style={styles.title}>Payment Information</Text>

          <InfoRow label="Method" value={order.paymentMode} />
          <InfoRow
            label="Status"
            value={order.paymentStatus}
            highlight
          />
        </View>

        {/* ===== DELIVERY PARTNER ===== */}
        {order.deliveryAgent && (
          <View style={styles.card}>
            <Text style={styles.title}>Delivery Partner</Text>

            <Text style={styles.body}>
              {order.deliveryAgent.name}
            </Text>
            <Text style={styles.meta}>
              📞 {order.deliveryAgent.phone}
            </Text>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={callPartner}
              >
                <Text style={styles.btnGhostText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>
                  Track Partner
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== ADDRESS ===== */}
        <View style={styles.card}>
          <Text style={styles.title}>Delivery Address</Text>
          <Text style={styles.body}>
            {order.deliveryAddress.addressLine1}
            {order.deliveryAddress.addressLine2
              ? `, ${order.deliveryAddress.addressLine2}`
              : ""}
          </Text>
          <Text style={styles.meta}>
            Pincode: {order.deliveryAddress.pincode}
          </Text>
        </View>

        {/* ===== ITEMS ===== */}
        <View style={styles.card}>
          <Text style={styles.title}>Medicines</Text>

          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View>
                <Text style={styles.itemName}>
                  {item.medicine.name}
                </Text>
                <Text style={styles.meta}>
                  Qty {item.quantity}
                </Text>
              </View>

              <Text style={styles.price}>
                ₹{item.totalPrice}
              </Text>
            </View>
          ))}
        </View>

        {/* ===== BILL ===== */}
        <View style={styles.card}>
          <Text style={styles.title}>Bill Summary</Text>

          <BillRow
            label="Subtotal"
            value={`₹${order.pricing.subtotal}`}
          />

          <BillRow
            label="GST"
            value={`₹${order.pricing.gstTotal}`}
          />

          <BillRow
            label="Delivery Charges"
            value={
              order.pricing.deliveryCharge === 0
                ? "FREE"
                : `₹${order.pricing.deliveryCharge}`
            }
          />

          <View style={styles.divider} />

          <BillRow
            label="Total Payable"
            value={`₹${order.pricing.payableAmount}`}
            strong
          />
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

/* ================= SMALL COMPONENTS ================= */

const InfoRow = ({ label, value, highlight }) => (
  <View style={styles.row}>
    <Text style={styles.meta}>{label}</Text>
    <Text
      style={[
        styles.value,
        highlight && styles.valueHighlight,
      ]}
    >
      {value}
    </Text>
  </View>
);

const BillRow = ({ label, value, strong }) => (
  <View style={styles.row}>
    <Text style={[styles.body, strong && styles.strong]}>
      {label}
    </Text>
    <Text style={[styles.body, strong && styles.strong]}>
      {value}
    </Text>
  </View>
);

/* ================= STYLES ================= */
/* 🔥 YOUR ORIGINAL STYLES — UNCHANGED */



/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  heroCard: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    elevation: 2,
  },

  cardAccent: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#4338ca",
  },

  otpCard: {
    backgroundColor: "#eef2ff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 18,
  },

  orderId: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },

  statusPill: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    color: "#1e293b",
    fontWeight: "800",
    fontSize: 12,
  },

  title: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14,
    color: "#0f172a",
  },

  /* ===== TIMELINE ===== */
  timelineRow: {
    flexDirection: "row",
    marginBottom: 18,
  },

  timelineLeft: {
    alignItems: "center",
    width: 22,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#cbd5e1",
  },

  dotDone: {
    backgroundColor: "#0f766e",
  },

  dotActive: {
    backgroundColor: "#4338ca",
  },

  line: {
    width: 2,
    height: 28,
    backgroundColor: "#e5e7eb",
    marginTop: 2,
  },

  lineDone: {
    backgroundColor: "#0f766e",
  },

  stepText: {
    marginLeft: 14,
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },

  stepDone: {
    color: "#0f172a",
  },

  stepActive: {
    color: "#1e293b",
    fontWeight: "900",
  },

  otp: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 6,
    textAlign: "center",
    color: "#1e293b",
  },

  helper: {
    textAlign: "center",
    fontSize: 12,
    color: "#475569",
    marginTop: 6,
  },

  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4338ca",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 18,
  },

  partnerName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
  },

  body: {
    fontSize: 13,
    color: "#334155",
  },

  meta: {
    fontSize: 12,
    color: "#64748b",
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  itemName: {
    fontWeight: "700",
    color: "#0f172a",
  },

  price: {
    fontWeight: "900",
    color: "#0f172a",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  value: {
    fontWeight: "700",
    color: "#0f172a",
  },

  valueHighlight: {
    color: "#0f766e",
    fontWeight: "900",
  },

  strong: {
    fontWeight: "900",
  },

  muted: {
    color: "#64748b",
  },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 10,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },

  btnGhost: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
  },

  btnGhostText: {
    fontWeight: "800",
    color: "#1e293b",
  },

  btnPrimary: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 16,
  },

  btnPrimaryText: {
    color: "#ffffff",
    fontWeight: "900",
  },
});