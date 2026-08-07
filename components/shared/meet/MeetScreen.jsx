import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import {
  OUTCOMES,
  RADIUS_OPTIONS,
  RANGE_TABS,
  STATUS_TABS,
  addressLine,
  landmarkLine,
  currentPosition,
  describePosition,
  fetchMarketingExecutives,
  fetchPlan,
  fetchRoutes,
  markVisit,
  prettyDate,
  prettyDistance,
  sinceLabel,
  undoVisit,
} from "./meetApi";

/* ================= BRAND ================= */

const PRIMARY = "#14b8a6";
const PRIMARY_DARK = "#0f766e";
const BG = "#f1f5f9";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const BORDER = "#e2e8f0";
const GREEN = "#15803d";
const AMBER = "#b45309";

const PAGE_SIZE = 20;

/* Every filter control shares these so the bar lines up as one block */
const CONTROL_H = 42;
const CONTROL_R = 12;

/* The cadence the executive is working through becomes the meet's visitType,
   so a monthly sweep and a daily call round stay distinguishable in reports. */
const VISIT_TYPE = {
  day: "DAILY",
  week: "WEEKLY",
  month: "MONTHLY",
  custom: "CUSTOM",
};

/* ================= MAIN ================= */

/**
 * The meet plan shared by the admin and marketing-executive dashboards.
 *
 * @param {"admin"|"marketing_agent"} role  which dashboard is hosting it —
 *        decides the track route and whether the executive filter is shown.
 */
