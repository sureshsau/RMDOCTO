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
const TEAL   = "#14b8a6";
const BG     = "#f1f5f9";
const CARD   = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";

const CATEGORIES = ["ALL", "Haematology", "Biochemistry", "Microbiology", "Radiology", "Pathology", "Cardiology", "Genetics"];

export default function TestsList() {
  const [tests,      setTests]      = useState([]);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("");
  const [loading,    setLoading]    = useState(true);
  const [more,       setMore]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const LIMIT = 20;

  const load = useCallback(async (pg = 1, q = search, cat = category, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pg === 1) setLoading(true);
      else setMore(true);

      const res = await api.get("/labs/tests/list", {
        params: { page: pg, limit: LIMIT, search: q, category: cat === "ALL" ? "" : cat },
      });
      const incoming = res.data?.data ?? [];
      setTests(pg === 1 ? incoming : (prev) => [...prev, ...incoming]);
      setTotal(res.data?.pagination?.total ?? 0);
      setPage(pg);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load tests");
    } finally {
      setLoading(false);
      setMore(false);
      setRefreshing(false);
    }
  }, [search, category]);

  useEffect(() => { load(1); }, []);

  const onSearch = (txt) => { setSearch(txt); load(1, txt, category); };
  const pickCategory = (cat) => { setCategory(cat); load(1, search, cat); };
  const loadMore = () => { if (more || tests.length >= total) return; load(page + 1); };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={TEXT_S} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tests by name, code…"
          placeholderTextColor={TEXT_S}
          value={search}
          onChangeText={onSearch}
        />
      </View>

      {/* Category Pills */}
      <FlatList
        data={CATEGORIES}
        horizontal
        keyExtractor={(i) => i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pill, (category === item || (item === "ALL" && !category)) && styles.pillActive]}
            onPress={() => pickCategory(item === "ALL" ? "" : item)}
          >
            <Text style={[(category === item || (item === "ALL" && !category)) ? styles.pillTxtActive : styles.pillTxt]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.centerTxt}>Loading tests…</Text>
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
          data={tests}
          keyExtractor={(i) => i._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(1, search, category, true)} colors={[PURPLE]} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={more ? <ActivityIndicator color={PURPLE} style={{ marginVertical: 12 }} /> : null}
          ListHeaderComponent={<Text style={styles.totalTxt}>{total} test{total !== 1 ? "s" : ""}</Text>}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="flask-outline" size={46} color={TEXT_S} />
              <Text style={styles.emptyTitle}>No Tests Found</Text>
            </View>
          }
          renderItem={({ item }) => <TestCard test={item} />}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/admin/lab/add-test")}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function TestCard({ test }) {
  const price = test.pricing?.userPrice ?? 0;
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() =>
        router.push({ pathname: "/admin/lab/add-test", params: { testId: test._id, edit: "true" } })
      }
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.testName} numberOfLines={1}>{test.name}</Text>
          <Text style={styles.testCode}>{test.shortCode ?? ""}</Text>
        </View>
        <Text style={styles.testPrice}>₹{price}</Text>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.chip}>
          <Text style={styles.chipTxt}>{test.category ?? "General"}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipTxt}>{test.sampleType ?? "—"}</Text>
        </View>
        {test.homeCollectionAvailable && (
          <View style={[styles.chip, { backgroundColor: "#d1fae5" }]}>
            <Text style={[styles.chipTxt, { color: GREEN }]}>Home</Text>
          </View>
        )}
        <Text style={styles.labName} numberOfLines={1}>
          {test.labId?.name ?? ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: CARD, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_D },

  pills: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: CARD,
  },
  pillActive:    { backgroundColor: PURPLE, borderColor: PURPLE },
  pillTxt:       { fontSize: 12, fontWeight: "600", color: TEXT_M },
  pillTxtActive: { fontSize: 12, fontWeight: "600", color: "#fff" },

  totalTxt: { fontSize: 12, color: TEXT_M, fontWeight: "600", marginBottom: 10 },

  card: {
    backgroundColor: CARD, borderRadius: 16, padding: 14, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardTop:   { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  testName:  { fontSize: 14, fontWeight: "800", color: TEXT_D },
  testCode:  { fontSize: 11, color: TEXT_S, marginTop: 2 },
  testPrice: { fontSize: 16, fontWeight: "900", color: PURPLE },

  cardBottom: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  chip: {
    backgroundColor: "#ede9fe", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  chipTxt:  { fontSize: 11, fontWeight: "600", color: PURPLE },
  labName:  { fontSize: 11, color: TEXT_S, fontStyle: "italic" },

  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerTxt:  { color: TEXT_M, fontSize: 14 },
  errTxt:     { color: "#ef4444", fontSize: 14, textAlign: "center" },
  retryBtn:   { backgroundColor: PURPLE, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryTxt:   { color: "#fff", fontWeight: "700" },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: TEXT_D },

  fab: {
    position: "absolute", bottom: 28, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: PURPLE, alignItems: "center", justifyContent: "center",
    elevation: 6, shadowColor: PURPLE, shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
  },
});
