import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import InputField from "./ui/InputField";
import SectionCard from "./ui/SectionCard";

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Drops",
  "Inhaler",
  "Other",
];

export default function DosageSection({ data, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <SectionCard title="Dosage & Legal">
      {/* DOSAGE FORM DROPDOWN */}
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Dosage Form</Text>

        <Pressable
          onPress={() => setOpen(true)}
          style={styles.dropdown}
        >
          <Text
            style={[
              styles.dropdownText,
              !data.dosageForm && styles.placeholder,
            ]}
          >
            {data.dosageForm || "Select dosage form"}
          </Text>

          <Ionicons
            name="chevron-down"
            size={18}
            color="#64748b"
          />
        </Pressable>
      </View>

      {/* PRESCRIPTION TYPE */}
      <InputField
        label="Prescription Type"
        placeholder="RX / OTC"
        value={data.prescriptionType}
        onChangeText={(v) =>
          onChange("prescriptionType", v)
        }
      />

      {/* MODAL */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Select Dosage Form
            </Text>

            <FlatList
              data={DOSAGE_FORMS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onChange("dosageForm", item);
                    setOpen(false);
                  }}
                  style={styles.optionRow}
                >
                  <Text style={styles.optionText}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </SectionCard>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569", // slate-600
    marginBottom: 4,
  },

  dropdown: {
    backgroundColor: "#f8fafc", // slate-50
    borderWidth: 1,
    borderColor: "#e2e8f0", // slate-200
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownText: {
    fontSize: 14,
    color: "#0f172a",
  },

  placeholder: {
    color: "#94a3b8", // slate-400
  },

  /* MODAL */

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: "60%",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 12,
  },

  optionRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },

  optionText: {
    fontSize: 16,
    color: "#1e293b",
  },
});
