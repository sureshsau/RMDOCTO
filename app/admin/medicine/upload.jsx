import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useMedicine } from "../../../context/MedicineContext";

const DEMO_IMAGE =
  "https://www.ipackdesign.com/medicine-box-design/";

export default function UploadMedicine() {
  const { addMedicine, loading } = useMedicine();

  const [images, setImages] = useState([]);
  const [isActive, setIsActive] = useState(true);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    tags: "",
    therapeuticUse: "",
    ingredient: "",
    strength: "",
    dosageForm: "",
    prescriptionType: "",
    mrp: "",
    sellingPrice: "",
    agentPrice: "",
    gst: "",
    totalQty: "",
    minQty: "",
    batchNo: "",
    expiryDate: "",
    batchQty: "",
    manufacturer: "",
    license: "",
    address: "",
  });

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ---------------- SAVE ----------------
  const handleSave = async () => {
    if (!form.name || !form.brand) {
      Toast.show({
        type: "error",
        text2: "Medicine name & brand are required",
      });
      return;
    }

    const payload = {
      ...form,
      images,
      isActive,
    };

    const res = await addMedicine(payload);

    if (!res.success) {
      Toast.show({
        type: "error",
        text2: res.error,
      });
      return;
    }

    Toast.show({
      type: "success",
      text2: "Medicine saved successfully",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ================= MEDICINE IMAGES ================= */}
        <Section title="Medicine Images">
          <TouchableOpacity
            onPress={() => {
              if (images.length >= 5) {
                Toast.show({
                  type: "info",
                  text2: "Maximum 5 images allowed",
                });
                return;
              }
              setImages((prev) => [...prev, DEMO_IMAGE]);
            }}
            style={styles.uploadBox}
          >
            <Ionicons name="camera" size={38} color="#4f46e5" />
            <Text style={styles.uploadTitle}>
              Upload Medicine Photo
            </Text>
            <Text style={styles.uploadSub}>
              Demo only • Max 5 images
            </Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 16 }}
          >
            {[0, 1, 2, 3, 4].map((index) => {
              const img = images[index];
              return (
                <View key={index} style={styles.thumb}>
                  {typeof img === "string" ? (
                    <>
                      <Image
                        source={{ uri: img }}
                        style={styles.thumbImg}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setImages((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        style={styles.removeBtn}
                      >
                        <Ionicons
                          name="close"
                          size={12}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Ionicons
                      name="image-outline"
                      size={26}
                      color="#94a3b8"
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>
        </Section>

        {/* ================= BASIC INFO ================= */}
        <Section title="Basic Information">
          <Input
            label="Medicine Name"
            placeholder="Paracetamol 500mg"
            onChangeText={(v) => update("name", v)}
          />
          <Input
            label="Brand Name"
            placeholder="Cipla / Sun Pharma"
            onChangeText={(v) => update("brand", v)}
          />
          <Input
            label="Description"
            placeholder="Short medicine description"
            multiline
            onChangeText={(v) => update("description", v)}
          />
        </Section>

        <Section title="Search & Discovery">
          <Input
            label="Tags"
            placeholder="fever, pain"
            onChangeText={(v) => update("tags", v)}
          />
          <Input
            label="Therapeutic Use"
            placeholder="Pain & fever relief"
            onChangeText={(v) => update("therapeuticUse", v)}
          />
        </Section>

        <Section title="Composition">
          <Input
            label="Ingredient"
            placeholder="Paracetamol"
            onChangeText={(v) => update("ingredient", v)}
          />
          <Input
            label="Strength"
            placeholder="500 mg"
            onChangeText={(v) => update("strength", v)}
          />
        </Section>

        <Section title="Dosage & Legal">
          <Input
            label="Dosage Form"
            placeholder="Tablet / Syrup"
            onChangeText={(v) => update("dosageForm", v)}
          />
          <Input
            label="Prescription Type"
            placeholder="RX / OTC"
            onChangeText={(v) => update("prescriptionType", v)}
          />
        </Section>

        <Section title="Pricing">
          <Input
            label="MRP (₹)"
            keyboard="numeric"
            onChangeText={(v) => update("mrp", v)}
          />
          <Input
            label="Selling Price (₹)"
            keyboard="numeric"
            onChangeText={(v) => update("sellingPrice", v)}
          />
          <Input
            label="Agent Price (₹)"
            keyboard="numeric"
            onChangeText={(v) => update("agentPrice", v)}
          />
          <Input
            label="GST (%)"
            keyboard="numeric"
            onChangeText={(v) => update("gst", v)}
          />
        </Section>

        <Section title="Stock">
          <Input
            label="Total Quantity"
            keyboard="numeric"
            onChangeText={(v) => update("totalQty", v)}
          />
          <Input
            label="Min Alert Quantity"
            keyboard="numeric"
            onChangeText={(v) => update("minQty", v)}
          />
        </Section>

        <Section title="Batch & Expiry">
          <Input
            label="Batch Number"
            onChangeText={(v) => update("batchNo", v)}
          />
          <Input
            label="Expiry Date"
            placeholder="YYYY-MM-DD"
            onChangeText={(v) => update("expiryDate", v)}
          />
          <Input
            label="Batch Quantity"
            keyboard="numeric"
            onChangeText={(v) => update("batchQty", v)}
          />
        </Section>

        <Section title="Manufacturer">
          <Input
            label="Manufacturer Name"
            onChangeText={(v) => update("manufacturer", v)}
          />
          <Input
            label="License Number"
            onChangeText={(v) => update("license", v)}
          />
          <Input
            label="Address"
            multiline
            onChangeText={(v) => update("address", v)}
          />
        </Section>

        <Section title="Status">
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              Active & Available
            </Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
            />
          </View>
        </Section>
      </ScrollView>

      {/* SAVE BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveBtn}
          disabled={loading}
        >
          <Text style={styles.saveText}>
            {loading ? "Saving..." : "Save Medicine"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Input({
  label,
  placeholder,
  keyboard = "default",
  multiline = false,
  onChangeText,
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        keyboardType={keyboard}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={[styles.input, multiline && { height: 96 }]}
        placeholderTextColor="#94a3b8"
        onChangeText={onChangeText}
      />
    </View>
  );
}


/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  scroll: { padding: 16, paddingBottom: 140 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: 1,
    marginBottom: 16,
  },

  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#c7d2fe",
    borderRadius: 16,
    height: 176,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef2ff",
  },
  uploadTitle: { marginTop: 8, fontWeight: "700", color: "#4f46e5" },
  uploadSub: { fontSize: 12, color: "#64748b", marginTop: 4 },

  thumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f1f5f9",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  label: { fontSize: 14, fontWeight: "600", color: "#475569", marginBottom: 4 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#0f172a",
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchText: { fontWeight: "600", color: "#334155" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
