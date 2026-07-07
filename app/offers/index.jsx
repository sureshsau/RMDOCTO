import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import api from "../../services/axios";
import Toast from "react-native-toast-message";
import { router, Stack } from "expo-router";

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/offers");
      if (res.data.success) {
        setOffers(res.data.offers);
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to fetch offers" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code) => {
    await Clipboard.setStringAsync(code);
    Toast.show({
      type: "success",
      text1: "Promo Code Copied! 🎉",
      text2: `Use code ${code} at checkout.`
    });
  };

  const renderOffer = ({ item }) => (
    <View style={styles.offerCard}>
      <View style={styles.offerTop}>
        <View style={styles.iconCircle}>
          <Ionicons name="pricetag" size={20} color="#14b8a6" />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.discountType === "FLAT" ? `₹${item.discountValue} OFF` : `${item.discountValue}% OFF`}
          </Text>
        </View>
      </View>
      
      <View style={styles.offerContent}>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.detailText}>Minimum Order: <Text style={{fontWeight: '700', color: '#334155'}}>₹{item.minOrderValue}</Text></Text>
        <Text style={styles.detailText}>Valid until: <Text style={{fontWeight: '700', color: '#334155'}}>{new Date(item.expiryDate).toLocaleDateString()}</Text></Text>
      </View>

      <TouchableOpacity 
        style={styles.copyBtn} 
        activeOpacity={0.7} 
        onPress={() => copyToClipboard(item.code)}
      >
        <Text style={styles.copyLabel}>PROMO CODE</Text>
        <View style={styles.codeWrap}>
          <Text style={styles.codeText}>{item.code}</Text>
          <Ionicons name="copy-outline" size={18} color="#14b8a6" style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Special Offers</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#14b8a6" />
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item._id}
          renderItem={renderOffer}
          contentContainerStyle={{ padding: 16 }}
          refreshing={loading}
          onRefresh={fetchOffers}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="pricetags-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No active offers right now.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 18, 
    backgroundColor: "#14b8a6",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#ffffff", flex: 1, textAlign: "center" },
  
  offerCard: { 
    backgroundColor: "#ffffff", 
    borderRadius: 20, 
    marginBottom: 20, 
    elevation: 5, 
    shadowColor: "#1e293b", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden"
  },
  offerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
  },
  offerContent: { paddingHorizontal: 16, paddingBottom: 16 },
  badge: { backgroundColor: "#ffedd5", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 13, fontWeight: "800", color: "#ea580c" },
  titleText: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  detailText: { fontSize: 13, color: "#64748b", marginBottom: 4 },
  
  copyBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    backgroundColor: "#f8fafc", 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderTopWidth: 1.5, 
    borderTopColor: "#e2e8f0", 
    borderStyle: "dashed" 
  },
  copyLabel: { fontSize: 12, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.5 },
  codeWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#ccfbf1", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  codeText: { fontSize: 15, fontWeight: "900", color: "#115e59", letterSpacing: 1 },
  
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#94a3b8", marginTop: 12 }
});
