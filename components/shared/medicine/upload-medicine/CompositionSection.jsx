import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import InputField from "./ui/InputField";
import SectionCard from "./ui/SectionCard";

export default function CompositionSection({
  data,
  onChange,
  onAdd,
  onRemove,
}) {
  return (
    <SectionCard title="Composition">
      {data.map((item, index) => (
        <View key={index} style={styles.itemCard}>
          {/* REMOVE BUTTON */}
          {data.length > 1 && (
            <TouchableOpacity
              onPress={() => onRemove(index)}
              style={styles.removeBtn}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="#ef4444"
              />
            </TouchableOpacity>
          )}

          <InputField
            label={`Ingredient ${index + 1}`}
            placeholder="Paracetamol"
            value={item.ingredient}
            onChangeText={(v) =>
              onChange(index, "ingredient", v)
            }
          />

          <InputField
            label={`Strength ${index + 1}`}
            placeholder="500 mg"
            value={item.strength}
            onChangeText={(v) =>
              onChange(index, "strength", v)
            }
          />
        </View>
      ))}

      {/* ADD */}
      <TouchableOpacity
        onPress={onAdd}
        style={styles.addRow}
        activeOpacity={0.8}
      >
        <Ionicons
          name="add-circle-outline"
          size={20}
          color="#4f46e5"
        />
        <Text style={styles.addText}>
          Add Ingredient
        </Text>
      </TouchableOpacity>
    </SectionCard>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  itemCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0", // slate-200
    backgroundColor: "#f8fafc", // slate-50
    position: "relative",
  },

  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },

  addRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  addText: {
    marginLeft: 8,
    fontWeight: "700",
    color: "#4f46e5", // indigo-600
  },
});
