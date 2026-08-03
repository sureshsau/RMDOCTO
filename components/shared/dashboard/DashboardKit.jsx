import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationBell from "../NotificationBell";

/**
 * Shared building blocks for the role dashboards (doctor, agent, marketing
 * agent, receptionist, rider).
 *
 * Every role screen was previously a hand-rolled icon grid with its own copy of
 * the same styles, so they drifted apart. These primitives keep one visual
 * language: teal header → lifted stat strip → panels → action grid.
 */

/* ═══════════════ TOKENS ═══════════════ */

export const PRIMARY = "#14b8a6";
export const PRIMARY_DARK = "#0f766e";
export const BG = "#f1f5f9";
export const CARD = "#ffffff";
export const TEXT_D = "#0f172a";
export const TEXT_M = "#475569";
export const TEXT_S = "#94a3b8";
export const BORDER = "#e2e8f0";

export const H_PADDING = 16;
const GRID_GAP = 12;
const GRID_COLS = 2;

/* Order/delivery status → badge colours. Shared so a CONFIRMED order looks the
   same on the rider, receptionist and agent screens. */
export const STATUS_TONES = {
  DELIVERED: { bg: "#dcfce7", color: "#15803d" },
  CONFIRMED: { bg: "#e0f2fe", color: "#0369a1" },
  SHIPPED: { bg: "#e0e7ff", color: "#4338ca" },
  OUT_FOR_DELIVERY: { bg: "#e0e7ff", color: "#4338ca" },
  INITIATED: { bg: "#fef3c7", color: "#b45309" },
  PENDING: { bg: "#fef3c7", color: "#b45309" },
  PAID: { bg: "#dcfce7", color: "#15803d" },
  CANCELLED: { bg: "#fee2e2", color: "#b91c1c" },
  /* agent follow-up levels */
  NO_ORDERS: { bg: "#fee2e2", color: "#b91c1c" },
  LOW: { bg: "#fef3c7", color: "#b45309" },
  ACTIVE: { bg: "#dcfce7", color: "#15803d" },
};

export const toneFor = (status) => STATUS_TONES[status] || STATUS_TONES.INITIATED;

/* ═══════════════ HELPERS ═══════════════ */

