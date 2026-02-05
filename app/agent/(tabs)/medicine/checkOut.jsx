import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

import AddressSelector from "../../../../components/shared/medicine/checkout/AddressSelector";
import UserInfo from "../../../../components/shared/medicine/checkout/UserInfo";
import { useAuth } from "../../../../context/AuthContext";
import { useMedicineCart } from "../../../../context/MedicineCartContext";

export default function Cart() {
  const {
    items,
    totalPrice,
    updateQuantity,
    removeMedicine,
    deliveryAddress,
    placeOrder,
    loading,
    error,
  } = useMedicineCart();

  const { user } = useAuth();

  const isAgent =
    user?.roles?.some((r) =>
      r.toLowerCase().includes("agent")
    ) ?? false;

  const handlePlaceOrder = async () => {
    const res = await placeOrder({ isAgent });

    if (res.success) {
      Toast.show({
        type: "success",
        text1: "Order placed successfully",
        text2: "Your medicines will be delivered soon",
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Order failed",
        text2: res.error || error,
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
        <Text style={styles.header}>Cart</Text>

        {/* EMPTY */}
        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
          </View>
        )}

        {/* ITEMS */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>

            {items.map((item) => {
              const price = isAgent
                ? item.specialPrice ?? item.price ?? 0
                : item.price ?? 0;

              return (
                <View key={item._id} style={styles.itemRow}>
                  <Image
                    source={{
                      uri:
                        item.image ||
                        "https://via.placeholder.com/150",
                    }}
                    style={styles.itemImage}
                  />

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text numberOfLines={2} style={styles.itemName}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>₹{price}</Text>

                    <TouchableOpacity
                      onPress={() => removeMedicine(item._id)}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() =>
                        updateQuantity(item._id, item.quantity - 1)
                      }
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepText}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.stepQty}>{item.quantity}</Text>

                    <TouchableOpacity
                      onPress={() =>
                        updateQuantity(item._id, item.quantity + 1)
                      }
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {items.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>User Details</Text>
              <UserInfo />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <AddressSelector />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentActive}>
                <Text style={styles.paymentTextActive}>
                  Cash on Delivery
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* CHECKOUT BAR */}
      {items.length > 0 && (
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalAmount}>₹{totalPrice}</Text>
            <Text style={styles.deliveryFree}>Delivery Fee: FREE</Text>
          </View>

          <TouchableOpacity
            disabled={!deliveryAddress || loading}
            onPress={handlePlaceOrder}
            style={[
              styles.checkoutBtn,
              (!deliveryAddress || loading) && styles.disabledBtn,
            ]}
          >
            <Text style={styles.checkoutText}>
              {loading ? "Placing..." : "Place Order"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
/* ================= STYLES (UNCHANGED) ================= */ const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#f8fafc" }, header: { fontSize: 22, fontWeight: "800", margin: 20 }, section: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 20, elevation: 2, }, sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14, }, itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 18, }, itemImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#f1f5f9", }, itemName: { fontSize: 14, fontWeight: "600", }, itemPrice: { fontSize: 13, color: "#64748b", marginTop: 4, }, removeText: { marginTop: 6, fontSize: 12, fontWeight: "600", color: "#dc2626", }, stepper: { flexDirection: "row", alignItems: "center", backgroundColor: "#ecfeff", borderRadius: 999, }, stepBtn: { paddingHorizontal: 16, paddingVertical: 6, }, stepText: { fontSize: 18, fontWeight: "700", }, stepQty: { fontSize: 14, fontWeight: "700", paddingHorizontal: 8, }, emptyState: { alignItems: "center", marginTop: 100, }, emptyIcon: { fontSize: 52 }, emptyTitle: { fontSize: 16, fontWeight: "700", marginTop: 12, }, paymentActive: { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#14b8a6", }, paymentTextActive: { color: "#fff", fontWeight: "700", }, checkoutBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderColor: "#e5e7eb", }, totalLabel: { fontSize: 12, color: "#64748b", }, totalAmount: { fontSize: 20, fontWeight: "800", color: "#14b8a6", }, checkoutBtn: { backgroundColor: "#14b8a6", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18, }, checkoutText: { color: "#fff", fontWeight: "800", }, });