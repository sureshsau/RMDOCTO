import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState, useCallback } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Animated,
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
import api from "../../../services/axios";

/* ─── BRAND ──────────────────────────────────────────────────── */
const PURPLE    = "#6b6dbf";
const TEAL      = "#14b8a6";
const BG        = "#f1f5f9";
const CARD      = "#ffffff";
const TEXT_DARK = "#0f172a";
const TEXT_MID  = "#475569";
const TEXT_SOFT = "#94a3b8";
const GREEN     = "#10b981";
const RED       = "#ef4444";
const AMBER     = "#f59e0b";

const RANGE_OPTIONS = ["today", "week", "month", "year"];
const LEVEL_COLORS  = ["#6b6dbf","#14b8a6","#f59e0b","#ec4899","#3b82f6","#10b981","#f97316"];
const levelColor    = (lvl) => LEVEL_COLORS[lvl % LEVEL_COLORS.length];

const fmtMoney = (v) => `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
const fmtDate  = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_CFG = {
  INITIATED: { color: TEXT_SOFT, bg: "#f1f5f9", label: "Initiated" },
  CONFIRMED: { color: "#3b82f6", bg: "#eff6ff", label: "Confirmed" },
  SHIPPED:   { color: AMBER,     bg: "#fffbeb", label: "Shipped"   },
  DELIVERED: { color: GREEN,     bg: "#f0fdf4", label: "Delivered" },
  CANCELLED: { color: RED,       bg: "#fef2f2", label: "Cancelled" },
};

/* ─── TREE NODE ──────────────────────────────────────────────── */
function filterTree(nodes, query) {
  return nodes.reduce((acc, node) => {
    const match =
      node.name?.toLowerCase().includes(query.toLowerCase()) ||
      node.phone?.includes(query);
    const fc = filterTree(node.children ?? [], query);
    if (match || fc.length) acc.push({ ...node, children: fc });
    return acc;
  }, []);
}

function TreeNode({ node, depth = 0, searchQuery }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const rotate = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 250, delay: depth * 40, useNativeDriver: true }).start();
  }, []);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.spring(rotate, { toValue: next ? 1 : 0, useNativeDriver: true }).start();
  };

  const hasChildren  = node.children?.length > 0;
  const color        = levelColor(node.level ?? depth);
  const arrowSpin    = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] });
  const isMatch = searchQuery && (
    node.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.phone?.includes(searchQuery)
  );

  return (
    <Animated.View style={[{ opacity: fadeIn }, depth > 0 && { marginLeft: 18 }]}>
      {depth > 0 && <View style={[styles.connector, { borderColor: color + "44" }]} />}
      <View style={[styles.nodeCard, isMatch && styles.nodeHighlight, { borderLeftColor: color }]}>
        <View style={[styles.nodeAvatar, { backgroundColor: color + "22" }]}>
          <Text style={[styles.nodeAvatarText, { color }]}>{node.name?.charAt(0)?.toUpperCase() || "?"}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.nodeName} numberOfLines={1}>{node.name || "Unknown"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Ionicons name="call-outline" size={9} color={TEXT_SOFT} />
            <Text style={styles.nodeMeta}>{node.phone || "—"}</Text>
            <View style={[styles.levelPill, { backgroundColor: color + "22" }]}>
              <Text style={[styles.levelText, { color }]}>L{node.level ?? depth}</Text>
            </View>
          </View>
        </View>
        {hasChildren && (
          <TouchableOpacity onPress={toggle}
            style={[styles.toggleBtn, { backgroundColor: color + "15" }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={{ transform: [{ rotate: arrowSpin }] }}>
              <Ionicons name="chevron-forward" size={14} color={color} />
            </Animated.View>
            <Text style={[{ fontSize: 10, fontWeight: "800", marginTop: 1 }, { color }]}>{node.children.length}</Text>
          </TouchableOpacity>
        )}
      </View>
      {hasChildren && expanded && node.children.map((c, i) => (
        <TreeNode key={c.id || i} node={c} depth={depth + 1} searchQuery={searchQuery} />
      ))}
    </Animated.View>
  );
}

/* ─── INLINE NETWORK PANEL ───────────────────────────────────── */
function NetworkPanel({ personId, mode }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState("");

  const accentColor = mode === "agent" ? PURPLE : TEAL;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let res;
      if (mode === "agent") {
        res  = await api.get(`/admin/network/agent/${personId}`);
        setData(res.data?.data?.data ?? res.data?.data ?? res.data);
      } else {
        res  = await api.get(`/admin/network/marketing-agent/${personId}`);
        setData(res.data?.data ?? res.data);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load network");
    } finally {
      setLoading(false);
    }
  }, [personId, mode]);

  useEffect(() => { load(); }, [load]);

  const tree         = mode === "agent" ? (data?.downlineTree ?? []) : (data?.tree ?? []);
  const filteredTree = search.trim() ? filterTree(tree, search) : tree;

  if (loading) return (
    <View style={styles.panelCenter}>
      <ActivityIndicator size="small" color={accentColor} />
      <Text style={styles.panelCenterText}>Loading network…</Text>
    </View>
  );

  if (error) return (
    <View style={styles.panelCenter}>
      <Ionicons name="cloud-offline-outline" size={30} color={TEXT_SOFT} />
      <Text style={[styles.panelCenterText, { color: RED }]}>{error}</Text>
      <TouchableOpacity onPress={load} style={[styles.retrySmall, { backgroundColor: accentColor }]}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.panelBody}>
      {/* Search */}
      <View style={styles.panelSearch}>
        <Ionicons name="search-outline" size={13} color={TEXT_SOFT} style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Search by name or phone…"
          placeholderTextColor={TEXT_SOFT}
          value={search} onChangeText={setSearch}
          style={{ flex: 1, fontSize: 13, color: TEXT_DARK }}
          color={TEXT_DARK}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={13} color={TEXT_SOFT} />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats row */}
      {tree.length > 0 && (() => {
        const countAll = (ns) => ns.reduce((c, n) => c + 1 + (n.children?.length ? countAll(n.children) : 0), 0);
        return (
          <View style={styles.treeStatRow}>
            {[
              { label: "Members", value: countAll(tree), icon: "people" },
              { label: "Roots",   value: tree.length,   icon: "git-network-outline" },
            ].map(({ label, value, icon }) => (
              <View key={label} style={[styles.treeStatChip, { borderColor: accentColor + "33" }]}>
                <Ionicons name={icon} size={11} color={accentColor} />
                <Text style={[styles.treeStatVal, { color: accentColor }]}>{value}</Text>
                <Text style={styles.treeStatLabel}>{label}</Text>
              </View>
            ))}
          </View>
        );
      })()}

      {/* Tree */}
      {filteredTree.length === 0 ? (
        <View style={styles.panelEmpty}>
          <Ionicons name="git-network-outline" size={36} color={TEXT_SOFT} />
          <Text style={styles.panelEmptyText}>
            {search ? "No match found" : "No downline RM Members yet"}
          </Text>
        </View>
      ) : (
        filteredTree.map((node, i) => (
          <TreeNode key={node.id || i} node={node} depth={0} searchQuery={search} />
        ))
      )}
    </View>
  );
}

/* ─── INLINE ORDERS PANEL ────────────────────────────────────── */
function OrdersPanel({ personId }) {
  const [range,   setRange]   = useState("month");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/medicine/order/stats/user/${personId}?range=${range}`);
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [personId, range]);

  useEffect(() => { load(); }, [load]);

  const summary = data?.summary;
  const orders  = data?.orders ?? [];

  if (loading) return (
    <View style={styles.panelCenter}>
      <ActivityIndicator size="small" color={TEAL} />
      <Text style={styles.panelCenterText}>Loading orders…</Text>
    </View>
  );

  if (error) return (
    <View style={styles.panelCenter}>
      <Ionicons name="cloud-offline-outline" size={30} color={TEXT_SOFT} />
      <Text style={[styles.panelCenterText, { color: RED }]}>{error}</Text>
      <TouchableOpacity onPress={load} style={[styles.retrySmall, { backgroundColor: TEAL }]}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.panelBody}>
      {/* Range pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
      >
        {RANGE_OPTIONS.map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRange(r)}
            style={[
              styles.rangePill,
              range === r && { backgroundColor: TEAL, borderColor: TEAL },
            ]}
          >
            <Text style={[styles.rangePillText, range === r && { color: "#fff" }]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary */}
      {summary && (
        <View style={styles.summaryGrid}>
          {[
            { label: "Orders",    value: String(summary.totalOrders),          color: PURPLE, icon: "receipt-outline" },
            { label: "Revenue",   value: fmtMoney(summary.totalRevenue),       color: TEAL,   icon: "cash-outline" },
            { label: "Delivered", value: String(summary.delivered),            color: GREEN,  icon: "checkmark-circle-outline" },
            { label: "Pending",   value: String(summary.pending),              color: AMBER,  icon: "time-outline" },
            { label: "Cancelled", value: String(summary.cancelled),            color: RED,    icon: "close-circle-outline" },
          ].map((c) => (
            <View key={c.label} style={[styles.summaryChip, { borderColor: c.color + "30" }]}>
              <Ionicons name={c.icon} size={14} color={c.color} />
              <Text style={[styles.summaryVal, { color: c.color }]}>{c.value}</Text>
              <Text style={styles.summaryLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Orders list */}
      {orders.length === 0 ? (
        <View style={styles.panelEmpty}>
          <Ionicons name="receipt-outline" size={36} color={TEXT_SOFT} />
          <Text style={styles.panelEmptyText}>No orders in this range</Text>
        </View>
      ) : (
        <>
          <View style={styles.ordersCard}>
            {orders.slice(0, 3).map((order, i) => {
              const cfg = STATUS_CFG[order.orderStatus] || STATUS_CFG.INITIATED;
              return (
                <View key={order._id ?? i}>
                  <TouchableOpacity
                    style={styles.orderRow}
                    activeOpacity={0.75}
                    onPress={() =>
                      router.push({
                        pathname: "/admin/orders/[orderId]",
                        params: { orderId: order._id },
                      })
                    }
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDate}>{fmtDate(order.createdAt)}</Text>
                      <Text style={styles.orderMode}>{order.paymentMode}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.orderAmt}>{fmtMoney(order.pricing?.payableAmount)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={TEXT_SOFT} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                  {i < Math.min(orders.length, 3) - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>

          {/* See All button */}
          <TouchableOpacity
            style={styles.seeAllBtn}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/admin/orders/user-orders",
                params: { userId: personId, userName: "" },
              })
            }
          >
            <Text style={styles.seeAllText}>
              See All {orders.length} Orders
            </Text>
            <Ionicons name="arrow-forward" size={14} color={TEAL} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

/* ─── PERSON CARD (with inline expand) ──────────────────────── */
function PersonCard({ person, accentColor, mode }) {
  const [expanded, setExpanded] = useState(null); // null | "network" | "orders"

  const toggle = (tab) => setExpanded(prev => (prev === tab ? null : tab));

  return (
    <View style={styles.personCard}>
      {/* Header row */}
      <View style={styles.personRow}>
        <View style={[styles.personAvatar, { backgroundColor: accentColor + "22" }]}>
          <Text style={[styles.personInitials, { color: accentColor }]}>
            {person.name?.slice(0, 2)?.toUpperCase() || "??"}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.personName} numberOfLines={1}>{person.name || "Unknown"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
            <Ionicons name="call-outline" size={11} color={TEXT_SOFT} />
            <Text style={styles.personPhone}> {person.phone || "—"}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => toggle("orders")}
            style={[
              styles.actionBtn,
              expanded === "orders"
                ? { backgroundColor: TEAL, borderColor: TEAL }
                : { backgroundColor: TEAL + "18", borderColor: TEAL + "40" },
            ]}
          >
            <Ionicons name="receipt-outline" size={13} color={expanded === "orders" ? "#fff" : TEAL} />
            <Text style={[styles.actionBtnText, { color: expanded === "orders" ? "#fff" : TEAL }]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggle("network")}
            style={[
              styles.actionBtn,
              expanded === "network"
                ? { backgroundColor: accentColor, borderColor: accentColor }
                : { backgroundColor: accentColor + "18", borderColor: accentColor + "40" },
            ]}
          >
            <Ionicons name="git-network-outline" size={13} color={expanded === "network" ? "#fff" : accentColor} />
            <Text style={[styles.actionBtnText, { color: expanded === "network" ? "#fff" : accentColor }]}>Network</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded panel */}
      {expanded === "network" && (
        <View style={[styles.expandedPanel, { borderTopColor: accentColor + "30" }]}>
          <NetworkPanel personId={person._id} mode={mode} />
        </View>
      )}
      {expanded === "orders" && (
        <View style={[styles.expandedPanel, { borderTopColor: TEAL + "30" }]}>
          <OrdersPanel personId={person._id} />
        </View>
      )}
    </View>
  );
}

/* ─── ROOT SCREEN ────────────────────────────────────────────── */
export default function AdminNetworkScreen() {
  const [mode,      setMode]      = useState("marketing");
  const [people,    setPeople]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState("");
  const modeAnim = useRef(new Animated.Value(1)).current;

  const accentColor = mode === "agent" ? PURPLE : TEAL;
  const endpoint    = mode === "agent" ? "/admin/network/agents" : "/admin/network/marketing-agents";

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoint);
      setPeople(res.data?.data ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const switchMode = (m) => {
    setMode(m);
    setSearch("");
    Animated.spring(modeAnim, { toValue: m === "agent" ? 0 : 1, useNativeDriver: false }).start();
  };

  const filtered = search.trim()
    ? people.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search)
      )
    : people;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      {/* Mode Toggle */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Network Explorer</Text>
        <View style={styles.toggleTrack}>
          <Animated.View style={[
            styles.toggleIndicator,
            {
              backgroundColor: accentColor,
              left: modeAnim.interpolate({ inputRange: [0, 1], outputRange: ["1%", "50%"] }),
              width: "48%",
            },
          ]} />
          <TouchableOpacity style={styles.toggleOption} onPress={() => switchMode("agent")} activeOpacity={0.8}>
            <Ionicons name="person-outline" size={13} color={mode === "agent" ? "#fff" : TEXT_MID} />
            <Text style={[styles.toggleText, mode === "agent" && { color: "#fff" }]}>RM Member</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleOption} onPress={() => switchMode("marketing")} activeOpacity={0.8}>
            <Ionicons name="briefcase-outline" size={13} color={mode === "marketing" ? "#fff" : TEXT_MID} />
            <Text style={[styles.toggleText, mode === "marketing" && { color: "#fff" }]}>Marketing Executive</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={15} color={TEXT_SOFT} style={{ marginRight: 8 }} />
        <TextInput
          placeholder={`Search ${mode === "agent" ? "agents" : "marketing agents"}…`}
          placeholderTextColor={TEXT_SOFT}
          value={search} onChangeText={setSearch}
          style={styles.searchInput} color={TEXT_DARK}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={15} color={TEXT_SOFT} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={styles.centerText}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={46} color={TEXT_SOFT} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: accentColor }]} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[accentColor]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={46} color={TEXT_SOFT} />
              <Text style={styles.emptyTitle}>
                {search ? "No results found" : mode === "agent" ? "No RM Members found" : "No Marketing Executives found"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PersonCard person={item} accentColor={accentColor} mode={mode} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  topBar: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  pageTitle: { fontSize: 20, fontWeight: "900", color: TEXT_DARK, marginBottom: 12 },

  toggleTrack: {
    flexDirection: "row", backgroundColor: "#e2e8f0",
    borderRadius: 14, padding: 4, position: "relative",
    height: 44, alignItems: "center",
  },
  toggleIndicator: { position: "absolute", top: 4, bottom: 4, borderRadius: 10 },
  toggleOption:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, zIndex: 1 },
  toggleText:      { fontSize: 13, fontWeight: "600", color: TEXT_MID },

  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: CARD,
    marginHorizontal: 16, marginBottom: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_DARK },

  /* person card */
  personCard: {
    backgroundColor: CARD, borderRadius: 16,
    overflow: "hidden", elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  personRow:     { flexDirection: "row", alignItems: "center", padding: 14 },
  personAvatar:  { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  personInitials:{ fontSize: 16, fontWeight: "800" },
  personName:    { fontSize: 15, fontWeight: "700", color: TEXT_DARK },
  personPhone:   { fontSize: 12, color: TEXT_SOFT },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1,
  },
  actionBtnText: { fontWeight: "700", fontSize: 12 },

  /* expanded panel */
  expandedPanel: { borderTopWidth: 1, paddingTop: 2 },
  panelBody:     { padding: 12 },
  panelCenter:   { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 24 },
  panelCenterText:{ fontSize: 13, color: TEXT_MID },
  panelSearch: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: BG, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10,
  },
  panelEmpty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  panelEmptyText: { fontSize: 13, color: TEXT_MID, fontWeight: "600" },
  retrySmall: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },

  /* range pills */
  rangePill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: CARD,
  },
  rangePillText: { fontSize: 12, fontWeight: "600", color: TEXT_MID },

  /* summary grid */
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  summaryChip: {
    width: "31%", backgroundColor: BG, borderRadius: 12, borderWidth: 1,
    padding: 10, alignItems: "center", gap: 3,
  },
  summaryVal:   { fontSize: 15, fontWeight: "900" },
  summaryLabel: { fontSize: 10, color: TEXT_SOFT, fontWeight: "600", textAlign: "center" },

  /* orders */
  ordersCard: {
    backgroundColor: BG, borderRadius: 12, overflow: "hidden",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  orderRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 },
  orderDate:   { fontSize: 13, fontWeight: "700", color: TEXT_DARK },
  orderMode:   { fontSize: 11, color: TEXT_SOFT, marginTop: 1 },
  orderAmt:    { fontSize: 14, fontWeight: "800", color: TEXT_DARK },
  statusBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3 },
  statusText:  { fontSize: 10, fontWeight: "700" },
  divider:     { height: 1, backgroundColor: "#e2e8f0" },

  /* tree node */
  connector: {
    position: "absolute", left: -10, top: 0, bottom: "50%",
    borderLeftWidth: 1.5, borderBottomWidth: 1.5,
    borderBottomLeftRadius: 8, width: 12,
  },
  nodeCard: {
    backgroundColor: CARD, borderRadius: 12, borderLeftWidth: 3,
    padding: 10, flexDirection: "row", alignItems: "center",
    marginBottom: 7, elevation: 1,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
  },
  nodeHighlight:  { backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fde047" },
  nodeAvatar:     { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  nodeAvatarText: { fontSize: 13, fontWeight: "800" },
  nodeName:    { fontSize: 13, fontWeight: "700", color: TEXT_DARK },
  nodeMeta:    { fontSize: 10, color: TEXT_SOFT },
  levelPill:   { borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  levelText:   { fontSize: 9, fontWeight: "700" },
  toggleBtn:   { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4, alignItems: "center" },

  /* tree stats */
  treeStatRow:  { flexDirection: "row", gap: 8, marginBottom: 10 },
  treeStatChip: {
    flex: 1, backgroundColor: CARD, borderRadius: 10, borderWidth: 1,
    padding: 8, alignItems: "center", gap: 2,
  },
  treeStatVal:   { fontSize: 14, fontWeight: "900" },
  treeStatLabel: { fontSize: 9, color: TEXT_SOFT, fontWeight: "600" },

  /* states */
  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerText: { color: TEXT_MID, fontSize: 14 },
  errorText:  { color: RED, fontSize: 14, textAlign: "center", fontWeight: "500" },
  retryBtn:   { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryText:  { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: TEXT_DARK },

  /* see all button */
  seeAllBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 8, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: TEAL + "50",
    backgroundColor: TEAL + "10",
  },
  seeAllText: { fontSize: 13, fontWeight: "700", color: TEAL },
});
