import { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "../../../services/axios";

const PRIMARY = "#14b8a6";

const STATUS_COLOR = {
  PENDING: { bg: "#fef3c7", text: "#b45309", icon: "time-outline" },
  CONFIRMED: { bg: "#dcfce7", text: "#166534", icon: "checkmark-circle-outline" },
  DELIVERED: { bg: "#dbeafe", text: "#1e40af", icon: "bicycle-outline" },
  CANCELLED: { bg: "#fee2e2", text: "#b91c1c", icon: "close-circle-outline" },
  OUT_FOR_DELIVERY: { bg: "#fef3c7", text: "#92400e", icon: "navigate-outline" },
};

export default function OrdersTab() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetch = async () => {
        try {
          setLoading(true);
          const res = await api.get("/medicine/order");
          if (active && res.data?.success) setOrders(res.data.orders || []);
        } catch (_) { }
        finally { if (active) setLoading(false); }
      };
      fetch();
      return () => { active = false; };
    }, [])
  );

  const renderItem = ({ item }) => {
    const sc = STATUS_COLOR[item.status] || STATUS_COLOR.PENDING;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={styles.iconWrap}>
              <Ionicons name="cube-outline" size={22} color={PRIMARY} />
            </View>
            <View>
              <Text style={styles.orderTitle}>Order #{item._id?.slice(-6).toUpperCase()}</Text>
              <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Ionicons name={sc.icon} size={12} color={sc.text} />
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.cardBottom}>
          <Text style={styles.itemCount}>{item.items?.length || 0} item(s)</Text>
          <Text style={styles.amount}>₹{item.payableAmount || item.totalAmount}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySub}>Browse medicines and place your first order</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/medicine-store")}>
                <Text style={styles.emptyBtnText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 20, paddingVertical: 18, backgroundColor: PRIMARY },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#fff" },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: "#f1f5f9" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#f0fdfa", justifyContent: "center", alignItems: "center" },
  orderTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  orderDate: { fontSize: 12, color: "#64748b" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 10 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemCount: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  amount: { fontSize: 16, fontWeight: "900", color: PRIMARY },

  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#334155", marginTop: 8 },
  emptySub: { fontSize: 13, color: "#94a3b8" },
  emptyBtn: { marginTop: 16, backgroundColor: PRIMARY, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
