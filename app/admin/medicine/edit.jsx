import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useMedicine } from "../../../context/MedicineContext";

const PURPLE = "#6b6dbf";
const BG = "#e6e9f8";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#64748b";
const BORDER = "#e2e8f0";
const RED = "#ef4444";

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

const PRESCRIPTION_TYPES = ["OTC", "RX"];

/** Blank string / null must not become NaN — the schema rejects that. */
const toNumber = (v) => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};

/** Dates come back as ISO strings; the input edits the YYYY-MM-DD part. */
const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");

/**
 * The form starts fully shaped rather than null. Every array field is read
 * directly in the JSX (`form.batches.map(...)`), so a null form crashes the
 * screen the instant a render slips past the loading guard — which is what
 * "Cannot read property 'batches' of null" was.
 */
const EMPTY_FORM = {
  name: "",
  brandName: "",
  description: "",
  tags: "",
  therapeuticUse: "",
  dosageForm: "Tablet",
  prescriptionType: "RX",
  composition: [],
  mrp: "",
  price: "",
  specialPrice: "",
  gstPercentage: "0",
  totalQuantity: "0",
  minAlertQuantity: "0",
  batches: [],
  manufacturerName: "",
  manufacturerLicense: "",
  manufacturerAddress: "",
  isActive: true,
};