export const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** Compact money for stat tiles — ₹1.2L reads better than ₹1,20,000 in a chip. */
export const moneyShort = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K`;
  return money(v);
};

export const initialsOf = (name) =>
  String(name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "-";

/** First day of the current month / today, as YYYY-MM-DD for range params. */
export const monthRange = () => {
  const now = new Date();
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  return {
    from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: iso(now),
  };
};

/**
 * Condense `GET /attendance/log/me` (month range) into the two facts a
 * dashboard cares about: days present so far, and whether today is marked.
 */
export const parseAttendance = (payload) => {
  const overview = payload?.overview || {};
  const logs = payload?.logs || [];
  const todayKey = new Date().toDateString();

  const todayLog = logs.find(
    (l) => new Date(l.attendanceDate).toDateString() === todayKey
  );

  return {
    presentDays: (overview.presentFull || 0) + (overview.presentHalf || 0),
    totalDays: overview.totalDays || 0,
    totalHours: overview.totalHours || 0,
    checkedInToday: Boolean(todayLog) && todayLog.status !== "ABSENT",
  };
};

/* ═══════════════ HEADER ═══════════════ */

export function DashboardHeader({
  name,
  role,
  avatarUrl,
  meta,
  alert,
  onAvatarPress,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={onAvatarPress ? 0.8 : 1}
          onPress={onAvatarPress}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarTxt}>{initialsOf(name)}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>

          <View style={styles.rolePill}>
            <Ionicons name="shield-checkmark" size={10} color="#fff" />
            <Text style={styles.rolePillTxt}>{role}</Text>
          </View>
        </View>

        <NotificationBell
          color="#ffffff"
          bgColor="rgba(255,255,255,0.2)"
          size={22}
        />
      </View>

      {meta ? <Text style={styles.headerMeta}>{meta}</Text> : null}

      {alert ? (
        <TouchableOpacity
          style={styles.alertStrip}
          activeOpacity={alert.onPress ? 0.8 : 1}
          onPress={alert.onPress}
        >
          <Ionicons name={alert.icon || "alert-circle"} size={14} color="#fff" />
          <Text style={styles.alertTxt} numberOfLines={2}>
            {alert.text}
          </Text>
          {alert.onPress ? (
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          ) : null}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ═══════════════ STAT STRIP ═══════════════ */

/** Row of tiles that lifts over the header curve. Pass 2–3 StatCards. */
export function StatStrip({ children }) {
  return <View style={styles.statStrip}>{children}</View>;
}

export function StatCard({ icon, tint = PRIMARY_DARK, label, value, meta, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.statCard} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: tint + "18" }]}>
          <Ionicons name={icon} size={15} color={tint} />
        </View>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>

      {meta ? (
        <Text style={styles.statMeta} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
    </Wrapper>
  );
}

/* ═══════════════ PANELS ═══════════════ */

export function Panel({ title, linkLabel, onLink, flush, children, style }) {
  return (
    <View style={[flush ? styles.panelFlush : styles.panel, style]}>
      {title ? (
        <View style={[styles.panelHead, flush && styles.panelHeadFlush]}>
          <Text style={styles.panelTitle}>{title}</Text>
          {linkLabel && onLink ? (
            <TouchableOpacity onPress={onLink} hitSlop={8}>
              <Text style={styles.panelLink}>{linkLabel} →</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {children}
    </View>
  );
}

export function MetricRow({ items }) {
  return (
    <View style={styles.metricRow}>
      {items.map((m) => (
        <View key={m.label} style={styles.metric}>
          <Text
            style={[styles.metricValue, { color: m.tone || TEXT_D }]}
            numberOfLines={1}
          >
            {m.value}
          </Text>
          <Text style={styles.metricLabel} numberOfLines={1}>
            {m.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SectionTitle({ children, linkLabel, onLink }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {linkLabel && onLink ? (
        <TouchableOpacity onPress={onLink} hitSlop={8}>
          <Text style={styles.panelLink}>{linkLabel} →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ═══════════════ ACTION GRID ═══════════════ */

/**
 * Two-column shortcut grid. Widths are computed in pixels — percentage widths
 * plus a fixed gap overflow the row and collapse the grid to one column.
 */
export function ActionGrid({ items, onPress }) {
  const { width } = useWindowDimensions();
  const cardW =
    (width - H_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

  return (
    <View style={styles.grid}>
      {items.map((a) => (
        <TouchableOpacity
          key={a.title}
          style={[styles.actionCard, { width: cardW }]}
          activeOpacity={0.85}
          onPress={() => (a.onPress ? a.onPress() : onPress?.(a))}
        >
          <View style={[styles.actionIcon, { backgroundColor: a.tint + "18" }]}>
            <Ionicons name={a.icon} size={19} color={a.tint} />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.actionTitle} numberOfLines={1}>
              {a.title}
            </Text>
            <Text style={styles.actionSub} numberOfLines={1}>
              {a.subtitle}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ═══════════════ LIST ROW ═══════════════ */

export function ListRow({
  image,
  icon = "ellipse-outline",
  iconTint = TEXT_S,
  title,
  subtitle,
  amount,
  badge,
  last,
  onPress,
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const tone = badge ? toneFor(badge) : null;

  return (
    <Wrapper
      style={[styles.row, !last && styles.rowBorder]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.rowThumb} />
      ) : (
        <View style={[styles.rowThumb, styles.rowThumbFallback]}>
          <Ionicons name={icon} size={18} color={iconTint} />
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", gap: 4 }}>
        {amount ? <Text style={styles.rowAmount}>{amount}</Text> : null}
        {badge ? (
          <View style={[styles.rowBadge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.rowBadgeTxt, { color: tone.color }]}>
              {String(badge).replace(/_/g, " ")}
            </Text>
          </View>
        ) : null}
      </View>
    </Wrapper>
  );
}

/* ═══════════════ STATES ═══════════════ */

export function Loader({ style }) {
  return <ActivityIndicator color={PRIMARY} style={[{ paddingVertical: 24 }, style]} />;
}

export function EmptyState({ icon, title, actionLabel, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.empty} activeOpacity={0.85} onPress={onPress}>
      <Ionicons name={icon} size={30} color={TEXT_S} />
      <Text style={styles.emptyTxt}>{title}</Text>
      {actionLabel ? <Text style={styles.emptyLink}>{actionLabel} →</Text> : null}
    </Wrapper>
  );
}

/* ═══════════════ STYLES ═══════════════ */

const styles = StyleSheet.create({
  /* HEADER */
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: H_PADDING,
    paddingBottom: 46,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarFallback: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "#fff", fontSize: 17, fontWeight: "900" },
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  name: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 1 },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 5,
  },
  rolePillTxt: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  headerMeta: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 12,
  },
  alertStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 12,
  },
  alertTxt: { color: "#fff", fontSize: 12, fontWeight: "700", flex: 1 },

  /* STAT STRIP */
  statStrip: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: H_PADDING,
    marginTop: -32,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 13,
    elevation: 3,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  statTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 10.5, fontWeight: "700", color: TEXT_M, flex: 1 },
  statValue: { fontSize: 19, fontWeight: "900", color: TEXT_D },
  statMeta: { fontSize: 10, color: TEXT_S, marginTop: 2 },

  /* PANELS */
  panel: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginHorizontal: H_PADDING,
    marginTop: 14,
    padding: 14,
  },
  panelFlush: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginHorizontal: H_PADDING,
    marginTop: 14,
    overflow: "hidden",
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  panelHeadFlush: {
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 4,
  },
  panelTitle: { fontSize: 13, fontWeight: "800", color: TEXT_D },
  panelLink: { fontSize: 12, fontWeight: "700", color: PRIMARY },

  metricRow: { flexDirection: "row", gap: 8 },
  metric: { flex: 1, alignItems: "center" },
  metricValue: { fontSize: 16, fontWeight: "900" },
  metricLabel: { fontSize: 10, color: TEXT_S, fontWeight: "600", marginTop: 3 },

  /* SECTION */
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: TEXT_D },

  /* ACTIONS */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingHorizontal: H_PADDING,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 12.5, fontWeight: "800", color: TEXT_D },
  actionSub: { fontSize: 10, color: TEXT_S, marginTop: 2 },

  /* ROWS */
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowThumb: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#f8fafc" },
  rowThumbFallback: { alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 13, fontWeight: "700", color: TEXT_D },
  rowSub: { fontSize: 11, color: TEXT_S, marginTop: 2 },
  rowAmount: { fontSize: 13, fontWeight: "900", color: TEXT_D },
  rowBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  rowBadgeTxt: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.3 },

  /* STATES */
  empty: { alignItems: "center", paddingVertical: 26, gap: 6 },
  emptyTxt: { fontSize: 13, fontWeight: "700", color: TEXT_M },
  emptyLink: { fontSize: 12, fontWeight: "700", color: PRIMARY },
});
