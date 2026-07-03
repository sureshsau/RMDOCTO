import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import Toast from "react-native-toast-message";
import api from "../../../../services/axios";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

/* ================= CONSTANTS ================= */

const WEEK_DAYS = [
  "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday", "Sunday",
];

const TIME_SLOTS = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
  "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
];

export default function EditEmployee() {
  const { id, name = "Employee", role = "Doctor", phone = "N/A", faceUri } =
    useLocalSearchParams();

  const resolveFace = (v) => {
    if (!v) return null;
    if (typeof v === "string") return v;
    if (typeof v === "object") return v.url || v.faceUri || null;
    return null;
  };

  const [faceImage, setFaceImage] = useState(resolveFace(faceUri) || null);
  const [locationAddress, setLocationAddress] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    setFaceImage(resolveFace(faceUri));
  }, [faceUri]);

  const [shiftStartTime, setShiftStartTime] = useState("09:00");
  const [shiftEndTime, setShiftEndTime] = useState("17:00");

  const [requiredHoursPerDay, setRequiredHoursPerDay] = useState("8");
  const [halfDayMinHours, setHalfDayMinHours] = useState("4");
  const [graceMinutes, setGraceMinutes] = useState("10");

  const [weeklyOffDays, setWeeklyOffDays] = useState(["Sunday"]);

  const [allowedLocation, setAllowedLocation] = useState({
    lat: null,
    lng: null,
    radiusMeters: 50,
  });

  const [saving, setSaving] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  /* ================= AUTO LOCATION ================= */

  useEffect(() => {
    autoFetchLocation();
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`
      );
      const data = await res.json();
      return data.results?.[0]?.formatted_address || "";
    } catch {
      return "";
    }
  };

  const autoFetchLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      const address = await reverseGeocode(lat, lng);

      setAllowedLocation({
        lat,
        lng,
        radiusMeters: 50,
      });

      setLocationAddress(address);

    } catch {
      Toast.show({
        type: "error",
        text1: "Location Error",
        text2: "Failed to fetch location",
      });
    } finally {
      setLocationLoading(false);
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

    if (!allowedLocation.lat || !allowedLocation.lng) {
      Toast.show({
        type: "error",
        text1: "Location Not Ready",
        text2: "Please wait until location is detected",
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
        { headers: { "Content-Type": "multipart/form-data" } }
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
    <View style={styles.safeArea}>
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
              router.push({
                pathname: `/admin/employee/${id}/face-capture`,
                params: { returnTo: 'attendance' },
              })
            }
            style={styles.faceScanner}
          >
            {faceImage ? (
              <Image source={{ uri: faceImage }} style={styles.faceScanner} />
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
            );
          })}
        </View>

        {/* LOCATION */}
        <Section title="Allowed Location" />
        <Card>
          {locationLoading ? (
            <ActivityIndicator color="#6b6dbf" />
          ) : (
            <>
              <Text>Lat: {allowedLocation.lat?.toFixed(6)}</Text>
              <Text>Lng: {allowedLocation.lng?.toFixed(6)}</Text>
              <Text style={{ marginTop: 8, fontWeight: "600" }}>
                {locationAddress}
              </Text>
            </>
          )}
        </Card>

        {/* SAVE */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving || locationLoading}
          style={[
            styles.saveBtn,
            (saving || locationLoading) && { opacity: 0.5 }
          ]}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : "Save Attendance Setup"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />

      </ScrollView>
    </View>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function Card({ children, center }) {
  return (
    <View style={[styles.card, center && styles.cardCenter]}>
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
    <TouchableOpacity onPress={onPress} style={styles.timeRow}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{value}</Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#eef0fa" },
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

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
    textTransform: "uppercase",
  },

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

  faceText: {
    marginTop: 12,
    fontWeight: "700",
    color: "#6b6dbf",
  },

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

  weekWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },

  weekDay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
  },

  weekDaySelected: {
    backgroundColor: "#6b6dbf",
    borderColor: "#6b6dbf",
  },

  weekDayUnselected: {
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
  },

  weekDayText: { fontWeight: "700" },

  weekDayTextSelected: { color: "#fff" },

  weekDayTextUnselected: { color: "#334155" },

  saveBtn: {
    backgroundColor: "#6b6dbf",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },

  saveBtnText: { color: "#fff", fontWeight: "800" },
});
