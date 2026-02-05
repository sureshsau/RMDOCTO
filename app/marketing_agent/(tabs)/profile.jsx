import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";

const PRIMARY = "#6b6dbf";

export default function Profile() {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/auth/login");
          },
        },
      ]
    );
  };

  const Detail = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>
        {value || "—"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* AVATAR */}
        <Ionicons
          name="person-circle-outline"
          size={88}
          color={PRIMARY}
        />

        {/* NAME */}
        <Text style={styles.name}>
          {user?.name || "User"}
        </Text>

        {/* ROLE */}
        {user?.role && (
          <Text style={styles.role}>
            {user.role.toUpperCase()}
          </Text>
        )}

        {/* DETAILS */}
        <View style={styles.detailsBox}>
          <Detail label="Email" value={user?.email} />
          <Detail label="Phone" value={user?.phone} />
          <Detail label="User ID" value={user?._id} />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.85}
          style={styles.logoutBtn}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color="white"
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef0fa",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 8,
  },
  role: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: 16,
    marginTop: 2,
    letterSpacing: 1,
  },
  detailsBox: {
    width: "100%",
    marginBottom: 28,
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  detailLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },
  detailValue: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "65%",
    textAlign: "right",
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
  },
});
