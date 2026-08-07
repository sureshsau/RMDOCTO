import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileNameEditor from "../../../components/shared/ProfileNameEditor";
import ProfileAvatarUploader from "../../../components/shared/ProfileAvatarUploader";
import { useAuth } from "../../../context/AuthContext";
import { roleLabel } from "../../../utils/roleLabels";

const PRIMARY = "#1BA6A6";

export default function Profile() {
  const { logout, user, updateUser } = useAuth();

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

  const DetailItem = ({ icon, label, value }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={18} color="#64748B" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>
        {value || "—"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ================= HEADER CARD ================= */}
        <View style={styles.headerCard}>
          <ProfileAvatarUploader 
            user={user} 
            onUploadSuccess={(newUrl) => updateUser({ profileImage: newUrl })} 
          />

          <ProfileNameEditor user={user} onNameUpdated={(newName) => updateUser({ name: newName })} />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <View style={[styles.roleBadge, { marginTop: 0 }]}>
            <Text style={styles.roleText}>
              {roleLabel(user?.roles?.[0], "User").toUpperCase()}
            </Text>
          </View>
            {user?.kycStatus === "verified" && (
              <View style={[styles.roleBadge, { marginTop: 0, backgroundColor: "#dcfce7" }]}>
                <Text style={[styles.roleText, { color: "#166534" }]}>
                  <Ionicons name="checkmark-circle" size={12} color="#166534" /> KYC VERIFIED
                </Text>
              </View>
            )}
          </View>
        </View>



        {/* ================= DETAILS CARD ================= */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Account Details
          </Text>

          <DetailItem
            icon="call-outline"
            label="Phone"
            value={user?.phone}
          />

          <DetailItem
            icon="shield-checkmark-outline"
            label="Roles"
            value={
              user?.roles?.length
                ? user.roles.join(", ")
                : "—"
            }
          />

          <DetailItem
            icon="grid-outline"
            label="Dashboard"
            value="Doctor"
          />
        </View>

        {/* ================= LOGOUT BUTTON ================= */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.85}
          style={styles.logoutBtn}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#fff"
          />
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
  },

  /* HEADER */
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 30,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 12,
  },

  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  roleBadge: {
    marginTop: 8,
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
  },

  /* RM COIN CARD */
  rmCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
  },

  rmLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  rmLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },

  rmValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#CA8A04",
  },

  /* DETAILS CARD */
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
    color: "#0F172A",
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },

  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    maxWidth: "55%",
    textAlign: "right",
  },

  /* LOGOUT */
  logoutBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
  },

  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
