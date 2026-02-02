import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

import { useMedicine } from "../../../context/MedicineContext";

/* ================= MAIN ================= */

export default function MedicineDetails() {
  const { id } = useLocalSearchParams();
  const { getMedicineById, loading } = useMedicine();

  const [medicine, setMedicine] = useState(null);

  /* ================= LOAD ================= */

  useEffect(() => {
    (async () => {
      const res = await getMedicineById(id);

      if (!res.success) {
        Toast.show({
          type: "error",
          text1: "Failed to load medicine",
          text2: res.error,
        });
        router.back();
        return;
      }

      setMedicine(res.data);
    })();
  }, [id]);

  /* ================= LOADING ================= */

  if (loading || !medicine) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6b6dbf" />
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <ScrollView style={styles.container}>
      {/* IMAGE */}
      {medicine.images?.[0]?.url ? (
        <Image
          source={{ uri: medicine.images[0].url }}
          style={styles.image}
        />
      ) : (
        <View style={styles.imageFallback}>
          <Ionicons
            name="medkit-outline"
            size={48}
            color="#94a3b8"
          />
        </View>
      )}

      {/* BASIC */}
      <View style={styles.card}>
        <Text style={styles.name}>{medicine.name}</Text>
        <Text style={styles.brand}>
          {medicine.brandName} • {medicine.dosageForm}
        </Text>
      </View>

      {/* PRICING */}
      <Section title="Pricing">
        <Row label="MRP" value={`₹${medicine.pricing?.mrp}`} />
        <Row
          label="Customer Price"
          value={`₹${medicine.pricing?.price}`}
        />
        <Row
          label="Agent Price"
          value={`₹${medicine.pricing?.specialPrice}`}
        />
        <Row
          label="GST"
          value={`${medicine.gstPercentage || 0}%`}
        />
      </Section>

      {/* STOCK */}
      <Section title="Stock">
        <Row
          label="Total Quantity"
          value={medicine.stock?.totalQuantity}
        />
        <Row
          label="Min Alert"
          value={medicine.stock?.minAlertQuantity}
        />
      </Section>

      {/* COMPOSITION */}
      {medicine.composition?.length > 0 && (
        <Section title="Composition">
          {medicine.composition.map((c, i) => (
            <Text key={i} style={styles.listItem}>
              • {c.ingredient} ({c.strength})
            </Text>
          ))}
        </Section>
      )}

      {/* MANUFACTURER */}
      <Section title="Manufacturer">
        <Row label="Name" value={medicine.manufacturer?.name} />
        <Row
          label="License"
          value={medicine.manufacturer?.licenseNumber}
        />
        <Row
          label="Address"
          value={medicine.manufacturer?.address}
        />
      </Section>

      {/* META */}
      <Section title="Other Info">
        <Row
          label="Prescription"
          value={medicine.prescriptionType}
        />
        <Row
          label="Active"
          value={medicine.isActive ? "Yes" : "No"}
        />
      </Section>
    </ScrollView>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef0fa" },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100%",
    height: 220,
  },

  imageFallback: {
    height: 220,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
  },

  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },

  brand: {
    color: "#64748b",
    marginTop: 4,
  },

  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
  },

  sectionTitle: {
    fontWeight: "800",
    marginBottom: 10,
    color: "#334155",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  label: {
    color: "#64748b",
    fontWeight: "600",
  },

  value: {
    color: "#0f172a",
    fontWeight: "700",
  },

  listItem: {
    color: "#334155",
    marginBottom: 6,
  },
});
