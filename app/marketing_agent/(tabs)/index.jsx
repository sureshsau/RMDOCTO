import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import {
  ActionGrid,
  BG,
  DashboardHeader,
  EmptyState,
  ListRow,
  Loader,
  MetricRow,
  Panel,
  PRIMARY,
  PRIMARY_DARK,
  SectionTitle,
  StatCard,
  StatStrip,
  money,
  moneyShort,
  monthRange,
  parseAttendance,
} from "../../../components/shared/dashboard/DashboardKit";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../services/axios";
import { roleLabel } from "../../../utils/roleLabels";

const ACTIONS = [
  { icon: "person-add-outline", tint: "#6366f1", title: "Register RM Member", subtitle: "Grow network", route: "/marketing_agent/register-agent" },
  { icon: "git-network-outline", tint: "#0ea5e9", title: "My Network", subtitle: "Assigned RM Members", route: "/marketing_agent/(tabs)/network" },
  { icon: "notifications-outline", tint: "#ef4444", title: "RM Member Alerts", subtitle: "Follow-up list", route: "/marketing_agent/agent-alerts" },
  { icon: "scan-outline", tint: "#8b5cf6", title: "Check-In", subtitle: "Mark attendance", route: "/marketing_agent/face-verification" },
  { icon: "storefront-outline", tint: "#14b8a6", title: "Medicine Store", subtitle: "Buy medicines", route: "/medicine-store" },
  { icon: "cube-outline", tint: "#0891b2", title: "My Orders", subtitle: "Track orders", route: "/mymedicineorder" },
  { icon: "flask-outline", tint: "#10b981", title: "Lab Tests", subtitle: "Book diagnostics", route: "/lab" },
  { icon: "receipt-outline", tint: "#64748b", title: "My Lab Orders", subtitle: "Test reports", route: "/lab/my-orders" },
  { icon: "wallet-outline", tint: "#d97706", title: "RM Coins", subtitle: "Balance & history", route: "/rmcoin" },
  { icon: "pricetags-outline", tint: "#ec4899", title: "Special Offers", subtitle: "Active promos", route: "/offers" },
];

