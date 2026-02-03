import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

/* ================= MOCK CART DATA ================= */
const INITIAL_CART = [
  {
    id: 1,
    name: "HK Vitals Biotin Tablets",
    price: 482.82,
    quantity: 1,
  },
  {
    id: 2,
    name: "Everherb Neem Capsules",
    price: 191.08,
    quantity: 2,
  },
];

export default function Cart() {
  const [cart, setCart] = useState(INITIAL_CART);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  /* ================= CART ACTIONS ================= */
  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>
        {/* ================= HEADER ================= */}
        <Text style={styles.header}>Cart</Text>

        {/* ================= EMPTY STATE ================= */}
        {cart.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySub}>
              Add medicines to continue
            </Text>
          </View>
        )}

        {/* ================= CART ITEMS ================= */}
        {cart.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>

            {cart.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>
                    ₹{item.price.toFixed(2)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => decreaseQty(item.id)}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepText}>−</Text>
                  </TouchableOpacity>

                  <Text style={styles.stepQty}>
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    onPress={() => increaseQty(item.id)}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= ADDRESS ================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressName}>Suresh Motherchod</Text>
          <Text style={styles.addressText}>
            Kolkata, West Bengal, India
          </Text>
        </View>

        {/* ================= PAYMENT ================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <PaymentOption
            label="Cash on Delivery"
            active={paymentMethod === "COD"}
            onPress={() => setPaymentMethod("COD")}
          />

          <PaymentOption
            label="Credit / Debit Card"
            active={paymentMethod === "CARD"}
            onPress={() => setPaymentMethod("CARD")}
          />

          <PaymentOption
            label="UPI"
            active={paymentMethod === "UPI"}
            onPress={() => setPaymentMethod("UPI")}
          />
        </View>
      </ScrollView>

      {/* ================= CHECKOUT BAR ================= */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalAmount}>
            ₹{totalAmount.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          disabled={cart.length === 0}
          style={[
            styles.checkoutBtn,
            cart.length === 0 && styles.disabledBtn,
          ]}
        >
          <Text style={styles.checkoutText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= PAYMENT OPTION ================= */
function PaymentOption({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.paymentRow,
        active && styles.paymentActive,
      ]}
    >
      <Text
        style={[
          styles.paymentText,
          active && styles.paymentTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#020617",
    margin: 20,
  },

  section: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#020617",
    marginBottom: 14,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#020617",
  },

  itemPrice: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  removeText: {
    marginTop: 6,
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

  stepBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  stepText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#020617",
  },

  stepQty: {
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 8,
    color: "#020617",
  },

  addressName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#020617",
  },

  addressText: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  paymentRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    marginBottom: 10,
  },

  paymentActive: {
    backgroundColor: "#14b8a6",
  },

  paymentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  paymentTextActive: {
    color: "#ffffff",
  },

  emptyState: {
    alignItems: "center",
    marginTop: 100,
  },

  emptyIcon: {
    fontSize: 52,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    color: "#020617",
  },

  emptySub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },

  totalLabel: {
    fontSize: 12,
    color: "#64748b",
  },

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

  disabledBtn: {
    backgroundColor: "#9ca3af",
  },

  checkoutText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});