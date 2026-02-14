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
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../../../../../services/axios.js";

export default function RMCreditAdmin() {
  const { id, name, phone, role } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const [wallet, setWallet] = useState({
    balance: 0,
    totalCredit: 0,
    usedCredit: 0,
    expiryDate: null,
  });

  const [transactions, setTransactions] = useState([]);

  const [addModal, setAddModal] = useState(false);
  const [revokeModal, setRevokeModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);

  const [amount, setAmount] = useState("");
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const res = await api.get(`/rmcredit/admin/${id}`);

      setWallet(res.data?.data?.wallet || {
        balance: 0,
        totalCredit: 0,
        usedCredit: 0,
        expiryDate: null,
      });

      setTransactions(res.data?.data?.transactions || []);
    } catch (err) {
      // ❌ No toast here if wallet not found
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
        text1: "Credit Added",
        text2: "Credit successfully added to agent",
      });

      setAddModal(false);
      setAmount("");
      setDescription("");

      fetchData();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Add Credit Failed",
        text2: err?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setBtnLoading(false);
    }
  };

  const handleRequestRevoke = async () => {
    try {
      setBtnLoading(true);

      await api.post(`/rmcredit/revoke/request`, {
        agentId: id,
        amount,
      });

      Toast.show({
        type: "success",
        text1: "OTP Sent",
        text2: "OTP sent to agent successfully",
      });

      setRevokeModal(false);
      setVerifyModal(true);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Revoke Failed",
        text2: err?.response?.data?.message || "Request failed",
      });
    } finally {
      setBtnLoading(false);
    }
  };

  const handleVerifyRevoke = async () => {
    try {
      setBtnLoading(true);

      await api.post(`/rmcredit/revoke/verify`, {
        agentId: id,
        otp,
      });

      Toast.show({
        type: "success",
        text1: "Credit Revoked",
        text2: "Credit revoked successfully",
      });

      setVerifyModal(false);
      setOtp("");
      setAmount("");

      fetchData();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "OTP Verification Failed",
        text2: err?.response?.data?.message || "Invalid OTP",
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Agent Info */}
        <View style={styles.card}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>{role}</Text>
          <Text style={styles.meta}>{phone}</Text>
        </View>

        {/* Wallet */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Balance</Text>
          <Text style={styles.walletValue}>₹ {wallet.balance}</Text>

          <View style={styles.walletRow}>
            <Text style={styles.walletSub}>
              Total: ₹ {wallet.totalCredit}
            </Text>
            <Text style={styles.walletSub}>
              Used: ₹ {wallet.usedCredit}
            </Text>
          </View>

          <Text style={styles.walletSub}>
            Expiry: {wallet.expiryDate ? wallet.expiryDate.slice(0, 10) : "-"}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.row}>
          <ActionButton
            label="Add Credit"
            color="#16a34a"
            onPress={() => setAddModal(true)}
          />
          <ActionButton
            label="Revoke"
            color="#dc2626"
            onPress={() => setRevokeModal(true)}
          />
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {transactions.length === 0 && (
          <Text style={{ color: "#64748b" }}>No transactions found</Text>
        )}

        {transactions.map((tx) => (
          <View key={tx._id} style={styles.txCard}>
            <View>
              <Text style={styles.txType}>{tx.type.toUpperCase()}</Text>
              <Text style={styles.txDesc}>{tx.description}</Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                { color: tx.type === "credit" ? "#16a34a" : "#dc2626" },
              ]}
            >
              ₹ {tx.amount}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* ADD MODAL */}
      <FormModal
        visible={addModal}
        title="Add Credit"
        onClose={() => setAddModal(false)}
        onSubmit={handleAddCredit}
        loading={btnLoading}
      >
        <TextInput
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>
            {expiryDate
              ? expiryDate.toISOString().slice(0, 10)
              : "Select Expiry Date"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={expiryDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setExpiryDate(selectedDate);
            }}
          />
        )}

        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />
      </FormModal>

      {/* REVOKE MODAL */}
      <FormModal
        visible={revokeModal}
        title="Revoke Credit"
        onClose={() => setRevokeModal(false)}
        onSubmit={handleRequestRevoke}
        loading={btnLoading}
      >
        <TextInput
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
          keyboardType="numeric"
        />
      </FormModal>

      {/* VERIFY OTP MODAL */}
      <FormModal
        visible={verifyModal}
        title="Verify OTP"
        onClose={() => setVerifyModal(false)}
        onSubmit={handleVerifyRevoke}
        loading={btnLoading}
      >
        <TextInput
          placeholder="Enter OTP"
          value={otp}
          onChangeText={setOtp}
          style={styles.input}
          keyboardType="numeric"
        />
      </FormModal>
    </SafeAreaView>
  );
}

function ActionButton({ label, color, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={{ color: "#fff", fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function FormModal({ visible, title, onClose, onSubmit, loading, children }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>

          {children}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff" }}>Submit</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={{ textAlign: "center", marginTop: 10 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef0fa",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ================= CARD ================= */

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },

  meta: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  /* ================= WALLET ================= */

  walletCard: {
    backgroundColor: "#6b6dbf",
    padding: 25,
    borderRadius: 25,
    marginBottom: 20,
  },

  walletLabel: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
  },

  walletValue: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 6,
  },

  walletRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  walletSub: {
    color: "#fff",
    fontSize: 13,
    marginTop: 4,
  },

  /* ================= ACTION BUTTONS ================= */

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  /* ================= TRANSACTIONS ================= */

  sectionTitle: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 10,
    color: "#334155",
  },

  txCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  txType: {
    fontWeight: "700",
    fontSize: 13,
    color: "#0f172a",
  },

  txDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  txAmount: {
    fontWeight: "700",
    fontSize: 14,
  },

  /* ================= MODAL ================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
    color: "#0f172a",
  },

  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 14,
    color: "#0f172a",
  },

  submitBtn: {
    backgroundColor: "#6b6dbf",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
});