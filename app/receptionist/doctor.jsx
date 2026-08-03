import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../../services/axios";
import PrescriptionPicker from "../../components/shared/appointment/PrescriptionPicker";
import { bookAppointment } from "../../utils/appointmentApi";

export default function ReceptionistDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const initialForm = {
    patientName: "",
    patientPhone: "",
    patientAge: "",
    patientGender: "",
    appointmentDate: "",
    appointmentTime: "",
    consultationFee: "",
    symptoms: "",
    notes: "",
  };

  const [form, setForm] = useState(initialForm);

  // Optional prescription image / PDF attached to the booking
  const [prescription, setPrescription] = useState(null);

  /* ================= LOAD DOCTORS ================= */

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await api.get("/user/doctors");
        setDoctors(res.data.data);
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Doctor Load Failed",
          text2: "Please try again",
        });
      } finally {
        setLoading(false);
      }
    };
    loadDoctors();
  }, []);

  /* ================= FILTER ================= */

  const filteredDoctors = useMemo(() => {
    return doctors.filter(
      (doc) =>
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.phone.includes(search)
    );
  }, [doctors, search]);

  /* ================= FORM VALIDATION ================= */

  const isFormValid =
    selectedDoctor &&
    form.patientName.trim().length > 2 &&
    form.patientPhone.trim().length >= 10 &&
    Number(form.patientAge) > 0 &&
    form.patientGender &&
    form.appointmentDate &&
    form.appointmentTime &&
    Number(form.consultationFee) > 0;

  /* ================= CLOSE MODAL ================= */

  const closeModal = () => {
    setBookingModal(false);
    setSelectedDoctor(null);
    setForm(initialForm);
    setPrescription(null);
  };

  /* ================= BOOK ================= */

  const handleBooking = async () => {
    if (!isFormValid) return;

    try {
      setBookingLoading(true);

      const result = await bookAppointment(
        {
          doctorId: selectedDoctor._id,
          ...form,
        },
        prescription
      );

      Toast.show({
        type: result?.warning ? "info" : "success",
        text1: "Appointment Booked",
        text2: result?.warning || `Booked with Dr. ${selectedDoctor.name}`,
      });

      closeModal();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Booking Failed",
        text2:
          err?.response?.data?.message ||
          "Something went wrong",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator size="large" color="#1BA6A6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748B" />
        <TextInput
          placeholder="Search doctor name or phone"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {filteredDoctors.map((doc) => (
          <View key={doc._id} style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              {doc.faceImage?.url ? (
                <Image source={{ uri: doc.faceImage.url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={22} color="#1BA6A6" />
                </View>
              )}

              <View style={{ marginLeft: 12 }}>
                <Text style={styles.name}>{doc.name}</Text>
                <Text style={styles.meta}>{doc.phone}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => {
                setSelectedDoctor(doc);
                setBookingModal(true);
              }}
            >
              <Text style={styles.btnText}>Book</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* ================= BOOKING MODAL ================= */}

      <Modal visible={bookingModal} animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionTitle}>Book Appointment</Text>

              <Text style={{ marginBottom: 20, fontWeight: "600" }}>
                Doctor: {selectedDoctor?.name}
              </Text>

              <TextInput
                placeholder="Patient Name"
                placeholderTextColor="#94A3B8"
                value={form.patientName}
                onChangeText={(t) =>
                  setForm({ ...form, patientName: t })
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Patient Phone"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={form.patientPhone}
                onChangeText={(t) =>
                  setForm({ ...form, patientPhone: t })
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Patient Age"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={form.patientAge}
                onChangeText={(t) =>
                  setForm({ ...form, patientAge: t })
                }
                style={styles.input}
              />

              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {["MALE", "FEMALE"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderBtn,
                      form.patientGender === g &&
                        styles.genderBtnActive,
                    ]}
                    onPress={() =>
                      setForm({ ...form, patientGender: g })
                    }
                  >
                    <Text
                      style={[
                        styles.genderText,
                        form.patientGender === g && {
                          color: "#fff",
                        },
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* DATE */}
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: form.appointmentDate ? "#0F172A" : "#94A3B8" }}>
                  {form.appointmentDate || "Select Appointment Date"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  mode="date"
                  minimumDate={new Date()}
                  value={new Date()}
                  onChange={(e, date) => {
                    setShowDatePicker(false);
                    if (date)
                      setForm({
                        ...form,
                        appointmentDate:
                          date.toISOString().split("T")[0],
                      });
                  }}
                />
              )}

              {/* TIME */}
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: form.appointmentTime ? "#0F172A" : "#94A3B8" }}>
                  {form.appointmentTime || "Select Appointment Time"}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  mode="time"
                  value={new Date()}
                  onChange={(e, time) => {
                    setShowTimePicker(false);
                    if (time)
                      setForm({
                        ...form,
                        appointmentTime:
                          time.toLocaleTimeString(),
                      });
                  }}
                />
              )}

              <TextInput
                placeholder="Consultation Fee"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={form.consultationFee}
                onChangeText={(t) =>
                  setForm({ ...form, consultationFee: t })
                }
                style={styles.input}
              />

              {/* PRESCRIPTION (OPTIONAL) */}
              <PrescriptionPicker
                value={prescription}
                onChange={setPrescription}
                disabled={bookingLoading}
              />

              {/* CONFIRM BUTTON */}
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  (!isFormValid || bookingLoading) &&
                    styles.disabledBtn,
                ]}
                onPress={handleBooking}
                disabled={!isFormValid || bookingLoading}
              >
                {bookingLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>
                    Confirm Booking
                  </Text>
                )}
              </TouchableOpacity>

              {/* CANCEL BUTTON */}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeModal}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },

  searchInput: { marginLeft: 10, flex: 1 },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },

  name: { fontWeight: "700", fontSize: 15 },
  meta: { fontSize: 12, color: "#64748B" },

  bookBtn: {
    backgroundColor: "#1BA6A6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  confirmBtn: {
    backgroundColor: "#1BA6A6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },

  cancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },

  cancelText: {
    fontWeight: "700",
    color: "#64748B",
  },

  disabledBtn: {
    backgroundColor: "#94a3b8",
  },

  btnText: { color: "#fff", fontWeight: "700" },

  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#fff",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },

  label: {
    fontWeight: "600",
    marginBottom: 8,
  },

  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  genderBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1BA6A6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 5,
  },

  genderBtnActive: {
    backgroundColor: "#1BA6A6",
  },

  genderText: {
    fontWeight: "600",
    color: "#1BA6A6",
  },
});
