import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/* ===== NEW COLOR SYSTEM ===== */
const PRIMARY = "#0d9488";      // professional teal
const PAGE_BG = "#f6f7fb";      // soft neutral background
const INPUT_BG = "#f1f5f9";     // light input background

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

  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = () => {
    const payload = {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };
    console.log("Register Agent Payload:", payload);
  };

  return (
    <View style={[styles.container, { backgroundColor: PAGE_BG }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ================= PAGE HEADER ================= */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Register Agent</Text>
          <Text style={styles.pageSub}>
            Add a new agent to your network
          </Text>
        </View>

        {/* ================= BASIC INFO ================= */}
        <Section title="Basic Information">
          <Input
            label="Agent Name"
            placeholder="Full name"
            value={form.agentName}
            onChange={(v) => update("agentName", v)}
          />

          <Input
            label="Phone Number"
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            value={form.phone}
            onChange={(v) => update("phone", v)}
          />

          <Input
            label="Password"
            placeholder="Temporary password"
            secureTextEntry
            value={form.password}
            onChange={(v) => update("password", v)}
          />
        </Section>

        {/* ================= LOCATION ================= */}
        <Section title="Location">
          <TwoCol>
            <Input
              label="Latitude"
              placeholder="22.5726"
              keyboardType="numeric"
              value={form.latitude}
              onChange={(v) => update("latitude", v)}
            />
            <Input
              label="Longitude"
              placeholder="88.3639"
              keyboardType="numeric"
              value={form.longitude}
              onChange={(v) => update("longitude", v)}
            />
          </TwoCol>
        </Section>

        {/* ================= ADDRESS ================= */}
        <Section title="Address">
          <Input
            label="Address"
            placeholder="House, Street, Area"
            value={form.address}
            onChange={(v) => update("address", v)}
          />

          <TwoCol>
            <Input
              label="City"
              placeholder="City"
              value={form.city}
              onChange={(v) => update("city", v)}
            />
            <Input
              label="State"
              placeholder="State"
              value={form.state}
              onChange={(v) => update("state", v)}
            />
          </TwoCol>

          <Input
            label="Pincode"
            placeholder="Postal code"
            keyboardType="numeric"
            value={form.pincode}
            onChange={(v) => update("pincode", v)}
          />
        </Section>

        {/* ================= CTA ================= */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>Register Agent</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Agent will remain inactive until approved
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

/* ================= COMPONENTS ================= */

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const TwoCol = ({ children }) => (
  <View style={styles.twoCol}>{children}</View>
);

const Input = ({
  label,
  placeholder,
  value,
  onChange,
  keyboardType,
  secureTextEntry,
}) => (
  <View style={styles.inputWrap}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      value={value}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      onChangeText={onChange}
    />
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* HEADER */
  pageHeader: {
    padding: 20,
    paddingTop: 28,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
  },

  pageSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  /* SECTIONS */
  section: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14,
    color: "#0f172a",
  },

  /* INPUTS */
  inputWrap: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 6,
  },

  input: {
    backgroundColor: INPUT_BG,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 14,
    color: "#0f172a",
  },

  twoCol: {
    flexDirection: "row",
    gap: 12,
  },

  /* FOOTER */
  footer: {
    marginHorizontal: 16,
    marginTop: 10,
  },

  submitBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },

  submitText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },

  footerNote: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
  },
});