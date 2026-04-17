import { router } from "expo-router";
import { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMedicineCart } from "../../context/MedicineCartContext";
import { useAuth } from "../../context/AuthContext";
import UserInfo from "../../components/shared/medicine/checkout/UserInfo";

export default function CartScreen() {
  const {
    items,
    updateQuantity,
    removeMedicine,
    calculatePricing,
  } = useMedicineCart();

  const { user } = useAuth();
  const isAgent = user?.roles?.some((r) => r.toLowerCase().includes("agent")) ?? false;

  const { subtotal, gstTotal, payableAmount } = useMemo(
    () => calculatePricing(isAgent),
    [items, isAgent]
  );

  /* ===================== CHECKS ===================== */
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        </View>
      </View>
    );
  }

  /* ===================== RENDER ===================== */
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 150, paddingTop: 16 }}>
        
        <View style={styles.card}>
          <UserInfo />
          <View style={{ marginVertical: 12 }} />

          {items.map((item) => {
            const price = isAgent ? item.specialPrice ?? item.price ?? 0 : item.price ?? 0;
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
                  <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity - 1)} style={styles.stepBtn}>
                    <Text style={styles.stepText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.stepInput}
                    value={String(item.quantity)}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const val = text.replace(/[^0-9]/g, "");
                      updateQuantity(item._id, val === "" ? "" : parseInt(val, 10));
                    }}
                  />
                  <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity + 1)} style={styles.stepBtn}>
                    <Text style={styles.stepText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={styles.gstBox}>
            <Text style={styles.gstBoxText}>Subtotal: ₹{subtotal}</Text>
            <Text style={styles.gstBoxText}>GST: ₹{gstTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* CHECKOUT BOTTOM BAR */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalAmount}>₹{payableAmount}</Text>
        </View>

        <TouchableOpacity onPress={() => router.push("/medicine-store/address")} style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Proceed to Address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  card: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  
  /* Item Styles */
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  itemImage: { width: 56, height: 56, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  itemName: { fontSize: 14, fontWeight: "600", color: "#334155" },
  itemPrice: { fontSize: 13, color: "#64748b", marginTop: 2 },
  removeText: { fontSize: 12, fontWeight: "600", color: "#ef4444", marginTop: 6 },
  
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  stepText: { fontSize: 16, fontWeight: "700", color: "#14b8a6" },
  stepInput: { fontSize: 14, fontWeight: "700", textAlign: "center", minWidth: 26, padding: 0, marginHorizontal: 4 },
  
  gstBox: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 8, marginTop: 4 },
  gstBoxText: { fontSize: 13, color: "#475569", marginBottom: 2 },

  /* Bottom Bar */
  checkoutBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 16, paddingBottom: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderColor: "#e5e7eb", elevation: 10 },
  totalLabel: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  totalAmount: { fontSize: 22, fontWeight: "800", color: "#0f766e" },
  checkoutBtn: { backgroundColor: "#14b8a6", paddingHorizontal: 26, paddingVertical: 14, borderRadius: 14 },
  checkoutText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  
  emptyState: { alignItems: "center", marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748b" },
});
