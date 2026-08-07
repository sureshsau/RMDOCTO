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
import api from "../../../services/axios.js";

/* ================= BRAND ================= */

const PRIMARY = "#14b8a6";
const PAGE_BG = "#f0fdfa";
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
  const [locLoading, setLocLoading] = useState(true);

  const update = (k, v) =>
    setForm((p) => ({ ...p, [k]: v }));

  /* ================= AUTO LOCATION ================= */

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchGoogleAddress = async (lat, lng) => {
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

  const fetchLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Location access is required to register RM Member.",
        });
        setLocLoading(false);
        return;
      }

      const loc =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const { latitude, longitude } =
        loc.coords;

      const address =
        await fetchGoogleAddress(
          latitude,
          longitude
        );

      setForm((p) => ({
        ...p,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address:
          address.fullAddress || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
      }));

      Toast.show({
        type: "success",
        text1: "Location Detected",
        text2: "Address auto-filled successfully.",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Location Error",
        text2: "Unable to fetch current location.",
      });
    } finally {
      setLocLoading(false);
    }
  };

  /* ================= VALIDATION ================= */

  const isFormValid =
    form.agentName &&
    form.phone &&
    form.latitude &&
    form.longitude;

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
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

      await api.post(
        "/admin/register-agent",
        payload
      );

      Toast.show({
        type: "success",
        text1: "RM Member Registered",
        text2: "RM Member added to your network successfully.",
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

      fetchLocation();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2:
          err?.response?.data?.message ||
          "Something went wrong. Please try again.",
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
        <View style={styles.header}>
          <Text style={styles.title}>
            Register New RM Member
          </Text>
          <Text style={styles.subtitle}>
            Expand your marketing network
          </Text>
        </View>

        {/* BASIC INFO */}
        <Card title="Basic Information">
          <Input
            icon="person-outline"
            label="RM Member Name *"
            value={form.agentName}
            onChange={(v) =>
              update("agentName", v)
            }
          />

          <Input
            icon="call-outline"
            label="Phone Number *"
            keyboardType="phone-pad"
            value={form.phone}
            onChange={(v) =>
              update("phone", v)
            }
          />
        </Card>

        {/* LOCATION */}
        <Card title="Location Details">
          {locLoading ? (
            <View style={styles.locLoader}>
              <ActivityIndicator
                size="small"
                color={PRIMARY}
              />
              <Text style={styles.locText}>
                Detecting your location...
              </Text>
            </View>
          ) : (
            <>
              <Input
                icon="location-outline"
                label="Full Address"
                value={form.address}
                onChange={(v) =>
                  update("address", v)
                }
              />

              {/* GPS can't infer this — the rider needs it to find the shop */}
              <Input
                icon="flag-outline"
                label="Landmark"
                value={form.landmark}
                onChange={(v) =>
                  update("landmark", v)
                }
              />

              <Row>
                <Input
                  icon="business-outline"
                  label="City"
                  value={form.city}
                  onChange={(v) =>
                    update("city", v)
                  }
                />
                <Input
                  icon="map-outline"
                  label="State"
                  value={form.state}
                  onChange={(v) =>
                    update("state", v)
                  }
                />
              </Row>

              <Input
                icon="pin-outline"
                label="Pincode"
                keyboardType="numeric"
                value={form.pincode}
                onChange={(v) =>
                  update("pincode", v)
                }
              />
            </>
          )}
        </Card>

        {/* SUBMIT */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!isFormValid ||
                loading) && { opacity: 0.5 },
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitText}>
                  Register RM Member
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ================= COMPONENTS ================= */

const Card = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>
      {title}
    </Text>
    {children}
  </View>
);

const Row = ({ children }) => (
  <View style={styles.row}>
    {children}
  </View>
);

const Input = ({
  label,
  value,
  onChange,
  keyboardType,
  icon,
}) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>
      {label}
    </Text>
    <View style={styles.inputRow}>
      <Ionicons
        name={icon}
        size={18}
        color={PRIMARY}
        style={{ marginRight: 8 }}
      />
      <TextInput
        style={styles.input}
        value={value}
        keyboardType={keyboardType}
        onChangeText={onChange}
      />
    </View>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },

  header: {
    padding: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },

  subtitle: {
    fontSize: 13,
    marginTop: 6,
    color: "#475569",
  },

  card: {
    backgroundColor: CARD_BG,
    marginHorizontal: 18,
    marginBottom: 20,
    padding: 20,
    borderRadius: 22,
    elevation: 6,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 16,
    color: PRIMARY,
  },

  inputWrap: {
    marginBottom: 16,
    flex: 1,
  },

  label: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
    color: "#475569",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    paddingHorizontal: 12,
    borderRadius: 14,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    color: "#0f172a",
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  locLoader: {
    alignItems: "center",
    paddingVertical: 20,
  },

  locText: {
    marginTop: 8,
    fontSize: 13,
    color: "#475569",
  },

  footer: {
    marginHorizontal: 18,
  },

  submitBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingVertical: 18,
    borderRadius: 20,
  },

  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});
