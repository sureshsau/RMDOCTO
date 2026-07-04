import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import api from "../../../../services/axios";

export default function RiderLabOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const res = await api.get("/lab/order/rider");
      setOrders(res?.data?.orders || []);
    } catch (err) {
      console.log(err);
      Toast.show({
        type: "error",
        text1: "Failed to load orders",
        text2: err?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(true);
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => o?.orderStatus === "CONFIRMED" || o?.orderStatus === "INITIATED"
    ).length;
    return { totalOrders, pendingOrders };
  }, [orders]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14b8a6" />
        }
      >
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Lab Orders Overview</Text>
          <Text style={styles.subtitle}>Lab tests assigned to you for sample collection</Text>
        </View>

        {orders.length > 0 && (
          <View style={styles.overviewCard}>
            <OverviewItem label="Total Assigned" value={stats.totalOrders} />
            <Divider />
            <OverviewItem label="Pending Collection" value={stats.pendingOrders} />
          </View>
        )}

        {orders.map((order, index) => (
          <TouchableOpacity
            key={`${order?.orderId}-${index}`}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(`/rmrider/lab/order/${order?.orderId}`)}
          >
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.orderId}>#{order?.orderId?.slice(-6) || "----"}</Text>
                <Text style={styles.meta}>
                  {order?.createdAt ? new Date(order.createdAt).toDateString() : "-"}
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{order?.orderStatus || "-"}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Patient Details</Text>
              <Text style={styles.value}>
                {order?.collectionAddress?.fullName || order?.user?.name || "N/A"}
              </Text>
              <Text style={styles.meta}>
                📞 {order?.collectionAddress?.phone || order?.user?.phone || "N/A"}
              </Text>
            </View>

            {order?.collectionType === "HOME" ? (
              <View style={styles.section}>
                <Text style={styles.label}>Collection Address (Home)</Text>
                <Text style={styles.meta}>
                  {order?.collectionAddress?.addressLine1 || "Address not available"}
                </Text>
                <Text style={styles.meta}>
                  Pincode: {order?.collectionAddress?.pincode || "-"}
                </Text>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.label}>Collection Type</Text>
                <Text style={styles.meta}>Walk In (At Lab)</Text>
                <Text style={styles.meta}>{order?.lab?.name}</Text>
              </View>
            )}

            <View style={styles.footerRow}>
              <Text style={styles.items}>{order?.itemsCount ?? 0} Test(s)</Text>
              <Text style={styles.amount}>₹{order?.payableAmount ?? 0}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {orders.length === 0 && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#94a3b8" }}>No lab orders assigned.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function OverviewItem({ label, value }) {
  return (
    <View style={styles.overviewItem}>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  pageHeader: { padding: 20, paddingTop: 40, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 4 },
  
  overviewCard: {
    flexDirection: "row", backgroundColor: "#fff",
    marginHorizontal: 20, marginBottom: 20, borderRadius: 16,
    paddingVertical: 20, elevation: 2, alignItems: "center"
  },
  overviewItem: { flex: 1, alignItems: "center" },
  overviewValue: { fontSize: 18, fontWeight: "800", color: "#14b8a6", marginBottom: 4 },
  overviewLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", textTransform: "uppercase" },
  divider: { width: 1, height: "60%", backgroundColor: "#e2e8f0" },

  card: { backgroundColor: "#fff", marginHorizontal: 20, marginBottom: 14, borderRadius: 16, padding: 16, elevation: 2 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  orderId: { fontSize: 16, fontWeight: "800", color: "#0f172a", textTransform: "uppercase" },
  meta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  
  statusBadge: { backgroundColor: "#f0fdf4", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#bbf7d0" },
  statusText: { fontSize: 11, fontWeight: "700", color: "#16a34a" },
  
  section: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  value: { fontSize: 14, fontWeight: "600", color: "#334155" },
  
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  items: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  amount: { fontSize: 16, fontWeight: "800", color: "#14b8a6" }
});
