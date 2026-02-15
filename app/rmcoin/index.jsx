import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import api from "../../services/axios.js";

export default function UserWalletScreen() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [transferModal, setTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");

  const LIMIT = 10;

  /* ================= FETCH WALLET ================= */

  const loadWallet = async (pageNumber = 1, isLoadMore = false) => {
    try {
      const res = await api.get(
        `/rmcoin/logs/me?page=${pageNumber}&limit=${LIMIT}`
      );

      if (!res.data.success) throw new Error("Failed");

      setWallet(res.data.wallet);
      setTotalPages(res.data.pagination.totalPages);

      if (isLoadMore) {
        setTransactions((prev) => [...prev, ...res.data.logs]);
      } else {
        setTransactions(res.data.logs);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to load wallet",
        text2:
          error?.response?.data?.message ||
          "Something went wrong",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadWallet(1);
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      setLoadingMore(true);
      loadWallet(nextPage, true);
    }
  };

  /* ================= TRANSFER ================= */

  const handleTransfer = async () => {
    if (!transferAmount) {
      setTransferError("Please enter transfer amount");
      return;
    }

    try {
      setTransferLoading(true);
      setTransferError("");

      const res = await api.post(
        "/rmcoin/transfer-to-admin",
        {
          amount: Number(transferAmount),
        }
      );

      Toast.show({
        type: "success",
        text1: "Transfer Successful",
        text2: res?.data?.message,
      });

      setTransferModal(false);
      setTransferAmount("");
      setPage(1);
      loadWallet(1);
    } catch (error) {
      setTransferError(
        error?.response?.data?.message ||
          "Transfer failed. Please try again."
      );
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1BA6A6" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          onScrollEndDrag={loadMore}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ================= HEADER CARD ================= */}

          <View style={styles.balanceCard}>
            <View style={styles.ownerRow}>
              <Ionicons
                name="person-circle"
                size={38}
                color="#1BA6A6"
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.ownerLabel}>
                  Wallet Owner
                </Text>
                <Text style={styles.ownerName}>
                  {wallet?.name}
                </Text>
              </View>
            </View>

            <View style={styles.balanceWrapper}>
              <Text style={styles.balanceLabel}>
                Available RM Coin
              </Text>
              <Text style={styles.balanceAmount}>
                {wallet?.balance} RM
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>
                  Total Sent
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: "#DC2626" },
                  ]}
                >
                  {wallet?.totalSent} RM
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>
                  Total Received
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: "#16A34A" },
                  ]}
                >
                  {wallet?.totalReceived} RM
                </Text>
              </View>
            </View>

            {/* PREMIUM TRANSFER BUTTON */}
            <TouchableOpacity
              style={styles.transferBtn}
              onPress={() => {
                setTransferError("");
                setTransferModal(true);
              }}
            >
              <View style={styles.transferIconWrap}>
                <Ionicons
                  name="arrow-up-outline"
                  size={18}
                  color="#1E293B"
                />
              </View>
              <Text style={styles.transferText}>
                Transfer To Admin
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= HISTORY ================= */}

          <Text style={styles.sectionTitle}>
            Transaction History
          </Text>

          {transactions.map((item) => (
            <TransactionItem
              key={item._id}
              item={item}
              walletUserId={wallet?.userId}
            />
          ))}

          {loadingMore && (
            <ActivityIndicator
              style={{ marginVertical: 15 }}
              color="#1BA6A6"
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ================= TRANSFER MODAL ================= */}

      <Modal visible={transferModal} transparent animationType="fade">
        <TouchableWithoutFeedback
          onPress={() => setTransferModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <Text style={styles.sectionTitle}>
                  Transfer To Admin
                </Text>

                <TextInput
                  placeholder="Enter Amount"
                  keyboardType="numeric"
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                  style={styles.input}
                />

                {transferError ? (
                  <Text style={styles.modalError}>
                    {transferError}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={handleTransfer}
                  disabled={transferLoading}
                >
                  {transferLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>
                      Transfer
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setTransferModal(false)}
                  style={{ marginTop: 12 }}
                >
                  <Text style={{ color: "#1BA6A6" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

/* ================= TRANSACTION ITEM ================= */

function TransactionItem({ item, walletUserId }) {
  const isSent = item.fromUserId?._id === walletUserId;

  return (
    <View style={styles.transactionCard}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isSent
              ? "#FEF2F2"
              : "#ECFDF5",
          },
        ]}
      >
        <Ionicons
          name="swap-horizontal"
          size={22}
          color={isSent ? "#DC2626" : "#16A34A"}
        />
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.transactionTop}>
          <Text style={styles.transactionTitle}>
            {item.description}
          </Text>
          <Text
            style={[
              styles.transactionAmount,
              {
                color: isSent
                  ? "#DC2626"
                  : "#16A34A",
              },
            ]}
          >
            {isSent ? "-" : "+"} {item.amount} RM
          </Text>
        </View>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  balanceCard: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },

  ownerRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  ownerLabel: { fontSize: 11, color: "#94A3B8" },
  ownerName: { fontSize: 16, fontWeight: "700", color: "#fff" },

  balanceWrapper: { alignItems: "center", marginBottom: 20 },
  balanceLabel: { color: "#94A3B8", fontSize: 12 },
  balanceAmount: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 6 },

  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginHorizontal: 4,
  },
  summaryTitle: { fontSize: 11, color: "#94A3B8" },
  summaryValue: { fontSize: 14, fontWeight: "700", marginTop: 4 },

  transferBtn: {
    marginTop: 10,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  transferIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#1BA6A6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  transferText: {
    fontWeight: "700",
    color: "#1E293B",
    fontSize: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },

  transactionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  transactionTop: { flexDirection: "row", justifyContent: "space-between" },
  transactionTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  transactionDate: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  transactionAmount: { fontSize: 14, fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },

  modalBtn: {
    marginTop: 16,
    backgroundColor: "#1BA6A6",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  modalError: {
    marginTop: 10,
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "500",
  },

  btnText: { color: "#fff", fontWeight: "700" },
});
