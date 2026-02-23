import { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import Toast from "react-native-toast-message";
import api from "../../services/axios.js";

import AddressSelector from "../../components/shared/medicine/checkout/AddressSelector";
import UserInfo from "../../components/shared/medicine/checkout/UserInfo";
import { useAuth } from "../../context/AuthContext";
import { useMedicineCart } from "../../context/MedicineCartContext";
import { useRMCredit } from "../../context/RMCreditContext.jsx";

export default function Cart() {

  const {
    items,
    updateQuantity,
    removeMedicine,
    deliveryAddress,
    placeOrder,
    loading,
    error,
    calculatePricing
  } = useMedicineCart();

  const { wallet } = useRMCredit();
  const { user } = useAuth();

  const [paymentMode, setPaymentMode] = useState("COD");
  const [pendingOnlineOrderId, setPendingOnlineOrderId] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const isAgent =
    user?.roles?.some(r =>
      r.toLowerCase().includes("agent")
    ) ?? false;

  /* ================= GST PRICING ================= */

  const { subtotal, gstTotal, payableAmount } = useMemo(
    () => calculatePricing(isAgent),
    [items, isAgent]
  );

  const insufficientCredit =
    paymentMode === "RM_CREDIT" &&
    (wallet?.balance || 0) < payableAmount;

  /* ===================== HANDLE ORDER ===================== */

  const handlePlaceOrder = async () => {

    if (processingPayment || loading) return;

    if (!deliveryAddress) {
      Toast.show({
        type: "error",
        text1: "Select delivery address",
      });
      return;
    }

    /* ========= COD / RM CREDIT ========= */

    if (paymentMode === "COD" || paymentMode === "RM_CREDIT") {

      const res = await placeOrder({
        isAgent,
        paymentMode,
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Order placed successfully",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Order failed",
          text2: res.error || error,
        });
      }
      return;
    }

    /* ========= ONLINE ========= */

    try {

      setProcessingPayment(true);

      let orderId = pendingOnlineOrderId;

      if (!orderId) {

        const res = await placeOrder({
          isAgent,
          paymentMode: "ONLINE",
        });

        if (!res.success) {
          Toast.show({
            type: "error",
            text1: "Order failed",
            text2: res.error || error,
          });
          setProcessingPayment(false);
          return;
        }

        orderId =
          res?.data?.orderId ||
          res?.data?.data?.orderId;

        setPendingOnlineOrderId(orderId);
      }

      const razorRes = await api.post(
        "/medicine/order/payments/razorpay/create",
        { orderId }
      );

      const {
        key,
        amount,
        currency,
        razorpayOrderId,
      } = razorRes.data.data;

      const options = {
        key,
        amount,
        currency,
        name: "RM Docto",
        description: "Medicine Order",
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || "",
          contact: user?.phone || "",
        },
        theme: { color: "#14b8a6" },
      };

      RazorpayCheckout.open(options)
        .then(async (data) => {

          await api.post(
            "/medicine/order/payments/razorpay/verify",
            {
              orderId,
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
            }
          );

          setPendingOnlineOrderId(null);
          setProcessingPayment(false);

          Toast.show({
            type: "success",
            text1: "Payment Successful",
          });

        })
        .catch(() => {

          setProcessingPayment(false);

          Toast.show({
            type: "error",
            text1: "Payment Cancelled",
            text2: "You can retry payment",
          });

        });

    } catch (err) {

      setProcessingPayment(false);

      Toast.show({
        type: "error",
        text1: "Payment failed",
      });
    }
  };

  /* ===================== UI ===================== */

  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>

        <Text style={styles.header}>Cart</Text>

        {items.length > 0 && (

          <View style={styles.section}>

            <Text style={styles.sectionTitle}>Items</Text>

            {items.map(item => {

              const price = isAgent
                ? item.specialPrice ?? item.price ?? 0
                : item.price ?? 0;

              return (
                <View key={item._id} style={styles.itemRow}>

                  <Image source={{ uri: item.image }} style={styles.itemImage} />

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>₹{price}</Text>

                    <TouchableOpacity onPress={() => removeMedicine(item._id)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item._id, item.quantity - 1)}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepText}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.stepQty}>{item.quantity}</Text>

                    <TouchableOpacity
                      onPress={() => updateQuantity(item._id, item.quantity + 1)}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepText}>+</Text>
                    </TouchableOpacity>
                  </View>

                </View>
              );
            })}

            {/* GST BREAKDOWN */}
            <View style={{ marginTop: 10 }}>
              <Text>Subtotal: ₹{subtotal}</Text>
              <Text>GST: ₹{gstTotal}</Text>
            </View>

          </View>
        )}

        {/* USER */}
        <View style={styles.section}>
          <UserInfo />
        </View>

        {/* ADDRESS */}
        <View style={styles.section}>
          <AddressSelector />
        </View>

        {/* PAYMENT METHOD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Payment Method
          </Text>

          <PaymentOption
            label="Cash on Delivery"
            active={paymentMode === "COD"}
            onPress={() => setPaymentMode("COD")}
          />

          <PaymentOption
            label="Online Payment"
            active={paymentMode === "ONLINE"}
            onPress={() => setPaymentMode("ONLINE")}
          />

          <PaymentOption
            label="RM Credit"
            active={paymentMode === "RM_CREDIT"}
            onPress={() => setPaymentMode("RM_CREDIT")}
          />

          {paymentMode === "RM_CREDIT" && (
            <>
              <Text style={styles.creditInfo}>
                Available Credit: ₹{wallet?.balance || 0}
              </Text>

              {insufficientCredit && (
                <Text style={styles.creditWarning}>
                  Insufficient RM Credit
                </Text>
              )}
            </>
          )}
        </View>

      </ScrollView>

      {/* CHECKOUT */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.totalLabel}>
            Total Payable
          </Text>
          <Text style={styles.totalAmount}>
            ₹{payableAmount}
          </Text>
        </View>

        <TouchableOpacity
          disabled={
            !deliveryAddress ||
            loading ||
            insufficientCredit ||
            processingPayment
          }
          onPress={handlePlaceOrder}
          style={[
            styles.checkoutBtn,
            (!deliveryAddress ||
              loading ||
              insufficientCredit ||
              processingPayment) &&
              styles.disabledBtn,
          ]}
        >
          <Text style={styles.checkoutText}>
            {processingPayment || loading
              ? "Processing..."
              : paymentMode === "ONLINE"
              ? "Pay Now"
              : "Place Order"}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

