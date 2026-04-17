import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMedicineCart } from "../../context/MedicineCartContext";
import AddressSelector from "../../components/shared/medicine/checkout/AddressSelector";

export default function AddressScreen() {
  const { deliveryAddress } = useMedicineCart();

  const isValidAddress =
    deliveryAddress &&
    deliveryAddress.addressLine1 &&
    deliveryAddress.pincode &&
    deliveryAddress.fullName && 
    deliveryAddress.phone;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={styles.headerTitle}>Select Delivery Address</Text>
        <AddressSelector />
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.checkoutBar}>
        <TouchableOpacity 
          style={[styles.nextBtn, !isValidAddress && styles.disabledBtn]} 
          disabled={!isValidAddress}
          onPress={() => router.push("/medicine-store/payment")}
        >
          <Text style={styles.nextBtnText}>Proceed to Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#334155", marginBottom: 16 },
  checkoutBar: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: "#fff", 
    padding: 16, 
    paddingBottom: 24, 
    borderTopWidth: 1, 
    borderColor: "#e5e7eb", 
    elevation: 10 
  },
  nextBtn: { backgroundColor: "#14b8a6", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  nextBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  disabledBtn: { backgroundColor: "#cbd5e1" },
});
