import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import Toast from "react-native-toast-message";
import api from "../../../services/axios";

const PURPLE = "#6b6dbf";
const BG     = "#f1f5f9";
const CARD   = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const RED    = "#ef4444";

const CATEGORIES = ["Haematology", "Biochemistry", "Microbiology", "Radiology", "Pathology", "Cardiology", "Genetics", "Other"];
const SAMPLE_TYPES = ["Blood", "Urine", "Stool", "Sputum", "Swab", "Tissue", "Other"];

export default function AddTest() {
  const { testId, edit } = useLocalSearchParams();
  const isEdit = edit === "true";

  const [saving,   setSaving]  = useState(false);
  const [loading,  setLoading] = useState(isEdit);
  const [labs,     setLabs]    = useState([]);
  const [form, setForm] = useState({
    name:                 "",
    shortCode:            "",
    category:             CATEGORIES[0],
    sampleType:           SAMPLE_TYPES[0],
    labId:                "",
    mrp:                  "",
    userPrice:            "",
    agentPrice:           "",
    gstPercentage:        "0",
    reportTat:            "",
    homeCollectionAvailable: true,
    isActive:             true,
    description:          "",
    preparation:          "",
  });

  // Load labs for picker
  useEffect(() => {
    api.get("/labs?limit=100").then((r) => setLabs(r.data?.data ?? [])).catch(() => {});
  }, []);

  // Load existing test if edit
  useEffect(() => {
    if (!isEdit || !testId) return;
    const fetchTest = async () => {
      try {
        const res = await api.get(`/labs/tests/${testId}`);
        const d = res.data?.data;
        if (d) {
          setForm({
            name:       d.name       ?? "",
            shortCode:  d.shortCode  ?? "",
            category:   d.category   ?? CATEGORIES[0],
            sampleType: d.sampleType ?? SAMPLE_TYPES[0],
            labId:      d.labId?._id ?? d.labId ?? "",
            mrp:        String(d.pricing?.mrp        ?? ""),
            userPrice:  String(d.pricing?.userPrice  ?? ""),
            agentPrice: String(d.pricing?.agentPrice ?? ""),
            gstPercentage: String(d.gstPercentage ?? "0"),
            reportTat:  d.reportTat  ?? "",
            homeCollectionAvailable: d.homeCollectionAvailable ?? true,
            isActive:   d.isActive   ?? true,
            description: d.description ?? "",
            preparation: d.preparation ?? "",
          });
        }
      } catch {
        Toast.show({ type: "error", text1: "Failed to load test" });
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId, isEdit]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim())      return Toast.show({ type: "error", text1: "Test name required" });
    if (!form.labId)            return Toast.show({ type: "error", text1: "Select a lab" });
    if (!form.mrp)              return Toast.show({ type: "error", text1: "MRP is required" });
    if (!form.userPrice)        return Toast.show({ type: "error", text1: "User price required" });

    const payload = {
      name:       form.name,
      shortCode:  form.shortCode,
      category:   form.category,
      sampleType: form.sampleType,
      labId:      form.labId,
      pricing: {
        mrp:        parseFloat(form.mrp)        || 0,
        userPrice:  parseFloat(form.userPrice)  || 0,
        agentPrice: parseFloat(form.agentPrice) || 0,
      },
      gstPercentage:        parseFloat(form.gstPercentage) || 0,
      reportTat:            form.reportTat,
      homeCollectionAvailable: form.homeCollectionAvailable,
      isActive:             form.isActive,
      description:          form.description,
      preparation:          form.preparation,
    };

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/labs/tests/${testId}`, payload);
        Toast.show({ type: "success", text1: "Test updated!" });
      } else {
        await api.post("/labs/tests/create", payload);
        Toast.show({ type: "success", text1: "Test created!" });
      }
      router.back();
    } catch (e) {
      Toast.show({ type: "error", text1: e?.response?.data?.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Deactivate Test", "This will deactivate the test.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate", style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/labs/tests/${testId}`);
            Toast.show({ type: "success", text1: "Test deactivated" });
            router.back();
          } catch {
            Toast.show({ type: "error", text1: "Failed" });
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={PURPLE} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.safe} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Field label="Test Name *" value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Complete Blood Count" />
        <Field label="Short Code"  value={form.shortCode} onChange={(v) => set("shortCode", v)} placeholder="e.g. CBC" />
        <Field label="Description" value={form.description} onChange={(v) => set("description", v)} placeholder="What this test covers…" multiline />
        <Field label="Preparation" value={form.preparation} onChange={(v) => set("preparation", v)} placeholder="Patient preparation instructions…" multiline />
        <Field label="Report TAT"  value={form.reportTat} onChange={(v) => set("reportTat", v)} placeholder="e.g. 24 hours" />

        {/* Lab Picker */}
        <Text style={styles.fieldLabel}>Select Lab *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {labs.map((l) => (
            <TouchableOpacity
              key={l._id}
              style={[styles.pill, form.labId === l._id && styles.pillActive]}
              onPress={() => set("labId", l._id)}
            >
              <Text style={[styles.pillTxt, form.labId === l._id && { color: "#fff" }]}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Picker */}
        <Text style={styles.fieldLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.pill, form.category === c && styles.pillActive]}
              onPress={() => set("category", c)}
            >
              <Text style={[styles.pillTxt, form.category === c && { color: "#fff" }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sample Type Picker */}
        <Text style={styles.fieldLabel}>Sample Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {SAMPLE_TYPES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.pill, form.sampleType === s && styles.pillActive]}
              onPress={() => set("sampleType", s)}
            >
              <Text style={[styles.pillTxt, form.sampleType === s && { color: "#fff" }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Pricing</Text>
        <Field label="MRP (₹) *" value={form.mrp} onChange={(v) => set("mrp", v)} keyboardType="decimal-pad" placeholder="0.00" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="User Price (₹) *" value={form.userPrice}  onChange={(v) => set("userPrice", v)}  keyboardType="decimal-pad" placeholder="0.00" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Agent Price (₹)"  value={form.agentPrice} onChange={(v) => set("agentPrice", v)} keyboardType="decimal-pad" placeholder="0.00" />
          </View>
        </View>
        <Field label="GST %" value={form.gstPercentage} onChange={(v) => set("gstPercentage", v)} keyboardType="decimal-pad" placeholder="0" />

        <Text style={styles.sectionLabel}>Settings</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Home Collection Available</Text>
          <Switch value={form.homeCollectionAvailable} onValueChange={(v) => set("homeCollectionAvailable", v)} trackColor={{ true: PURPLE }} thumbColor="#fff" />
        </View>
        {isEdit && (
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Active</Text>
            <Switch value={form.isActive} onValueChange={(v) => set("isActive", v)} trackColor={{ true: PURPLE }} thumbColor="#fff" />
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveTxt}>{saving ? "Saving…" : isEdit ? "Update Test" : "Create Test"}</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={RED} />
            <Text style={styles.deleteTxt}>Deactivate Test</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, multiline }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType || "default"}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  scroll:  { padding: 20, paddingBottom: 40 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center" },

  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: "#475569",
    letterSpacing: 1, textTransform: "uppercase", marginTop: 24, marginBottom: 10,
  },
  fieldWrap:  { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: TEXT_M, marginBottom: 6 },
  input: {
    backgroundColor: CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: TEXT_D, borderWidth: 1, borderColor: "#e2e8f0", elevation: 1,
  },

  pill:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: CARD, marginRight: 8 },
  pillActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  pillTxt:    { fontSize: 12, fontWeight: "600", color: TEXT_M },

  toggleRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0",
  },
  toggleLabel: { fontSize: 14, color: TEXT_D, fontWeight: "600" },

  saveBtn:   { backgroundColor: PURPLE, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 24 },
  saveTxt:   { color: "#fff", fontWeight: "800", fontSize: 16 },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 14, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: "#fca5a5", backgroundColor: "#fef2f2",
  },
  deleteTxt: { color: RED, fontWeight: "700", fontSize: 14 },
});
