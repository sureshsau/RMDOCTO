import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../../services/axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../context/AuthContext";

const PURPLE = "#6b6dbf";
const TEAL   = "#14b8a6";
const BG     = "#f1f5f9";
const CARD   = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";

export default function DoctorBookingDetail() {
  const { doctorId } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  // Booking Form State
  const [form, setForm] = useState({
    patientName: user?.name || "",
    patientPhone: user?.phone || "",
    patientAge: "",
    patientGender: "MALE",
    symptoms: "",
    notes: ""
  });

  const [dateObj, setDateObj] = useState(new Date());
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date");

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await api.get("/user/doctors");
        const docs = res.data?.data || [];
        const found = docs.find(d => d._id === doctorId);
        if (found) setDoctor(found);
      } catch {
        Toast.show({ type: "error", text1: "Failed to load doctor" });
      } finally {
        setLoading(false);
      }
    };
    if (doctorId) fetchDoc();
  }, [doctorId]);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowPicker(false);
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
    setAppointmentDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setAppointmentTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const openPicker = () => {
    setPickerMode(Platform.OS === "ios" ? "datetime" : "date");
    setShowPicker(true);
  };

  const handleBook = async () => {
    if (!form.patientName || !form.patientPhone || !appointmentDate || !appointmentTime) {
      return Toast.show({ type: "error", text1: "Please fill all required fields" });
    }

    const payload = {
      doctorId,
      ...form,
      patientAge: form.patientAge ? Number(form.patientAge) : undefined,
      appointmentDate,
      appointmentTime,
      consultationFee: doctor?.profiles?.doctorId?.consultationFee || 0
    };

    try {
      setBooking(true);
      await api.post("/appointment", payload);
      Toast.show({ type: "success", text1: "Appointment Booked!" });
      router.replace("/doctor-booking/my-appointments");
    } catch (e) {
      Toast.show({ type: "error", text1: e?.response?.data?.message || "Booking failed" });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTxt}>Doctor not found</Text>
      </View>
    );
  }

  const profile = doctor.profiles?.doctorId;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.safe} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* Doctor Header */}
        <View style={styles.docHeader}>
          {doctor.faceImage?.url ? (
            <Image source={{ uri: doctor.faceImage.url }} style={styles.docAvatar} />
          ) : (
            <View style={[styles.docAvatar, { backgroundColor: PURPLE + "18", alignItems: "center", justifyContent: "center" }]}>
               <Ionicons name="person" size={32} color={PURPLE} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.docName}>{doctor.name}</Text>
            <Text style={styles.docSpec}>{profile?.specialization || "General Physician"}</Text>
            {profile?.qualification ? <Text style={styles.docQual}>{profile.qualification}</Text> : null}
            <Text style={styles.docFee}>Consultation Fee: ₹{profile?.consultationFee || 0}</Text>
          </View>
        </View>

        {/* Schedule */}
        <Text style={styles.sectionTitle}>When would you like to visit?</Text>
        <View style={styles.fieldWrap}>
          <TouchableOpacity 
            style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]} 
            onPress={openPicker}
          >
            <Text style={{ color: appointmentDate ? TEXT_D : "#94a3b8", fontSize: 14 }}>
              {appointmentDate ? `${appointmentDate} at ${appointmentTime}` : "Select date and time *"}
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

        {/* Patient Details */}
        <Text style={styles.sectionTitle}>Patient Details</Text>
        
        <Field label="Patient Name *" value={form.patientName} onChange={(v) => setForm({ ...form, patientName: v })} />
        <Field label="Patient Phone *" value={form.patientPhone} onChange={(v) => setForm({ ...form, patientPhone: v })} keyboardType="phone-pad" />
        
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Age" value={form.patientAge} onChange={(v) => setForm({ ...form, patientAge: v })} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.toggleRow}>
              {["MALE", "FEMALE"].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.toggleBtn, form.patientGender === g && styles.toggleActive]}
                  onPress={() => setForm({ ...form, patientGender: g })}
                >
                  <Text style={[styles.toggleTxt, form.patientGender === g && { color: "#fff" }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Field label="Symptoms (Optional)" value={form.symptoms} onChange={(v) => setForm({ ...form, symptoms: v })} />
        
        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={booking}>
          <Text style={styles.bookBtnTxt}>{booking ? "Booking..." : "Confirm Appointment"}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, keyboardType }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errTxt: { color: "#ef4444", fontSize: 16 },

  docHeader: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: CARD, borderRadius: 20, padding: 20, marginBottom: 24,
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  docAvatar: { width: 70, height: 70, borderRadius: 35 },
  docName: { fontSize: 18, fontWeight: "800", color: TEXT_D },
  docSpec: { fontSize: 14, color: PURPLE, fontWeight: "600", marginTop: 2 },
  docQual: { fontSize: 12, color: TEXT_S, marginTop: 2 },
  docFee:  { fontSize: 14, fontWeight: "800", color: TEAL, marginTop: 8 },

  sectionTitle: { fontSize: 13, fontWeight: "800", color: TEXT_M, textTransform: "uppercase", marginBottom: 12, marginTop: 8 },

  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: TEXT_M, marginBottom: 6 },
  input: {
    backgroundColor: CARD, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: TEXT_D, borderWidth: 1, borderColor: "#e2e8f0", elevation: 1,
  },

  toggleRow: { flexDirection: "row", gap: 8 },
  toggleBtn: { flex: 1, backgroundColor: CARD, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  toggleActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  toggleTxt: { fontSize: 12, fontWeight: "700", color: TEXT_M },

  bookBtn: {
    backgroundColor: PURPLE, borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, marginTop: 20, elevation: 4,
    shadowColor: PURPLE, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
  },
  bookBtnTxt: { color: "#fff", fontWeight: "900", fontSize: 17 },
});