export default function MeetScreen({ role = "marketing_agent" }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAdmin = role === "admin";
  const trackBase = isAdmin ? "/admin/meet" : "/marketing_agent/meet";

  const alive = useRef(true);
  const requestId = useRef(0);

  /* ===== FILTERS ===== */
  const [range, setRange] = useState("day");
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d;
  });
  const [customTo, setCustomTo] = useState(new Date());

  const [tab, setTab] = useState("pending");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [route, setRoute] = useState(null); // { latitude, longitude, radiusKm, label }
  const [execId, setExecId] = useState("all");

  /* ===== DATA ===== */
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  /* ===== MODALS ===== */
  const [customOpen, setCustomOpen] = useState(false);
  const [picker, setPicker] = useState(null); // "from" | "to"
  const [draftFrom, setDraftFrom] = useState(customFrom);
  const [draftTo, setDraftTo] = useState(customTo);

  const [routeOpen, setRouteOpen] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);

  const [execOpen, setExecOpen] = useState(false);
  const [execs, setExecs] = useState([]);

  const [mark, setMark] = useState(null); // { member, status, outcome, notes }
  const [submitting, setSubmitting] = useState(false);

  /* ================= DEBOUNCED SEARCH ================= */

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ================= LOAD ================= */

  const filters = useMemo(
    () => ({
      range,
      customFrom,
      customTo,
      status: tab,
      search,
      route,
      marketingAgentId: isAdmin ? execId : undefined,
    }),
    [range, customFrom, customTo, tab, search, route, execId, isAdmin]
  );

  const load = useCallback(
    async (nextPage = 1) => {
      // Filters can change while a slower request is still in flight; only the
      // newest request is allowed to write to state.
      const ticket = ++requestId.current;

      try {
        const data = await fetchPlan({ ...filters, page: nextPage, limit: PAGE_SIZE });

        if (!alive.current || ticket !== requestId.current) return;

        setSummary(data.summary);
        setPeriod(data.period);
        setItems((prev) =>
          nextPage === 1 ? data.members : [...prev, ...data.members]
        );
        setPage(nextPage);
        setHasMore(nextPage < (data.pagination?.totalPages || 1));
      } catch (err) {
        if (!alive.current || ticket !== requestId.current) return;

        Toast.show({
          type: "error",
          text1: "Could not load the meet plan",
          text2: err?.response?.data?.message || "Please try again.",
        });
      }
    },
    [filters]
  );

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    load(1).finally(() => alive.current && setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1);
    if (alive.current) setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    await load(page + 1);
    if (alive.current) setLoadingMore(false);
  };

  /* ================= ROUTE (LOCATION) MODE ================= */

  const openRoutes = async () => {
    setRouteOpen(true);
    setRoutesLoading(true);

    try {
      const data = await fetchRoutes({
        range,
        customFrom,
        customTo,
        marketingAgentId: isAdmin ? execId : undefined,
      });
      if (alive.current) setRoutes(data?.routes || []);
    } catch {
      if (alive.current) setRoutes([]);
    } finally {
      if (alive.current) setRoutesLoading(false);
    }
  };

  const useMyLocation = async () => {
    const pos = await currentPosition();

    if (!pos) {
      Toast.show({
        type: "error",
        text1: "Location unavailable",
        text2: "Allow location access to plan a route around you.",
      });
      return;
    }

    setRoute({ ...pos, radiusKm, label: "Around me" });
    setRouteOpen(false);
  };

  const pickRoute = (r) => {
    if (r.latitude == null || r.longitude == null) {
      // Cluster has no coordinates on file — fall back to a text search
      setSearchInput(r.pincode || r.city || "");
      setRoute(null);
      setRouteOpen(false);
      return;
    }

    setRoute({
      latitude: r.latitude,
      longitude: r.longitude,
      radiusKm,
      label: [r.city, r.pincode].filter(Boolean).join(" • "),
    });
    setRouteOpen(false);
  };

  /* ================= MARK A MEET ================= */

  const openMark = (member, status) =>
    setMark({
      member,
      status,
      outcome: OUTCOMES[status][0].key,
      notes: "",
    });

  const submitMark = async () => {
    if (!mark) return;

    setSubmitting(true);

    try {
      const pos = await currentPosition();
      const address = pos ? await describePosition(pos) : null;

      await markVisit(mark.member.agentProfileId, {
        status: mark.status,
        outcome: mark.outcome,
        notes: mark.notes || null,
        visitType: VISIT_TYPE[range] || "CUSTOM",
        ...(pos ? { latitude: pos.latitude, longitude: pos.longitude } : {}),
        ...(address ? { address } : {}),
      });

      if (!alive.current) return;

      applyLocalMark(mark.member.agentProfileId, mark.status);

      Toast.show({
        type: "success",
        text1:
          mark.status === "COMPLETED" ? "Meet completed" : "Marked incomplete",
        text2:
          mark.status === "COMPLETED"
            ? `${mark.member.name} is done for this period.`
            : `${mark.member.name} stays on the pending list.`,
      });

      setMark(null);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Could not save the meet",
        text2: err?.response?.data?.message || "Please try again.",
      });
    } finally {
      if (alive.current) setSubmitting(false);
    }
  };

  /* Keeps the list and the tab badges in step without a full refetch, so the
     executive does not lose their place after every tick. */
  const applyLocalMark = (agentProfileId, status) => {
    const completed = status === "COMPLETED";

    setItems((prev) => {
      const next = prev.map((m) =>
        m.agentProfileId === agentProfileId
          ? {
              ...m,
              visitStatus: completed ? "COMPLETED" : m.visitStatus,
              attemptCount: (m.attemptCount || 0) + 1,
              completedCount: (m.completedCount || 0) + (completed ? 1 : 0),
              lastVisitedAt: completed ? new Date().toISOString() : m.lastVisitedAt,
            }
          : m
      );

      // The row no longer belongs on the tab being viewed
      if (completed && tab === "pending") {
        return next.filter((m) => m.agentProfileId !== agentProfileId);
      }
      return next;
    });

    if (completed) {
      setSummary((s) =>
        s
          ? {
              ...s,
              pending: Math.max(0, s.pending - 1),
              completed: s.completed + 1,
              completionRate: s.total
                ? Math.round(((s.completed + 1) / s.total) * 100)
                : 0,
            }
          : s
      );
    }
  };

  const undo = async (member) => {
    const visitId = member.lastCompleted?._id;

    if (!visitId) {
      Toast.show({ type: "error", text1: "Nothing to undo for this period" });
      return;
    }

    try {
      await undoVisit(visitId);
      Toast.show({ type: "success", text1: "Meet reverted to pending" });
      await load(1);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Could not undo",
        text2: err?.response?.data?.message || "Please try again.",
      });
    }
  };

  /* ================= CUSTOM RANGE ================= */

  const openCustom = () => {
    setDraftFrom(customFrom);
    setDraftTo(customTo);
    setCustomOpen(true);
  };

  const onPickDate = (_event, selected) => {
    const which = picker;
    setPicker(null);

    if (!selected || !which) return;
    if (which === "from") setDraftFrom(selected);
    else setDraftTo(selected);
  };

  const applyCustom = () => {
    if (draftTo < draftFrom) {
      Toast.show({ type: "error", text1: "The end date cannot be before the start date" });
      return;
    }

    setCustomFrom(draftFrom);
    setCustomTo(draftTo);
    setRange("custom");
    setCustomOpen(false);
  };

  /* ================= EXECUTIVE FILTER (ADMIN) ================= */

  const openExecs = async () => {
    setExecOpen(true);

    if (execs.length) return;

    try {
      const list = await fetchMarketingExecutives();
      if (alive.current) setExecs(list);
    } catch {
      if (alive.current) setExecs([]);
    }
  };

  const execLabel =
    execId === "all"
      ? "All executives"
      : execs.find((e) => String(e._id) === String(execId))?.name || "Executive";

  /* The API label is ISO ("2026-08-01 → 2026-08-31"); the header reads better
     with the dates spelled out, and "Today" needs no range at all. */
  const periodLabel = (() => {
    if (!period) return "Loading period…";
    if (period.range === "day") return `Today • ${prettyDate(period.from)}`;

    // `to` is exclusive — step back a day so the label reads inclusively
    const lastDay = new Date(new Date(period.to).getTime() - 1);
    return `${prettyDate(period.from)} – ${prettyDate(lastDay)}`;
  })();

  /* ================= RENDER ================= */

  const call = (phone) => phone && Linking.openURL(`tel:${phone}`);

  const track = (member) =>
    router.push({
      pathname: `${trackBase}/[agentProfileId]`,
      params: { agentProfileId: String(member.agentProfileId) },
    });

  /* The header and the filters ride inside the list rather than sitting above
     it, so a scroll moves the whole page — the list is not a small window
     under a fixed chrome. Built as an element (not a function) so React keeps
     the search TextInput mounted and focused across re-renders. */
  const listHeader = (
    <>
      {/* ===== HEADER ===== */}
      {/* The screen renders its own header, so the status-bar inset has to be
          paid here rather than by SafeAreaView — otherwise the teal block
          stops short of the top of the screen. */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>RM Member Meet</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {periodLabel}
            </Text>
          </View>

          <TouchableOpacity style={styles.headerBtn} onPress={openRoutes}>
            <Ionicons name="navigate-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <SummaryPill label="Total" value={summary?.total ?? "—"} />
          <SummaryPill label="Pending" value={summary?.pending ?? "—"} tone="#fde68a" />
          <SummaryPill label="Done" value={summary?.completed ?? "—"} tone="#bbf7d0" />
          <SummaryPill
            label="Covered"
            value={summary ? `${summary.completionRate}%` : "—"}
          />
        </View>
      </View>

      {/* ===== FILTERS =====
          Every control in this block is the same height, radius and inset so
          the bar reads as one unit. Both segmented rows size their segments
          with flex, so a long label (a date range, a long executive name)
          can never make one control wider than its neighbours. */}
      <View style={styles.filterBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={TEXT_S} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location, shop, name or phone"
            placeholderTextColor={TEXT_S}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
          {searchInput ? (
            <TouchableOpacity onPress={() => setSearchInput("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={TEXT_S} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Segmented
          items={RANGE_TABS.map((r) => ({ key: r.key, label: r.label }))}
          value={range}
          onChange={(key) => (key === "custom" ? openCustom() : setRange(key))}
        />

        <Segmented
          items={STATUS_TABS.map((t) => ({
            key: t.key,
            label: t.label,
            count:
              t.key === "pending"
                ? summary?.pending
                : t.key === "completed"
                  ? summary?.completed
                  : summary?.total,
          }))}
          value={tab}
          onChange={setTab}
        />

        {isAdmin ? (
          <TouchableOpacity style={styles.selectBox} onPress={openExecs}>
            <Ionicons name="person-circle-outline" size={16} color={TEXT_S} />
            <Text
              style={[
                styles.selectTxt,
                execId !== "all" && { color: PRIMARY_DARK, fontWeight: "800" },
              ]}
              numberOfLines={1}
            >
              {execLabel}
            </Text>
            <Ionicons name="chevron-down" size={15} color={TEXT_S} />
          </TouchableOpacity>
        ) : null}

        {route ? (
          <View style={styles.routeBanner}>
            <Ionicons name="git-branch-outline" size={15} color={PRIMARY_DARK} />
            <Text style={styles.routeTxt} numberOfLines={1}>
              {route.label} • {route.radiusKm} km • nearest first
            </Text>
            <TouchableOpacity onPress={() => setRoute(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={PRIMARY_DARK} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <FlatList
        /* Loading swaps the rows for a spinner in the empty slot, so the
           header and filters stay put instead of the screen going blank */
        data={loading ? [] : items}
        keyExtractor={(m) => String(m.agentProfileId)}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
            progressViewOffset={insets.top}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={PRIMARY} />
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons
                name={tab === "pending" ? "checkmark-done-outline" : "people-outline"}
                size={42}
                color={TEXT_S}
              />
              <Text style={styles.emptyTxt}>
                {tab === "pending"
                  ? "Every RM Member here has been met for this period"
                  : "No RM Members match these filters"}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={PRIMARY} style={{ paddingVertical: 18 }} />
          ) : null
        }
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            onCall={() => call(item.phone)}
            onTrack={() => track(item)}
            onComplete={() => openMark(item, "COMPLETED")}
            onIncomplete={() => openMark(item, "INCOMPLETE")}
            onUndo={() => undo(item)}
          />
        )}
      />

      {/* ===== CUSTOM RANGE MODAL ===== */}
      <Modal visible={customOpen} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Custom period</Text>
            <Text style={styles.sheetHint}>
              Show who was met between two dates.
            </Text>

            <Text style={styles.fieldLabel}>From</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setPicker("from")}>
              <Ionicons name="calendar-outline" size={15} color={PRIMARY} />
              <Text style={styles.dateTxt}>{prettyDate(draftFrom)}</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>To</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setPicker("to")}>
              <Ionicons name="calendar-outline" size={15} color={PRIMARY} />
              <Text style={styles.dateTxt}>{prettyDate(draftTo)}</Text>
            </TouchableOpacity>

            {picker ? (
              <DateTimePicker
                value={picker === "from" ? draftFrom : draftTo}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onPickDate}
              />
            ) : null}

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetCancel]}
                onPress={() => {
                  setPicker(null);
                  setCustomOpen(false);
                }}
              >
                <Text style={styles.sheetCancelTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sheetBtn} onPress={applyCustom}>
                <Text style={styles.sheetApplyTxt}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== ROUTE PICKER ===== */}
      <Modal visible={routeOpen} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { maxHeight: "80%" }]}>
            <Text style={styles.sheetTitle}>Plan a route</Text>
            <Text style={styles.sheetHint}>
              Pick a location and every RM Member around it is listed
              nearest-first, so one trip covers the whole area.
            </Text>

            <Text style={styles.fieldLabel}>Cover shops within</Text>
            <View style={styles.radiusRow}>
              {RADIUS_OPTIONS.map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[styles.radiusChip, radiusKm === km && styles.chipActive]}
                  onPress={() => setRadiusKm(km)}
                >
                  <Text
                    style={[styles.chipTxt, radiusKm === km && styles.chipTxtActive]}
                  >
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={useMyLocation}>
              <Ionicons name="locate-outline" size={17} color="#fff" />
              <Text style={styles.primaryBtnTxt}>Start from my location</Text>
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
              Or pick an area
            </Text>

            {routesLoading ? (
              <ActivityIndicator color={PRIMARY} style={{ paddingVertical: 20 }} />
            ) : routes.length === 0 ? (
              <Text style={styles.sheetHint}>No areas found for this period.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 260 }}>
                {routes.map((r, i) => (
                  <TouchableOpacity
                    key={`${r.city}-${r.pincode}-${i}`}
                    style={styles.routeRow}
                    onPress={() => pickRoute(r)}
                  >
                    <View style={styles.routeIcon}>
                      <Ionicons name="location-outline" size={16} color={PRIMARY_DARK} />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.routeName} numberOfLines={1}>
                        {r.city || "Unknown area"}
                      </Text>
                      <Text style={styles.routeMeta} numberOfLines={1}>
                        {[r.pincode, `${r.total} RM Members`]
                          .filter(Boolean)
                          .join(" • ")}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.pendingBadge,
                        r.pending === 0 && { backgroundColor: "#dcfce7" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pendingBadgeTxt,
                          r.pending === 0 && { color: GREEN },
                        ]}
                      >
                        {r.pending === 0 ? "Done" : `${r.pending} left`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.sheetBtn, styles.sheetCancel, { marginTop: 14 }]}
              onPress={() => setRouteOpen(false)}
            >
              <Text style={styles.sheetCancelTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== EXECUTIVE PICKER (ADMIN) ===== */}
      <Modal visible={execOpen} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { maxHeight: "75%" }]}>
            <Text style={styles.sheetTitle}>Marketing executive</Text>

            <ScrollView style={{ maxHeight: 360 }}>
              {[{ _id: "all", name: "All executives" }, ...execs].map((e) => {
                const active = String(execId) === String(e._id);
                return (
                  <TouchableOpacity
                    key={String(e._id)}
                    style={styles.routeRow}
                    onPress={() => {
                      setExecId(String(e._id));
                      setExecOpen(false);
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.routeName} numberOfLines={1}>
                        {e.name || "Unnamed"}
                      </Text>
                      {e.phone ? (
                        <Text style={styles.routeMeta}>{e.phone}</Text>
                      ) : null}
                    </View>

                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={PRIMARY} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.sheetBtn, styles.sheetCancel, { marginTop: 14 }]}
              onPress={() => setExecOpen(false)}
            >
              <Text style={styles.sheetCancelTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== MARK MEET ===== */}
      <Modal visible={!!mark} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {mark?.status === "COMPLETED" ? "Complete meet" : "Mark incomplete"}
            </Text>
            <Text style={styles.sheetHint}>
              {mark?.member?.name}
              {mark?.member?.shopName ? ` • ${mark.member.shopName}` : ""}
            </Text>

            <Text style={styles.fieldLabel}>What happened?</Text>
            <View style={styles.outcomeWrap}>
              {(OUTCOMES[mark?.status || "COMPLETED"] || []).map((o) => {
                const active = mark?.outcome === o.key;
                return (
                  <TouchableOpacity
                    key={o.key}
                    style={[styles.outcomeChip, active && styles.chipActive]}
                    onPress={() => setMark((m) => ({ ...m, outcome: o.key }))}
                  >
                    <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Anything the next visit should know"
              placeholderTextColor={TEXT_S}
              value={mark?.notes || ""}
              onChangeText={(v) => setMark((m) => ({ ...m, notes: v }))}
              multiline
            />

            <View style={styles.gpsHint}>
              <Ionicons name="location-outline" size={14} color={TEXT_M} />
              <Text style={styles.gpsHintTxt}>
                Your GPS position is saved with this meet.
              </Text>
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetCancel]}
                onPress={() => setMark(null)}
                disabled={submitting}
              >
                <Text style={styles.sheetCancelTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetBtn, submitting && { opacity: 0.6 }]}
                onPress={submitMark}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sheetApplyTxt}>
                    {mark?.status === "COMPLETED" ? "Mark complete" : "Save"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= PIECES ================= */

/**
 * Equal-width segmented control. Segments are flex-sized rather than
 * content-sized, so every option stays the same width no matter how long its
 * label is — that is what keeps the range row and the status row aligned.
 */
function Segmented({ items, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {items.map((it) => {
        const active = value === it.key;
        const hasCount = it.count !== undefined && it.count !== null;

        return (
          <TouchableOpacity
            key={it.key}
            style={[styles.segment, active && styles.segmentActive]}
            activeOpacity={0.85}
            onPress={() => onChange(it.key)}
          >
            <Text
              style={[styles.segmentTxt, active && styles.segmentTxtActive]}
              numberOfLines={1}
            >
              {it.label}
            </Text>

            {hasCount ? (
              <View
                style={[styles.segmentCount, active && styles.segmentCountActive]}
              >
                <Text
                  style={[
                    styles.segmentCountTxt,
                    active && styles.segmentCountTxtActive,
                  ]}
                >
                  {it.count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SummaryPill({ label, value, tone }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, tone && { color: tone }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function MemberCard({ member, onCall, onTrack, onComplete, onIncomplete, onUndo }) {
  const done = member.visitStatus === "COMPLETED";
  const distance = prettyDistance(member.distanceInMeters);
  const address = addressLine(member);
  const landmark = landmarkLine(member);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        {member.shopImage || member.avatar ? (
          <Image
            source={{ uri: member.shopImage || member.avatar }}
            style={styles.thumb}
          />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Ionicons name="storefront-outline" size={20} color={TEXT_S} />
          </View>
        )}

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardName} numberOfLines={1}>
            {member.name || "Unnamed RM Member"}
          </Text>

          <Text style={styles.cardShop} numberOfLines={1}>
            {[member.shopName, distance].filter(Boolean).join(" • ") ||
              member.phone}
          </Text>

          {address ? (
            <Text style={styles.cardAddress} numberOfLines={2}>
              {address}
            </Text>
          ) : null}

          {/* The line that actually finds the door — kept out of the address
              so it can never be the part that gets truncated away */}
          {landmark ? (
            <View style={styles.landmarkRow}>
              <Ionicons name="flag" size={11} color={AMBER} />
              <Text style={styles.landmarkTxt} numberOfLines={1}>
                {landmark}
              </Text>
            </View>
          ) : null}

          <Text
            style={[
              styles.cardSince,
              !member.lastVisitedAt && { color: AMBER },
            ]}
          >
            {sinceLabel(member.lastVisitedAt)}
            {member.attemptCount > 0 && !done
              ? ` • ${member.attemptCount} attempt${member.attemptCount === 1 ? "" : "s"} this period`
              : ""}
          </Text>
        </View>

        <View
          style={[styles.statusBadge, done ? styles.badgeDone : styles.badgePending]}
        >
          <Ionicons
            name={done ? "checkmark-circle" : "time-outline"}
            size={12}
            color={done ? GREEN : AMBER}
          />
          <Text style={[styles.statusTxt, { color: done ? GREEN : AMBER }]}>
            {done ? "Done" : "Pending"}
          </Text>
        </View>
      </View>

      {/* Two rows, every button flex:1. Four buttons on one row left Complete
          with whatever pixels the other three did not want — on a narrow
          phone that clipped the label off the primary action. */}
      <View style={styles.cardActions}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.ghostBtn} onPress={onCall}>
            <Ionicons name="call-outline" size={15} color={PRIMARY_DARK} />
            <Text style={styles.ghostBtnTxt}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={onTrack}>
            <Ionicons name="navigate-circle-outline" size={15} color={PRIMARY_DARK} />
            <Text style={styles.ghostBtnTxt}>Track</Text>
          </TouchableOpacity>
        </View>

        {done ? (
          <TouchableOpacity style={styles.undoBtn} onPress={onUndo}>
            <Ionicons name="arrow-undo-outline" size={15} color={TEXT_M} />
            <Text style={styles.undoBtnTxt}>Undo this meet</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.incompleteBtn} onPress={onIncomplete}>
              <Ionicons name="close-circle-outline" size={15} color={AMBER} />
              <Text style={styles.incompleteBtnTxt} numberOfLines={1}>
                Incomplete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tickBtn} onPress={onComplete}>
              <Ionicons name="checkmark-circle" size={17} color="#fff" />
              <Text style={styles.tickBtnTxt} numberOfLines={1}>
                Complete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  /* HEADER */
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "900" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  pill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  pillValue: { color: "#fff", fontSize: 16, fontWeight: "900" },
  pillLabel: { color: "rgba(255,255,255,0.85)", fontSize: 10, marginTop: 2 },

  /* FILTER BAR — one stack, one rhythm: same height, radius and gap */
  filterBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: CONTROL_H,
    backgroundColor: CARD,
    borderRadius: CONTROL_R,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: { flex: 1, paddingVertical: 0, color: TEXT_D, fontSize: 13 },

  /* SEGMENTED CONTROL */
  segmented: {
    flexDirection: "row",
    height: CONTROL_H,
    backgroundColor: CARD,
    borderRadius: CONTROL_R,
    padding: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: CONTROL_R - 4,
    paddingHorizontal: 4,
  },
  segmentActive: { backgroundColor: PRIMARY },
  segmentTxt: { flexShrink: 1, fontSize: 12, fontWeight: "700", color: TEXT_M },
  segmentTxtActive: { color: "#fff", fontWeight: "800" },

  segmentCount: {
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: BG,
    alignItems: "center",
  },
  segmentCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  segmentCountTxt: { fontSize: 10, fontWeight: "800", color: TEXT_M },
  segmentCountTxtActive: { color: "#fff" },

  /* SELECT (admin executive filter) */
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: CONTROL_H,
    backgroundColor: CARD,
    borderRadius: CONTROL_R,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  selectTxt: { flex: 1, fontSize: 12.5, fontWeight: "700", color: TEXT_M },

  /* ROUTE BANNER */
  routeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: CONTROL_H,
    paddingHorizontal: 12,
    borderRadius: CONTROL_R,
    backgroundColor: "#ccfbf1",
  },
  routeTxt: { flex: 1, fontSize: 11.5, fontWeight: "700", color: PRIMARY_DARK },

  /* Pill chips inside the sheets (radius picker, outcome picker) */
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipTxt: { fontSize: 12, fontWeight: "700", color: TEXT_M },
  chipTxtActive: { color: "#fff" },

  /* LIST — no horizontal padding here: the header block must run edge to
     edge, so the cards carry their own inset instead */
  listPad: { paddingBottom: 32, gap: 12 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  emptyTxt: {
    fontSize: 13,
    color: TEXT_M,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  /* CARD */
  card: {
    marginHorizontal: 16,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTop: { flexDirection: "row", gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: BG },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  cardName: { fontSize: 14.5, fontWeight: "800", color: TEXT_D },
  cardShop: { fontSize: 12, color: PRIMARY_DARK, fontWeight: "700", marginTop: 2 },
  cardAddress: { fontSize: 11.5, color: TEXT_M, marginTop: 3, lineHeight: 16 },

  landmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#fffbeb",
  },
  landmarkTxt: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
    color: AMBER,
  },
  cardSince: { fontSize: 11, color: TEXT_S, marginTop: 4, fontWeight: "600" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badgeDone: { backgroundColor: "#dcfce7" },
  badgePending: { backgroundColor: "#fef3c7" },
  statusTxt: { fontSize: 10, fontWeight: "800" },

  cardActions: {
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  actionRow: { flexDirection: "row", gap: 8 },

  ghostBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f0fdfa",
  },
  ghostBtnTxt: { fontSize: 12, fontWeight: "800", color: PRIMARY_DARK },

  incompleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#fffbeb",
  },
  incompleteBtnTxt: { fontSize: 12, fontWeight: "800", color: AMBER },

  tickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: PRIMARY,
  },
  tickBtnTxt: { fontSize: 12.5, fontWeight: "900", color: "#fff" },

  undoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: BG,
  },
  undoBtnTxt: { fontSize: 12, fontWeight: "800", color: TEXT_M },

  /* SHEETS */
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 22,
  },
  sheet: { backgroundColor: CARD, borderRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: TEXT_D },
  sheetHint: { fontSize: 12, color: TEXT_M, marginTop: 6, lineHeight: 17 },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: TEXT_M,
    marginTop: 16,
    marginBottom: 7,
    textTransform: "uppercase",
  },

  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: BG,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dateTxt: { fontSize: 13, fontWeight: "700", color: TEXT_D },

  radiusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  radiusChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: 13,
    borderRadius: 13,
    marginTop: 14,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "900", fontSize: 13 },

  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  routeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f0fdfa",
    alignItems: "center",
    justifyContent: "center",
  },
  routeName: { fontSize: 13.5, fontWeight: "800", color: TEXT_D },
  routeMeta: { fontSize: 11.5, color: TEXT_M, marginTop: 2 },

  pendingBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fef3c7",
  },
  pendingBadgeTxt: { fontSize: 10.5, fontWeight: "800", color: AMBER },

  outcomeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  outcomeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },

  notesInput: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    textAlignVertical: "top",
    color: TEXT_D,
    fontSize: 13,
  },

  gpsHint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  gpsHintTxt: { fontSize: 11, color: TEXT_M },

  sheetActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  sheetBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancel: { backgroundColor: BG },
  sheetCancelTxt: { fontWeight: "800", color: TEXT_M, fontSize: 13 },
  sheetApplyTxt: { fontWeight: "900", color: "#fff", fontSize: 13 },
});
