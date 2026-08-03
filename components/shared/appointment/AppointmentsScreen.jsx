import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PrescriptionAttachment from "./PrescriptionAttachment";
import api from "../../../services/axios";

const TEAL = "#1BA6A6";
const BG = "#F8FAFC";
const CARD = "#FFFFFF";
const TEXT_D = "#0F172A";
const TEXT_M = "#475569";
const TEXT_S = "#94A3B8";
const BORDER = "#E2E8F0";

const LIMIT = 20;

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "custom", label: "Custom" },
];

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const pretty = (d) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Sunday → Saturday of the current week, matching the doctor bookings endpoint */
const thisWeek = () => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - now.getDay());
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  return { from, to };
};

/**
 * Appointments list, shared by staff (admin + receptionist) and doctors.
 *
 * The two endpoints take different filter params:
 *   staff  — /appointment/bookings, `type` = today | month | custom(from,to).
 *            Week has no server support, so it goes out as a custom range.
 *   doctor — /appointment/doctor/bookings, `filterType` = today | week | month,
 *            with a bare from/to pair for a custom range.
 * Both answer with the same { data, pagination } shape.
 *
 * Rendered under a native stack header, so this screen adds no top inset of
 * its own — doing both stacked a second status-bar gap under the header.
 */
export default function AppointmentsScreen({ mode = "staff" }) {
  const isDoctor = mode === "doctor";
  const endpoint = isDoctor
    ? "/appointment/doctor/bookings"
    : "/appointment/bookings";

  const [range, setRange] = useState("today");
  const [customRange, setCustomRange] = useState(null); // { from: Date, to: Date }

  const [search, setSearch] = useState("");

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  /* Which end of the custom range the native date dialog is editing */
  const [showPicker, setShowPicker] = useState(null); // "from" | "to" | null

  const reqId = useRef(0);

  /* ================= PARAMS ================= */

  const params = useMemo(() => {
    if (isDoctor) {
      // today | week | month are all native to this endpoint
      if (range !== "custom") return { filterType: range };
      if (!customRange) return {};
      return { from: iso(customRange.from), to: iso(customRange.to) };
    }

    if (range === "today" || range === "month") return { type: range };

    const { from, to } =
      range === "week" ? thisWeek() : customRange || { from: null, to: null };

    // Custom with no dates chosen yet — fall back to all appointments
    if (!from || !to) return {};

    return { type: "custom", from: iso(from), to: iso(to) };
  }, [isDoctor, range, customRange]);

  /* ================= FETCH ================= */

  const fetchPage = useCallback(
    async (targetPage, mode = "replace") => {
      // Stale-response guard: a fast chip tap must not be overwritten by the
      // slower request it replaced
      const id = ++reqId.current;

      try {
        if (mode === "replace") setError(null);

        const res = await api.get(endpoint, {
          params: { page: targetPage, limit: LIMIT, ...params },
        });

        if (id !== reqId.current) return;

        const data = res.data?.data || [];

        setItems((prev) => (mode === "append" ? [...prev, ...data] : data));
        setPage(targetPage);
        setTotalPages(res.data?.pagination?.totalPages || 1);
        setTotalRecords(res.data?.pagination?.totalRecords || 0);
      } catch (e) {
        if (id !== reqId.current) return;
        setError(e?.response?.data?.message || "Failed to load appointments");
        if (mode === "replace") setItems([]);
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [endpoint, params]
  );

  useEffect(() => {
    setLoading(true);
    fetchPage(1);
  }, [fetchPage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(1);
  };

  const loadMore = () => {
    if (loading || loadingMore || refreshing || page >= totalPages) return;
    setLoadingMore(true);
    fetchPage(page + 1, "append");
  };

  /* ================= SEARCH (over loaded pages) ================= */

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((a) => {
      if (!a) return false;
      return (
        (a.patientName || "").toLowerCase().includes(term) ||
        String(a.patientPhone || "").includes(term) ||
        (a.doctorId?.name || "").toLowerCase().includes(term)
      );
    });
  }, [items, search]);

  /* ================= CUSTOM RANGE ================= */

  /* Start from the last 7 days so the range is always valid the moment the
     chip is tapped — no empty state to explain */
  const selectCustom = () => {
    if (!customRange) {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 6);
      setCustomRange({ from, to });
    }
    setRange("custom");
  };

  const onPickDate = (event, date) => {
    const which = showPicker;
    // Android dismisses the dialog itself; iOS keeps the spinner mounted
    if (Platform.OS !== "ios") setShowPicker(null);
    if (event.type === "dismissed" || !date || !which) return;

    setCustomRange((r) => {
      const next = { ...(r || { from: date, to: date }), [which]: date };
      // Collapse to a single day rather than keeping an inverted range
      return next.from > next.to ? { from: date, to: date } : next;
    });
  };

  const rangeLabel = (() => {
    if (range === "today") return "Today";
    if (range === "month") return "This month";
    if (range === "week") {
      const { from, to } = thisWeek();
      return `${pretty(from)} – ${pretty(to)}`;
    }
    if (customRange) return `${pretty(customRange.from)} – ${pretty(customRange.to)}`;
    return "Pick a date range";
  })();

  /* ================= HEADER ================= */

  const listHeader = (
    <View style={styles.headerBlock}>
      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={TEXT_S} />
        <TextInput
          placeholder={
            isDoctor ? "Search patient or phone" : "Search patient, doctor or phone"
          }
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor={TEXT_S}
          returnKeyType="search"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={TEXT_S} />
          </TouchableOpacity>
        )}
      </View>

      {/* RANGE CHIPS */}
      <View style={styles.chipRow}>
        {RANGES.map((r) => {
          const active = range === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => (r.key === "custom" ? selectCustom() : setRange(r.key))}
            >
              {r.key === "custom" && (
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={active ? "#fff" : TEXT_M}
                />
              )}
              <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CUSTOM RANGE EDITOR */}
      {range === "custom" && customRange && (
        <View style={styles.rangeRow}>
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setShowPicker("from")}
          >
            <Text style={styles.dateLabel}>From</Text>
            <Text style={styles.dateValue}>{pretty(customRange.from)}</Text>
          </TouchableOpacity>

          <Ionicons name="arrow-forward" size={14} color={TEXT_S} />

          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setShowPicker("to")}
          >
            <Text style={styles.dateLabel}>To</Text>
            <Text style={styles.dateValue}>{pretty(customRange.to)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CONTEXT LINE */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Ionicons name="funnel-outline" size={12} color={TEXT_S} />
          <Text style={styles.metaTxt} numberOfLines={1}>
            {rangeLabel}
          </Text>
        </View>

        <Text style={styles.metaCount}>
          {search.trim()
            ? `${visible.length} of ${items.length} loaded`
            : `${items.length} of ${totalRecords}`}
        </Text>
      </View>
    </View>
  );

  const busy = loading && !refreshing;

  return (
    <View style={styles.container}>
      <FlatList
        data={busy || error ? [] : visible}
        keyExtractor={(item, i) => String(item?._id || i)}
        renderItem={({ item }) =>
          item ? (
            <AppointmentCard appointment={item} showDoctor={!isDoctor} />
          ) : null
        }
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} />
        }
        ListEmptyComponent={
          busy ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={TEAL} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Ionicons name="cloud-offline-outline" size={44} color={TEXT_S} />
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPage(1)}>
                <Text style={styles.retryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={44} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                {search.trim()
                  ? "No appointments match your search"
                  : "No appointments in this period"}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={TEAL} style={{ marginVertical: 20 }} />
          ) : null
        }
      />

      {/* Rendered outside any Modal — an Android date dialog stacked on an RN
          Modal can end up behind it */}
      {showPicker && customRange && (
        <DateTimePicker
          value={customRange[showPicker]}
          mode="date"
          display="default"
          maximumDate={showPicker === "from" ? customRange.to : undefined}
          minimumDate={showPicker === "to" ? customRange.from : undefined}
          onChange={onPickDate}
        />
      )}

      {Platform.OS === "ios" && showPicker && (
        <TouchableOpacity style={styles.pickerDone} onPress={() => setShowPicker(null)}>
          <Text style={styles.pickerDoneTxt}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ================= CARD ================= */

function AppointmentCard({ appointment, showDoctor = true }) {
  /* A doctor viewing their own list gains nothing from their own name, so show
     who booked the patient in instead. */
  const subLine = showDoctor
    ? `Dr. ${String(appointment.doctorId?.name || "Unknown")}`
    : `Booked by ${String(appointment.bookedBy?.name || "—")}`;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={TEAL} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.patientName} numberOfLines={1}>
            {String(appointment.patientName || "Unknown")}
          </Text>
          <Text style={styles.doctorName} numberOfLines={1}>
            {subLine}
          </Text>
        </View>

        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>
            {String(appointment.appointmentTime || "--:--")}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <DetailItem
          icon="call-outline"
          text={String(appointment.patientPhone || "N/A")}
        />
        <DetailItem
          icon="calendar-outline"
          text={
            appointment.appointmentDate
              ? new Date(appointment.appointmentDate).toDateString()
              : "No Date"
          }
        />
      </View>

      <View style={styles.detailsRow}>
        <DetailItem
          icon="person-outline"
          text={[appointment.patientGender, appointment.patientAge && `${appointment.patientAge} yrs`]
            .filter(Boolean)
            .join(" • ") || "N/A"}
        />
        <DetailItem
          icon="cash-outline"
          text={`₹${appointment.consultationFee ?? 0}`}
        />
      </View>

      {!!appointment.symptoms && (
        <View style={styles.symptomsBox}>
          <Text style={styles.symptomsLabel}>Symptoms</Text>
          <Text style={styles.symptomsText}>{String(appointment.symptoms)}</Text>
        </View>
      )}

      <PrescriptionAttachment prescription={appointment.prescription} />
    </View>
  );
}

