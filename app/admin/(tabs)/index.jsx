import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppointments } from "../../../context/AppointmentContext";
import { useAuth } from "../../../context/AuthContext";

/* ================= MAIN SCREEN ================= */

export default function AdminDashboard() {
  const[appointments]=useAppointments();
  const {user}=useAuth();
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Admin Panel</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notifyBtn}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#475569"
              />
            </TouchableOpacity>
            <Image
              source={{ uri: user?.profileImage }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* OVERVIEW */}
        <View style={styles.sectionPadding}>
          <View style={styles.overview}>
            <Text style={styles.overviewTitle}>
              Dashboard Overview
            </Text>
            <Text style={styles.overviewSub}>
              Real-time hospital performance
            </Text>

            <View style={styles.overviewRow}>
              <OverviewStat label="Employees" value="48" />
              <OverviewStat label="Doctors" value="12" />
              <OverviewStat label="Patients" value="1.2k" />
              <OverviewStat label="Revenue" value="₹1L+" />
            </View>
          </View>
        </View>

        {/* SYSTEM STATUS */}
        <SectionDivider title="System Status" />
        <View style={styles.sectionPadding}>
          <View style={styles.statusBox}>
            <StatusItem label="Server" value="Online" color="#16a34a" />
            <StatusItem label="Queue" value="Normal" color="#ca8a04" />
            <StatusItem label="Alerts" value="0" color="#dc2626" />
          </View>
        </View>

     
        {/* QUICK STATS */}
<SectionDivider title="Quick Access" />
<View style={styles.sectionPadding}>
  <View style={styles.statsGrid}>

    <StatCard
      icon="people-outline"
      label="Manage Users"
      onPress={() => router.push("/admin/(tabs)/users")}
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
      icon="medkit-outline"
      label="Medicine Store"
      onPress={() => router.push("/medicine-store")}
    />

    {/* <StatCard
      icon="cube-outline"
      label="Medicine Orders"
      onPress={() => router.push("/admin/(tabs)/medicine-orders")}
    />

    <StatCard
      icon="analytics-outline"
      label="Reports"
      onPress={() => router.push("/admin/(tabs)/reports-analysis")}
    /> */}

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
          <QuickAction icon="add-circle" label="Add Employee" onPress={() => router.push("/admin/employee/add")} />
          <QuickAction icon="person-add" label="Add Patient" onPress={() => router.push("/admin/addpatient")} />
          <QuickAction icon="time" label="Create Payroll" onPress={() => router.push("/admin/roles")} />
          <QuickAction icon="medkit" label="Medicine Management" onPress={() => router.push("/admin/medicine")} />
          <QuickAction icon="flask" label="Lab Management" />
          <QuickAction icon="analytics" label="Reports & Analytics" />
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
    paddingTop: 16,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notifyBtn: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 999,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
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
