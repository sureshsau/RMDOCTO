import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NotificationBell from "../../../components/shared/NotificationBell";
import {
  moneyShort,
} from "../../../components/shared/dashboard/DashboardKit";
import api from "../../../services/axios";

/* Anyone on the payroll. Doctors are counted separately, and agents /
   marketing agents are partners rather than employees. */
const STAFF_ROLES = ["admin", "subadmin", "employee", "receptionist", "rmrider"];

/* A patient is a plain account: no staff, doctor or partner role */
const NON_PATIENT_ROLES = [...STAFF_ROLES, "doctor", "agent", "marketing_agent"];

const compactCount = (n) => {
  const v = Number(n || 0);
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
};

/* ================= MAIN SCREEN ================= */

export default function AdminDashboard() {
  const alive = useRef(true);

  const [stats, setStats] = useState(null);
  const [apiUp, setApiUp] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= FETCH ================= */

  const load = useCallback(async () => {
    const [analytics, users] = await Promise.allSettled([
      api.get("/admin/analytics"),
      api.get("/user"),
    ]);

    if (!alive.current) return;

    const list =
      users.status === "fulfilled" ? users.value.data?.data || [] : null;

    const hasRole = (u, roles) => (u.roles || []).some((r) => roles.includes(r));

    setApiUp(analytics.status === "fulfilled");

    setStats({
      revenue:
        analytics.status === "fulfilled"
          ? analytics.value.data?.data?.overall?.totalRevenue ?? 0
          : null,
      bookings:
        analytics.status === "fulfilled"
          ? analytics.value.data?.data?.overall?.totalBookings ?? 0
          : null,
      employees: list ? list.filter((u) => hasRole(u, STAFF_ROLES)).length : null,
      doctors: list ? list.filter((u) => hasRole(u, ["doctor"])).length : null,
      patients: list
        ? list.filter((u) => !hasRole(u, NON_PATIENT_ROLES)).length
        : null,
      pendingKyc: list
        ? list.filter((u) => u.kycStatus === "pending").length
        : null,
      blocked: list
        ? list.filter((u) => u.isBlocked || u.isActive === false).length
        : null,
    });
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

  /* Never render a number we don't have — a dash beats an invented figure */
  const show = (v, format = String) =>
    loading ? "…" : v === null || v === undefined ? "—" : format(v);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6b6dbf"
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Admin Panel</Text>
          </View>

          <NotificationBell />
        </View>

        {/* OVERVIEW */}
        <View style={styles.sectionPadding}>
          <View style={styles.overview}>
            <Text style={styles.overviewTitle}>
              Dashboard Overview
            </Text>
            <Text style={styles.overviewSub}>
              {show(stats?.bookings, (v) => `${compactCount(v)} bookings all time`)}
            </Text>

            <View style={styles.overviewRow}>
              <OverviewStat
                label="Employees"
                value={show(stats?.employees, compactCount)}
              />
              <OverviewStat
                label="Doctors"
                value={show(stats?.doctors, compactCount)}
              />
              <OverviewStat
                label="Patients"
                value={show(stats?.patients, compactCount)}
              />
              <OverviewStat
                label="Revenue"
                value={show(stats?.revenue, moneyShort)}
              />
            </View>
          </View>
        </View>

        {/* SYSTEM STATUS */}
        <SectionDivider title="System Status" />
        <View style={styles.sectionPadding}>
          <View style={styles.statusBox}>
            <StatusItem
              label="API"
              value={loading ? "…" : apiUp ? "Online" : "Offline"}
              color={apiUp ? "#16a34a" : "#dc2626"}
            />
            <StatusItem
              label="Pending KYC"
              value={show(stats?.pendingKyc)}
              color={stats?.pendingKyc ? "#ca8a04" : "#16a34a"}
            />
            <StatusItem
              label="Blocked"
              value={show(stats?.blocked)}
              color={stats?.blocked ? "#dc2626" : "#16a34a"}
            />
          </View>
        </View>


        {/* QUICK STATS */}
        <SectionDivider title="Quick Access" />
        <View style={styles.sectionPadding}>
          <View style={styles.statsGrid}>

            <StatCard
              icon="walk-outline"
              label="RM Member Meet"
              onPress={() => router.push("/admin/meet")}
            />

            <StatCard
              icon="card-outline"
              label="RM Credit"
              onPress={() => router.push("/admin/rmcredit")}
            />

            <StatCard
              icon="calendar-outline"
              label="Appointments"
              onPress={() => router.push("/admin/appointments")}
            />

            <StatCard
              icon="wallet-outline"
              label="Wallet"
              onPress={() => router.push("/admin/rmcoin")}
            />

            <StatCard
              icon="pricetag-outline"
              label="Promo Offers"
              onPress={() => router.push("/admin/manage-offers")}
            />

            <StatCard
              icon="megaphone-outline"
              label="Send Notification"
              onPress={() => router.push("/admin/notifications/send")}
            />

            <StatCard
              icon="trophy-outline"
              label="RM Member Targets"
              onPress={() => router.push("/admin/manage-targets")}
            />

            <StatCard
              icon="medkit-outline"
              label="Medicine Store"
              onPress={() => router.push("/medicine-store")}
            />

            <StatCard
              icon="receipt-outline"
              label="Medicine Orders"
              onPress={() => router.push("/admin/(tabs)/medicineorder")}
            />

            <StatCard
              icon="flask-outline"
              label="Lab Management"
              onPress={() => router.push("/admin/lab")}
            />

            <StatCard
              icon="receipt-outline"
              label="Lab Orders"
              onPress={() => router.push("/admin/lab/lab-orders")}
            />

          </View>
        </View>

        {/* STAFF ONLINE */}
        <SectionDivider title="Staff Online" />
        {/* <View style={styles.onlineRow}>
          <OnlineAvatar name="Dr. Alex" />
          <OnlineAvatar name="Nurse Riya" />
          <OnlineAvatar name="Reception" />
        </View> */}

        {/* QUICK ACTIONS */}
        <SectionDivider title="Admin Actions" />
        <View style={styles.sectionPadding}>
          <QuickAction icon="add-circle" label="my medicine order" onPress={() => router.push("/mymedicineorder")} />
          <QuickAction icon="receipt-outline" label="View All Medicine Orders" onPress={() => router.push("/admin/(tabs)/medicineorder")} />
          <QuickAction icon="cart" label="Order for Customer" onPress={() => router.push("/admin/orders/create")} />
          <QuickAction icon="megaphone" label="Send Notification" onPress={() => router.push("/admin/notifications/send")} />
          <QuickAction icon="paper-plane" label="Sent Notifications" onPress={() => router.push("/admin/notifications")} />
          <QuickAction icon="notifications" label="RM Member Alerts" onPress={() => router.push("/admin/agent-alerts")} />
          <QuickAction icon="walk" label="RM Member Meet Plan" onPress={() => router.push("/admin/meet")} />
          <QuickAction icon="add-circle" label="Add Employee" onPress={() => router.push("/admin/employee/add")} />
          <QuickAction icon="person-add" label="Add Patient" onPress={() => router.push("/admin/addpatient")} />
          <QuickAction icon="time" label="Create Payroll" onPress={() => router.push("/admin/roles")} />
          <QuickAction icon="medkit" label="Medicine Management" onPress={() => router.push("/admin/medicine")} />
          <QuickAction icon="flask" label="Lab Management" onPress={() => router.push("/admin/lab")} />
          <QuickAction icon="flask-outline" label="All Lab Tests" onPress={() => router.push("/admin/lab/tests-list")} />
          <QuickAction icon="receipt-outline" label="Lab Orders" onPress={() => router.push("/admin/lab/lab-orders")} />
          <QuickAction icon="analytics" label="Reports & Analytics" onPress={() => router.push("/admin/analytics")} />
        </View>

        {/* RECENT ACTIVITY */}
        {/* <SectionDivider title="Recent Activity" />
        <View style={styles.sectionPadding}>
          <ActivityCard title="New doctor added" subtitle="Dr. Alex Morgan" />
          <ActivityCard title="Appointment booked" subtitle="Patient: Rahul Das" />
          <ActivityCard title="Payment received" subtitle="₹1,200 OPD" />
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function SectionDivider({ title }) {
  return (
    <View style={styles.divider}>
      <Text style={styles.dividerText}>{title}</Text>
    </View>
  );
}

function OverviewStat({ label, value }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

function StatusItem({ label, value, color }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontWeight: "800", color }}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={22} color="#6b6dbf" />
      </View>

      <Text style={styles.statLabelNew}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.85}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name={icon} size={22} color="#6b6dbf" />
        <Text style={styles.quickText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </TouchableOpacity>
  );
}

function ActivityCard({ title, subtitle }) {
  return (
    <View style={styles.activity}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySub}>{subtitle}</Text>
    </View>
  );
}

function OnlineAvatar({ name }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View>
        <Image source={{ uri: "https://i.pravatar.cc/100" }} style={styles.onlineAvatar} />
        <View style={styles.onlineDot} />
      </View>
      <Text style={styles.onlineName}>{name}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e6e9f8" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sectionPadding: { paddingHorizontal: 20 },

  overview: {
    backgroundColor: "#6b6dbf",
    borderRadius: 28,
    padding: 24,
  },
  overviewTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  overviewSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 20,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  overviewLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },

  divider: {
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 16,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  statusBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 12,
    color: "#64748b",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statIcon: {
    backgroundColor: "rgba(107,109,191,0.15)",
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803d",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  onlineRow: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 20,
  },
  onlineAvatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    backgroundColor: "#22c55e",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#fff",
  },
  onlineName: {
    fontSize: 12,
    color: "#334155",
    marginTop: 4,
  },

  quickAction: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quickText: {
    marginLeft: 12,
    fontWeight: "600",
    color: "#1e293b",
  },

  activity: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  activityTitle: {
    fontWeight: "600",
    color: "#0f172a",
  },
  activitySub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  statLabelNew: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 10,
  },
});
