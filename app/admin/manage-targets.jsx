import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { money, moneyShort } from "../../components/shared/dashboard/DashboardKit";
import api from "../../services/axios";

const TEAL = "#14b8a6";
const TEAL_DARK = "#0f766e";
const BG = "#f1f5f9";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const BORDER = "#e2e8f0";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-03" → "March 2026" */
const monthLabel = (value) => {
  const [y, m] = String(value).split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

/* Podium colours for the top three sellers */
const MEDALS = ["#f59e0b", "#94a3b8", "#b45309"];

export default function ManageTargets() {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [targets, setTargets] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [monthPicker, setMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const [search, setSearch] = useState("");

  /* Create-target form */
  const [formOpen, setFormOpen] = useState(false);
  const [rank, setRank] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [reward, setReward] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ================= FETCH ================= */

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const res = await api.get("/target-offers/progress", {
        params: { month: selectedMonth },
      });

      if (res.data?.success) {
        setTargets(res.data.activeTargets || []);
        setProgress(res.data.progressReport || []);
      } else {
        setTargets([]);
        setProgress([]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load target data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  /* ================= DERIVED ================= */

  /* Leaderboard: highest seller first — the ordering an admin actually reads */
  const ranked = useMemo(
    () => [...progress].sort((a, b) => b.totalSales - a.totalSales),
    [progress]
  );

  /* Sales rank per agent, so a filtered list still shows true standings */
  const placeOf = useMemo(() => {
    const map = new Map();
    ranked.forEach((a, i) => map.set(String(a.agentId), i));
    return map;
  }, [ranked]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ranked;
    return ranked.filter(
      (a) =>
        (a.agentName || "").toLowerCase().includes(term) ||
        String(a.agentPhone || "").includes(term)
    );
  }, [ranked, search]);

  const stats = useMemo(() => {
    const totalSales = progress.reduce((s, a) => s + (a.totalSales || 0), 0);
    const achieved = progress.filter(
      (a) => a.achievedTarget && a.achievedTarget !== "None"
    ).length;

    return { agents: progress.length, totalSales, achieved, targets: targets.length };
  }, [progress, targets]);

  /* How many agents have cleared each target — the number that tells an admin
     whether a target was pitched at the right level */
  const achieversFor = (amount) =>
    progress.filter((a) => (a.totalSales || 0) >= amount).length;

  /* ================= ACTIONS ================= */

  const handleCreateTarget = async () => {
    if (!rank || !targetAmount || !reward.trim()) {
      return Toast.show({ type: "error", text1: "Please fill all fields" });
    }

    if (targets.some((t) => t.rank === Number(rank))) {
      return Toast.show({
        type: "error",
        text1: `Rank ${rank} already exists`,
        text2: "Pick a different rank for this month",
      });
    }

    try {
      setSubmitting(true);

      const res = await api.post("/target-offers", {
        rank: Number(rank),
        targetSalesAmount: Number(targetAmount),
        rewardDescription: reward.trim(),
        targetMonth: selectedMonth,
      });

      if (res.data?.success) {
        Toast.show({ type: "success", text1: "Target created" });
        setFormOpen(false);
        setRank("");
        setTargetAmount("");
        setReward("");
        fetchData();
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Failed to create target",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (target) => {
    Alert.alert(
      "Delete target",
      `Remove target #${target.rank} (${money(target.targetSalesAmount)} → ${target.rewardDescription})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/target-offers/${target._id}`);
              Toast.show({ type: "success", text1: "Target deleted" });
              fetchData();
            } catch (err) {
              Toast.show({
                type: "error",
                text1: err?.response?.data?.message || "Failed to delete",
              });
            }
          },
        },
      ]
    );
  };

  const callAgent = (agent) => {
    if (!agent.agentPhone || agent.agentPhone === "Unknown") {
      return Toast.show({ type: "error", text1: "No phone number on record" });
    }
    Linking.openURL(`tel:${agent.agentPhone}`).catch(() =>
      Toast.show({ type: "error", text1: "Could not open the dialer" })
    );
  };

  /* ================= HEADER ================= */

  const listHeader = (
    <View>
      {/* MONTH + SUMMARY */}
      <TouchableOpacity
        style={styles.monthBtn}
        activeOpacity={0.85}
        onPress={() => {
          setPickerYear(Number(selectedMonth.split("-")[0]));
          setMonthPicker(true);
        }}
      >
        <Ionicons name="calendar-outline" size={16} color={TEAL_DARK} />
        <Text style={styles.monthTxt}>{monthLabel(selectedMonth)}</Text>
        <Ionicons name="chevron-down" size={15} color={TEXT_S} />
      </TouchableOpacity>

      <View style={styles.statRow}>
        <Stat label="RM Members" value={stats.agents} />
        <Stat label="Sales" value={moneyShort(stats.totalSales)} tone={TEAL_DARK} />
        <Stat label="Targets" value={stats.targets} />
        <Stat label="Achieved" value={stats.achieved} tone="#15803d" />
      </View>

      {/* ACTIVE TARGETS */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Targets for this month</Text>
        <TouchableOpacity onPress={() => setFormOpen(true)} hitSlop={8}>
          <Text style={styles.sectionLink}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {targets.length === 0 ? (
        <TouchableOpacity style={styles.noTargets} onPress={() => setFormOpen(true)}>
          <Ionicons name="trophy-outline" size={26} color={TEXT_S} />
          <Text style={styles.noTargetsTxt}>No targets set for this month</Text>
          <Text style={styles.noTargetsLink}>Create the first target →</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.targetRow}
        >
          {targets.map((t) => {
            const hit = achieversFor(t.targetSalesAmount);
            return (
              <View key={t._id} style={styles.targetCard}>
                <View style={styles.targetTop}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeTxt}>#{t.rank}</Text>
                  </View>

                  <TouchableOpacity onPress={() => confirmDelete(t)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={15} color="#cbd5e1" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.targetAmount}>{money(t.targetSalesAmount)}</Text>
                <Text style={styles.targetReward} numberOfLines={2}>
                  {t.rewardDescription}
                </Text>

                <View style={styles.targetFoot}>
                  <Ionicons
                    name={hit > 0 ? "checkmark-circle" : "ellipse-outline"}
                    size={12}
                    color={hit > 0 ? "#15803d" : TEXT_S}
                  />
                  <Text style={[styles.targetHit, hit > 0 && { color: "#15803d" }]}>
                    {hit} achieved
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* LEADERBOARD HEAD */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>RM Member leaderboard</Text>
        <Text style={styles.sectionCount}>
          {search.trim() ? `${visible.length} of ${ranked.length}` : `${ranked.length}`}
        </Text>
      </View>

      {ranked.length > 0 && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={TEXT_S} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search RM Member or phone"
            placeholderTextColor={TEXT_S}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={TEXT_S} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const busy = loading && !refreshing;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={TEXT_D} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>RM Member Targets</Text>
          <Text style={styles.headerSub}>Monthly sales goals & rewards</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setFormOpen(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={busy || error ? [] : visible}
        keyExtractor={(item) => String(item.agentId)}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <AgentRow
            agent={item}
            /* Medals follow sales rank, not the filtered position */
            place={placeOf.get(String(item.agentId)) ?? 0}
            onCall={() => callAgent(item)}
          />
        )}
        ListEmptyComponent={
          busy ? (
            <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={40} color={TEXT_S} />
              <Text style={styles.emptyTxt}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
                <Text style={styles.retryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyTxt}>
                {search.trim()
                  ? "No RM Member matches your search"
                  : "No RM Member sales recorded this month"}
              </Text>
            </View>
          )
        }
      />

      {/* ===== MONTH PICKER ===== */}
      <Modal visible={monthPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.pickerHead}>
              <TouchableOpacity onPress={() => setPickerYear(pickerYear - 1)} hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color={TEXT_D} />
              </TouchableOpacity>
              <Text style={styles.pickerYear}>{pickerYear}</Text>
              <TouchableOpacity onPress={() => setPickerYear(pickerYear + 1)} hitSlop={8}>
                <Ionicons name="chevron-forward" size={22} color={TEXT_D} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthGrid}>
              {MONTHS.map((name, i) => {
                const value = `${pickerYear}-${String(i + 1).padStart(2, "0")}`;
                const active = selectedMonth === value;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[styles.monthCell, active && styles.monthCellActive]}
                    onPress={() => {
                      setSelectedMonth(value);
                      setMonthPicker(false);
                    }}
                  >
                    <Text style={[styles.monthCellTxt, active && { color: "#fff" }]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setMonthPicker(false)}
            >
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== CREATE TARGET ===== */}
      <Modal visible={formOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.formHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formTitle}>New target</Text>
                <Text style={styles.formSub}>{monthLabel(selectedMonth)}</Text>
              </View>
              <TouchableOpacity onPress={() => setFormOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={TEXT_M} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Rank</Text>
            <TextInput
              style={styles.input}
              placeholder="1 = lowest tier"
              placeholderTextColor={TEXT_S}
              value={rank}
              onChangeText={(v) => setRank(v.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Sales target (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50000"
              placeholderTextColor={TEXT_S}
              value={targetAmount}
              onChangeText={(v) => setTargetAmount(v.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
            />
            {targetAmount ? (
              <Text style={styles.inputHint}>{money(targetAmount)}</Text>
            ) : null}

            <Text style={styles.label}>Reward</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Refrigerator"
              placeholderTextColor={TEXT_S}
              value={reward}
              onChangeText={setReward}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleCreateTarget}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitTxt}>Create target</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

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

function AgentRow({ agent, place, onCall }) {
  const achieved = agent.achievedTarget && agent.achievedTarget !== "None";

  // No next target means every tier is cleared
  const percent = agent.nextTargetAmount
    ? Math.min((agent.totalSales / agent.nextTargetAmount) * 100, 100)
    : 100;

  const remaining = agent.nextTargetAmount
    ? Math.max(agent.nextTargetAmount - agent.totalSales, 0)
    : 0;

  return (
    <View style={styles.agentCard}>
      <View style={styles.agentTop}>
        <View
          style={[
            styles.place,
            place < 3 && { backgroundColor: MEDALS[place] + "22" },
          ]}
        >
          <Text
            style={[styles.placeTxt, place < 3 && { color: MEDALS[place] }]}
          >
            {place + 1}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.agentName} numberOfLines={1}>
            {agent.agentName}
          </Text>
          <Text style={styles.agentPhone}>{agent.agentPhone}</Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.agentSales}>{money(agent.totalSales)}</Text>
          <TouchableOpacity style={styles.callBtn} onPress={onCall}>
            <Ionicons name="call" size={11} color="#fff" />
            <Text style={styles.callTxt}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            { backgroundColor: achieved ? "#dcfce7" : "#f1f5f9" },
          ]}
        >
          <Ionicons
            name={achieved ? "trophy" : "trophy-outline"}
            size={11}
            color={achieved ? "#15803d" : TEXT_S}
          />
          <Text
            style={[styles.badgeTxt, { color: achieved ? "#15803d" : TEXT_S }]}
            numberOfLines={1}
          >
            {achieved ? agent.achievedTarget : "No target hit yet"}
          </Text>
        </View>
      </View>

      {agent.nextTargetAmount ? (
        <View style={{ marginTop: 10 }}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressNext} numberOfLines={1}>
              Next: {agent.nextTargetReward}
            </Text>
            <Text style={styles.progressPct}>{Math.round(percent)}%</Text>
          </View>

          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${percent}%` }]} />
          </View>

          <Text style={styles.progressGap}>
            {money(remaining)} more to reach {money(agent.nextTargetAmount)}
          </Text>
        </View>
      ) : (
        <View style={styles.allDone}>
          <Ionicons name="ribbon" size={13} color="#15803d" />
          <Text style={styles.allDoneTxt}>All targets cleared</Text>
        </View>
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: TEXT_D },
  headerSub: { fontSize: 11, color: TEXT_S, marginTop: 1 },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: { padding: 16, paddingBottom: 40 },

  monthBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  monthTxt: { fontSize: 13, fontWeight: "800", color: TEXT_D },

  statRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  stat: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 11,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  statValue: { fontSize: 16, fontWeight: "900" },
  statLabel: { fontSize: 10, color: TEXT_S, fontWeight: "700", marginTop: 3 },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: TEXT_D },
  sectionLink: { fontSize: 12, fontWeight: "800", color: TEAL },
  sectionCount: { fontSize: 11, fontWeight: "700", color: TEXT_S },

  targetRow: { gap: 10, paddingRight: 4 },
  targetCard: {
    width: 150,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  targetTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rankBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rankBadgeTxt: { fontSize: 10, fontWeight: "900", color: "#0369a1" },
  targetAmount: { fontSize: 17, fontWeight: "900", color: TEXT_D },
  targetReward: { fontSize: 12, color: TEXT_M, marginTop: 3, fontWeight: "600" },
  targetFoot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  targetHit: { fontSize: 10.5, fontWeight: "700", color: TEXT_S },

  noTargets: {
    alignItems: "center",
    gap: 6,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    paddingVertical: 24,
  },
  noTargetsTxt: { fontSize: 13, fontWeight: "700", color: TEXT_M },
  noTargetsLink: { fontSize: 12, fontWeight: "700", color: TEAL },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: TEXT_D, padding: 0 },

  agentCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
  },
  agentTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  place: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  placeTxt: { fontSize: 12, fontWeight: "900", color: TEXT_M },
  agentName: { fontSize: 14, fontWeight: "800", color: TEXT_D },
  agentPhone: { fontSize: 11, color: TEXT_S, marginTop: 1 },
  agentSales: { fontSize: 15, fontWeight: "900", color: TEAL_DARK },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: TEAL,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    marginTop: 5,
  },
  callTxt: { color: "#fff", fontSize: 10, fontWeight: "800" },

  badgeRow: { flexDirection: "row", marginTop: 10 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    maxWidth: "100%",
  },
  badgeTxt: { fontSize: 11, fontWeight: "700", flexShrink: 1 },

  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 5,
  },
  progressNext: { fontSize: 11, color: TEXT_M, fontWeight: "600", flexShrink: 1 },
  progressPct: { fontSize: 11, color: TEXT_D, fontWeight: "800" },
  barBg: { height: 7, backgroundColor: "#e2e8f0", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: TEAL, borderRadius: 4 },
  progressGap: { fontSize: 10.5, color: TEXT_S, marginTop: 5, fontWeight: "600" },

  allDone: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  allDoneTxt: { fontSize: 11.5, fontWeight: "800", color: "#15803d" },

  empty: { alignItems: "center", gap: 10, paddingVertical: 44 },
  emptyTxt: { fontSize: 13, color: TEXT_S, textAlign: "center" },
  retryBtn: {
    backgroundColor: TEAL,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 20,
  },

  pickerHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pickerYear: { fontSize: 17, fontWeight: "900", color: TEXT_D },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  monthCell: {
    width: "22%",
    flexGrow: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: BORDER,
  },
  monthCellActive: { backgroundColor: TEAL, borderColor: TEAL },
  monthCellTxt: { fontSize: 13, fontWeight: "700", color: TEXT_M },
  cancelBtn: { marginTop: 14, paddingVertical: 10, alignItems: "center" },
  cancelTxt: { fontSize: 14, fontWeight: "800", color: TEXT_M },

  formHead: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  formTitle: { fontSize: 17, fontWeight: "900", color: TEXT_D },
  formSub: { fontSize: 12, color: TEXT_S, marginTop: 2 },
  label: { fontSize: 12, fontWeight: "700", color: TEXT_M, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: TEXT_D,
    marginBottom: 12,
  },
  inputHint: {
    fontSize: 11,
    fontWeight: "700",
    color: TEAL_DARK,
    marginTop: -8,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: TEAL_DARK,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  submitTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
