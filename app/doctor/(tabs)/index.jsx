import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import {
  ActionGrid,
  BG,
  DashboardHeader,
  EmptyState,
  Loader,
  MetricRow,
  Panel,
  PRIMARY,
  PRIMARY_DARK,
  ListRow,
  SectionTitle,
  StatCard,
  StatStrip,
  money,
  monthRange,
  parseAttendance,
} from "../../../components/shared/dashboard/DashboardKit";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../services/axios";

const ACTIONS = [
  { icon: "calendar-outline", tint: "#0891b2", title: "Appointments", subtitle: "All bookings", route: "/doctor/appointments" },
  { icon: "scan-outline", tint: "#6366f1", title: "Check-In", subtitle: "Mark attendance", route: "/doctor/face-verification" },
  { icon: "storefront-outline", tint: "#14b8a6", title: "Medicine Store", subtitle: "Buy medicines", route: "/medicine-store" },
  { icon: "cube-outline", tint: "#8b5cf6", title: "My Orders", subtitle: "Track orders", route: "/mymedicineorder" },
  { icon: "flask-outline", tint: "#10b981", title: "Lab Tests", subtitle: "Book diagnostics", route: "/lab" },
  { icon: "receipt-outline", tint: "#64748b", title: "My Lab Orders", subtitle: "Test reports", route: "/lab/my-orders" },
  { icon: "wallet-outline", tint: "#d97706", title: "RM Coins", subtitle: "Balance & history", route: "/rmcoin" },
  { icon: "pricetags-outline", tint: "#ec4899", title: "Special Offers", subtitle: "Active promos", route: "/offers" },
];

export default function DoctorDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const alive = useRef(true);

  const [profile, setProfile] = useState(null);
  const [today, setToday] = useState([]);
  const [monthCount, setMonthCount] = useState(0);
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
    const [me, todayRes, monthRes, att] = await Promise.allSettled([
      api.get("/user/me"),
      api.get("/appointment/doctor/bookings", {
        params: { filterType: "today", page: 1, limit: 50 },
      }),
      api.get("/appointment/doctor/bookings", {
        params: { filterType: "month", page: 1, limit: 1 },
      }),
      api.get("/attendance/log/me", { params: { from, to, page: 1, limit: 31 } }),
    ]);

    if (!alive.current) return;

    if (me.status === "fulfilled") setProfile(me.value.data?.data || null);

    if (todayRes.status === "fulfilled") {
      setToday(todayRes.value.data?.data || []);
    }

    if (monthRes.status === "fulfilled") {
      setMonthCount(monthRes.value.data?.pagination?.totalRecords ?? 0);
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

  const displayName = profile?.name || user?.name || "Doctor";
  const avatarUrl = profile?.faceImage?.url || user?.faceImage?.url || null;

  // Appointments carry no status field, so "upcoming" is time-based only.
  const todayFees = today.reduce((sum, a) => sum + (a.consultationFee || 0), 0);

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
          role="DOCTOR"
          avatarUrl={avatarUrl}
          meta={todayLabel}
          onAvatarPress={() => router.push("/doctor/(tabs)/profile")}
          alert={
            attendance && !attendance.checkedInToday
              ? {
                  icon: "scan-outline",
                  text: "You haven't checked in today",
                  onPress: () => router.push("/doctor/face-verification"),
                }
              : null
          }
        />

        <StatStrip>
          <StatCard
            icon="people-outline"
            tint={PRIMARY_DARK}
            label="Today"
            value={today.length}
            meta={today.length === 1 ? "patient" : "patients"}
            onPress={() => router.push("/doctor/appointments")}
          />
          <StatCard
            icon="calendar-outline"
            tint="#6366f1"
            label="This Month"
            value={monthCount}
            meta="appointments"
            onPress={() => router.push("/doctor/appointments")}
          />
          <StatCard
            icon="checkmark-done-outline"
            tint="#10b981"
            label="Present"
            value={attendance?.presentDays ?? 0}
            meta="days this month"
            onPress={() => router.push("/doctor/(tabs)/attendance")}
          />
        </StatStrip>

        {/* ================= TODAY AT A GLANCE ================= */}

        <Panel title="Today at a Glance">
          {loading ? (
            <Loader />
          ) : (
            <MetricRow
              items={[
                { label: "Patients", value: today.length },
                { label: "Fees", value: money(todayFees), tone: PRIMARY_DARK },
                {
                  label: "Hours",
                  value: attendance?.totalHours ?? 0,
                  tone: "#6366f1",
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

        {/* ================= TODAY'S SCHEDULE ================= */}

        <SectionTitle
          linkLabel={today.length > 0 ? "See all" : null}
          onLink={() => router.push("/doctor/appointments")}
        >
          Today’s Schedule
        </SectionTitle>

        <Panel flush style={{ marginTop: 0 }}>
          {loading ? (
            <Loader />
          ) : today.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No appointments today"
              actionLabel="View all appointments"
              onPress={() => router.push("/doctor/appointments")}
            />
          ) : (
            today.slice(0, 5).map((a, i) => (
              <ListRow
                key={String(a._id)}
                icon="person-outline"
                iconTint={PRIMARY}
                title={a.patientName || "Patient"}
                subtitle={[
                  a.patientPhone,
                  a.patientAge ? `${a.patientAge} yrs` : null,
                  a.patientGender,
                ]
                  .filter(Boolean)
                  .join(" • ")}
                amount={a.appointmentTime || "-"}
                last={i === Math.min(today.length, 5) - 1}
                onPress={() => router.push("/doctor/appointments")}
              />
            ))
          )}
        </Panel>

        {today.length > 5 && (
          <Text
            style={{
              paddingHorizontal: 16,
              marginTop: 8,
              fontSize: 11,
              color: "#94a3b8",
              fontWeight: "600",
            }}
          >
            +{today.length - 5} more today
          </Text>
        )}

        {/* ================= QUICK ACTIONS ================= */}

        <SectionTitle>Quick Actions</SectionTitle>

        <ActionGrid items={ACTIONS} onPress={(a) => router.push(a.route)} />
      </ScrollView>
    </View>
  );
}
