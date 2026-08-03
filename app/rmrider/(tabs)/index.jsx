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

/* Orders still on the rider's plate */
const OPEN_STATUSES = ["INITIATED", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY"];

const ACTIONS = [
  { icon: "cube-outline", tint: "#6366f1", title: "Medicine Orders", subtitle: "Assigned deliveries", route: "/rmrider/medicine/order" },
  { icon: "flask-outline", tint: "#10b981", title: "Lab Pickups", subtitle: "Sample collection", route: "/rmrider/lab/order" },
  { icon: "scan-outline", tint: "#8b5cf6", title: "Check-In", subtitle: "Mark attendance", route: "/rmrider/face-verification" },
  { icon: "storefront-outline", tint: "#14b8a6", title: "Medicine Store", subtitle: "Buy medicines", route: "/medicine-store" },
  { icon: "bag-outline", tint: "#0891b2", title: "My Orders", subtitle: "Track orders", route: "/mymedicineorder" },
  { icon: "wallet-outline", tint: "#d97706", title: "RM Coins", subtitle: "Balance & history", route: "/rmcoin" },
  { icon: "pricetags-outline", tint: "#ec4899", title: "Special Offers", subtitle: "Active promos", route: "/offers" },
];

export default function RiderDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const alive = useRef(true);

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [labOrders, setLabOrders] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  /* ================= FETCH ================= */

  const load = useCallback(async () => {
    const { from, to } = monthRange();

    // Independent panels — one failing endpoint must not blank the dashboard
    const [me, med, lab, att] = await Promise.allSettled([
      api.get("/user/me"),
      // limit 50: the cash/active figures below are derived from this page
      api.get("/medicine/order/rider", { params: { page: 1, limit: 50 } }),
      api.get("/lab/order/rider"),
      api.get("/attendance/log/me", { params: { from, to, page: 1, limit: 31 } }),
    ]);

    if (!alive.current) return;

    if (me.status === "fulfilled") setProfile(me.value.data?.data || null);

    if (med.status === "fulfilled") {
      setOrders(med.value.data?.orders || []);
      setTotalAssigned(
        med.value.data?.pagination?.totalOrders ??
          med.value.data?.orders?.length ??
          0
      );
    }

    if (lab.status === "fulfilled") setLabOrders(lab.value.data?.orders || []);

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

  const displayName = profile?.name || user?.name || "Rider";
  const avatarUrl = profile?.faceImage?.url || user?.faceImage?.url || null;

  const active = orders.filter((o) => OPEN_STATUSES.includes(o.orderStatus));

  const delivered = orders.filter((o) => o.orderStatus === "DELIVERED").length;

  // Cash the rider is still carrying responsibility for: COD, not yet paid
  const cashToCollect = active
    .filter((o) => o.paymentMode === "COD" && o.paymentStatus === "PENDING")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const openLab = labOrders.filter(
    (o) => o.orderStatus !== "DELIVERED" && o.orderStatus !== "CANCELLED"
  );

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
          role="RM RIDER"
          avatarUrl={avatarUrl}
          meta={todayLabel}
          onAvatarPress={() => router.push("/rmrider/(tabs)/profile")}
          alert={
            attendance && !attendance.checkedInToday
              ? {
                  icon: "scan-outline",
                  text: "You haven't checked in today",
                  onPress: () => router.push("/rmrider/face-verification"),
                }
              : null
          }
        />

        <StatStrip>
          <StatCard
            icon="bicycle-outline"
            tint={PRIMARY_DARK}
            label="Active"
            value={active.length}
            meta="to deliver"
            onPress={() => router.push("/rmrider/medicine/order")}
          />
          <StatCard
            icon="cash-outline"
            tint="#d97706"
            label="Collect"
            value={moneyShort(cashToCollect)}
            meta="cash on delivery"
            onPress={() => router.push("/rmrider/medicine/order")}
          />
          <StatCard
            icon="flask-outline"
            tint="#10b981"
            label="Lab"
            value={openLab.length}
            meta="pickups"
            onPress={() => router.push("/rmrider/lab/order")}
          />
        </StatStrip>

        {/* ================= WORKLOAD ================= */}

        <Panel
          title="My Workload"
          linkLabel="All orders"
          onLink={() => router.push("/rmrider/medicine/order")}
        >
          {loading ? (
            <Loader />
          ) : (
            <MetricRow
              items={[
                { label: "Assigned", value: totalAssigned },
                { label: "Delivered", value: delivered, tone: "#15803d" },
                {
                  label: "Present",
                  value: attendance?.presentDays ?? 0,
                  tone: PRIMARY_DARK,
                },
                {
                  label: "Check-in",
                  value: attendance?.checkedInToday ? "Done" : "Due",
                  tone: attendance?.checkedInToday ? "#15803d" : "#b45309",
                },
              ]}
            />
          )}
        </Panel>

        {/* ================= NEXT DELIVERIES ================= */}

        <SectionTitle
          linkLabel={active.length > 0 ? "View all" : null}
          onLink={() => router.push("/rmrider/medicine/order")}
        >
          Next Deliveries
        </SectionTitle>

        <Panel flush style={{ marginTop: 0 }}>
          {loading ? (
            <Loader />
          ) : active.length === 0 ? (
            <EmptyState
              icon="checkmark-done-outline"
              title="Nothing pending — you're all caught up"
              actionLabel="See delivery history"
              onPress={() => router.push("/rmrider/medicine/order")}
            />
          ) : (
            active.slice(0, 4).map((o, i) => (
              <ListRow
                key={String(o.orderId)}
                icon="location-outline"
                iconTint={PRIMARY}
                title={o.customer?.name || "Customer"}
                subtitle={[
                  o.deliveryAddress?.addressLine1,
                  o.deliveryAddress?.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
                amount={money(o.totalAmount)}
                badge={o.orderStatus}
                last={i === Math.min(active.length, 4) - 1}
                onPress={() =>
                  router.push(`/rmrider/medicine/order/${o.orderId}`)
                }
              />
            ))
          )}
        </Panel>

        {/* ================= LAB PICKUPS ================= */}

        {openLab.length > 0 && (
          <>
            <SectionTitle
              linkLabel="View all"
              onLink={() => router.push("/rmrider/lab/order")}
            >
              Lab Pickups
            </SectionTitle>

            <Panel flush style={{ marginTop: 0 }}>
              {openLab.slice(0, 3).map((o, i) => (
                <ListRow
                  key={String(o.orderId)}
                  icon="flask-outline"
                  iconTint="#10b981"
                  title={
                    o.collectionAddress?.fullName || o.user?.name || "Patient"
                  }
                  subtitle={
                    o.collectionType === "HOME"
                      ? o.collectionAddress?.addressLine1 || "Home collection"
                      : `Walk-in • ${o.lab?.name || "Lab"}`
                  }
                  amount={money(o.payableAmount)}
                  badge={o.orderStatus}
                  last={i === Math.min(openLab.length, 3) - 1}
                  onPress={() => router.push(`/rmrider/lab/order/${o.orderId}`)}
                />
              ))}
            </Panel>
          </>
        )}

        {/* ================= QUICK ACTIONS ================= */}

        <SectionTitle>Quick Actions</SectionTitle>

        <ActionGrid items={ACTIONS} onPress={(a) => router.push(a.route)} />
      </ScrollView>
    </View>
  );
}
