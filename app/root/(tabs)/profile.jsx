import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileNameEditor from "../../../components/shared/ProfileNameEditor";
import ProfileAvatarUploader from "../../../components/shared/ProfileAvatarUploader";
import { useAuth } from "../../../context/AuthContext";
import { roleLabel } from "../../../utils/roleLabels";

const PRIMARY = "#14b8a6";

export default function Profile() {
  const { logout, user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

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

  const SettingRow = ({ icon, label }) => (
    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
      <View style={styles.settingRowLeft}>
        <View style={styles.settingIconBg}>
          <Ionicons name={icon} size={18} color="#475569" />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Curved / Large Header Background */}
      <View style={styles.headerBackground} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: Math.max(insets.top, 20) }}
      >
        <Text style={styles.pageTitle}>My Profile</Text>

        {/* ================= PROFILE CARD ================= */}
        <View style={styles.headerCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <ProfileAvatarUploader
                user={user}
                onUploadSuccess={(newUrl) => updateUser({ profileImage: newUrl })}
              />
            </View>
            <View style={styles.profileInfo}>
              <ProfileNameEditor user={user} onNameUpdated={(newName) => updateUser({ name: newName })} />
              <Text style={styles.phoneText}>{user?.phone || "No phone added"}</Text>
              
              <View style={styles.badgesRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{roleLabel(user?.roles?.[0], "User").toUpperCase()}</Text>
                </View>
                {user?.kycStatus === "verified" && (
                  <View style={[styles.roleBadge, { backgroundColor: "#dcfce7" }]}>
                    <Ionicons name="checkmark-circle" size={12} color="#166534" style={{ marginRight: 4 }} />
                    <Text style={[styles.roleText, { color: "#166534" }]}>VERIFIED</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ================= QUICK ACTIONS ================= */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionTile} onPress={() => router.push("/mymedicineorder")}>
            <View style={[styles.actionIconBg, { backgroundColor: "#e0f2fe" }]}>
              <Ionicons name="cube" size={26} color="#0ea5e9" />
            </View>
            <Text style={styles.actionText}>My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionTile} onPress={() => router.push("/root/appointments")}>
            <View style={[styles.actionIconBg, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="calendar" size={26} color="#d97706" />
            </View>
            <Text style={styles.actionText}>Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionTile} onPress={() => router.push("/lab/my-orders")}>
            <View style={[styles.actionIconBg, { backgroundColor: "#f3e8ff" }]}>
              <Ionicons name="flask" size={26} color="#9333ea" />
            </View>
            <Text style={styles.actionText}>Lab Tests</Text>
          </TouchableOpacity>
        </View>

        {/* ================= SETTINGS MENU ================= */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon="person-outline" label="Account Details" />
            <SettingRow icon="location-outline" label="Saved Addresses" />
            <SettingRow icon="wallet-outline" label="Wallet & Payments" />
            <View style={styles.divider} />
            <SettingRow icon="notifications-outline" label="Notifications" />
          </View>
          
          <Text style={styles.sectionTitle}>Support & About</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon="help-buoy-outline" label="Help & Support" />
            <View style={styles.divider} />
            <SettingRow icon="document-text-outline" label="Terms & Conditions" />
            <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" />
          </View>
        </View>

        {/* ================= LOGOUT BUTTON ================= */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.85}
          style={styles.logoutBtn}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.appVersion}>RMDOCTO v1.0.1</Text>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  headerBackground: {
    backgroundColor: PRIMARY,
    height: 200,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    paddingHorizontal: 24,
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  /* PROFILE CARD */
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    elevation: 8,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  phoneText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
    flexWrap: "wrap",
  },
  roleBadge: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  roleText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
  },

  /* QUICK ACTIONS */
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  actionTile: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },

  /* SETTINGS SECTION */
  settingsSection: {
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 12,
    marginLeft: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 28,
    paddingVertical: 8,
    elevation: 3,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  settingRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginLeft: 70, // Align with text
    marginRight: 20,
  },

  /* LOGOUT */
  logoutBtn: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#fca5a5",
    elevation: 2,
    marginBottom: 24,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "800",
  },
  
  appVersion: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#cbd5e1",
  }
});
