import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../../../../services/axios";

/* ================= CONSTANTS ================= */

const WEEK_DAYS = [
  "Monday","Tuesday","Wednesday",
  "Thursday","Friday","Saturday","Sunday",
];

const TIME_SLOTS = [
  "00:00","00:30","01:00","01:30","02:00","02:30","03:00","03:30",
  "04:00","04:30","05:00","05:30","06:00","06:30","07:00","07:30",
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30",
  "20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30",
];

export default function EditEmployee() {
  const { id, name = "Employee", role = "Doctor", phone = "N/A", faceUri } =
    useLocalSearchParams();

  /* ================= STATE ================= */

  const [faceImage, setFaceImage] = useState(faceUri || null);

  const [shiftStartTime, setShiftStartTime] = useState("09:00");
  const [shiftEndTime, setShiftEndTime] = useState("17:00");

  const [requiredHoursPerDay, setRequiredHoursPerDay] = useState("8");
  const [halfDayMinHours, setHalfDayMinHours] = useState("4");
  const [graceMinutes, setGraceMinutes] = useState("10");

  const [weeklyOffDays, setWeeklyOffDays] = useState(["Sunday"]);

  const [allowedLocation, setAllowedLocation] = useState({
    lat: 28.6139,
    lng: 77.209,
    radiusMeters: 50,
  });

  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  /* ================= LOCATION ================= */

  const fetchAccurateLocation = async () => {
    try {
      setFetchingLocation(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission denied",
          text2: "Location permission is required",
        });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setAllowedLocation((prev) => ({
        ...prev,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      }));

      Toast.show({
        type: "success",
        text1: "Location Updated",
        text2: "Accurate location fetched",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Location Error",
        text2: "Failed to fetch location",
      });
    } finally {
      setFetchingLocation(false);
    }
  };

  /* ================= WEEK OFF ================= */

  const toggleWeekOff = (day) => {
    setWeeklyOffDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!faceImage) {
      Toast.show({
        type: "error",
        text1: "Face Required",
        text2: "Please register face first",
      });
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("shiftStartTime", shiftStartTime);
      formData.append("shiftEndTime", shiftEndTime);
      formData.append("requiredHoursPerDay", requiredHoursPerDay);
      formData.append("halfDayMinHours", halfDayMinHours);
      formData.append("graceMinutes", graceMinutes);
      formData.append("weeklyOffDays", JSON.stringify(weeklyOffDays));
      formData.append("allowedLocation", JSON.stringify(allowedLocation));

      formData.append("faceImage", {
        uri: faceImage,
        name: "face.jpg",
        type: "image/jpeg",
      });

      const res = await api.post(
        `/attendance/setup/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Toast.show({
        type: "success",
        text1: "Attendance Setup Saved",
        text2: res.data?.message || "Configuration completed",
      });

      router.back();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Something went wrong";

      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Setup</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* USER CARD */}
        <View style={styles.userCard}>
          <Image
            source={{
              uri: faceImage
                ? faceImage
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userMeta}>{role}</Text>
            <Text style={styles.userMeta}>{phone}</Text>
          </View>
        </View>

        {/* FACE */}
        <Section title="Face Registration" />
        <Card center>
          <TouchableOpacity
            onPress={() =>
              router.push(`/admin/employee/${id}/face-capture`)
            }
            style={styles.faceScanner}
          >
            {faceImage ? (
              <Image
                source={{ uri: faceImage }}
                style={styles.faceScanner}
              />
            ) : (
              <Ionicons name="scan-outline" size={32} color="#6b6dbf" />
            )}
          </TouchableOpacity>
          <Text style={styles.faceText}>
            {faceImage ? "Face Registered" : "Scan Face"}
          </Text>
        </Card>

        {/* SHIFT */}
        <Section title="Shift Timing" />
        <Card>
          <TimeRow label="Start Time" value={shiftStartTime} onPress={() => {
            setEditingType("start"); setShowTimeModal(true);
          }} />
          <TimeRow label="End Time" value={shiftEndTime} onPress={() => {
            setEditingType("end"); setShowTimeModal(true);
          }} />
        </Card>

        {/* RULES */}
        <Section title="Attendance Rules" />
        <Card>
          <InputRow label="Required Hours / Day" value={requiredHoursPerDay} onChange={setRequiredHoursPerDay} />
          <InputRow label="Half Day Min Hours" value={halfDayMinHours} onChange={setHalfDayMinHours} />
          <InputRow label="Grace Minutes" value={graceMinutes} onChange={setGraceMinutes} />
        </Card>

        {/* WEEK OFF */}
        <Section title="Weekly Off Days" />
        <View style={styles.weekWrap}>
          {WEEK_DAYS.map((day) => {
            const selected = weeklyOffDays.includes(day);
            return (
            <TouchableOpacity
              key={day}
              onPress={() => toggleWeekOff(day)}
              style={[
                styles.weekDay,
                selected ? styles.weekDaySelected : styles.weekDayUnselected,
              ]}
            >
              <Text style={[
                styles.weekDayText,
                selected ? styles.weekDayTextSelected : styles.weekDayTextUnselected,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          )})}
        </View>

        {/* LOCATION */}
        <Section title="Allowed Location" />
        <Card>
          <Text>Lat: {allowedLocation.lat.toFixed(6)}</Text>
          <Text>Lng: {allowedLocation.lng.toFixed(6)}</Text>

          <TouchableOpacity
            onPress={fetchAccurateLocation}
            style={styles.fetchBtn}
          >
            {fetchingLocation ? (
              <ActivityIndicator color="#6b6dbf" />
            ) : (
              <Text style={styles.fetchBtnText}>
                Fetch Accurate Location
              </Text>
            )}
          </TouchableOpacity>
        </Card>

        {/* SAVE */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving}
          style={styles.saveBtn}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : "Save Attendance Setup"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* TIME MODAL */}
      {showTimeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Select {editingType === "start" ? "Start" : "End"} Time
            </Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {TIME_SLOTS.map((time) => (
                <TouchableOpacity
                  key={time}
                  onPress={() => {
                    editingType === "start"
                      ? setShiftStartTime(time)
                      : setShiftEndTime(time);
                    setShowTimeModal(false);
                  }}
                  style={styles.timeSlot}
                >
                  <Text style={styles.timeText}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowTimeModal(false)}
              style={styles.modalCancel}
            >
              <Text style={styles.modalCancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title }) {
  return (
    <Text style={styles.sectionTitle}>
      {title}
    </Text>
  );
}

function Card({ children, center }) {
  return (
    <View style={[styles.card, center ? styles.cardCenter : null]}>
      {children}
    </View>
  );
}

function InputRow({ label, value, onChange }) {
  return (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        style={styles.inputField}
      />
    </View>
  );
}

function TimeRow({ label, value, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.timeRow}
    >
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{value}</Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#eef0fa" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#6b6dbf",
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginLeft: 16 },

  scrollContent: { padding: 20 },

  userCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  userInfo: { marginLeft: 16, flex: 1 },
  userName: { fontSize: 18, fontWeight: "800" },
  userMeta: { color: "#6b7280" },

  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 12, textTransform: "uppercase" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 1,
  },
  cardCenter: { alignItems: "center" },

  faceScanner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "#6b6dbf",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  faceText: { marginTop: 12, fontWeight: "700", color: "#6b6dbf" },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  timeLabel: { fontWeight: "700", color: "#4b5563" },
  timeValue: { fontWeight: "800", color: "#111827" },

  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  inputLabel: { fontWeight: "700", color: "#4b5563" },
  inputField: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: "700",
    minWidth: 60,
    textAlign: "center",
  },

  weekWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
  weekDay: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, marginRight: 12, marginBottom: 12, borderWidth: 1 },
  weekDaySelected: { backgroundColor: "#6b6dbf", borderColor: "#6b6dbf" },
  weekDayUnselected: { backgroundColor: "#fff", borderColor: "#cbd5e1" },
  weekDayText: { fontWeight: "700" },
  weekDayTextSelected: { color: "#fff" },
  weekDayTextUnselected: { color: "#334155" },

  fetchBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#6b6dbf",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  fetchBtnText: { color: "#6b6dbf", fontWeight: "700" },

  saveBtn: {
    backgroundColor: "#6b6dbf",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  saveBtnText: { color: "#fff", fontWeight: "800" },

  modalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 12 },

  timeSlot: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  timeText: { textAlign: "center", fontWeight: "600" },

  modalCancel: { marginTop: 16, backgroundColor: "#6b6dbf", borderRadius: 12, padding: 12 },
  modalCancelText: { color: "#fff", fontWeight: "700", textAlign: "center" },
});