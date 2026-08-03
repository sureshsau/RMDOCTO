import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import TargetOfferBanner from "../../../components/shared/agent/TargetOfferBanner";
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
  shortDate,
} from "../../../components/shared/dashboard/DashboardKit";
import { useAuth } from "../../../context/AuthContext";
import { useRMCredit } from "../../../context/RMCreditContext";
import api from "../../../services/axios";

const ACTIONS = [
  { icon: "person-add-outline", tint: "#6366f1", title: "Register Agent", subtitle: "Grow downline", route: "/agent/register" },
  { icon: "git-network-outline", tint: "#0ea5e9", title: "My Network", subtitle: "Team tree", route: "/agent/(tabs)/network" },
  { icon: "trophy-outline", tint: "#f59e0b", title: "My Targets", subtitle: "Rewards", route: "/agent/targets" },
  { icon: "pricetags-outline", tint: "#ec4899", title: "Offers", subtitle: "Active promos", route: "/offers" },
  { icon: "storefront-outline", tint: "#14b8a6", title: "Medicine Store", subtitle: "Buy medicines", route: "/medicine-store" },
  { icon: "cube-outline", tint: "#8b5cf6", title: "My Orders", subtitle: "Track orders", route: "/mymedicineorder" },
  { icon: "medkit-outline", tint: "#ef4444", title: "Book Doctor", subtitle: "Consultations", route: "/doctor-booking" },
  { icon: "calendar-outline", tint: "#0891b2", title: "Appointments", subtitle: "My bookings", route: "/doctor-booking/my-appointments" },
  { icon: "flask-outline", tint: "#10b981", title: "Book Lab", subtitle: "Diagnostics", route: "/lab" },
  { icon: "receipt-outline", tint: "#64748b", title: "Lab Orders", subtitle: "My tests", route: "/lab/my-orders" },
];

export default function AgentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { wallet, refreshRMCredit } = useRMCredit();

  const alive = useRef(true);

  const [profile, setProfile] = useState(null); // fresh copy from /user/me
  const [coinBalance, setCoinBalance] = useState(user?.rmCoinsBalance ?? 0);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= FETCH ================= */

  const load = useCallback(async () => {
    // Independent panels — one failing endpoint must not blank the dashboard
    const [me, downline, orders] = await Promise.allSettled([
      api.get("/user/me"),
      api.get("/medicine/order/stats/agent/downline", {
        params: { range: "month" },
      }),
      api.get("/medicine/order", { params: { limit: 3 } }),
    ]);

    if (!alive.current) return;

    if (me.status === "fulfilled") {
      const fresh = me.value.data?.data;
      setProfile(fresh || null);
      setCoinBalance(fresh?.rmCoinsBalance ?? 0);
    }

    if (downline.status === "fulfilled") {
      setStats({
        downlineSize: downline.value.data?.downlineSize ?? 0,
        ...(downline.value.data?.summary || {}),
      });
    }

    if (orders.status === "fulfilled") {
      setRecentOrders(orders.value.data?.orders?.slice(0, 3) || []);
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
    await Promise.all([load(), refreshRMCredit?.()]);
    setRefreshing(false);
  };

  /* ================= DERIVED ================= */

  const displayName = profile?.name || user?.name || "Agent";
  const avatarUrl = profile?.faceImage?.url || user?.faceImage?.url || null;

  const creditExpiring = (() => {
    if (!wallet?.expiryDate) return null;
    const days = Math.ceil((new Date(wallet.expiryDate) - Date.now()) / 86400000);
    return days >= 0 && days <= 7 ? days : null;
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
          role="AGENT"
          avatarUrl={avatarUrl}
          onAvatarPress={() => router.push("/agent/(tabs)/profile")}
          alert={
            creditExpiring !== null
              ? {
                  icon: "time-outline",
                  text: `RM Credit expires in ${creditExpiring} day${creditExpiring === 1 ? "" : "s"}`,
                  onPress: () => router.push("/agent/rmcredit"),
                }
              : null
          }
        />

        {/* ═════════════ WALLETS ═════════════ */}

        <StatStrip>
          <StatCard
            icon="cash-outline"
            tint={PRIMARY_DARK}
            label="RM Credit"
            value={money(wallet?.balance)}
            meta={
              wallet?.usedCredit
                ? `${money(wallet.usedCredit)} used`
                : "Tap for history"
            }
            onPress={() => router.push("/agent/rmcredit")}
          />
          <StatCard
            icon="logo-bitcoin"
            tint="#d97706"
            label="RM Coin"
            value={money(coinBalance)}
            meta="Tap for transactions"
            onPress={() => router.push("/rmcoin")}
          />
        </StatStrip>

        {/* ═════════════ TARGETS BANNER ═════════════ */}

        <TargetOfferBanner />

        {/* ═════════════ THIS MONTH ═════════════ */}

        <Panel
          title="This Month"
          linkLabel="Network"
          onLink={() => router.push("/agent/(tabs)/network")}
        >
          {loading ? (
            <Loader />
          ) : (
            <MetricRow
              items={[
                { label: "Orders", value: stats?.totalOrders ?? 0 },
                {
                  label: "Sales",
                  value: money(stats?.totalRevenue),
                  tone: PRIMARY_DARK,
                },
                { label: "Team", value: stats?.downlineSize ?? 0 },
                { label: "Pending", value: stats?.pending ?? 0, tone: "#b45309" },
              ]}
            />
          )}
        </Panel>

        {/* ═════════════ QUICK ACTIONS ═════════════ */}

        <SectionTitle>Quick Actions</SectionTitle>

        <ActionGrid items={ACTIONS} onPress={(a) => router.push(a.route)} />

        {/* ═════════════ RECENT ORDERS ═════════════ */}

        <SectionTitle
          linkLabel={recentOrders.length > 0 ? "View all" : null}
          onLink={() => router.push("/mymedicineorder")}
        >
          Recent Orders
        </SectionTitle>

        <Panel flush style={{ marginTop: 0 }}>
          {loading ? (
            <Loader />
          ) : recentOrders.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="No orders yet"
              actionLabel="Browse the medicine store"
              onPress={() => router.push("/medicine-store")}
            />
          ) : (
            recentOrders.map((o, i) => (
              <ListRow
                key={String(o.orderId)}
                image={o.medicine?.image || null}
                icon="medkit-outline"
                title={o.medicine?.name || "Medicine order"}
                subtitle={`${shortDate(o.createdAt)} • ${o.paymentMode || "-"}`}
                amount={money(o.payableAmount)}
                badge={o.orderStatus}
                last={i === recentOrders.length - 1}
                onPress={() => router.push("/mymedicineorder")}
              />
            ))
          )}
        </Panel>
      </ScrollView>
    </View>
  );
}
