import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function AddLab() {
  const { labId, edit } = useLocalSearchParams();
  const isEdit = edit === "true";

  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(isEdit);
  const [form, setForm] = useState({
    name:        "",
    brandName:   "",
    phone:       "",
    email:       "",
    gstin:       "",
    "address.line1":  "",
    "address.city":   "",
    "address.state":  "",
    "address.pincode":"",
    homeCollection: true,
    isActive:       true,
  });

  useEffect(() => {
    if (!isEdit || !labId) return;
    const fetchLab = async () => {
      try {
        const res = await api.get(`/labs/${labId}`);
        const d = res.data?.data;
        if (d) {
          setForm({
            name:               d.name        ?? "",
            brandName:          d.brandName   ?? "",
            phone:              d.phone        ?? "",
            email:              d.email        ?? "",
            gstin:              d.gstin        ?? "",
            "address.line1":   d.address?.line1   ?? "",
            "address.city":    d.address?.city    ?? "",
            "address.state":   d.address?.state   ?? "",
            "address.pincode": d.address?.pincode ?? "",
            homeCollection: d.homeCollection ?? true,
            isActive:       d.isActive       ?? true,
          });
        }
      } catch {
        Toast.show({ type: "error", text1: "Failed to load lab" });
      } finally {
        setLoading(false);
      }
    };
    fetchLab();
  }, [labId, isEdit]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) return Toast.show({ type: "error", text1: "Lab name is required" });

    const payload = {
      name:      form.name,
      brandName: form.brandName,
      phone:     form.phone,
      email:     form.email,
      gstin:     form.gstin,
      address: {
        line1:   form["address.line1"],
        city:    form["address.city"],
        state:   form["address.state"],
        pincode: form["address.pincode"],
      },
      homeCollection: form.homeCollection,
      isActive:       form.isActive,
    };

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/labs/${labId}`, payload);
        Toast.show({ type: "success", text1: "Lab updated!" });
      } else {
        await api.post("/labs", payload);
        Toast.show({ type: "success", text1: "Lab created!" });
      }
      router.back();
    } catch (e) {
      Toast.show({ type: "error", text1: e?.response?.data?.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Deactivate Lab", "Are you sure you want to deactivate this lab?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate", style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/labs/${labId}`);
            Toast.show({ type: "success", text1: "Lab deactivated" });
            router.back();
          } catch {
            Toast.show({ type: "error", text1: "Failed to deactivate" });
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.safe} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Field label="Lab Name *"    value={form.name}      onChange={(v) => set("name", v)}      placeholder="e.g. City Diagnostics" />
        <Field label="Brand Name"    value={form.brandName} onChange={(v) => set("brandName", v)}  placeholder="e.g. Thyrocare" />
        <Field label="Phone"         value={form.phone}     onChange={(v) => set("phone", v)}      placeholder="+91 XXXXXXXXXX" keyboardType="phone-pad" />
        <Field label="Email"         value={form.email}     onChange={(v) => set("email", v)}      placeholder="lab@example.com" keyboardType="email-address" />
        <Field label="GSTIN"         value={form.gstin}     onChange={(v) => set("gstin", v)}      placeholder="22AAAAA0000A1Z5" />

        <Text style={styles.sectionLabel}>Address</Text>
        <Field label="Address Line 1" value={form["address.line1"]}   onChange={(v) => set("address.line1", v)}   placeholder="Street, Area" />
        <Field label="City"           value={form["address.city"]}    onChange={(v) => set("address.city", v)}    placeholder="Mumbai" />
        <Field label="State"          value={form["address.state"]}   onChange={(v) => set("address.state", v)}   placeholder="Maharashtra" />
        <Field label="Pincode"        value={form["address.pincode"]} onChange={(v) => set("address.pincode", v)} placeholder="400001" keyboardType="number-pad" />

        <Text style={styles.sectionLabel}>Settings</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Home Collection Available</Text>
          <Switch
            value={form.homeCollection}
            onValueChange={(v) => set("homeCollection", v)}
            trackColor={{ true: PURPLE }}
            thumbColor="#fff"
          />
        </View>

        {isEdit && (
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Active</Text>
            <Switch
              value={form.isActive}
              onValueChange={(v) => set("isActive", v)}
              trackColor={{ true: PURPLE }}
              thumbColor="#fff"
            />
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveTxt}>{saving ? "Saving…" : isEdit ? "Update Lab" : "Create Lab"}</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={RED} />
            <Text style={styles.deleteTxt}>Deactivate Lab</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType || "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: "#475569",
    letterSpacing: 1, textTransform: "uppercase",
    marginTop: 24, marginBottom: 10,
  },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: TEXT_M, marginBottom: 6 },
  input: {
    backgroundColor: CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: TEXT_D, borderWidth: 1, borderColor: "#e2e8f0",
    elevation: 1,
  },

  toggleRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0",
  },
  toggleLabel: { fontSize: 14, color: TEXT_D, fontWeight: "600" },

  saveBtn: {
    backgroundColor: PURPLE, borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: 24,
  },
  saveTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },

  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 14, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: "#fca5a5", backgroundColor: "#fef2f2",
  },
  deleteTxt: { color: "#ef4444", fontWeight: "700", fontSize: 14 },
});
