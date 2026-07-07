import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/axios";
import Toast from "react-native-toast-message";
import { router, Stack } from "expo-router";

export default function AgentTargets() {
  const [targets, setTargets] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [targetMonth, setTargetMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyProgress();
  }, []);

  const fetchMyProgress = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/target-offers/my-progress`);
      if (res.data.success) {
        setTargets(res.data.activeTargets);
        setTotalSales(res.data.totalSales);
        setTargetMonth(res.data.targetMonth);
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load target progress" });
    } finally {
      setLoading(false);
    }
  };

  const getProgressDetails = () => {
    let currentTarget = null;
    let nextTarget = null;

    for (let i = 0; i < targets.length; i++) {
      if (totalSales >= targets[i].targetSalesAmount) {
        currentTarget = targets[i];
      } else {
        nextTarget = targets[i];
        break;
      }
    }

    return { currentTarget, nextTarget };
  };

  const { currentTarget, nextTarget } = getProgressDetails();

  const renderTarget = ({ item }) => {
    const isAchieved = totalSales >= item.targetSalesAmount;
    return (
      <View style={[styles.targetCard, isAchieved && styles.achievedCard]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[styles.rankText, isAchieved && {color: "#065f46"}]}>Target #{item.rank}</Text>
          {isAchieved && <Ionicons name="checkmark-circle" size={20} color="#059669" />}
        </View>
        <Text style={[styles.amountText, isAchieved && {color: "#064e3b"}]}>Sales Required: ₹{item.targetSalesAmount}</Text>
        <Text style={styles.rewardText}>🎁 Reward: {item.rewardDescription}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </SafeAreaView>
    );
  }

  const percent = nextTarget ? Math.min((totalSales / nextTarget.targetSalesAmount) * 100, 100) : 100;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Targets & Rewards</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.progressCard}>
          <Text style={styles.monthText}>Current Month: {targetMonth}</Text>
          <Text style={styles.salesText}>Total Sales: ₹{totalSales}</Text>
          
          <View style={{ marginTop: 12 }}>
            {currentTarget && (
              <Text style={styles.achievedText}>🎉 Achieved: {currentTarget.rewardDescription}</Text>
            )}
            
            {nextTarget ? (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6, marginTop: 8 }}>
                  <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>Next: {nextTarget.rewardDescription}</Text>
                  <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>₹{totalSales} / ₹{nextTarget.targetSalesAmount}</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                </View>
                <Text style={styles.remainingText}>
                  ₹{(nextTarget.targetSalesAmount - totalSales).toFixed(2)} more to unlock!
                </Text>
              </>
            ) : (
               <Text style={[styles.achievedText, {marginTop: 10}]}>🏆 You have achieved all targets for this month!</Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Available Rewards</Text>
        <FlatList
          data={targets}
          keyExtractor={(item) => item._id}
          renderItem={renderTarget}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20, color: "#94a3b8" }}>No active targets for this month</Text>}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#334155" },
  
  progressCard: { backgroundColor: "#fff", padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0", elevation: 2 },
  monthText: { fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 6 },
  salesText: { fontSize: 22, fontWeight: "800", color: "#0f766e", marginBottom: 8 },
  achievedText: { fontSize: 14, fontWeight: "700", color: "#16a34a" },
  remainingText: { fontSize: 12, fontWeight: "600", color: "#0ea5e9", marginTop: 8, textAlign: "right" },
  
  progressBarBg: { height: 10, backgroundColor: "#e2e8f0", borderRadius: 5, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#14b8a6", borderRadius: 5 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#334155", marginBottom: 12 },
  
  targetCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0", borderLeftWidth: 4, borderLeftColor: "#cbd5e1" },
  achievedCard: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0", borderLeftColor: "#10b981" },
  rankText: { fontSize: 14, fontWeight: "800", color: "#475569", marginBottom: 4 },
  amountText: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  rewardText: { fontSize: 15, fontWeight: "700", color: "#d97706" },
});
