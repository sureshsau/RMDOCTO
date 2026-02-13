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

/* ================= MAIN ================= */

export default function MarketingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= FETCH ORDERS ================= */

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const res = await api.get("/marketing-agent/medicine/orders");
      setOrders(res?.data?.orders || []);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(true);
  }, []);

  /* ================= DERIVED STATS ================= */

  const stats = useMemo(() => {
    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
      (o) =>
        o.orderStatus === "CONFIRMED" &&
        o.paymentStatus === "PENDING"
    ).length;

    const totalAmount = orders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );

    return {
      totalOrders,
      pendingOrders,
      totalAmount,
    };
  }, [orders]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14b8a6"
          />
        }
      >
        {/* ===== HEADER ===== */}
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Orders Overview</Text>
          <Text style={styles.subtitle}>
            Orders placed by your network
          </Text>
        </View>

        {/* ===== OVERVIEW CARD ===== */}
        {orders.length > 0 && (
          <View style={styles.overviewCard}>
            <OverviewItem
              label="Total Orders"
              value={stats.totalOrders}
            />
            <Divider />
            <OverviewItem
              label="Pending"
              value={stats.pendingOrders}
            />
            <Divider />
            <OverviewItem
              label="Total Value"
              value={`₹${stats.totalAmount}`}
            />
          </View>
        )}

        {/* ===== ORDER LIST ===== */}
        {orders.map((order, index) => (
          <TouchableOpacity
            key={`${order.orderId}-${index}`} // ✅ FIXED
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push(
                `/marketing_agent/medicine/order/${order.orderId}`
              )
            }
          >
            {/* TOP */}
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.orderId}>
                  #{order.orderId.slice(-6)}
                </Text>
                <Text style={styles.meta}>
                  {new Date(order.createdAt).toDateString()}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  order.orderStatus === "CONFIRMED" &&
                    styles.confirmed,
                ]}
              >
                <Text style={styles.statusText}>
                  {order.orderStatus}
                </Text>
              </View>
            </View>

            {/* CUSTOMER */}
            <View style={styles.section}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>
                {order.customer.name}
              </Text>
              <Text style={styles.meta}>
                📞 {order.customer.phone}
              </Text>
            </View>

            {/* ADDRESS */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Delivery Address
              </Text>
              <Text style={styles.meta}>
                {order.deliveryAddress.addressLine1}
              </Text>
              <Text style={styles.meta}>
                Pincode: {order.deliveryAddress.pincode}
              </Text>
            </View>

            {/* FOOTER */}
            <View style={styles.footerRow}>
              <Text style={styles.items}>
                {order.itemCount} item(s)
              </Text>

              <Text style={styles.amount}>
                ₹{order.totalAmount}
              </Text>
            </View>

            {/* PAYMENT */}
            <View style={styles.paymentRow}>
              <Text style={styles.meta}>
                {order.paymentMode}
              </Text>
              <Text
                style={[
                  styles.meta,
                  order.paymentStatus === "PENDING" &&
                    styles.pending,
                ]}
              >
                {order.paymentStatus}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* EMPTY */}
        {orders.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>
              No orders found
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ================= SMALL COMPONENTS ================= */

const OverviewItem = ({ label, value }) => (
  <View style={styles.overviewItem}>
    <Text style={styles.overviewValue}>{value}</Text>
    <Text style={styles.overviewLabel}>{label}</Text>
  </View>
);

const Divider = () => (
  <View style={styles.dividerVertical} />
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  pageHeader: {
    marginVertical: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
  },

  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  /* OVERVIEW */
  overviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 3,
  },

  overviewItem: {
    flex: 1,
    alignItems: "center",
  },

  overviewValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },

  overviewLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },

  dividerVertical: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },

  /* CARD */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderId: {
    fontSize: 14,
    fontWeight: "800",
  },

  meta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e0f2fe",
  },

  confirmed: {
    backgroundColor: "#dcfce7",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#065f46",
  },

  section: {
    marginTop: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },

  value: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  items: {
    fontSize: 12,
    color: "#64748b",
  },

  amount: {
    fontSize: 16,
    fontWeight: "900",
  },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  pending: {
    color: "#dc2626",
    fontWeight: "700",
  },

  empty: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyIcon: {
    fontSize: 48,
  },

  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
  },
});
