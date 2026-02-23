import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useMedicine } from "../../context/MedicineContext";


const { width } = Dimensions.get("window");

export default function MedicineDetails() {
  const { id } = useLocalSearchParams();
  const { getMedicineById } = useMedicine();

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchMedicine = async () => {
    const res = await getMedicineById(id);

    if (!res?.success || !res?.data) {
      Toast.show({
        type: "error",
        text1: "Failed to load medicine",
      });
      return;
    }

    const data = res.data;

    setMedicine({
      ...data,
      images: data.images || [],
      tags: data.tags || [],
      composition: data.composition || [],
      batches: data.batches || [],
      pricing: data.pricing || {},
      stock: data.stock || {},
      addedBy: data.addedBy || {},
    });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMedicine();
      setLoading(false);
    })();
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMedicine();
    setRefreshing(false);
  }, []);

  const onScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6b6dbf" />
      </View>
    );
  }

  if (!medicine) return null;

  const lowStock =
    medicine.stock.totalQuantity <= medicine.stock.minAlertQuantity;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6b6dbf"
          />
        }
      >
        {/* ================= IMAGE SLIDER ================= */}
        {medicine.images.length > 0 && (
          <View style={styles.sliderWrapper}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
            >
              {medicine.images.map((img, index) => (
                <View key={index} style={styles.slide}>
                  <Image source={{ uri: img.url }} style={styles.image} />
                </View>
              ))}
            </ScrollView>

            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {activeIndex + 1} / {medicine.images.length}
              </Text>
            </View>

            <View style={styles.dots}>
              {medicine.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeIndex === index && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* ================= BASIC INFO ================= */}
        <View style={styles.block}>
          <Text style={styles.name}>{medicine.name || "-"}</Text>
          <Text style={styles.brand}>{medicine.brandName || "-"}</Text>

          <View style={styles.badges}>
            {medicine.dosageForm && <Badge text={medicine.dosageForm} />}
            {medicine.prescriptionType && (
              <Badge text={medicine.prescriptionType} />
            )}
            {lowStock && <Badge text="LOW STOCK" warning />}
          </View>
        </View>

        {medicine.description && (
          <Section title="Description">
            <Text style={styles.text}>{medicine.description}</Text>
          </Section>
        )}

        <Section title="Clinical Information">
          <Row label="Therapeutic Use" value={medicine.therapeuticUse || "-"} />
          <Row label="Dosage Form" value={medicine.dosageForm || "-"} />
          <Row
            label="Prescription Type"
            value={medicine.prescriptionType || "-"}
          />
        </Section>

        {medicine.tags.length > 0 && (
          <Section title="Tags">
            <View style={styles.tagContainer}>
              {medicine.tags.map((tag, i) => (
                <Text key={i} style={styles.tag}>
                  {tag.toUpperCase()}
                </Text>
              ))}
            </View>
          </Section>
        )}

        {medicine.composition.length > 0 && (
          <Section title="Composition">
            {medicine.composition.map((c, i) => (
              <Row key={i} label={c.ingredient} value={c.strength} />
            ))}
          </Section>
        )}

        <Section title="Pricing & Tax">
          <Row label="MRP" value={`₹ ${medicine.pricing.mrp || 0}`} />
          <Row label="Selling Price" value={`₹ ${medicine.pricing.price || 0}`} />
          <Row
            label="Special Price"
            value={`₹ ${medicine.pricing.specialPrice || 0}`}
          />
          <Row label="GST" value={`${medicine.gstPercentage || 0}%`} />
        </Section>

        <Section title="Stock Information">
          <Row
            label="Total Quantity"
            value={medicine.stock.totalQuantity ?? 0}
            highlight={lowStock}
          />
          <Row
            label="Minimum Alert Quantity"
            value={medicine.stock.minAlertQuantity ?? 0}
          />
        </Section>

        {medicine.batches.length > 0 && (
          <Section title="Batch & Expiry Details">
            {medicine.batches.map((b, i) => (
              <View key={i} style={styles.batch}>
                <Row label="Batch Number" value={b.batchNumber} />
                <Row label="Expiry Date" value={b.expiryDate} />
                <Row label="Quantity" value={b.quantity} />
              </View>
            ))}
          </Section>
        )}

        <Section title="Status & Audit">
          <Row label="Status" value={medicine.isActive ? "Active" : "Inactive"} />
          <Row label="Added By" value={medicine.addedBy?.name || "-"} />
          <Row
            label="Created At"
            value={new Date(medicine.createdAt).toDateString()}
          />
          <Row
            label="Last Updated"
            value={new Date(medicine.updatedAt).toDateString()}
          />
        </Section>
      </ScrollView>
    </View>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, highlight }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.highlight]}>
        {value}
      </Text>
    </View>
  );
}

function Badge({ text, warning }) {
  return (
    <View style={[styles.badge, warning && styles.badgeWarning]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e6e9f8" },
  content: { paddingBottom: 40 },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  sliderWrapper: { marginBottom: 16 },
  slide: { width, alignItems: "center" },

  image: {
    width: width - 40,
    height: 220,
    borderRadius: 16,
    backgroundColor: "#fff",
  },

  counter: {
    position: "absolute",
    bottom: 12,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  counterText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#c7c9f5",
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: "#6b6dbf",
    width: 10,
  },

  block: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },

  name: { fontSize: 22, fontWeight: "800", color: "#6b6dbf" },
  brand: { fontSize: 14, color: "#64748b" },

  badges: { flexDirection: "row", gap: 8, marginTop: 12 },

  badge: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  badgeWarning: { backgroundColor: "#fef3c7" },

  badgeText: { fontSize: 12, fontWeight: "700", color: "#334155" },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1e293b",
  },

  text: { color: "#475569", lineHeight: 22 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  label: { color: "#64748b", fontWeight: "600" },
  value: { color: "#0f172a", fontWeight: "600" },

  highlight: { color: "#6b6dbf", fontWeight: "800" },

  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  tag: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b6dbf",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  batch: { paddingVertical: 8 },
});