/* PAYMENT OPTION */

function PaymentOption({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.paymentBox,
        active && styles.paymentActive,
      ]}
    >
      <Text
        style={[
          styles.paymentText,
          active && { color: "#fff" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ===================== PAYMENT OPTION ===================== */


/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { fontSize: 22, fontWeight: "800", margin: 20 },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemPrice: { fontSize: 13, color: "#64748b" },
  removeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#dc2626",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfeff",
    borderRadius: 999,
  },
  stepBtn: { paddingHorizontal: 16, paddingVertical: 6 },
  stepText: { fontSize: 18, fontWeight: "700" },
  stepQty: { fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", marginTop: 100 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  paymentBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    marginBottom: 10,
  },
  paymentActive: { backgroundColor: "#14b8a6" },
  paymentText: { fontWeight: "700" },
  creditInfo: {
    marginTop: 6,
    fontWeight: "600",
    color: "#14b8a6",
  },
  creditWarning: {
    marginTop: 6,
    color: "#dc2626",
    fontWeight: "600",
  },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },
  totalLabel: { fontSize: 12, color: "#64748b" },
  totalAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#14b8a6",
  },
  checkoutBtn: {
    backgroundColor: "#14b8a6",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 18,
  },
  checkoutText: { color: "#fff", fontWeight: "800" },
  disabledBtn: { backgroundColor: "#cbd5e1" },
});
