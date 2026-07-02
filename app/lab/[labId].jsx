import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../../services/axios";

const PURPLE = "#6b6dbf";
const TEAL   = "#14b8a6";
const BG     = "#f1f5f9";
const CARD   = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const GREEN  = "#10b981";

const fmtMoney = (v) => `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

export default function LabDetail() {
  const { labId } = useLocalSearchParams();

  const [lab,        setLab]        = useState(null);
  const [tests,      setTests]      = useState([]);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [moreTests,  setMoreTests]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cart,       setCart]       = useState({}); // { testId: quantity }

  const LIMIT = 20;

  const fetchLab = useCallback(async () => {
    try {
      const res = await api.get(`/labs/${labId}`);
      setLab(res.data?.data ?? null);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load lab" });
    }
  }, [labId]);

  const fetchTests = useCallback(async (pg = 1, q = search, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pg === 1) setLoading(true);
      else setMoreTests(true);

      const res = await api.get("/labs/tests/list", {
        params: { page: pg, limit: LIMIT, labId, search: q },
      });
      const incoming = res.data?.data ?? [];
      setTests(pg === 1 ? incoming : (prev) => [...prev, ...incoming]);
      setTotal(res.data?.pagination?.total ?? 0);
      setPage(pg);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load tests" });
    } finally {
      setLoading(false);
      setMoreTests(false);
      setRefreshing(false);
    }
  }, [labId, search]);

  useEffect(() => {
    fetchLab();
    fetchTests(1);
  }, [labId]);

  const onSearch = (txt) => { setSearch(txt); fetchTests(1, txt); };

  const addToCart   = (testId) => setCart((c) => ({ ...c, [testId]: (c[testId] || 0) + 1 }));
  const removeFromCart = (testId) =>
    setCart((c) => {
      const next = { ...c };
      if ((next[testId] || 0) > 1) next[testId]--;
      else delete next[testId];
      return next;
    });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartItems = Object.entries(cart).map(([testId, quantity]) => {
    const test = tests.find((t) => t._id === testId);
    return { testId, quantity, name: test?.name, price: test?.pricing?.userPrice ?? 0 };
  });
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const goBook = () => {
    if (cartCount === 0) return Toast.show({ type: "info", text1: "Add at least one test" });
    router.push({
      pathname: "/lab/book",
      params: {
        labId,
        labName: lab?.name ?? "",
        items: JSON.stringify(cartItems.map((i) => ({ testId: i.testId, quantity: i.quantity }))),
      },
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>

      {/* Lab Info Header */}
      {lab && (
        <View style={styles.labHeader}>
          <View style={styles.labAvatar}>
            <Ionicons name="business" size={26} color={PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.labName}>{lab.name}</Text>
            {lab.brandName ? <Text style={styles.labBrand}>{lab.brandName}</Text> : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={12} color={TEXT_S} />
              <Text style={styles.labCity}>{lab.address?.city ?? "—"}</Text>
              {lab.phone && (
                <>
                  <Text style={{ color: TEXT_S }}> · </Text>
                  <Ionicons name="call-outline" size={12} color={TEXT_S} />
                  <Text style={styles.labCity}>{lab.phone}</Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={TEXT_S} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tests…"
          placeholderTextColor={TEXT_S}
          value={search}
          onChangeText={onSearch}
        />
      </View>

      {/* Tests list */}
      <FlatList
        data={tests}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ padding: 16, paddingBottom: cartCount > 0 ? 120 : 40 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { fetchLab(); fetchTests(1, search, true); }} colors={[PURPLE]} />
        }
        onEndReached={() => { if (!moreTests && tests.length < total) fetchTests(page + 1); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={moreTests ? <ActivityIndicator color={PURPLE} style={{ marginVertical: 12 }} /> : null}
        ListHeaderComponent={<Text style={styles.totalTxt}>{total} test{total !== 1 ? "s" : ""} available</Text>}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="flask-outline" size={46} color={TEXT_S} />
            <Text style={styles.emptyTitle}>No Tests Available</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TestCard
            test={item}
            qty={cart[item._id] || 0}
            onAdd={() => addToCart(item._id)}
            onRemove={() => removeFromCart(item._id)}
          />
        )}
      />

      {/* Cart Bar */}
      {cartCount > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartCount}>{cartCount} test{cartCount !== 1 ? "s" : ""} selected</Text>
            <Text style={styles.cartTotal}>{fmtMoney(cartTotal)}</Text>
          </View>
          <TouchableOpacity style={styles.bookBtn} onPress={goBook}>
            <Text style={styles.bookBtnTxt}>Book Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function TestCard({ test, qty, onAdd, onRemove }) {
  const price = test.pricing?.userPrice ?? 0;
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.testName}>{test.name}</Text>
          {test.shortCode ? <Text style={styles.testCode}>{test.shortCode}</Text> : null}
          {test.description ? <Text style={styles.testDesc} numberOfLines={2}>{test.description}</Text> : null}
        </View>
        <Text style={styles.testPrice}>{fmtMoney(price)}</Text>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.tagRow}>
          <View style={styles.tag}><Text style={styles.tagTxt}>{test.category ?? "General"}</Text></View>
          <View style={styles.tag}><Text style={styles.tagTxt}>{test.sampleType ?? "—"}</Text></View>
          {test.homeCollectionAvailable && (
            <View style={[styles.tag, { backgroundColor: "#d1fae5" }]}>
              <Text style={[styles.tagTxt, { color: "#065f46" }]}>🏠 Home</Text>
            </View>
          )}
          {test.reportTat ? <Text style={styles.tatTxt}>Report: {test.reportTat}</Text> : null}
        </View>

        {/* Qty control */}
        {qty === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnTxt}>Add</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyControl}>
            <TouchableOpacity style={styles.qtyBtn} onPress={onRemove}>
              <Ionicons name="remove" size={18} color={PURPLE} />
            </TouchableOpacity>
            <Text style={styles.qtyNum}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={onAdd}>
              <Ionicons name="add" size={18} color={PURPLE} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },

  labHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: CARD, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  labAvatar: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: PURPLE + "18", alignItems: "center", justifyContent: "center",
  },
  labName:  { fontSize: 16, fontWeight: "800", color: TEXT_D },
  labBrand: { fontSize: 12, color: TEXT_M, marginTop: 1 },
  labCity:  { fontSize: 12, color: TEXT_S },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: CARD, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_D },
  totalTxt:    { fontSize: 12, color: TEXT_M, fontWeight: "600", marginBottom: 10 },

  card: {
    backgroundColor: CARD, borderRadius: 16, padding: 14, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 8 },
  testName:  { fontSize: 14, fontWeight: "800", color: TEXT_D },
  testCode:  { fontSize: 11, color: TEXT_S, marginTop: 2 },
  testDesc:  { fontSize: 12, color: TEXT_M, marginTop: 4 },
  testPrice: { fontSize: 16, fontWeight: "900", color: PURPLE },

  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tagRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 },
  tag:        { backgroundColor: "#ede9fe", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt:     { fontSize: 11, fontWeight: "600", color: PURPLE },
  tatTxt:     { fontSize: 11, color: TEXT_S },

  addBtn:    { backgroundColor: PURPLE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  addBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  qtyControl:{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f1f5f9", borderRadius: 10, padding: 4 },
  qtyBtn:    { backgroundColor: CARD, width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", elevation: 1 },
  qtyNum:    { fontSize: 16, fontWeight: "900", color: PURPLE, minWidth: 24, textAlign: "center" },

  cartBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: PURPLE, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14,
    paddingBottom: 20,
  },
  cartCount: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  cartTotal: { color: "#fff", fontSize: 18, fontWeight: "900" },
  bookBtn:   { backgroundColor: TEAL, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  bookBtnTxt:{ color: "#fff", fontWeight: "800", fontSize: 15 },

  emptyTitle: { fontSize: 16, fontWeight: "800", color: TEXT_D },
});
