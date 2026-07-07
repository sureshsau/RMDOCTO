import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const PRIMARY = "#14b8a6";

const CATEGORIES = [
  { label: "Doctor Consultation", icon: "medkit-outline", route: "/doctor-booking", color: "#0ea5e9", bg: "#e0f2fe" },
  { label: "Medicine Store", icon: "storefront-outline", route: "/medicine-store", color: "#10b981", bg: "#d1fae5" },
  { label: "Lab Tests", icon: "flask-outline", route: "/lab", color: "#8b5cf6", bg: "#ede9fe" },
  { label: "RM Coins", icon: "logo-bitcoin", route: "/rmcoin", color: "#f59e0b", bg: "#fef3c7" },
  { label: "My Medicine Orders", icon: "cube-outline", route: "/mymedicineorder", color: "#ef4444", bg: "#fee2e2" },
  { label: "My Lab Orders", icon: "receipt-outline", route: "/lab/my-orders", color: "#db2777", bg: "#fce7f3" },
  { label: "Special Offers", icon: "pricetags-outline", route: "/offers", color: PRIMARY, bg: "#ccfbf1" },
  { label: "My Profile", icon: "person-circle-outline", route: "/root/profile", color: "#475569", bg: "#f1f5f9" },
];

export default function Categories() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Services</Text>
        <Text style={styles.headerSub}>Everything you need in one place</Text>
      </View>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 20, backgroundColor: PRIMARY, paddingTop: 24 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 13, color: "#ccfbf1", marginTop: 4 },
  grid: { padding: 16, gap: 12 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 16, elevation: 2, borderLeftWidth: 4, gap: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  cardLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: "#0f172a" },
});
