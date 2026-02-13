import * as Location from "expo-location";
import { useState } from "react";
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

/* ================= COLORS ================= */

const PRIMARY = "#14b8a6";
const PAGE_BG = "#ecfeff";
const CARD_BG = "#ffffff";
const INPUT_BG = "#f8fafc";

const GOOGLE_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

/* ================= MAIN ================= */

export default function RegisterAgent() {
  const [form, setForm] = useState({
    agentName: "",
    phone: "",
    password: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });

  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const update = (k, v) =>
    setForm((p) => ({ ...p, [k]: v }));

  /* ================= GOOGLE ADDRESS ================= */

  const fetchGoogleAddress = async (
    lat,
    lng
  ) => {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`
    );

    const data = await res.json();

    if (!data.results?.length)
      return {};

    const result = data.results[0];
    const components =
      result.address_components;

    const get = (type) =>
      components.find((c) =>
        c.types.includes(type)
      )?.long_name || "";

    return {
      fullAddress: result.formatted_address,
      city:
        get("locality") ||
        get("administrative_area_level_2"),
      state: get(
        "administrative_area_level_1"
      ),
      pincode: get("postal_code"),
    };
  };

  /* ================= LOCATION ================= */

  const fetchLocation = async () => {
    try {
      setLocLoading(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
        });
        return;
      }

      const loc =
        await Location.getCurrentPositionAsync({
          accuracy:
            Location.Accuracy.High,
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
          address.fullAddress ||
          p.address,
        city: address.city || p.city,
        state: address.state || p.state,
        pincode:
          address.pincode || p.pincode,
      }));

      Toast.show({
        type: "success",
        text1: "Location Detected",
        text2: "Address auto-filled",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Location Error",
        text2: "Unable to fetch address",
      });
    } finally {
      setLocLoading(false);
    }
  };

  /* ================= VALIDATION ================= */

  const isFormValid =
    form.agentName &&
    form.phone &&
    form.password &&
    form.latitude &&
    form.longitude;

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = {
        agentName: form.agentName.trim(),
        phone: form.phone.trim(),
        password: form.password,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
      };

      await api.post(
        "/marketing-agent/register/agent",
        payload
      );

      Toast.show({
        type: "success",
        text1: "Agent Registered",
      });

      setForm({
        agentName: "",
        phone: "",
        password: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        latitude: "",
        longitude: "",
      });
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

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            Register Agent
          </Text>
          <Text style={styles.pageSub}>
            Add a new agent to your network
          </Text>
        </View>

        {/* BASIC */}
        <Section title="Basic Information">
          <Input
            label="Agent Name *"
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
          <Input
            label="Password *"
            secureTextEntry
            value={form.password}
            onChange={(v) =>
              update("password", v)
            }
          />
        </Section>

        {/* LOCATION */}
        <Section title="Location">
          <TouchableOpacity
            style={styles.locBtn}
            onPress={fetchLocation}
            disabled={locLoading}
          >
            {locLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.locText}>
                📍 Fetch Location from Google
              </Text>
            )}
          </TouchableOpacity>

          {form.latitude && (
            <Text style={styles.locMeta}>
              {form.latitude},{" "}
              {form.longitude}
            </Text>
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

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!isFormValid ||
                loading) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                Register Agent
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Agent will remain inactive until
            approved
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ================= UI ================= */

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
  secureTextEntry,
}) => (
  <View style={styles.inputWrap}>
    <Text style={styles.inputLabel}>
      {label}
    </Text>
    <TextInput
      style={styles.input}
      value={value}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
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
    elevation: 6,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 16,
  },

  inputWrap: {
    marginBottom: 16,
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
  },

  twoCol: {
    flexDirection: "row",
    gap: 12,
  },

  locBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },

  locText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  locMeta: {
    marginTop: 10,
    fontSize: 12,
    textAlign: "center",
    color: "#334155",
  },

  footer: {
    marginHorizontal: 16,
  },

  submitBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 17,
    borderRadius: 20,
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  footerNote: {
    fontSize: 11,
    textAlign: "center",
    color: "#475569",
    marginTop: 10,
  },
});
