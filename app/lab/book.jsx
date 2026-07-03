import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
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
import api from "../../services/axios";
import DateTimePicker from "@react-native-community/datetimepicker";

const PURPLE = "#6b6dbf";
const TEAL   = "#14b8a6";
const BG     = "#f1f5f9";
const CARD   = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const GREEN  = "#10b981";

const PAYMENT_MODES = [
  { key: "COD",       label: "Cash on Delivery", icon: "cash-outline"   },
  { key: "ONLINE",    label: "Online (Razorpay)", icon: "card-outline"   },
  { key: "RM_CREDIT", label: "RM Credit",         icon: "wallet-outline" },
  { key: "RM_COIN",   label: "RM Coin",           icon: "logo-bitcoin"   },
];

const fmtMoney = (v) => `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

export default function BookLab() {
  const { labId, labName, items: rawItems } = useLocalSearchParams();
  const items = JSON.parse(rawItems || "[]");

  const [collectionType, setCollectionType] = useState("HOME");
  const [paymentMode,    setPaymentMode]    = useState("COD");
  const [scheduledAt,    setScheduledAt]    = useState("");
  const [showPicker,     setShowPicker]     = useState(false);
  const [pickerMode,     setPickerMode]     = useState("date");
  const [dateObj,        setDateObj]        = useState(new Date());

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    
    if (event.type === "dismissed") return;

    if (selectedDate) {
      setDateObj(selectedDate);
      if (Platform.OS === "android") {
        if (pickerMode === "date") {
          setPickerMode("time");
          setTimeout(() => setShowPicker(true), 50);
        } else {
          formatAndSetDate(selectedDate);
        }
      } else {
        formatAndSetDate(selectedDate);
      }
    }
  };

  const formatAndSetDate = (d) => {
    const pad = (n) => n.toString().padStart(2, "0");
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    setScheduledAt(formatted);
  };

  const openPicker = () => {
    setPickerMode(Platform.OS === "ios" ? "datetime" : "date");
    setShowPicker(true);
  };
  const [address, setAddress] = useState({
    fullName:     "",
    phone:        "",
    addressLine1: "",
    city:         "",
    pincode:      "",
  });
  const [booking, setBooking] = useState(false);

  const setAddr = (key, val) => setAddress((a) => ({ ...a, [key]: val }));

  const handleBook = async () => {
    if (collectionType === "HOME") {
      if (!address.fullName.trim())     return Toast.show({ type: "error", text1: "Full name required" });
      if (!address.phone.trim())        return Toast.show({ type: "error", text1: "Phone required" });
      if (!address.addressLine1.trim()) return Toast.show({ type: "error", text1: "Address required" });
    }
    if (!scheduledAt.trim()) return Toast.show({ type: "error", text1: "Schedule date/time required" });

    const payload = {
      labId,
      items,
      collectionType,
      collectionAddress: collectionType === "HOME" ? address : undefined,
      scheduledAt,
      paymentMode,
    };

    try {
      setBooking(true);
      const res = await api.post("/lab/order", payload);
      Toast.show({ type: "success", text1: "Lab order placed!", text2: "Check My Orders for updates." });

      // If online, handle Razorpay; otherwise go to order detail
      const order = res.data?.data;
      if (paymentMode === "ONLINE" && order?._id) {
        // Initiate Razorpay flow
        try {
          const rp = await api.post("/lab/order/payments/razorpay/create", { orderId: order._id });
          // Navigate to a Razorpay webview/modal — for now just show success
          Toast.show({ type: "info", text1: "Razorpay integration ready", text2: `Amount: ${fmtMoney(rp.data?.data?.amount / 100)}` });
        } catch {
          Toast.show({ type: "error", text1: "Razorpay init failed" });
        }
      }

      router.replace("/lab/my-orders");
    } catch (e) {
      Toast.show({ type: "error", text1: e?.response?.data?.message || "Booking failed" });
    } finally {
      setBooking(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.safe} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Lab */}
        <View style={styles.labBanner}>
          <Ionicons name="business" size={20} color={PURPLE} />
          <Text style={styles.labName} numberOfLines={1}>{labName}</Text>
        </View>

        {/* Tests summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tests Selected ({items.length})</Text>
          {items.map((item, i) => (
            <Text key={i} style={styles.itemRow}>• {item.name ?? `Test ${i + 1}`} × {item.quantity}</Text>
          ))}
        </View>

        {/* Collection type */}
        <Text style={styles.label}>Collection Type</Text>
        <View style={styles.toggleRow}>
          {["HOME", "WALK_IN"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, collectionType === t && styles.typeBtnActive]}
              onPress={() => setCollectionType(t)}
            >
              <Ionicons
                name={t === "HOME" ? "home-outline" : "walk-outline"}
                size={18}
                color={collectionType === t ? "#fff" : PURPLE}
              />
              <Text style={[styles.typeTxt, collectionType === t && { color: "#fff" }]}>
                {t === "HOME" ? "Home Collection" : "Walk In"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Address (Home only) */}
        {collectionType === "HOME" && (
          <>
            <Text style={styles.label}>Delivery Address</Text>
            <Field label="Full Name *"    value={address.fullName}     onChange={(v) => setAddr("fullName", v)}     placeholder="Your full name" />
            <Field label="Phone *"        value={address.phone}        onChange={(v) => setAddr("phone", v)}        placeholder="+91 XXXXXXXXXX" keyboardType="phone-pad" />
            <Field label="Address Line *" value={address.addressLine1} onChange={(v) => setAddr("addressLine1", v)} placeholder="Street, Area" />
            <Field label="City"           value={address.city}         onChange={(v) => setAddr("city", v)}         placeholder="Mumbai" />
            <Field label="Pincode"        value={address.pincode}      onChange={(v) => setAddr("pincode", v)}      placeholder="400001" keyboardType="number-pad" />
          </>
        )}

        {/* Schedule */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Scheduled Date & Time *</Text>
          <TouchableOpacity 
            style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]} 
            onPress={openPicker}
          >
            <Text style={{ color: scheduledAt ? TEXT_D : "#94a3b8", fontSize: 14 }}>
              {scheduledAt ? scheduledAt.replace("T", " ") : "Select date and time"}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={PURPLE} />
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={dateObj}
            mode={pickerMode}
            is24Hour={false}
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Payment Mode */}
        <Text style={styles.label}>Payment Mode</Text>
        {PAYMENT_MODES.map((pm) => (
          <TouchableOpacity
            key={pm.key}
            style={[styles.pmRow, paymentMode === pm.key && styles.pmRowActive]}
            onPress={() => setPaymentMode(pm.key)}
          >
            <Ionicons name={pm.icon} size={20} color={paymentMode === pm.key ? PURPLE : TEXT_M} />
            <Text style={[styles.pmLabel, paymentMode === pm.key && { color: PURPLE, fontWeight: "800" }]}>
              {pm.label}
            </Text>
            {paymentMode === pm.key && <Ionicons name="checkmark-circle" size={20} color={PURPLE} />}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={booking}>
          <Ionicons name="flask" size={20} color="#fff" />
          <Text style={styles.bookBtnTxt}>{booking ? "Placing Order…" : "Confirm Booking"}</Text>
        </TouchableOpacity>

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
  scroll: { padding: 20 },

  labBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: PURPLE + "14", borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  labName: { fontSize: 15, fontWeight: "700", color: PURPLE, flex: 1 },

  card: { backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: TEXT_D, marginBottom: 10 },
  itemRow:      { fontSize: 13, color: TEXT_M, marginBottom: 4 },

  label: { fontSize: 12, fontWeight: "700", color: TEXT_M, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10, marginTop: 8 },

  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  typeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: CARD, borderRadius: 14, padding: 14,
    borderWidth: 2, borderColor: "#e2e8f0", elevation: 1,
  },
  typeBtnActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  typeTxt: { fontSize: 13, fontWeight: "700", color: PURPLE },

  fieldWrap:  { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: TEXT_M, marginBottom: 6 },
  input: {
    backgroundColor: CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: TEXT_D, borderWidth: 1, borderColor: "#e2e8f0", elevation: 1,
  },

  pmRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: CARD, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1.5, borderColor: "#e2e8f0",
  },
  pmRowActive: { borderColor: PURPLE, backgroundColor: PURPLE + "0a" },
  pmLabel: { flex: 1, fontSize: 14, color: TEXT_D, fontWeight: "600" },

  bookBtn: {
    backgroundColor: PURPLE, borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, marginTop: 20, elevation: 4,
    shadowColor: PURPLE, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
  },
  bookBtnTxt: { color: "#fff", fontWeight: "900", fontSize: 17 },
});
