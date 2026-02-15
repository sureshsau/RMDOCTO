import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function ReceptionistDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={26} color="#94A3B8" />
                </View>
              )}

              <View>
                <Text style={styles.greeting}>
                  Welcome Back 👋
                </Text>
                <Text style={styles.name}>
                  {user?.name || "User"}
                </Text>

                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {user?.roles?.[0]?.toUpperCase() ||
                      "RECEPTIONIST"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================= DATE CARD ================= */}
          <View style={styles.dateCard}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#1BA6A6"
            />
            <Text style={styles.dateText}>
              {formattedDate}
            </Text>
          </View>

          {/* ================= RM COIN CARD ================= */}
          <View style={styles.rmCard}>
            <View style={styles.rmRow}>
              <Ionicons
                name="wallet-outline"
                size={22}
                color="#CA8A04"
              />
              <Text style={styles.rmLabel}>
                RM Coins Balance
              </Text>
            </View>

            <Text style={styles.rmValue}>
              ₹ {user?.rmCoinsBalance || 0}
            </Text>
          </View>

          {/* ================= QUICK ACTIONS ================= */}
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="people-outline"
              label="Patients"
              bgColor="#ECFEFF"
              iconColor="#0891B2"
              onPress={() => router.push("/receptionist/appointments")}
            />

            <QuickAction
              icon="medkit-outline"
              label="Doctors"
              bgColor="#E0F2FE"
              iconColor="#0284C7"
              onPress={() =>
                router.push("/receptionist/doctor")
              }
            />

            {/* <QuickAction
              icon="cube-outline"
              label="Medicine"
              bgColor="#DCFCE7"
              iconColor="#16A34A"
              onPress={() =>
                router.push("/receptionist/medicineorder")
              }
            /> */}

            <QuickAction
              icon="wallet-outline"
              label="RM Coins"
              bgColor="#FEF3C7"
              iconColor="#CA8A04"
              onPress={() =>
                router.push("/rmcoin")
              }
            />

            <QuickAction
              icon="log-in-outline"
              label="Check-In"
              bgColor="#D1F2EB"
              iconColor="#1BA6A6"
              onPress={() =>
                router.push("/receptionist/face-verification")
              }
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ================= SUB COMPONENT ================= */

function QuickAction({
  icon,
  label,
  bgColor,
  iconColor,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.quickActionItem}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={[styles.qaIconWrapper, { backgroundColor: bgColor }]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={iconColor}
        />
      </View>

      <Text style={styles.qaText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  /* HEADER */
  header: {
    marginBottom: 30,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  greeting: {
    fontSize: 13,
    color: "#64748B",
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 4,
  },

  roleBadge: {
    marginTop: 6,
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1BA6A6",
  },

  /* DATE CARD */
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,
    elevation: 2,
  },

  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },

  /* RM CARD */
  rmCard: {
    backgroundColor: "#FFFBEB",
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    elevation: 2,
  },

  rmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
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

  /* QUICK ACTIONS */
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  quickActionItem: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: "center",
    marginBottom: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  qaIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  qaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
  },
});
