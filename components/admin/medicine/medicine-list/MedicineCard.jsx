import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { useMedicine } from "../../../../context/MedicineContext";

export default function MedicineCard({ medicine, onDeleted, detailsPath = "/admin/medicine/details" }) {
  const { deleteMedicine } = useMedicine();

  const {
    _id,
    name,
    brandName,
    dosageForm,
    price,
    mrp,
    specialPrice,
    image,
  } = medicine;

  const handleDelete = () => {
    Alert.alert(
      "Delete Medicine",
      "This action cannot be undone",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteMedicine(_id);

            if (!res.success) {
              Toast.show({
                type: "error",
                text1: "Delete Failed",
                text2: res.error,
              });
              return;
            }

            Toast.show({
              type: "success",
              text1: "Medicine Deleted",
              text2: "Medicine removed successfully",
            });

            onDeleted?.(_id); // 🔥 remove from UI
          },
        },
      ]
    );
  };

  return (

    <Pressable
  onPress={() =>
    router.push({
      pathname: detailsPath,
      params: {
        id: _id,
      },
    })
  }
>
        <View style={styles.card}>
      {/* DELETE */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDelete}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={16} color="#dc2626" />
      </TouchableOpacity>

      {/* IMAGE */}
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.iconFallback}>
          <Ionicons name="medkit-outline" size={28} color="#94a3b8" />
        </View>
      )}

      {/* INFO */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        <Text style={styles.brand} numberOfLines={1}>
          {brandName} • {dosageForm}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price}</Text>
          <Text style={styles.mrp}>₹{mrp}</Text>
        </View>

        <View style={styles.agentBadge}>
          <Text style={styles.agentText}>
            Agent ₹{specialPrice}
          </Text>
        </View>
      </View>
    </View>
    </Pressable>

  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    gap: 12,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  deleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "#fee2e2",
    padding: 6,
    borderRadius: 999,
  },

  image: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },

  iconFallback: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  info: {
    flex: 1,
    paddingRight: 28,
  },

  name: {
    fontWeight: "800",
    fontSize: 15,
    color: "#0f172a",
  },

  brand: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },

  price: {
    fontWeight: "800",
    fontSize: 16,
    color: "#16a34a",
  },

  mrp: {
    fontSize: 12,
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },

  agentBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },

  agentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
  },
});
