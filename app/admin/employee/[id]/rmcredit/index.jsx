import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../../../../../services/axios.js";

export default function RMCreditAdmin() {
  const { id, name = "Agent", phone = "-", role = "-" } =
    useLocalSearchParams();

  const [wallet, setWallet] = useState({
    balance: 0,
    totalCredit: 0,
    usedCredit: 0,
    expiryDate: null,
  });

  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const [addModal, setAddModal] = useState(false);
  const [revokeModal, setRevokeModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const res = await api.get(`/rmcredit/admin/${id}`);

      setWallet(
        res.data?.data?.wallet || {
          balance: 0,
          totalCredit: 0,
          usedCredit: 0,
          expiryDate: null,
        }
      );

      setTransactions(res.data?.data?.transactions || []);
    } catch (err) {
      setWallet({
        balance: 0,
        totalCredit: 0,
        usedCredit: 0,
        expiryDate: null,
      });
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, []);

  /* ================= ADD CREDIT ================= */

  const handleAddCredit = async () => {
    try {
      setBtnLoading(true);

      await api.post(`/rmcredit`, {
        agentId: id,
        amount,
        expiryDate,
        description,
      });

      Toast.show({
        type: "success",
        text1: "Credit Added Successfully",
      });

      setAddModal(false);
      setAmount("");
      setDescription("");
      fetchData();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Failed",
      });
    } finally {
      setBtnLoading(false);
    }
  };

  /* ================= REQUEST REVOKE ================= */

  const handleRequestRevoke = async () => {
    try {
      setBtnLoading(true);

      await api.post(`/rmcredit/revoke/request`, {
        agentId: id,
        amount,
      });

      Toast.show({
        type: "success",
        text1: "OTP Sent Successfully",
      });

      setRevokeModal(false);
      setVerifyModal(true);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Failed",
      });
    } finally {
      setBtnLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */

  const handleVerifyRevoke = async () => {
    try {
      setBtnLoading(true);

      await api.post(`/rmcredit/revoke/verify`, {
        agentId: id,
        otp,
      });

      Toast.show({
        type: "success",
        text1: "Credit Revoked Successfully",
      });

      setVerifyModal(false);
      setOtp("");
      setAmount("");
      fetchData();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Invalid OTP",
      });
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6b6dbf" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* AGENT INFO */}
        <View style={styles.adminCard}>
          <Ionicons name="person-circle" size={60} color="#6b6dbf" />
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.adminName}>{name}</Text>
            <Text style={styles.adminMeta}>{role}</Text>
            <Text style={styles.adminMeta}>{phone}</Text>
          </View>
        </View>

        {/* BALANCE CARD */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>₹ {wallet.balance}</Text>

          <View style={styles.balanceRow}>
            <WalletStat label="Total" value={`₹ ${wallet.totalCredit}`} />
            <WalletStat label="Used" value={`₹ ${wallet.usedCredit}`} />
            <WalletStat
              label="Expiry"
              value={wallet.expiryDate?.slice(0, 10) || "-"}
            />
          </View>
        </View>

        {/* ACTIONS */}
        <Section title="Wallet Actions" />

        <ActionButton
          icon="add-circle-outline"
          label="Add Credit"
          onPress={() => setAddModal(true)}
        />

        <ActionButton
          icon="remove-circle-outline"
          label="Revoke Credit"
          onPress={() => setRevokeModal(true)}
        />

        {/* TRANSACTIONS */}
        <Section title="Recent Transactions" />

        {transactions.length === 0 && (
          <Text style={{ color: "#64748b" }}>No transactions found</Text>
        )}

        {transactions.map((tx) => (
          <TransactionItem
            key={tx._id}
            title={tx.type.toUpperCase()}
            subtitle={tx.description}
            amount={`₹ ${tx.amount}`}
            positive={tx.type === "credit"}
          />
        ))}
      </ScrollView>

      {/* ADD CREDIT MODAL */}
      <Modal visible={addModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Credit</Text>

            <TextInput
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.dateContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{expiryDate.toISOString().slice(0, 10)}</Text>
              <Ionicons name="calendar-outline" size={20} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={expiryDate}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date) setExpiryDate(date);
                }}
              />
            )}

            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddCredit}
              disabled={btnLoading}
            >
              {btnLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff" }}>Submit</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAddModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* REVOKE MODAL */}
      <Modal visible={revokeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Revoke Credit</Text>

            <TextInput
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleRequestRevoke}
              disabled={btnLoading}
            >
              {btnLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff" }}>Submit</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setRevokeModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VERIFY OTP MODAL */}
      <Modal visible={verifyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Verify OTP</Text>

            <TextInput
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              style={styles.input}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleVerifyRevoke}
              disabled={btnLoading}
            >
              {btnLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff" }}>Submit</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setVerifyModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title }) {
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.sectionText}>{title}</Text>
    </View>
  );
}

function WalletStat({ label, value }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color="#6b6dbf" />
      </View>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function TransactionItem({ title, subtitle, amount, positive }) {
  return (
    <View style={styles.txCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.txTitle}>{title}</Text>
        <Text style={styles.txSubtitle}>{subtitle}</Text>
      </View>
      <Text
        style={[
          styles.txAmount,
          { color: positive ? "#16a34a" : "#dc2626" },
        ]}
      >
        {amount}
      </Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef0fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", marginLeft: 15 },

  scroll: { padding: 20, paddingBottom: 100 },

  adminCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  adminName: { fontSize: 16, fontWeight: "700" },
  adminMeta: { fontSize: 13, color: "#64748b", marginTop: 4 },

  balanceCard: {
    backgroundColor: "#6b6dbf",
    borderRadius: 24,
    padding: 25,
    marginBottom: 30,
  },
  balanceLabel: { color: "#ffffffaa", fontSize: 12 },
  balanceValue: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  statValue: { color: "#fff", fontWeight: "700" },
  statLabel: { color: "#ffffffaa", fontSize: 12, marginTop: 4 },

  sectionText: { fontSize: 14, fontWeight: "800", color: "#475569" },

  actionButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  actionIcon: {
    width: 45,
    height: 45,
    borderRadius: 50,
    backgroundColor: "#e6e7f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  actionText: { fontWeight: "600", fontSize: 14 },

  txCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  txTitle: { fontWeight: "600", fontSize: 14 },
  txSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  txAmount: { fontWeight: "800", fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 15 },

  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  dateContainer: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  submitBtn: {
    backgroundColor: "#6b6dbf",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 5,
  },
  closeText: {
    textAlign: "center",
    marginTop: 12,
    color: "#64748b",
  },
});
