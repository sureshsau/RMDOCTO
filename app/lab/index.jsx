import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../services/axios";

const PURPLE = "#6b6dbf";
const TEAL = "#14b8a6";
const BG = "#f1f5f9";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";

export default function LabBrowse() {
  const insets = useSafeAreaInsets();
  const [labs, setLabs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const LIMIT = 15;

  const load = useCallback(async (pg = 1, q = search, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pg === 1) setLoading(true);
      else setMore(true);
      const res = await api.get("/labs", { params: { page: pg, limit: LIMIT, search: q } });
      const incoming = res.data?.data ?? [];
      setLabs(pg === 1 ? incoming : (prev) => [...prev, ...incoming]);
      setTotal(res.data?.pagination?.total ?? 0);
      setPage(pg);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load labs");
    } finally {
      setLoading(false);
      setMore(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => { load(1); }, []);

  const onSearch = (txt) => { setSearch(txt); load(1, txt); };
  const loadMore = () => { if (more || labs.length >= total) return; load(page + 1); };

  return (
    <View style={styles.container}>

      {/* Hero */}
      <View style={[styles.hero, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8, padding: 4 }}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Diagnostic Labs</Text>
          <Text style={styles.heroSub}>Book lab tests at home or at center</Text>
        </View>
        <TouchableOpacity style={styles.ordersBtn} onPress={() => router.push("/lab/my-orders")}>
          <Ionicons name="receipt-outline" size={20} color={PURPLE} />
          <Text style={styles.ordersBtnTxt}>My Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={TEXT_S} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search labs by name or city…"
          placeholderTextColor={TEXT_S}
          value={search}
          onChangeText={onSearch}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.centerTxt}>Finding labs near you…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={46} color={TEXT_S} />
          <Text style={styles.errTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(1)}>
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={labs}
          keyExtractor={(i) => i._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(1, search, true)} colors={[PURPLE]} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={more ? <ActivityIndicator color={PURPLE} style={{ marginVertical: 12 }} /> : null}
          ListHeaderComponent={
            <Text style={styles.totalTxt}>{total} lab{total !== 1 ? "s" : ""} available</Text>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="business-outline" size={54} color={TEXT_S} />
              <Text style={styles.emptyTitle}>No Labs Found</Text>
              <Text style={styles.emptyTxt}>Try a different search or check back later.</Text>
            </View>
          }
          renderItem={({ item }) => <LabCard lab={item} />}
        />
      )}
    </View>
  );
}

function LabCard({ lab }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/lab/[labId]", params: { labId: lab._id } })}
    >
      <View style={styles.cardLeft}>
        <View style={styles.labAvatar}>
          <Ionicons name="flask" size={22} color={PURPLE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.labName} numberOfLines={1}>{lab.name}</Text>
          {lab.brandName ? <Text style={styles.labBrand} numberOfLines={1}>{lab.brandName}</Text> : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Ionicons name="location-outline" size={12} color={TEXT_S} />
            <Text style={styles.labCity}>
              {lab.address?.city ?? "—"}{lab.address?.state ? `, ${lab.address.state}` : ""}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ alignItems: "flex-end", gap: 8 }}>
        {lab.homeCollection && (
          <View style={styles.homeBadge}>
            <Text style={styles.homeBadgeTxt}>🏠 Home</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={TEXT_S} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  safe: { flex: 1, backgroundColor: BG },

  hero: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: PURPLE, paddingHorizontal: 20, paddingVertical: 16,
  },
  heroIcon: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  ordersBtn: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: "center", gap: 4,
  },
  ordersBtnTxt: { fontSize: 11, fontWeight: "700", color: PURPLE },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    backgroundColor: CARD, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_D },

  totalTxt: { fontSize: 12, color: TEXT_M, fontWeight: "600", marginBottom: 10 },

  card: {
    backgroundColor: CARD, borderRadius: 18, padding: 16, elevation: 2,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  labAvatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: PURPLE + "18", alignItems: "center", justifyContent: "center",
  },
  labName: { fontSize: 15, fontWeight: "800", color: TEXT_D },
  labBrand: { fontSize: 12, color: TEXT_M, marginTop: 1 },
  labCity: { fontSize: 12, color: TEXT_S },
  homeBadge: { backgroundColor: "#d1fae5", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  homeBadgeTxt: { fontSize: 11, fontWeight: "700", color: "#065f46" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerTxt: { color: TEXT_M, fontSize: 14 },
  errTxt: { color: "#ef4444", fontSize: 14, textAlign: "center" },
  retryBtn: { backgroundColor: PURPLE, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryTxt: { color: "#fff", fontWeight: "700" },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: TEXT_D },
  emptyTxt: { fontSize: 13, color: TEXT_M, textAlign: "center" },
});
