import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../../services/axios.js";

export default function MedicineOrdersOverview() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");

  const LIMIT = 20;

  /* ================= FETCH ================= */

  const fetchOrders = async (pageNumber = 1, isRefresh = false) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get("/medicine/order/view/all", {
        params: {
          page: pageNumber,
          limit: LIMIT,
        },
      });

      if (!res?.data?.success) return;

      const newOrders = Array.isArray(res.data.data)
        ? res.data.data
        : [];

      if (pageNumber === 1 || isRefresh) {
        setOrders(newOrders);
      } else {
        setOrders((prev) => [...prev, ...newOrders]);
      }

      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
      
    } catch (err) {
      console.log(err);
      console.log("Order Fetch Error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, true);
  }, []);

  /* ================= SEARCH ================= */

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;

    const keyword = search.toLowerCase();

    return orders.filter((o) =>
      o.customer?.name?.toLowerCase().includes(keyword) ||
      o.customer?.phone?.includes(search) ||
      o.medicine?.name?.toLowerCase().includes(keyword) ||
      o.deliveryAgent?.name?.toLowerCase().includes(keyword)
    );
  }, [orders, search]);

  /* ================= REFRESH ================= */

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(1, true);
  };

  /* ================= LOAD MORE ================= */

  const loadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    await fetchOrders(page + 1);
  };

  /* ================= LOADING ================= */

  if (loading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1BA6A6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Search customer / phone / medicine"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onMomentumScrollEnd={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } =
            e.nativeEvent;

          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 20
          ) {
            loadMore();
          }
        }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 && (
          <Text style={{ color: "#94A3B8", textAlign: "center" }}>
            No Orders Found
          </Text>
        )}

        {filteredOrders.map((order) => (
          <OrderCard key={order.orderId} order={order} />
        ))}

        {loadingMore && (
          <ActivityIndicator
            color="#1BA6A6"
            style={{ marginVertical: 20 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= ORDER CARD ================= */

function OrderCard({ order }) {
  const statusColor =
    order.orderStatus === "CONFIRMED"
      ? "#16A34A"
      : order.orderStatus === "SHIPPED"
      ? "#F59E0B"
      : order.orderStatus === "CANCELLED"
      ? "#DC2626"
      : "#64748B";

  const paymentColor =
    order.paymentStatus === "PAID"
      ? "#16A34A"
      : "#DC2626";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() =>
    router.push({
      pathname: "/admin/(tabs)/medicineorder/[orderId]",
      params: { orderId: order.orderId },
    })
  }
    >
      {/* ===== HEADER ===== */}
      <View style={styles.headerRow}>
        <Text style={styles.orderId}>
          Order #{order.orderId?.slice(-6)}
        </Text>

        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>
            {order.orderStatus}
          </Text>
        </View>
      </View>

      {/* ===== MEDICINE SECTION ===== */}
      <View style={styles.medicineRow}>
        {order.medicine?.image ? (
          <Image
            source={{ uri: order.medicine.image }}
            style={styles.medicineImage}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="medical-outline" size={22} color="#94A3B8" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.medicineName}>
            {order.medicine?.name}
          </Text>

          <Text style={styles.quantity}>
            Quantity: {order.medicine?.quantity}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.amount}>
            ₹{order.payableAmount}
          </Text>

          <Text style={[styles.paymentStatus, { color: paymentColor }]}>
            {order.paymentStatus}
          </Text>
        </View>
      </View>

      {/* ===== DIVIDER ===== */}
      <View style={styles.divider} />

      {/* ===== CUSTOMER INFO ===== */}
      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={14} color="#64748B" />
        <Text style={styles.metaText}>
          {order.customer?.name}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={14} color="#64748B" />
        <Text style={styles.metaText}>
          {order.customer?.phone}
        </Text>
      </View>

      {order.deliveryAgent && (
        <View style={styles.infoRow}>
          <Ionicons name="bicycle-outline" size={14} color="#64748B" />
          <Text style={styles.metaText}>
            {order.deliveryAgent.name}
          </Text>
        </View>
      )}

      {/* Placed at the counter by staff, not by the customer */}
      {order.placedBy && (
        <View style={styles.infoRow}>
          <Ionicons name="storefront-outline" size={14} color="#64748B" />
          <Text style={styles.metaText}>
            Placed by {order.placedBy.name || "staff"}
          </Text>
        </View>
      )}

      {/* ===== FOOTER ===== */}
      <View style={styles.footerRow}>
        <Text style={styles.date}>
          {new Date(order.createdAt).toLocaleString()}
        </Text>

        <Text style={styles.paymentMode}>
          {order.paymentMode}
        </Text>
      </View>
    </TouchableOpacity>
  );
}


/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  searchInput: { flex: 1, marginLeft: 10 },

 card: {
  backgroundColor: "#fff",
  padding: 18,
  borderRadius: 22,
  marginBottom: 18,
  borderWidth: 1,
  borderColor: "#E2E8F0",
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 3,
},

headerRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
},

orderId: {
  fontSize: 13,
  fontWeight: "700",
  color: "#0F172A",
},

statusBadge: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 999,
},

statusText: {
  fontSize: 10,
  fontWeight: "700",
  color: "#fff",
},

medicineRow: {
  flexDirection: "row",
  alignItems: "center",
},

medicineImage: {
  width: 52,
  height: 52,
  borderRadius: 12,
  marginRight: 14,
},

imagePlaceholder: {
  width: 52,
  height: 52,
  borderRadius: 12,
  marginRight: 14,
  backgroundColor: "#F1F5F9",
  justifyContent: "center",
  alignItems: "center",
},

medicineName: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0F172A",
},

quantity: {
  fontSize: 12,
  color: "#64748B",
  marginTop: 4,
},

amount: {
  fontSize: 15,
  fontWeight: "800",
  color: "#1BA6A6",
},

paymentStatus: {
  fontSize: 11,
  fontWeight: "600",
  marginTop: 4,
},

divider: {
  height: 1,
  backgroundColor: "#F1F5F9",
  marginVertical: 14,
},

infoRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 6,
  gap: 6,
},

metaText: {
  fontSize: 12,
  color: "#475569",
},

footerRow: {
  marginTop: 8,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

date: {
  fontSize: 11,
  color: "#94A3B8",
},

paymentMode: {
  fontSize: 11,
  fontWeight: "600",
  color: "#64748B",
},

    
});
