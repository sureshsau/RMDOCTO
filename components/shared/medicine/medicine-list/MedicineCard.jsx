import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../../context/AuthContext";
import { useMedicineCart } from "../../../../context/MedicineCartContext";
import { hasAgentPricing } from "../../../../utils/roles";

export default function MedicineCard({ medicine }) {
  const item = medicine;
  const { user } = useAuth();
  const { items, addMedicine, updateQuantity } =
    useMedicineCart();
  /* ================= ROLE LOGIC ================= */

  const isAgent = hasAgentPricing(user);

  const price = isAgent
    ? item.specialPrice ?? item.price ?? 0
    : item.price ?? 0;

  const mrp = item.mrp ?? 0;

  const discount =
    mrp > price && mrp > 0
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

  const image =
    item.image || "https://via.placeholder.com/300";

  const cartItem = items.find(
    (i) => i._id === item._id
  );

  const goToDetails = () => {
    router.push({
      pathname: "/medicine-store/details",
      params: { id: item._id },
    });
  };

  return (
    <View style={styles.card}>
      {/* CLICKABLE AREA */}
      <Pressable onPress={goToDetails}>
        {/* IMAGE */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: image }} style={styles.image} />

          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {discount}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* NAME */}
        <Text numberOfLines={2} style={styles.name}>
          {item.name}
        </Text>
      </Pressable>

      {/* PRICE */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{price}</Text>
        {mrp > price && (
          <Text style={styles.mrp}>₹{mrp}</Text>
        )}
      </View>

      {/* ACTION */}
      {!cartItem ? (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => addMedicine(item)}
        >
          <Text style={styles.addText}>ADD</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.qtyWrapper}>
          {/* MINUS */}
          <TouchableOpacity
            onPress={() =>
              updateQuantity(
                item._id,
                cartItem.quantity - 1
              )
            }
          >
            <Text style={styles.qtyText}>−</Text>
          </TouchableOpacity>

          {/* COUNT */}
          <TextInput
            style={styles.qtyInput}
            value={String(cartItem.quantity)}
            keyboardType="numeric"
            onChangeText={(text) => {
              const val = text.replace(/[^0-9]/g, '');
              updateQuantity(item._id, val === '' ? '' : parseInt(val, 10));
            }}
          />

          {/* PLUS */}
          <TouchableOpacity
            onPress={() =>
              updateQuantity(
                item._id,
                cartItem.quantity + 1
              )
            }
          >
            <Text style={styles.qtyText}>+</Text>
          </TouchableOpacity>

          {/* DELETE */}
          <TouchableOpacity
            onPress={() =>
              updateQuantity(item._id, 0)
            }
            style={styles.deleteBtn}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  imageWrap: {
    position: "relative",
    marginBottom: 10,
  },

  image: {
    width: "100%",
    height: 130,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },

  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#dc2626",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  discountText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },

  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 18,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  price: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e40af",
  },

  mrp: {
    fontSize: 12,
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },

  addBtn: {
    backgroundColor: "#14b8a6",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },

  addText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
  },

  qtyWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF7F11",
    borderRadius: 14,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "space-between",
  },

  qtyText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },

  qtyValue: {
    color: "#ffffff",
    fontWeight: "800",
  },

  qtyInput: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
    minWidth: 40,
    padding: 0,
    marginHorizontal: 8,
  },

  deleteBtn: {
    paddingLeft: 10,
  },
});
