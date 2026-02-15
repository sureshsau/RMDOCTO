import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
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
import api from "../../../services/axios.js";

export default function WalletScreen() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");

  const [rechargeModal, setRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);

  const LIMIT = 10;

  /* ================= FETCH WALLET ================= */

  const loadWallet = async (pageNumber = 1, isRefresh = false) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(
        `/rmcoin/admin/logs?page=${pageNumber}&limit=${LIMIT}`
      );

      if (!res.data.success) throw new Error("Failed");

      setWallet(res.data.wallet);

      const newLogs = res.data.logs || [];

      if (isRefresh || pageNumber === 1) {
        setTransactions(newLogs);
      } else {
        setTransactions((prev) => [...prev, ...newLogs]);
      }

      const totalPages = res.data.pagination?.totalPages || 1;
      setHasMore(pageNumber < totalPages);
      setPage(pageNumber);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to load wallet",
        text2:
          error?.response?.data?.message ||
          error.message ||
          "Something went wrong",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadWallet(1, true);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWallet(1, true);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    loadWallet(page + 1);
  };

  /* ================= SEARCH FILTER ================= */

  const filteredTransactions = useMemo(() => {
    if (!search) return transactions;

    return transactions.filter((item) => {
      const fromName = item.fromUserId?.name?.toLowerCase() || "";
      const toName = item.toUserId?.name?.toLowerCase() || "";
      const fromPhone = item.fromUserId?.phone || "";
      const toPhone = item.toUserId?.phone || "";

      return (
        fromName.includes(search.toLowerCase()) ||
        toName.includes(search.toLowerCase()) ||
        fromPhone.includes(search) ||
        toPhone.includes(search)
      );
    });
  }, [transactions, search]);

  /* ================= RECHARGE ================= */

  const handleRecharge = async () => {
    if (!rechargeAmount) {
      Toast.show({
        type: "error",
        text1: "Amount Required",
        text2: "Please enter recharge amount",
      });
      return;
    }

    try {
      setRechargeLoading(true);

      const res = await api.post("/rmcoin/admin/recharge", {
        amount: Number(rechargeAmount),
      });

      Toast.show({
        type: "success",
        text1: "Recharge Successful",
        text2: res?.data?.message || "Wallet recharged",
      });

      setRechargeModal(false);
      setRechargeAmount("");
      loadWallet(1, true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Recharge Failed",
        text2:
          error?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setRechargeLoading(false);
    }
  };

  /* ================= LOADING SCREEN ================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1BA6A6" />
      </SafeAreaView>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onMomentumScrollEnd={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              event.nativeEvent;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 20;

            if (isCloseToBottom) loadMore();
          }}
        >
          {/* ================= BALANCE CARD ================= */}

          <View style={styles.balanceCard}>
            <View style={styles.ownerRow}>
              <Ionicons name="person-circle" size={38} color="#1BA6A6" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.ownerLabel}>Wallet Owner</Text>
                <Text style={styles.ownerName}>{wallet?.name}</Text>
              </View>
            </View>

            <View style={styles.balanceWrapper}>
              <Text style={styles.balanceLabel}>Available RM Coin</Text>
              <Text style={styles.balanceAmount}>
                {wallet?.balance} RM
              </Text>
            </View>

            <TouchableOpacity
              style={styles.rechargeBtn}
              onPress={() => setRechargeModal(true)}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.btnText}>Recharge Wallet</Text>
            </TouchableOpacity>
          </View>

          {/* ================= SEARCH BAR ================= */}

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              placeholder="Search by name or phone..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* ================= TRANSACTIONS ================= */}

          <Text style={styles.sectionTitle}>Transaction History</Text>

          {filteredTransactions.length === 0 && (
            <Text style={{ color: "#64748B" }}>
              No transactions found
            </Text>
          )}

          {filteredTransactions.map((item) => (
            <TransactionItem
              key={item._id}
              item={item}
              walletUserId={wallet?.userId}
            />
          ))}

          {loadingMore && (
            <ActivityIndicator
              size="small"
              color="#1BA6A6"
              style={{ marginVertical: 20 }}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ================= RECHARGE MODAL ================= */}

      <Modal visible={rechargeModal} transparent animationType="fade">
        <TouchableWithoutFeedback
          onPress={() => setRechargeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <Text style={styles.sectionTitle}>
                  Recharge Wallet
                </Text>

                <TextInput
                  placeholder="Enter Amount"
                  keyboardType="numeric"
                  value={rechargeAmount}
                  onChangeText={setRechargeAmount}
                  style={styles.input}
                />

                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={handleRecharge}
                  disabled={rechargeLoading}
                >
                  {rechargeLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Recharge</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRechargeModal(false)}
                  style={{ marginTop: 12 }}
                >
                  <Text style={{ color: "#1BA6A6" }}>Cancel</Text>
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
  const isRecharge = item.type === "admin_recharge";

  const title = isRecharge
    ? "Admin Recharge"
    : isSent
    ? `Sent to ${item.toUserId?.name}`
    : `Received from ${item.fromUserId?.name}`;

  return (
    <View style={styles.transactionCard}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: isSent ? "#FEF2F2" : "#ECFDF5" },
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
          <Text style={styles.transactionTitle}>{title}</Text>
          <Text
            style={[
              styles.transactionAmount,
              { color: isSent ? "#DC2626" : "#16A34A" },
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

  rechargeBtn: {
    backgroundColor: "#1BA6A6",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  btnText: { color: "#fff", fontWeight: "700", marginLeft: 6 },

  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  searchInput: { marginLeft: 8, flex: 1, color: "#1E293B" },

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

  transactionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  transactionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  transactionDate: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },

  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
  },

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
});
