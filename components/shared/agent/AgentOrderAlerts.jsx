import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import api from "../../../services/axios";

const TEAL = "#14b8a6";
const BG = "#f1f5f9";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const BORDER = "#e2e8f0";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

const LEVELS = {
  NO_ORDERS: { label: "NO ORDERS", bg: "#fee2e2", color: "#b91c1c", icon: "alert-circle" },
  LOW: { label: "LOW", bg: "#fef3c7", color: "#b45309", icon: "trending-down" },
  ACTIVE: { label: "ACTIVE", bg: "#dcfce7", color: "#15803d", icon: "checkmark-circle" },
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "NO_ORDERS", label: "No orders" },
  { key: "LOW", label: "Low" },
  { key: "ACTIVE", label: "Active" },
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/**
 * Agent order alerts — who ordered how much in the period, with the
 * under-ordering agents surfaced first and a one-tap call button.
 *
 * The API scopes the list by role: admin sees every agent, a marketing agent
 * sees only the agents assigned to them.
 *
 * Both call sites render this under a native stack header, so the screen adds
 * no top inset or title of its own — that produced a triple-stacked header.
 */
export default function AgentOrderAlerts() {
  const [range, setRange] = useState("month");
  const [filter, setFilter] = useState("ALL");
  const [threshold, setThreshold] = useState(5000);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [thresholdDraft, setThresholdDraft] = useState("5000");

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const res = await api.get("/medicine/order/stats/agent-alerts", {
          params: { range, lowThreshold: threshold },
        });

        setData(res.data);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load agent alerts");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range, threshold]
  );

  useEffect(() => {
    load();
  }, [load]);

  const agents = useMemo(() => {
    const all = data?.agents || [];
    return filter === "ALL" ? all : all.filter((a) => a.alertLevel === filter);
  }, [data, filter]);

  const call = (agent) => {
    if (!agent.phone) {
      return Toast.show({
        type: "error",
        text1: "No phone number",
        text2: `${agent.name} has no number on record`,
      });
    }

    Alert.alert("Call agent", `Call ${agent.name} at ${agent.phone}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call",
        onPress: () =>
          Linking.openURL(`tel:${agent.phone}`).catch(() =>
            Toast.show({ type: "error", text1: "Could not open the dialer" })
          ),
      },
    ]);
  };

  const applyThreshold = () => {
    const next = Number(thresholdDraft);

    if (Number.isNaN(next) || next < 0) {
      return Toast.show({ type: "error", text1: "Enter a valid amount" });
    }

    setThreshold(next);
    setThresholdOpen(false);
  };

  const summary = data?.summary;
  const busy = loading && !refreshing;

  /* Filters scroll away with the list instead of being pinned above it, so the
     whole page moves as one on small screens. */
  const listHeader = (
    <View style={styles.listHeader}>
      <Text style={styles.subtitle}>
        {data?.scope === "all" ? "All agents" : "Agents you registered"}
      </Text>

      {/* ===== RANGE ===== */}
      <View style={styles.chipRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.chip, range === r.key && styles.chipActive]}
            onPress={() => setRange(r.key)}
          >
            <Text style={[styles.chipTxt, range === r.key && styles.chipTxtActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ===== SUMMARY ===== */}
      {summary && (
        <View style={styles.summaryRow}>
          <Stat label="Agents" value={summary.totalAgents} />
          <Stat label="No orders" value={summary.noOrderAgents} tone="#b91c1c" />
          <Stat label="Low" value={summary.lowAgents} tone="#b45309" />
          <Stat label="Value" value={money(summary.totalOrderValue)} tone={TEAL} />
        </View>
      )}

      {/* ===== FILTER + THRESHOLD ===== */}
      <View style={styles.filterRow}>
        <View style={styles.filterChips}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[styles.filterTxt, filter === f.key && styles.filterTxtActive]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.thresholdBtn}
          onPress={() => {
            setThresholdDraft(String(threshold));
            setThresholdOpen(true);
          }}
        >
          <Ionicons name="options-outline" size={13} color={TEXT_M} />
          <Text style={styles.thresholdTxt}>Low &lt; {money(threshold)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.safe}>
      {/* ===== LIST ===== */}
      <FlatList
        data={busy || error ? [] : agents}
        keyExtractor={(item) => String(item.userId)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={listHeader}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
        ListEmptyComponent={
          busy ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={TEAL} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Ionicons name="cloud-offline-outline" size={44} color={TEXT_S} />
              <Text style={styles.emptyTxt}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
                <Text style={styles.retryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="people-outline" size={44} color={TEXT_S} />
              <Text style={styles.emptyTxt}>
                {filter === "ALL"
                  ? "No agents in your network yet"
                  : "No agents match this filter"}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <AgentCard agent={item} onCall={call} />}
      />

      {/* ===== THRESHOLD MODAL ===== */}
      <Modal visible={thresholdOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Low-order threshold</Text>
            <Text style={styles.modalHint}>
              Agents ordering below this amount in the selected period are flagged LOW.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={thresholdDraft}
              onChangeText={(t) => setThresholdDraft(t.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
              placeholder="5000"
              placeholderTextColor={TEXT_S}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setThresholdOpen(false)}
              >
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={applyThreshold}>
                <Text style={styles.modalApplyTxt}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ label, value, tone = TEXT_D }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: tone }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AgentCard({ agent, onCall }) {
  const level = LEVELS[agent.alertLevel] || LEVELS.ACTIVE;

  return (
    <View style={[styles.card, { borderLeftColor: level.color }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.agentName} numberOfLines={1}>
            {agent.name}
          </Text>
          {!!agent.phone && <Text style={styles.agentPhone}>{agent.phone}</Text>}
        </View>

        <View style={[styles.badge, { backgroundColor: level.bg }]}>
          <Ionicons name={level.icon} size={11} color={level.color} />
          <Text style={[styles.badgeTxt, { color: level.color }]}>{level.label}</Text>
        </View>
      </View>

      {!!agent.address && (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={13} color={TEXT_S} />
          <Text style={styles.addressTxt} numberOfLines={2}>
            {agent.address}
          </Text>
        </View>
      )}

      <View style={styles.metricsRow}>
        <View>
          <Text style={styles.metricValue}>{money(agent.totalOrderValue)}</Text>
          <Text style={styles.metricLabel}>Order value</Text>
        </View>

        <View>
          <Text style={styles.metricValue}>{agent.orderCount}</Text>
          <Text style={styles.metricLabel}>Orders</Text>
        </View>

        <View>
          <Text style={styles.metricValue}>
            {agent.lastOrderAt
              ? new Date(agent.lastOrderAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })
              : "—"}
          </Text>
          <Text style={styles.metricLabel}>Last order</Text>
        </View>

        <TouchableOpacity
          style={[styles.callBtn, !agent.phone && styles.callBtnOff]}
          onPress={() => onCall(agent)}
        >
          <Ionicons name="call" size={15} color="#fff" />
          <Text style={styles.callTxt}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 10 },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  /* Cancels the list's horizontal padding so chips/stats keep their own edges */
  listHeader: { marginHorizontal: -16, marginBottom: 6 },
  subtitle: { fontSize: 12, color: TEXT_M, paddingHorizontal: 16, marginBottom: 10 },

  chipRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  chipActive: { backgroundColor: TEAL },
  chipTxt: { fontSize: 12, fontWeight: "700", color: TEXT_M },
  chipTxtActive: { color: "#fff" },

  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statValue: { fontSize: 15, fontWeight: "900" },
  statLabel: { fontSize: 10, color: TEXT_S, marginTop: 2, fontWeight: "600" },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 8,
  },
  filterChips: { flexDirection: "row", gap: 6, flexShrink: 1 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  filterChipActive: { backgroundColor: TEXT_D, borderColor: TEXT_D },
  filterTxt: { fontSize: 11, fontWeight: "700", color: TEXT_M },
  filterTxtActive: { color: "#fff" },

  thresholdBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  thresholdTxt: { fontSize: 11, fontWeight: "700", color: TEXT_M },

  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    padding: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  agentName: { fontSize: 15, fontWeight: "800", color: TEXT_D },
  agentPhone: { fontSize: 12, color: TEXT_M, marginTop: 2 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTxt: { fontSize: 9, fontWeight: "900", letterSpacing: 0.3 },

  addressRow: { flexDirection: "row", gap: 5, marginTop: 8, alignItems: "flex-start" },
  addressTxt: { flex: 1, fontSize: 11, color: TEXT_S, lineHeight: 15 },

  metricsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  metricValue: { fontSize: 14, fontWeight: "800", color: TEXT_D },
  metricLabel: { fontSize: 10, color: TEXT_S, marginTop: 2, fontWeight: "600" },

  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: TEAL,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  callBtnOff: { backgroundColor: "#cbd5e1" },
  callTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },

  emptyTxt: { fontSize: 13, color: TEXT_M, textAlign: "center" },
  retryBtn: {
    marginTop: 6,
    backgroundColor: TEAL,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: TEXT_D },
  modalHint: { fontSize: 12, color: TEXT_M, marginTop: 6, lineHeight: 17 },
  modalInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_D,
    marginTop: 14,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtn: {
    flex: 1,
    backgroundColor: TEAL,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancel: { backgroundColor: "#e2e8f0" },
  modalCancelTxt: { fontSize: 13, fontWeight: "800", color: TEXT_M },
  modalApplyTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },
});
