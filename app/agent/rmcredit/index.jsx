import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRMCredit } from "../../../context/RMCreditContext";

export default function AgentRMCreditDashboard() {
  const { wallet, transactions, loading, refreshRMCredit } =
    useRMCredit();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshRMCredit();
    setRefreshing(false);
  }, []);

  /* ===== OTP VISIBILITY RULE ===== */
  const showOtp = useMemo(() => {
    if (!wallet?.revokeOtp) return false;
    if (!wallet?.revokeOtpExpiresAt) return false;

    const isExpired =
      new Date(wallet.revokeOtpExpiresAt) < new Date();

    return !isExpired;
  }, [wallet]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#14b8a6"]}
          />
        }
      >
        {/* ===== BALANCE CARD ===== */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            Available Balance
          </Text>

          <Text style={styles.balanceAmount}>
            ₹ {wallet.balance}
          </Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceSubLabel}>
                Total Credit
              </Text>
              <Text style={styles.balanceSubValue}>
                ₹ {wallet.totalCredit}
              </Text>
            </View>

            <View>
              <Text style={styles.balanceSubLabel}>
                Used Credit
              </Text>
              <Text style={styles.balanceSubValue}>
                ₹ {wallet.usedCredit}
              </Text>
            </View>
          </View>

          <Text style={styles.expiryText}>
            Expiry:{" "}
            {wallet.expiryDate
              ? wallet.expiryDate.slice(0, 10)
              : "-"}
          </Text>
        </View>

        {/* ===== OTP SECTION ===== */}
        {showOtp && (
          <View style={styles.otpCard}>
            <Text style={styles.otpTitle}>
              Revoke Request Pending
            </Text>

            <Text style={styles.otpAmount}>
              Amount: ₹ {wallet.revokeAmount || 0}
            </Text>

            <Text style={styles.otpCode}>
              OTP: {wallet.revokeOtp}
            </Text>

            <Text style={styles.otpExpiry}>
              Expires At:{" "}
              {new Date(
                wallet.revokeOtpExpiresAt
              ).toLocaleString()}
            </Text>
          </View>
        )}

        {/* ===== TRANSACTIONS ===== */}
        <Text style={styles.sectionTitle}>
          Recent Transactions
        </Text>

        {transactions.length === 0 && (
          <Text style={{ color: "#64748b" }}>
            No transactions found
          </Text>
        )}

        {transactions.map((tx) => {
          const type = tx.type?.toLowerCase();

          const config = {
            credit: {
              bg: "#dcfce7",
              color: "#16a34a",
              sign: "+",
            },
            revoke: {
              bg: "#fee2e2",
              color: "#dc2626",
              sign: "-",
            },
            debit: {
              bg: "#ffedd5",
              color: "#f97316",
              sign: "-",
            },
          }[type] || {
            bg: "#e0f2fe",
            color: "#14b8a6",
            sign: "",
          };

          return (
            <View key={tx._id} style={styles.txCard}>
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: config.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      { color: config.color },
                    ]}
                  >
                    {type?.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.txDesc}>
                  {tx.description}
                </Text>
              </View>

              <Text
                style={[
                  styles.txAmount,
                  { color: config.color },
                ]}
              >
                {config.sign} ₹ {tx.amount}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eefdfb",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ===== BALANCE CARD ===== */
  balanceCard: {
    backgroundColor: "#14b8a6",
    padding: 25,
    borderRadius: 24,
    marginBottom: 20,
  },

  balanceLabel: {
    color: "#ccfbf1",
    fontSize: 13,
  },

  balanceAmount: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
    marginVertical: 8,
  },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  balanceSubLabel: {
    color: "#ccfbf1",
    fontSize: 12,
  },

  balanceSubValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  expiryText: {
    color: "#e6fffa",
    marginTop: 10,
    fontSize: 12,
  },

  /* ===== OTP CARD ===== */
  otpCard: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },

  otpTitle: {
    fontWeight: "700",
    color: "#14b8a6",
    marginBottom: 8,
  },

  otpAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f766e",
  },

  otpCode: {
    fontSize: 20,
    fontWeight: "800",
    color: "#dc2626",
    marginVertical: 6,
  },

  otpExpiry: {
    fontSize: 12,
    color: "#64748b",
  },

  /* ===== TRANSACTIONS ===== */
  sectionTitle: {
    fontWeight: "800",
    marginBottom: 10,
    color: "#0f172a",
  },

  txCard: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },

  typeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  txDesc: {
    fontSize: 12,
    color: "#6b7280",
  },

  txAmount: {
    fontWeight: "800",
    fontSize: 15,
  },
});
