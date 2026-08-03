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
  monthRange,
  parseAttendance,
  shortDate,
} from "../../../components/shared/dashboard/DashboardKit";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../services/axios";

const ACTIONS = [
  { icon: "cart-outline", tint: "#6366f1", title: "Order for Customer", subtitle: "Place an order", route: "/receptionist/create-order" },
  { icon: "receipt-outline", tint: "#0ea5e9", title: "Medicine Orders", subtitle: "All orders", route: "/receptionist/(tabs)/medicineorder" },
  { icon: "people-outline", tint: "#0891b2", title: "Patients", subtitle: "Appointments", route: "/receptionist/appointments" },
  { icon: "medkit-outline", tint: "#ef4444", title: "Book Doctor", subtitle: "New appointment", route: "/doctor-booking" },
  { icon: "cube-outline", tint: "#8b5cf6", title: "Medicine Stock", subtitle: "Manage catalogue", route: "/receptionist/medicine" },
  { icon: "scan-outline", tint: "#a855f7", title: "Check-In", subtitle: "Mark attendance", route: "/receptionist/face-verification" },
  { icon: "storefront-outline", tint: "#14b8a6", title: "Medicine Store", subtitle: "Buy medicines", route: "/medicine-store" },
  { icon: "bag-outline", tint: "#0d9488", title: "My Orders", subtitle: "Track orders", route: "/mymedicineorder" },
  { icon: "flask-outline", tint: "#10b981", title: "Lab Tests", subtitle: "Book diagnostics", route: "/lab" },
  { icon: "document-text-outline", tint: "#64748b", title: "My Lab Orders", subtitle: "Test reports", route: "/lab/my-orders" },
  { icon: "wallet-outline", tint: "#d97706", title: "RM Coins", subtitle: "Balance & history", route: "/rmcoin" },
  { icon: "pricetags-outline", tint: "#ec4899", title: "Special Offers", subtitle: "Active promos", route: "/offers" },
];

export default function ReceptionistDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const alive = useRef(true);

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState({ recent: [], total: 0 });
  const [awaiting, setAwaiting] = useState(0);
  const [appointments, setAppointments] = useState({ today: [], total: 0 });
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

    // Independent panels — one failing endpoint must not blank the dashboard.
    // Counts come from the server's totalRecords rather than a page length, so
    // they stay accurate beyond the first page.
    const [me, recent, confirmed, today, att] = await Promise.allSettled([
      api.get("/user/me"),
      api.get("/medicine/order/view/all", { params: { page: 1, limit: 5 } }),
      api.get("/medicine/order/view/all", {
        params: { page: 1, limit: 1, orderStatus: "CONFIRMED" },
      }),
      api.get("/appointment/bookings", {
        params: { page: 1, limit: 5, type: "today" },
      }),
      api.get("/attendance/log/me", { params: { from, to, page: 1, limit: 31 } }),
    ]);

    if (!alive.current) return;

    if (me.status === "fulfilled") setProfile(me.value.data?.data || null);

    if (recent.status === "fulfilled") {
      setOrders({
        recent: recent.value.data?.data || [],
        total: recent.value.data?.totalRecords ?? 0,
      });
    }

    if (confirmed.status === "fulfilled") {
      setAwaiting(confirmed.value.data?.totalRecords ?? 0);
    }

    if (today.status === "fulfilled") {
      setAppointments({
        today: today.value.data?.data || [],
        total: today.value.data?.pagination?.totalRecords ?? 0,
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

  const displayName = profile?.name || user?.name || "Receptionist";
  const avatarUrl = profile?.faceImage?.url || user?.faceImage?.url || null;

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
          role="RECEPTIONIST"
          avatarUrl={avatarUrl}
          meta={todayLabel}
          onAvatarPress={() => router.push("/receptionist/(tabs)/profile")}
          alert={
            attendance && !attendance.checkedInToday
              ? {
                  icon: "scan-outline",
                  text: "You haven't checked in today",
                  onPress: () => router.push("/receptionist/face-verification"),
                }
              : null
          }
        />

        <StatStrip>
          <StatCard
            icon="calendar-outline"
            tint="#0891b2"
            label="Today"
            value={appointments.total}
            meta="appointments"
            onPress={() => router.push("/receptionist/appointments")}
          />
          <StatCard
            icon="time-outline"
            tint="#b45309"
            label="Awaiting"
            value={awaiting}
            meta="to dispatch"
            onPress={() => router.push("/receptionist/(tabs)/medicineorder")}
          />
          <StatCard
            icon="cube-outline"
            tint={PRIMARY_DARK}
            label="Orders"
            value={orders.total}
            meta="all time"
            onPress={() => router.push("/receptionist/(tabs)/medicineorder")}
          />
        </StatStrip>

        {/* ================= TODAY ================= */}

        <Panel title="Front Desk Today">
          {loading ? (
            <Loader />
          ) : (
            <MetricRow
              items={[
                { label: "Appointments", value: appointments.total },
                { label: "To dispatch", value: awaiting, tone: "#b45309" },
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

        {/* ================= LATEST ORDERS ================= */}

        <SectionTitle
          linkLabel="View all"
          onLink={() => router.push("/receptionist/(tabs)/medicineorder")}
        >
          Latest Orders
        </SectionTitle>

        <Panel flush style={{ marginTop: 0 }}>
          {loading ? (
            <Loader />
          ) : orders.recent.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="No orders yet"
              actionLabel="Place an order for a customer"
              onPress={() => router.push("/receptionist/create-order")}
            />
          ) : (
            orders.recent.slice(0, 4).map((o, i) => (
              <ListRow
                key={String(o.orderId)}
                image={o.medicine?.image || null}
                icon="medkit-outline"
                title={o.customer?.name || "Customer"}
                subtitle={`${o.medicine?.name || "Medicine"} • ${shortDate(o.createdAt)}`}
                amount={money(o.payableAmount)}
                badge={o.orderStatus}
                last={i === Math.min(orders.recent.length, 4) - 1}
                onPress={() =>
                  router.push({
                    pathname: "/receptionist/(tabs)/medicineorder/[orderId]",
                    params: { orderId: o.orderId },
                  })
                }
              />
            ))
          )}
        </Panel>

        {/* ================= TODAY'S APPOINTMENTS ================= */}

        <SectionTitle
          linkLabel="View all"
          onLink={() => router.push("/receptionist/appointments")}
        >
          Today’s Appointments
        </SectionTitle>

        <Panel flush style={{ marginTop: 0 }}>
          {loading ? (
            <Loader />
          ) : appointments.today.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No appointments today"
              actionLabel="Book a doctor"
              onPress={() => router.push("/doctor-booking")}
            />
          ) : (
            appointments.today.slice(0, 4).map((a, i) => (
              <ListRow
                key={String(a._id)}
                icon="person-outline"
                iconTint={PRIMARY}
                title={a.patientName || "Patient"}
                subtitle={[a.doctorId?.name && `Dr. ${a.doctorId.name}`, a.patientPhone]
                  .filter(Boolean)
                  .join(" • ")}
                amount={a.appointmentTime || "-"}
                last={i === Math.min(appointments.today.length, 4) - 1}
                onPress={() => router.push("/receptionist/appointments")}
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
