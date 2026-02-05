import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import api from "../../../../services/axios";

/* ================= MAIN ================= */

export default function MedicineHistory() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= FETCH ORDERS ================= */

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const res = await api.get("/medicine/order");
      setOrders(res.data.data || []);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to load orders",
        text2:
          err?.response?.data?.message ||
          "Something went wrong",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ================= PULL TO REFRESH ================= */

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(true);
  }, []);

  /* ================= RENDER ITEM ================= */

  const renderItem = ({ item }) => {
    const statusColor =
      item.orderStatus === "CONFIRMED"
        ? "#dcfce7"
        : item.orderStatus === "CANCELLED"
          ? "#fee2e2"
          : "#e0f2fe";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "/agent/(tabs)/medicine/historyDetails",
            params: { orderId: item.orderId },
          })
        }
      >
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderId}>
                #{item.orderId.slice(-6)}
              </Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toDateString()}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor },
              ]}
            >
              <Text style={styles.statusText}>
                {item.orderStatus}
              </Text>
            </View>
          </View>

          {/* MEDICINE */}
          <View style={styles.medicineRow}>
            <Image
              source={{ uri: item.medicine.image }}
              style={styles.image}
            />

            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={styles.medicineName}
              >
                {item.medicine.name}
              </Text>

              <Text style={styles.qty}>
                Qty: {item.medicine.quantity}
              </Text>
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.payment}>
                {item.paymentMode} • {item.paymentStatus}
              </Text>
              <Text style={styles.amount}>
                ₹{item.payableAmount}
              </Text>
            </View>

            <View style={styles.reorderBtn}>
              <Text style={styles.reorderText}>
                View Details →
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  /* ================= MAIN VIEW ================= */

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.orderId}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14b8a6"
          />
        }
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            <Text style={styles.title}>My Orders</Text>
            <Text style={styles.subtitle}>
              Track your medicine orders
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>
              No orders found
            </Text>
          </View>
        }
      />
    </View>
  );
}


const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 16, }, pageHeader: { marginVertical: 20, }, title: { fontSize: 22, fontWeight: "900", }, subtitle: { fontSize: 13, color: "#64748b", marginTop: 4, }, card: { backgroundColor: "#ffffff", borderRadius: 18, padding: 16, marginBottom: 16, elevation: 3, }, headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", }, orderId: { fontSize: 14, fontWeight: "800", }, date: { fontSize: 12, color: "#64748b", marginTop: 2, }, statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, }, statusText: { fontSize: 11, fontWeight: "800", color: "#065f46", }, medicineRow: { flexDirection: "row", marginTop: 14, alignItems: "center", }, image: { width: 56, height: 56, borderRadius: 12, marginRight: 12, backgroundColor: "#f1f5f9", }, medicineName: { fontSize: 14, fontWeight: "700", }, qty: { fontSize: 12, color: "#64748b", marginTop: 4, }, footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, }, payment: { fontSize: 12, color: "#64748b", }, amount: { fontSize: 16, fontWeight: "900", marginTop: 2, }, reorderBtn: { backgroundColor: "#ecfeff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, }, reorderText: { fontWeight: "800", color: "#14b8a6", }, loader: { flex: 1, justifyContent: "center", alignItems: "center", }, empty: { alignItems: "center", marginTop: 80, }, emptyIcon: { fontSize: 48, }, emptyText: { fontSize: 14, color: "#64748b", marginTop: 8, }})