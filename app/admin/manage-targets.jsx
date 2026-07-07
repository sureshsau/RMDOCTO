import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/axios";
import Toast from "react-native-toast-message";
import { router, Stack } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ManageTargets() {
  const [targets, setTargets] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const months = [
    "01", "02", "03", "04", "05", "06", 
    "07", "08", "09", "10", "11", "12"
  ];

  const handleSelectMonth = (monthStr) => {
    setSelectedMonth(`${pickerYear}-${monthStr}`);
    setShowMonthPicker(false);
  };

  // Form states
  const [rank, setRank] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [reward, setReward] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/target-offers/progress?month=${selectedMonth}`);
      if (res.data.success) {
        setTargets(res.data.activeTargets);
        setProgress(res.data.progressReport);
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to fetch targets" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTarget = async () => {
    if (!rank || !targetAmount || !reward) {
      Toast.show({ type: "error", text1: "Please fill all fields" });
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        rank: Number(rank),
        targetSalesAmount: Number(targetAmount),
        rewardDescription: reward,
        targetMonth: selectedMonth
      };
      
      const res = await api.post("/target-offers", payload);
      if (res.data.success) {
        Toast.show({ type: "success", text1: "Target created successfully" });
        setShowForm(false);
        fetchData();
        setRank(""); setTargetAmount(""); setReward("");
      }
    } catch (err) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Failed to create target" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderTarget = ({ item }) => (
    <View style={styles.targetCard}>
      <Text style={styles.rankText}>Target #{item.rank}</Text>
      <Text style={styles.detailText}>Amount: ₹{item.targetSalesAmount}</Text>
      <Text style={styles.rewardText}>Reward: {item.rewardDescription}</Text>
    </View>
  );

  const renderProgress = ({ item }) => {
    const percent = item.nextTargetAmount ? Math.min((item.totalSales / item.nextTargetAmount) * 100, 100) : 100;
    return (
      <View style={styles.progressCard}>
        <Text style={styles.agentName}>{item.agentName} ({item.agentPhone})</Text>
        <Text style={styles.salesText}>Sales: ₹{item.totalSales}</Text>
        <Text style={styles.detailText}>Achieved: <Text style={{fontWeight:'700', color: '#16a34a'}}>{item.achievedTarget}</Text></Text>
        
        {item.nextTargetAmount && (
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: "#64748b" }}>Next: {item.nextTargetReward}</Text>
              <Text style={{ fontSize: 11, color: "#64748b" }}>₹{item.totalSales} / ₹{item.nextTargetAmount}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agent Targets</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? "close" : "add"} size={28} color="#14b8a6" />
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16, backgroundColor: "#fff", flexDirection: "row", alignItems: "center" }}>
        <Text style={{ fontWeight: "600", marginRight: 10 }}>Month:</Text>
        <TouchableOpacity onPress={() => setShowMonthPicker(true)}>
          <TextInput 
            style={styles.monthInput} 
            value={selectedMonth} 
            editable={false}
            pointerEvents="none"
            placeholder="YYYY-MM"
            placeholderTextColor="#94a3b8"
          />
        </TouchableOpacity>
      </View>

      {/* Custom Month Picker Modal */}
      {showMonthPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPickerYear(pickerYear - 1)}>
                <Ionicons name="chevron-back" size={24} color="#334155" />
              </TouchableOpacity>
              <Text style={styles.modalYearText}>{pickerYear}</Text>
              <TouchableOpacity onPress={() => setPickerYear(pickerYear + 1)}>
                <Ionicons name="chevron-forward" size={24} color="#334155" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalGrid}>
              {months.map((m) => {
                const isSelected = selectedMonth === `${pickerYear}-${m}`;
                const monthName = new Date(pickerYear, parseInt(m) - 1, 1).toLocaleString('default', { month: 'short' });
                return (
                  <TouchableOpacity 
                    key={m} 
                    style={[styles.modalMonthBtn, isSelected && styles.modalMonthBtnActive]}
                    onPress={() => handleSelectMonth(m)}
                  >
                    <Text style={[styles.modalMonthText, isSelected && { color: "#fff" }]}>{monthName}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowMonthPicker(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showForm ? (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Add Target for {selectedMonth}</Text>
          <TextInput style={styles.input} placeholderTextColor="#94a3b8" placeholder="Rank (e.g. 1)" value={rank} onChangeText={setRank} keyboardType="numeric" />
          <TextInput style={styles.input} placeholderTextColor="#94a3b8" placeholder="Target Sales Amount (₹)" value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" />
          <TextInput style={styles.input} placeholderTextColor="#94a3b8" placeholder="Reward (e.g. Fridge)" value={reward} onChangeText={setReward} />
          
          <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTarget} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Target</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Active Targets</Text>
          <FlatList
            horizontal
            data={targets}
            keyExtractor={(item) => item._id}
            renderItem={renderTarget}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            showsHorizontalScrollIndicator={false}
          />

          <Text style={styles.sectionTitle}>Agent Progress</Text>
          <FlatList
            data={progress}
            keyExtractor={(item) => item.agentId}
            renderItem={renderProgress}
            contentContainerStyle={{ padding: 16 }}
            refreshing={loading}
            onRefresh={fetchData}
            ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 50, color: "#94a3b8" }}>No agent progress found</Text>}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#334155" },
  
  monthInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 8, width: 120, textAlign: "center", color: "#334155" },
  
  formContainer: { padding: 20, backgroundColor: "#fff", m: 16, borderRadius: 12, margin: 16, elevation: 2 },
  formTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16, color: "#0f766e" },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: "#334155" },
  submitBtn: { backgroundColor: "#0f766e", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 8 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#334155", marginLeft: 16, marginTop: 16, marginBottom: 8 },
  
  targetCard: { backgroundColor: "#e0f2fe", padding: 16, borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: "#bae6fd", minWidth: 150 },
  rankText: { fontSize: 16, fontWeight: "800", color: "#0369a1", marginBottom: 4 },
  rewardText: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginTop: 4 },
  
  progressCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  agentName: { fontSize: 15, fontWeight: "700", color: "#334155", marginBottom: 4 },
  salesText: { fontSize: 14, fontWeight: "600", color: "#0f766e", marginBottom: 4 },
  detailText: { fontSize: 13, color: "#64748b" },
  
  progressBarBg: { height: 8, backgroundColor: "#e2e8f0", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#14b8a6" },

  modalOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 16, width: "80%", elevation: 5 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalYearText: { fontSize: 18, fontWeight: "800", color: "#0f766e" },
  modalGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  modalMonthBtn: { width: "30%", paddingVertical: 12, alignItems: "center", borderRadius: 8, marginBottom: 12, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0" },
  modalMonthBtnActive: { backgroundColor: "#14b8a6", borderColor: "#14b8a6" },
  modalMonthText: { fontSize: 14, fontWeight: "600", color: "#334155" },
  modalCloseBtn: { marginTop: 8, paddingVertical: 12, alignItems: "center" },
  modalCloseText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
});