function DetailItem({ icon, text }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={14} color="#64748B" />
      <Text style={styles.detailText}>{text != null ? String(text) : "N/A"}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 10 },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  headerBlock: { paddingTop: 12, paddingBottom: 4 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CARD,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_D, padding: 0 },

  chipRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: TEAL },
  chipTxt: { fontSize: 12, fontWeight: "700", color: TEXT_M },
  chipTxtActive: { color: "#fff" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  metaLeft: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, minWidth: 0 },
  metaTxt: { fontSize: 11, fontWeight: "700", color: TEXT_M, flexShrink: 1 },
  metaCount: { fontSize: 11, fontWeight: "700", color: TEXT_S },

  emptyText: { marginTop: 4, color: TEXT_S, fontSize: 13, textAlign: "center" },
  retryBtn: {
    marginTop: 6,
    backgroundColor: TEAL,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },

  card: {
    backgroundColor: CARD,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ECFEFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  patientName: { fontSize: 15, fontWeight: "700", color: TEXT_D },
  doctorName: { fontSize: 12, color: "#64748B", marginTop: 2 },
  timeBadge: {
    backgroundColor: TEAL,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 8,
  },
  timeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 14 },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  detailText: { fontSize: 12, color: "#475569" },

  symptomsBox: {
    marginTop: 10,
    backgroundColor: BG,
    padding: 10,
    borderRadius: 10,
  },
  symptomsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: TEAL,
    marginBottom: 4,
  },
  symptomsText: { fontSize: 12, color: "#334155" },

  rangeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  dateField: {
    flex: 1,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dateLabel: { fontSize: 10, fontWeight: "700", color: TEXT_S },
  dateValue: { fontSize: 13, fontWeight: "800", color: TEXT_D, marginTop: 2 },

  pickerDone: {
    alignSelf: "center",
    backgroundColor: TEAL,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  pickerDoneTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
