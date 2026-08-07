import { router } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { useMedicineCart } from "../../context/MedicineCartContext";
import { useRMCredit } from "../../context/RMCreditContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/axios";
import { hasAgentPricing } from "../../utils/roles";

export default function PaymentScreen() {
  const {
    items,
    deliveryAddress,
    placeOrder,
    loading,
    error,
    calculatePricing,
  } = useMedicineCart();

  const { wallet, loading: creditLoading, refreshRMCredit } = useRMCredit();
  const { user } = useAuth();
  
  const [paymentMode, setPaymentMode] = useState("COD");
  const [rmCoinBalance, setRmCoinBalance] = useState(0);
  const [coinLoading, setCoinLoading] = useState(true);
  const isAgent = hasAgentPricing(user);

  const { subtotal, payableAmount } = useMemo(() => calculatePricing(isAgent), [items, isAgent]);

  // 🔥 Fetch live RMCoin balance on mount
  useEffect(() => {
    const fetchCoinBalance = async () => {
      try {
        setCoinLoading(true);
        const res = await api.get("/rmcoin/logs/me?page=1&limit=1");
        if (res.data.success) {
          setRmCoinBalance(res.data.wallet?.balance ?? 0);
        }
      } catch {
        setRmCoinBalance(0);
      } finally {
        setCoinLoading(false);
      }
    };
    fetchCoinBalance();
    // Also refresh RM Credit when payment page opens
    refreshRMCredit();
  }, []);

  const rmCreditBalance = wallet?.balance ?? 0;
  const insufficientCredit = paymentMode === "RM_CREDIT" && !creditLoading && rmCreditBalance < payableAmount;
  const insufficientCoins = paymentMode === "RM_COIN" && !coinLoading && rmCoinBalance < payableAmount;

  const handlePlaceOrder = async () => {
    if (loading) return;
    
    if (!deliveryAddress) {
      Toast.show({ type: "error", text1: "Delivery Address missing!" });
      router.back();
      return;
    }

    const res = await placeOrder({ isAgent, paymentMode });
    
    if (res.success) {
      Toast.show({ type: "success", text1: "Order Placed Successfully ✨" });
      // Redirect to orders history
      router.push("/mymedicineorder");
    } else {
      Toast.show({ type: "error", text1: "Order Failed", text2: res.error || error });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={styles.headerTitle}>Select Payment Method</Text>

        <View style={styles.card}>
          <PaymentOption label="Cash on Delivery" active={paymentMode === "COD"} onPress={() => setPaymentMode("COD")} />
          <PaymentOption label="Online Payment" active={paymentMode === "ONLINE"} onPress={() => setPaymentMode("ONLINE")} />
          
          <PaymentOption label="RM Credit" active={paymentMode === "RM_CREDIT"} onPress={() => setPaymentMode("RM_CREDIT")} />
          {paymentMode === "RM_CREDIT" && (
            <View style={styles.walletBox}>
              {creditLoading ? (
                <ActivityIndicator size="small" color="#14b8a6" />
              ) : (
                <Text style={styles.walletInfo}>Available Credit: ₹{rmCreditBalance.toFixed(2)}</Text>
              )}
              {insufficientCredit && <Text style={styles.walletWarning}>Insufficient RM Credit (Need ₹{payableAmount}, Have ₹{rmCreditBalance.toFixed(2)})</Text>}
            </View>
          )}

          <PaymentOption label="RM Coins" active={paymentMode === "RM_COIN"} onPress={() => setPaymentMode("RM_COIN")} />
          {paymentMode === "RM_COIN" && (
            <View style={[styles.walletBox, { backgroundColor: "#fffbf1", borderColor: "#fde68a" }]}>
              {coinLoading ? (
                <ActivityIndicator size="small" color="#d97706" />
              ) : (
                <Text style={[styles.walletInfo, { color: "#d97706" }]}>Available Coins: 🪙 {rmCoinBalance}</Text>
              )}
              {insufficientCoins && <Text style={styles.walletWarning}>Insufficient RM Coins (Need {payableAmount}, Have {rmCoinBalance})</Text>}
            </View>
          )}

        </View>
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalAmount}>₹{payableAmount}</Text>
        </View>

        <TouchableOpacity
          disabled={loading || insufficientCredit || insufficientCoins}
          onPress={handlePlaceOrder}
          style={[styles.checkoutBtn, (loading || insufficientCredit || insufficientCoins) && styles.disabledBtn]}
        >
          <Text style={styles.checkoutText}>
            {loading ? "Processing..." : paymentMode === "ONLINE" ? "Pay Now" : "Place Order"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PaymentOption({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.paymentBox, active && styles.paymentActive]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={20} color={active ? "#14b8a6" : "#cbd5e1"} />
        <Text style={[styles.paymentText, active && { color: "#0f766e" }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#334155", marginBottom: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  
  paymentBox: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 10, backgroundColor: "#fff" },
  paymentActive: { borderColor: "#14b8a6", backgroundColor: "#f0fdfa" },
  paymentText: { fontWeight: "600", fontSize: 14, color: "#334155" },
  
  walletBox: { padding: 12, backgroundColor: "#f8fafc", borderRadius: 8, marginTop: -4, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  walletInfo: { fontWeight: "600", color: "#0f766e", fontSize: 13 },
  walletWarning: { marginTop: 4, color: "#ef4444", fontWeight: "600", fontSize: 12 },

  checkoutBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 16, paddingBottom: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderColor: "#e5e7eb", elevation: 10 },
  totalLabel: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  totalAmount: { fontSize: 22, fontWeight: "800", color: "#0f766e" },
  checkoutBtn: { backgroundColor: "#14b8a6", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  checkoutText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  disabledBtn: { backgroundColor: "#cbd5e1" },
});
