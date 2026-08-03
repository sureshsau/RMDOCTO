import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../../services/axios";

const { width: W } = Dimensions.get("window");
const BANNER_W = W - 32;

const BANNER_COLORS = [
  ["#0d9488", "#0f766e"],
  ["#7c3aed", "#6d28d9"],
  ["#d97706", "#b45309"],
  ["#0284c7", "#0369a1"],
  ["#db2777", "#be185d"],
];

const PRIMARY = "#14b8a6";

/**
 * Target offers rendered as an auto-rotating banner on the agent home,
 * mirroring the promo-offer carousel on the customer home.
 *
 * Renders nothing when there are no active targets for the month, so the
 * dashboard stays clean rather than showing an empty shell.
 */
export default function TargetOfferBanner() {
  const router = useRouter();

  const [targets, setTargets] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [targetMonth, setTargetMonth] = useState("");
  const [active, setActive] = useState(0);

  const listRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get("/target-offers/my-progress");
        if (cancelled || !res.data?.success) return;

        setTargets(res.data.activeTargets || []);
        setTotalSales(res.data.totalSales || 0);
        setTargetMonth(res.data.targetMonth || "");
      } catch {
        // Targets are a bonus surface — a failure here must not break the dashboard
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* Auto-advance, same 3.5s cadence as the customer offer banner */
  useEffect(() => {
    if (targets.length < 2) return;

    const timer = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % targets.length;
        try {
          listRef.current?.scrollToIndex({ index: next, animated: true });
        } catch {
          // scrollToIndex can throw before layout settles — the dot state still advances
        }
        return next;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [targets]);

  /* The first target the agent has not yet reached */
  const nextTargetIndex = useMemo(
    () => targets.findIndex((t) => totalSales < t.targetSalesAmount),
    [targets, totalSales]
  );

  if (!targets.length) return null;

  const renderTarget = ({ item, index }) => {
    const [c1] = BANNER_COLORS[index % BANNER_COLORS.length];

    const achieved = totalSales >= item.targetSalesAmount;
    const remaining = Math.max(item.targetSalesAmount - totalSales, 0);
    const percent = item.targetSalesAmount
      ? Math.min((totalSales / item.targetSalesAmount) * 100, 100)
      : 0;
    const isNext = index === nextTargetIndex;

    return (
      <View style={[styles.card, { backgroundColor: c1, width: BANNER_W }]}>
        <View style={styles.left}>
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillTxt}>TARGET #{item.rank}</Text>
            </View>

            {achieved ? (
              <View style={[styles.pill, styles.pillDone]}>
                <Ionicons name="checkmark-circle" size={11} color="#fff" />
                <Text style={styles.pillTxt}>ACHIEVED</Text>
              </View>
            ) : isNext ? (
              <View style={[styles.pill, styles.pillNext]}>
                <Text style={styles.pillTxt}>UP NEXT</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.big}>
            ₹{Number(item.targetSalesAmount).toLocaleString("en-IN")} in sales
          </Text>

          <Text style={styles.reward} numberOfLines={2}>
            🎁 {item.rewardDescription}
          </Text>

          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${percent}%` }]} />
          </View>

          <Text style={styles.meta}>
            {achieved
              ? `Unlocked with ₹${Number(totalSales).toLocaleString("en-IN")} in sales`
              : `₹${Number(remaining).toLocaleString("en-IN")} more to unlock • ${Math.round(percent)}%`}
          </Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push("/agent/targets")}
          >
            <Text style={[styles.btnTxt, { color: c1 }]}>View Targets →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.right}>
          <View style={styles.circleBig}>
            <View style={styles.circleSmall}>
              <Ionicons name={achieved ? "trophy" : "flag"} size={26} color="#fff" />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Targets &amp; Rewards</Text>
        {!!targetMonth && <Text style={styles.month}>{targetMonth}</Text>}
      </View>

      <Text style={styles.salesLine}>
        Sales this month: ₹{Number(totalSales).toLocaleString("en-IN")}
      </Text>

      <FlatList
        ref={listRef}
        data={targets}
        keyExtractor={(item) => item._id}
        renderItem={renderTarget}
        horizontal
        showsHorizontalScrollIndicator={false}
        // Stride must match getItemLayout: card width + separator
        snapToInterval={BANNER_W + 12}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        // length is the card itself; the separator only affects the offset
        getItemLayout={(_, index) => ({
          length: BANNER_W,
          offset: (BANNER_W + 12) * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12));
          setActive(idx);
        }}
      />

      {targets.length > 1 && (
        <View style={styles.dots}>
          {targets.map((t, i) => (
            <View key={t._id} style={[styles.dot, i === active && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 16 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  heading: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  month: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  salesLine: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 10,
  },

  card: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  left: { flex: 1, paddingRight: 8 },
  right: { width: 84, alignItems: "center", justifyContent: "center" },

  pillRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillDone: { backgroundColor: "rgba(255,255,255,0.45)" },
  pillNext: { backgroundColor: "rgba(0,0,0,0.18)" },
  pillTxt: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },

  big: { fontSize: 21, fontWeight: "900", color: "#fff", lineHeight: 27, marginBottom: 4 },
  reward: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.92)", marginBottom: 10 },

  barBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#fff", borderRadius: 4 },

  meta: { fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 6 },

  btn: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 14,
  },
  btnTxt: { fontSize: 13, fontWeight: "800" },

  circleBig: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  circleSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d1d5db" },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: PRIMARY },
});
