import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmployeeDetails() {
  const { name, role, department, status, id, faceUri } = useLocalSearchParams();
  const isActive = status === "Active";
  const safeFaceUri = (faceUri && faceUri !== "null" && faceUri !== "undefined" && faceUri !== "") ? faceUri : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ================= PROFILE CARD ================= */}
        <View style={styles.profileCard}>
          {safeFaceUri ? (
            <Image
              source={{ uri: safeFaceUri }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: "#E2E8F0", justifyContent: "center", alignItems: "center" }]}>
              <Ionicons name="person" size={40} color="#94A3B8" />
            </View>
          )}

          <Text style={styles.name}>{name}</Text>

          <Text style={styles.meta}>
            {role} • {department}
          </Text>

          <View
            style={[
              styles.statusBadge,
              isActive ? styles.activeBg : styles.inactiveBg,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isActive ? styles.activeText : styles.inactiveText,
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        {/* ================= DETAILS ================= */}
        <View style={styles.card}>
          <DetailRow label="Full Name" value={name} />
          <DetailRow label="Role" value={role} />
          <DetailRow label="Department" value={department} />
          <DetailRow label="Employment Status" value={status} />
          <DetailRow label="Shift Timing" value="9:00 AM – 6:00 PM" />
          <DetailRow label="Employee ID" value="EMP-1023" />
          <DetailRow label="Joining Date" value="12 Aug 2024" />
          <DetailRow label="Monthly Salary" value="₹40,000" />
        </View>

        {/* ================= CHANGE SHIFT TIMING ================= */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Change Shift Timing</Text>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Current Shift</Text>
            <Text style={styles.valueBold}>9:00 AM – 6:00 PM</Text>
          </View>

          <TouchableOpacity style={styles.primaryOutlineBtn}>
            <Text style={styles.primaryOutlineText}>
              Morning Shift (9:00 AM – 6:00 PM)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineBtn}>
            <Text style={styles.outlineText}>
              Evening Shift (2:00 PM – 10:00 PM)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineBtn}>
            <Text style={styles.outlineText}>
              Night Shift (10:00 PM – 6:00 AM)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>
              Save Shift Timing
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= MONTHLY ATTENDANCE ================= */}
        <View style={styles.card}>
          <View style={styles.rowCenter}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#6b6dbf"
            />
            <Text style={styles.attendanceTitle}>
              Monthly Attendance (Jan 2026)
            </Text>
          </View>

          <DetailRow label="Present Days" value="22 Days" />
          <DetailRow label="Absent Days" value="2 Days" />
          <DetailRow label="Leave Taken" value="1 Day" />
          <DetailRow label="Working Days" value="25 Days" />
        </View>

        {/* ================= ACTIONS ================= */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: `/admin/employee/${id}/edit`,
              params: { name, role, department, status },
            })
          }
          style={styles.primaryBtnLarge}
        >
          <Text style={styles.primaryBtnText}>
            Edit Employee
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => alert("Employee Deleted")}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteText}>
            Delete Employee
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= COMPONENT ================= */

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef0fa",
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#6b6dbf",
    flexDirection: "row",
    alignItems: "center",
  },

  backBtn: {
    marginRight: 12,
    padding: 8,
    marginLeft: -8,
    borderRadius: 999,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },

  content: {
    padding: 20,
  },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
    elevation: 5,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
  },

  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },

  meta: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },

  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 999,
  },

  activeBg: {
    backgroundColor: "#dcfce7",
  },

  inactiveBg: {
    backgroundColor: "#fee2e2",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  activeText: {
    color: "#15803d",
  },

  inactiveText: {
    color: "#dc2626",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  attendanceTitle: {
    marginLeft: 8,
    fontWeight: "800",
    color: "#1e293b",
  },

  label: {
    color: "#64748b",
    fontWeight: "600",
  },

  valueBold: {
    fontWeight: "700",
    color: "#0f172a",
  },

  outlineBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  outlineText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#334155",
  },

  primaryOutlineBtn: {
    borderWidth: 1,
    borderColor: "#6b6dbf",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  primaryOutlineText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#6b6dbf",
  },

  primaryBtn: {
    backgroundColor: "#6b6dbf",
    borderRadius: 12,
    padding: 16,
  },

  primaryBtnLarge: {
    backgroundColor: "#6b6dbf",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },

  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
  },

  deleteBtn: {
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },

  deleteText: {
    color: "#dc2626",
    fontWeight: "800",
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  detailLabel: {
    fontSize: 14,
    color: "#64748b",
  },

  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
});
