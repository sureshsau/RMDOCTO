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
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../services/axios";

const PURPLE = "#6b6dbf";
const BG     = "#f1f5f9";
const CARD   = "#ffffff";
const TEAL   = "#14b8a6";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";

export default function LabsList() {
  const [labs,      setLabs]      = useState([]);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [more,      setMore]      = useState(false);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState(null);

  const LIMIT = 15;

  const load = useCallback(async (pg = 1, q = search, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pg === 1) setLoading(true);
      else setMore(true);

      const res = await api.get("/labs", {
        params: { page: pg, limit: LIMIT, search: q },
      });
      const incoming = res.data?.data ?? [];
      setLabs(pg === 1 ? incoming : (prev) => [...prev, ...incoming]);
      setTotal(res.data?.pagination?.total ?? 0);
      setPage(pg);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load labs");
    } finally {
      setLoading(false);
      setMore(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => { load(1); }, []);

  const onSearch = (txt) => {
    setSearch(txt);
    load(1, txt);
  };

  const loadMore = () => {
    if (more || labs.length >= total) return;
    load(page + 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* Search bar */}
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
          <Text style={styles.centerTxt}>Loading labs…</Text>
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
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(1, search, true)} colors={[PURPLE]} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={more ? <ActivityIndicator color={PURPLE} style={{ marginVertical: 12 }} /> : null}
          ListHeaderComponent={
            <Text style={styles.totalTxt}>{total} lab{total !== 1 ? "s" : ""} found</Text>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="business-outline" size={46} color={TEXT_S} />
              <Text style={styles.emptyTitle}>No Labs Found</Text>
              <Text style={styles.emptyTxt}>Try a different search term.</Text>
            </View>
          }
          renderItem={({ item }) => <LabCard lab={item} />}
        />
      )}

      {/* FAB — Add Lab */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/admin/lab/add-lab")}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function LabCard({ lab }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() =>
        router.push({ pathname: "/admin/lab/add-lab", params: { labId: lab._id, edit: "true" } })
      }
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatarBox}>
          <Ionicons name="business" size={22} color={PURPLE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.labName} numberOfLines={1}>{lab.name}</Text>
          {lab.brandName ? (
            <Text style={styles.labBrand} numberOfLines={1}>{lab.brandName}</Text>
          ) : null}
          <View style={styles.row}>
            <Ionicons name="location-outline" size={12} color={TEXT_S} />
            <Text style={styles.labCity}>
              {lab.address?.city ?? "—"}{lab.address?.state ? `, ${lab.address.state}` : ""}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={TEXT_S} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: CARD, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_D },

  totalTxt: { fontSize: 12, color: TEXT_M, fontWeight: "600", marginBottom: 10 },

  card: {
    backgroundColor: CARD, borderRadius: 16, padding: 14, elevation: 2,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardLeft:  { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatarBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: PURPLE + "18", alignItems: "center", justifyContent: "center",
  },
  labName:  { fontSize: 14, fontWeight: "800", color: TEXT_D },
  labBrand: { fontSize: 12, color: TEXT_M, marginTop: 1 },
  row:      { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  labCity:  { fontSize: 12, color: TEXT_S },

  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerTxt:  { color: TEXT_M, fontSize: 14 },
  errTxt:     { color: "#ef4444", fontSize: 14, textAlign: "center" },
  retryBtn:   { backgroundColor: PURPLE, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryTxt:   { color: "#fff", fontWeight: "700" },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: TEXT_D },
  emptyTxt:   { fontSize: 13, color: TEXT_M, textAlign: "center" },

  fab: {
    position: "absolute", bottom: 28, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: PURPLE, alignItems: "center", justifyContent: "center",
    elevation: 6, shadowColor: PURPLE, shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
  },
});