export default function MarketingAgentDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const alive = useRef(true);

  const [profile, setProfile] = useState(null);
  const [network, setNetwork] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= FETCH ================= */

  const load = useCallback(async () => {
    const { from, to } = monthRange();

    // Independent panels — one failing endpoint must not blank the dashboard
    const [me, net, alert, att] = await Promise.allSettled([
      api.get("/user/me"),
      api.get("/medicine/order/stats/marketing-agent/network", {
        params: { range: "month" },
      }),
      api.get("/medicine/order/stats/agent-alerts", {
        params: { range: "month" },
      }),
      api.get("/attendance/log/me", { params: { from, to, page: 1, limit: 31 } }),
    ]);

    if (!alive.current) return;

    if (me.status === "fulfilled") setProfile(me.value.data?.data || null);

    if (net.status === "fulfilled") {
      setNetwork({
        networkSize: net.value.data?.networkSize ?? 0,
        summary: net.value.data?.summary || {},
        agentBreakdown: net.value.data?.agentBreakdown || [],
      });
    }

    if (alert.status === "fulfilled") {
      setAlerts({
        summary: alert.value.data?.summary || {},
        agents: alert.value.data?.agents || [],
      });
    }

    if (att.status === "fulfilled") {
      setAttendance(parseAttendance(att.value.data));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      load().finally(() => alive.current && setLoading(false));
      return () => {
        alive.current = false;
      };
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  /* ================= DERIVED ================= */

  const displayName = profile?.name || user?.name || "RM Member";
  const avatarUrl = profile?.faceImage?.url || user?.faceImage?.url || null;

  const summary = network?.summary || {};

  // The service already sorts worst-first: no orders → low value → active
  const followUps = (alerts?.agents || [])
    .filter((a) => a.alertLevel !== "ACTIVE")
    .slice(0, 3);

  const topAgents = [...(network?.agentBreakdown || [])]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3);

  const needsFollowUp =
    (alerts?.summary?.noOrderAgents || 0) + (alerts?.summary?.lowAgents || 0);

  const headerAlert = (() => {
    if (attendance && !attendance.checkedInToday) {
      return {
        icon: "scan-outline",
        text: "You haven't checked in today",
        onPress: () => router.push("/marketing_agent/face-verification"),
      };
    }
    if (needsFollowUp > 0) {
      return {
        icon: "call-outline",
        text: `${needsFollowUp} RM Member${needsFollowUp === 1 ? "" : "s"} need a follow-up call`,
        onPress: () => router.push("/marketing_agent/agent-alerts"),
      };
    }
    return null;
  })();

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
          />
        }
      >
        <DashboardHeader
          name={displayName}
          role={roleLabel("marketing_agent").toUpperCase()}
          avatarUrl={avatarUrl}
          onAvatarPress={() => router.push("/marketing_agent/(tabs)/profile")}
          alert={headerAlert}
        />

        <StatStrip>
          <StatCard
            icon="git-network-outline"
            tint="#0ea5e9"
            label="Network"
            value={network?.networkSize ?? 0}
            meta="RM Members assigned"
            onPress={() => router.push("/marketing_agent/(tabs)/network")}
          />
          <StatCard
            icon="cube-outline"
            tint={PRIMARY_DARK}
            label="Orders"
            value={summary.totalOrders ?? 0}
            meta="this month"
          />
          <StatCard
            icon="trending-up-outline"
            tint="#d97706"
            label="Sales"
            value={moneyShort(summary.totalRevenue)}
            meta="this month"
          />
        </StatStrip>

        {/* ================= THIS MONTH ================= */}

        <Panel
          title="This Month"
          linkLabel="Network"
          onLink={() => router.push("/marketing_agent/(tabs)/network")}
        >
          {loading ? (
            <Loader />
          ) : (
            <MetricRow
              items={[
                { label: "Delivered", value: summary.delivered ?? 0, tone: "#15803d" },
                { label: "Pending", value: summary.pending ?? 0, tone: "#b45309" },
                { label: "Cancelled", value: summary.cancelled ?? 0, tone: "#b91c1c" },
                {
                  label: "Present",
                  value: attendance?.presentDays ?? 0,
                  tone: PRIMARY_DARK,
                },
              ]}
            />
          )}
        </Panel>

        {/* ================= FOLLOW-UPS ================= */}

        <SectionTitle
          linkLabel="All alerts"
          onLink={() => router.push("/marketing_agent/agent-alerts")}
        >
          Needs Follow-up
        </SectionTitle>

        <Panel flush style={{ marginTop: 0 }}>
          {loading ? (
            <Loader />
          ) : followUps.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title="Every RM Member is ordering"
              actionLabel="Open alerts"
              onPress={() => router.push("/marketing_agent/agent-alerts")}
            />
          ) : (
            followUps.map((a, i) => (
              <ListRow
                key={String(a.userId)}
                icon="person-outline"
                iconTint="#ef4444"
                title={a.name}
                subtitle={[a.phone, `${a.orderCount} orders`]
                  .filter(Boolean)
                  .join(" • ")}
                amount={money(a.totalOrderValue)}
                badge={a.alertLevel}
                last={i === followUps.length - 1}
                onPress={() => router.push("/marketing_agent/agent-alerts")}
              />
            ))
          )}
        </Panel>

        {/* ================= TOP PERFORMERS ================= */}

        <SectionTitle>Top Performers</SectionTitle>

        <Panel flush style={{ marginTop: 0 }}>
          {loading ? (
            <Loader />
          ) : topAgents.length === 0 ? (
            <EmptyState
              icon="trophy-outline"
              title="No orders from your network yet"
              actionLabel="Register an RM Member"
              onPress={() => router.push("/marketing_agent/register-agent")}
            />
          ) : (
            topAgents.map((a, i) => (
              <ListRow
                key={String(a.userId)}
                icon="trophy-outline"
                iconTint="#d97706"
                title={a.name}
                subtitle={`${a.orderCount} order${a.orderCount === 1 ? "" : "s"} • ${a.phone || "no phone"}`}
                amount={money(a.totalRevenue)}
                last={i === topAgents.length - 1}
                onPress={() => router.push("/marketing_agent/(tabs)/network")}
              />
            ))
          )}
        </Panel>

        {/* ================= QUICK ACTIONS ================= */}

        <SectionTitle>Quick Actions</SectionTitle>

        <ActionGrid items={ACTIONS} onPress={(a) => router.push(a.route)} />
      </ScrollView>
    </View>
  );
}