export default function EditMedicine() {
  const { id } = useLocalSearchParams();
  const { getMedicineById, updateMedicine } = useMedicine();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  /* ================= LOAD ================= */

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    if (!id) {
      setLoadError("No medicine selected");
      setLoading(false);
      return;
    }

    const res = await getMedicineById(id);

    if (!res?.success || !res?.data) {
      // Surface it in the UI — a bare toast left the screen blank
      setLoadError(res?.error || "Failed to load medicine");
      setLoading(false);
      return;
    }

    const m = res.data;

    // Every key of EMPTY_FORM is filled, so no field can arrive undefined
    setForm({
      name: m.name || "",
      brandName: m.brandName || "",
      description: m.description || "",
      tags: (m.tags || []).join(", "),
      therapeuticUse: m.therapeuticUse || "",
      dosageForm: m.dosageForm || "Tablet",
      prescriptionType: m.prescriptionType || "RX",

      composition: (m.composition || []).map((c) => ({
        ingredient: c.ingredient || "",
        strength: c.strength || "",
      })),

      mrp: String(m.pricing?.mrp ?? ""),
      price: String(m.pricing?.price ?? ""),
      specialPrice: String(m.pricing?.specialPrice ?? ""),
      gstPercentage: String(m.gstPercentage ?? 0),

      totalQuantity: String(m.stock?.totalQuantity ?? 0),
      minAlertQuantity: String(m.stock?.minAlertQuantity ?? 0),

      batches: (m.batches || []).map((b) => ({
        batchNumber: b.batchNumber || "",
        expiryDate: toDateInput(b.expiryDate),
        quantity: String(b.quantity ?? 0),
      })),

      manufacturerName: m.manufacturer?.name || "",
      manufacturerLicense: m.manufacturer?.licenseNumber || "",
      manufacturerAddress: m.manufacturer?.address || "",

      isActive: m.isActive !== false,
    });

    setLoading(false);
    // getMedicineById is recreated on every provider render, so depending on
    // it here would re-run the load forever
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /* ================= COMPOSITION ROWS ================= */

  const updateComposition = (index, key, value) =>
    setForm((p) => ({
      ...p,
      composition: p.composition.map((c, i) =>
        i === index ? { ...c, [key]: value } : c
      ),
    }));

  const addComposition = () =>
    setForm((p) => ({
      ...p,
      composition: [...p.composition, { ingredient: "", strength: "" }],
    }));

  const removeComposition = (index) =>
    setForm((p) => ({
      ...p,
      composition: p.composition.filter((_, i) => i !== index),
    }));

  /* ================= BATCH ROWS ================= */

  const updateBatch = (index, key, value) =>
    setForm((p) => ({
      ...p,
      batches: p.batches.map((b, i) =>
        i === index ? { ...b, [key]: value } : b
      ),
    }));

  const addBatch = () =>
    setForm((p) => ({
      ...p,
      batches: [
        ...p.batches,
        { batchNumber: "", expiryDate: "", quantity: "0" },
      ],
    }));

  const removeBatch = (index) =>
    setForm((p) => ({
      ...p,
      batches: p.batches.filter((_, i) => i !== index),
    }));

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!form.name.trim()) {
      return Toast.show({
        type: "error",
        text1: "Name is required",
      });
    }

    // mrp / price / specialPrice are all required by the schema, so a blank
    // one would fail validation server-side with a less obvious message
    if (!form.mrp || !form.price || !form.specialPrice) {
      return Toast.show({
        type: "error",
        text1: "Pricing incomplete",
        text2: "MRP, selling price and special price are all required",
      });
    }

    const payload = {
      name: form.name.trim(),
      brandName: form.brandName.trim(),
      description: form.description.trim(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      therapeuticUse: form.therapeuticUse.trim(),
      dosageForm: form.dosageForm,
      prescriptionType: form.prescriptionType,

      // Rows the admin left blank would fail the required validators on the
      // composition subdocument
      composition: form.composition
        .filter((c) => c.ingredient.trim() && c.strength.trim())
        .map((c) => ({
          ingredient: c.ingredient.trim(),
          strength: c.strength.trim(),
        })),

      pricing: {
        mrp: toNumber(form.mrp),
        price: toNumber(form.price),
        specialPrice: toNumber(form.specialPrice),
      },
      gstPercentage: toNumber(form.gstPercentage),

      stock: {
        totalQuantity: toNumber(form.totalQuantity),
        minAlertQuantity: toNumber(form.minAlertQuantity),
      },

      batches: form.batches
        .filter((b) => b.batchNumber.trim())
        .map((b) => ({
          batchNumber: b.batchNumber.trim(),
          expiryDate: b.expiryDate ? new Date(b.expiryDate) : null,
          quantity: toNumber(b.quantity),
        })),

      manufacturer: {
        name: form.manufacturerName.trim(),
        licenseNumber: form.manufacturerLicense.trim(),
        address: form.manufacturerAddress.trim(),
      },

      isActive: form.isActive,
    };

    setSaving(true);
    const res = await updateMedicine(id, payload);
    setSaving(false);

    if (!res.success) {
      return Toast.show({
        type: "error",
        text1: "Update failed",
        text2: res.error,
      });
    }

    Toast.show({
      type: "success",
      text1: "Medicine updated",
      text2: payload.name,
    });

    router.back();
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.loader}>
        <Ionicons name="alert-circle-outline" size={40} color={RED} />
        <Text style={styles.errorTitle}>Couldn&apos;t load this medicine</Text>
        <Text style={styles.errorMsg}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryTxt}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* ============ BASIC ============ */}
          <Section title="Basic Information">
            <Field
              label="Medicine Name *"
              value={form.name}
              onChangeText={(v) => set("name", v)}
            />
            <Field
              label="Brand Name"
              value={form.brandName}
              onChangeText={(v) => set("brandName", v)}
            />
            <Field
              label="Description"
              value={form.description}
              onChangeText={(v) => set("description", v)}
              multiline
            />
            <Field
              label="Therapeutic Use"
              value={form.therapeuticUse}
              onChangeText={(v) => set("therapeuticUse", v)}
            />
            <Field
              label="Tags (comma separated)"
              value={form.tags}
              onChangeText={(v) => set("tags", v)}
              placeholder="fever, painkiller"
            />
          </Section>

          {/* ============ CLASSIFICATION ============ */}
          <Section title="Dosage & Legal">
            <Text style={styles.label}>Dosage Form</Text>
            <ChipRow
              options={DOSAGE_FORMS}
              selected={form.dosageForm}
              onSelect={(v) => set("dosageForm", v)}
            />

            <Text style={[styles.label, { marginTop: 14 }]}>
              Prescription Type
            </Text>
            <ChipRow
              options={PRESCRIPTION_TYPES}
              selected={form.prescriptionType}
              onSelect={(v) => set("prescriptionType", v)}
            />
          </Section>

          {/* ============ COMPOSITION ============ */}
          <Section title="Composition">
            {form.composition.map((c, i) => (
              <View key={i} style={styles.rowItem}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Ingredient"
                    value={c.ingredient}
                    onChangeText={(v) => updateComposition(i, "ingredient", v)}
                  />
                </View>
                <View style={{ width: 110 }}>
                  <Field
                    label="Strength"
                    value={c.strength}
                    onChangeText={(v) => updateComposition(i, "strength", v)}
                    placeholder="500mg"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => removeComposition(i)}
                  style={styles.removeBtn}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={RED} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity onPress={addComposition} style={styles.addBtn}>
              <Ionicons name="add-circle-outline" size={18} color={PURPLE} />
              <Text style={styles.addBtnText}>Add ingredient</Text>
            </TouchableOpacity>
          </Section>

          {/* ============ PRICING ============ */}
          <Section title="Pricing & Tax">
            <Field
              label="MRP *"
              value={form.mrp}
              onChangeText={(v) => set("mrp", v)}
              keyboardType="decimal-pad"
            />
            <Field
              label="Selling Price *"
              value={form.price}
              onChangeText={(v) => set("price", v)}
              keyboardType="decimal-pad"
            />
            <Field
              label="Special Price (RM Member price) *"
              value={form.specialPrice}
              onChangeText={(v) => set("specialPrice", v)}
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>
              RM Members are billed the special price on every order.
            </Text>
            <Field
              label="GST %"
              value={form.gstPercentage}
              onChangeText={(v) => set("gstPercentage", v)}
              keyboardType="decimal-pad"
            />
          </Section>

          {/* ============ STOCK ============ */}
          <Section title="Stock">
            <Field
              label="Total Quantity"
              value={form.totalQuantity}
              onChangeText={(v) => set("totalQuantity", v)}
              keyboardType="number-pad"
            />
            <Field
              label="Minimum Alert Quantity"
              value={form.minAlertQuantity}
              onChangeText={(v) => set("minAlertQuantity", v)}
              keyboardType="number-pad"
            />
          </Section>

          {/* ============ BATCHES ============ */}
          <Section title="Batches & Expiry">
            {form.batches.map((b, i) => (
              <View key={i} style={styles.batchCard}>
                <View style={styles.batchHeader}>
                  <Text style={styles.batchTitle}>Batch {i + 1}</Text>
                  <TouchableOpacity onPress={() => removeBatch(i)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={RED} />
                  </TouchableOpacity>
                </View>

                <Field
                  label="Batch Number"
                  value={b.batchNumber}
                  onChangeText={(v) => updateBatch(i, "batchNumber", v)}
                />
                <Field
                  label="Expiry Date"
                  value={b.expiryDate}
                  onChangeText={(v) => updateBatch(i, "expiryDate", v)}
                  placeholder="YYYY-MM-DD"
                />
                <Field
                  label="Quantity"
                  value={b.quantity}
                  onChangeText={(v) => updateBatch(i, "quantity", v)}
                  keyboardType="number-pad"
                />
              </View>
            ))}

            <TouchableOpacity onPress={addBatch} style={styles.addBtn}>
              <Ionicons name="add-circle-outline" size={18} color={PURPLE} />
              <Text style={styles.addBtnText}>Add batch</Text>
            </TouchableOpacity>
          </Section>

          {/* ============ MANUFACTURER ============ */}
          <Section title="Manufacturer">
            <Field
              label="Name"
              value={form.manufacturerName}
              onChangeText={(v) => set("manufacturerName", v)}
            />
            <Field
              label="License Number"
              value={form.manufacturerLicense}
              onChangeText={(v) => set("manufacturerLicense", v)}
            />
            <Field
              label="Address"
              value={form.manufacturerAddress}
              onChangeText={(v) => set("manufacturerAddress", v)}
              multiline
            />
          </Section>

          {/* ============ STATUS ============ */}
          <Section title="Status">
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Active</Text>
                <Text style={styles.hint}>
                  Inactive medicines stay hidden from the store.
                </Text>
              </View>
              <Switch
                value={form.isActive}
                onValueChange={(v) => set("isActive", v)}
                trackColor={{ true: PURPLE, false: "#cbd5e1" }}
                thumbColor="#fff"
              />
            </View>
          </Section>

          <Text style={styles.footNote}>
            Images can only be changed when a medicine is first uploaded.
          </Text>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, multiline, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

function ChipRow({ options, selected, onSelect }) {
  return (
    <View style={styles.chipWrap}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          onPress={() => onSelect(o)}
          style={[styles.chip, selected === o && styles.chipActive]}
        >
          <Text
            style={[styles.chipText, selected === o && { color: "#fff" }]}
          >
            {o}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingVertical: 16, paddingBottom: 60 },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
    padding: 32,
  },

  errorTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: TEXT_D,
    marginTop: 12,
    textAlign: "center",
  },

  errorMsg: {
    fontSize: 12,
    color: TEXT_M,
    marginTop: 6,
    marginBottom: 18,
    textAlign: "center",
  },

  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PURPLE,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },

  retryTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },

  block: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1e293b",
  },

  label: { fontSize: 12, fontWeight: "600", color: TEXT_M, marginBottom: 6 },

  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: TEXT_D,
    backgroundColor: "#f8fafc",
  },

  inputMultiline: { minHeight: 80, textAlignVertical: "top" },

  hint: { fontSize: 11, color: "#94a3b8", marginBottom: 10 },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#d5d7f0",
  },

  chipActive: { backgroundColor: PURPLE, borderColor: PURPLE },

  chipText: { fontSize: 12, fontWeight: "700", color: PURPLE },

  rowItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },

  removeBtn: { paddingTop: 26 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },

  addBtnText: { fontSize: 13, fontWeight: "700", color: PURPLE },

  batchCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  batchTitle: { fontSize: 13, fontWeight: "800", color: TEXT_D },

  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  switchLabel: { fontSize: 14, fontWeight: "700", color: TEXT_D },

  footNote: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    marginHorizontal: 24,
    marginBottom: 12,
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PURPLE,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },

  saveText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
