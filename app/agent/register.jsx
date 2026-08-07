import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import api from "../../services/axios.js";

const PRIMARY = "#14b8a6";
const PAGE_BG = "#ecfeff";
const CARD_BG = "#ffffff";
const INPUT_BG = "#f8fafc";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

/* ================= MAIN ================= */

export default function RegisterAgent() {
  const [form, setForm] = useState({
    agentName: "",
    phone: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  const update = (k, v) =>
    setForm((prev) => ({ ...prev, [k]: v }));

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
      if (!data.results?.length) return {};

      const result = data.results[0];
      const components = result.address_components;

      const get = (type) =>
        components.find((c) =>
          c.types.includes(type)
        )?.long_name || "";

      return {
        fullAddress: result.formatted_address,
        city:
          get("locality") ||
          get("administrative_area_level_2"),
        state: get("administrative_area_level_1"),
        pincode: get("postal_code"),
      };
    } catch {
      return {};
    }
  };

  const autoFetchLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Location permission is required",
        });
        setLocationLoading(false);
        return;
      }

      const loc =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const { latitude, longitude } =
        loc.coords;

      const address =
        await reverseGeocode(latitude, longitude);

      setForm((prev) => ({
        ...prev,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address: address.fullAddress || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
      }));

      Toast.show({
        type: "success",
        text1: "Location Detected",
        text2: "Address auto-filled successfully",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Location Error",
        text2: "Unable to fetch location",
      });
    } finally {
      setLocationLoading(false);
    }
  };

  /* ================= VALIDATION ================= */

  const isFormValid =
    form.agentName &&
    form.phone &&
    form.latitude &&
    form.longitude &&
    !locationLoading;

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!isFormValid) {
      Toast.show({
        type: "error",
        text1: "Missing Required Fields",
        text2:
          "RM Member name, phone and location are required",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        agentName: form.agentName.trim(),
        phone: form.phone.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        address: form.address || null,
        landmark: form.landmark || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
      };

      await api.post("/agent/register", payload);

      Toast.show({
        type: "success",
        text1: "RM Member Registered",
        text2: "RM Member added successfully",
      });

      setForm({
        agentName: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        latitude: "",
        longitude: "",
      });

      autoFetchLocation();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2:
          err?.response?.data?.message ||
          "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            Register RM Member
          </Text>
          <Text style={styles.pageSub}>
            Add a new RM Member under you
          </Text>
        </View>

        {/* BASIC */}
        <Section title="Basic Information">
          <Input
            label="RM Member Name *"
            value={form.agentName}
            onChange={(v) =>
              update("agentName", v)
            }
          />
          <Input
            label="Phone Number *"
            keyboardType="phone-pad"
            value={form.phone}
            onChange={(v) =>
              update("phone", v)
            }
          />
        </Section>

        {/* LOCATION */}
        <Section title="Detected Location">
          {locationLoading ? (
            <View style={styles.locationLoading}>
              <ActivityIndicator color={PRIMARY} />
              <Text style={styles.locationText}>
                Detecting your location...
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.locationMeta}>
                📍 {form.latitude}, {form.longitude}
              </Text>
              <Text style={styles.addressText}>
                {form.address}
              </Text>
            </>
          )}
        </Section>

        {/* ADDRESS */}
        <Section title="Address (Editable)">
          <Input
            label="Full Address"
            value={form.address}
            onChange={(v) =>
              update("address", v)
            }
          />
          {/* GPS can't infer this — the rider needs it to find the shop */}
          <Input
            label="Landmark"
            value={form.landmark}
            onChange={(v) =>
              update("landmark", v)
            }
          />
          <TwoCol>
            <Input
              label="City"
              value={form.city}
              onChange={(v) =>
                update("city", v)
              }
            />
            <Input
              label="State"
              value={form.state}
              onChange={(v) =>
                update("state", v)
              }
            />
          </TwoCol>
          <Input
            label="Pincode"
            keyboardType="numeric"
            value={form.pincode}
            onChange={(v) =>
              update("pincode", v)
            }
          />
        </Section>

        {/* SUBMIT */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!isFormValid || loading) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="person-add-outline"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.submitText}>
                  Register RM Member
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            RM Member will remain inactive until approved
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ================= UI COMPONENTS ================= */

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>
      {title}
    </Text>
    {children}
  </View>
);

const TwoCol = ({ children }) => (
  <View style={styles.twoCol}>
    {children}
  </View>
);

const Input = ({
  label,
  value,
  onChange,
  keyboardType,
}) => (
  <View style={styles.inputWrap}>
    <Text style={styles.inputLabel}>
      {label}
    </Text>
    <TextInput
      style={styles.input}
      value={value}
      keyboardType={keyboardType}
      onChangeText={onChange}
    />
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },

  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 10,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },

  pageSub: {
    fontSize: 13,
    color: "#475569",
    marginTop: 6,
  },

  section: {
    backgroundColor: CARD_BG,
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 18,
    borderRadius: 22,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14,
  },

  inputWrap: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 6,
    fontWeight: "600",
  },

  input: {
    backgroundColor: INPUT_BG,
    padding: 14,
    borderRadius: 14,
    color: "#0f172a",
  },

  twoCol: {
    flexDirection: "row",
    gap: 12,
  },

  locationLoading: {
    alignItems: "center",
  },

  locationText: {
    marginTop: 8,
    color: "#475569",
  },

  locationMeta: {
    fontSize: 12,
    color: "#334155",
  },

  addressText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
  },

  footer: {
    marginHorizontal: 16,
  },

  submitBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  footerNote: {
    fontSize: 11,
    textAlign: "center",
    color: "#475569",
    marginTop: 10,
  },
});
