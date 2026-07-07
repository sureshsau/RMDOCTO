import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/axios";
import Toast from "react-native-toast-message";
import { router, Stack } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ManageOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState("FLAT");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateValue(selectedDate);
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setExpiryDate(`${yyyy}-${mm}-${dd}`);
    }
  };
  
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleCreateOffer = async () => {
    if (!code || !title || !discountValue || !expiryDate) {
      Toast.show({ type: "error", text1: "Please fill all required fields" });
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        code,
        title,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue) || 0,
        expiryDate: new Date(expiryDate).toISOString()
      };
      
      const res = await api.post("/offers", payload);
      if (res.data.success) {
        Toast.show({ type: "success", text1: "Offer created successfully" });
        setShowForm(false);
        fetchOffers();
        // Reset form
        setCode(""); setTitle(""); setDiscountValue(""); setMinOrderValue(""); setExpiryDate("");
      }
    } catch (err) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Failed to create offer" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete Offer", "Are you sure you want to delete this offer?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const res = await api.delete(`/offers/${id}`);
          if (res.data.success) {
            Toast.show({ type: "success", text1: "Offer deleted" });
            fetchOffers();
          }
        } catch (err) {
          Toast.show({ type: "error", text1: "Failed to delete" });
        }
      }}
    ]);
  };

  const renderOffer = ({ item }) => (
    <View style={styles.offerCard}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.codeText}>{item.code}</Text>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.detailText}>
        Discount: {item.discountType === "FLAT" ? `₹${item.discountValue}` : `${item.discountValue}%`}
      </Text>
      <Text style={styles.detailText}>Min Order: ₹{item.minOrderValue}</Text>
      <Text style={styles.detailText}>Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Offers</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? "close" : "add"} size={28} color="#14b8a6" />
        </TouchableOpacity>
      </View>

      {showForm ? (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Create New Offer</Text>
          <TextInput style={styles.input} placeholderTextColor="#94a3b8" placeholder="Promo Code (e.g. SUMMER50)" value={code} onChangeText={setCode} autoCapitalize="characters" />
          <TextInput style={styles.input} placeholderTextColor="#94a3b8" placeholder="Offer Title" value={title} onChangeText={setTitle} />
          
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <TouchableOpacity 
              style={[styles.typeBtn, discountType === "FLAT" && styles.typeBtnActive]} 
              onPress={() => setDiscountType("FLAT")}
            >
              <Text style={[styles.typeBtnText, discountType === "FLAT" && { color: "#fff" }]}>FLAT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, discountType === "PERCENTAGE" && styles.typeBtnActive]} 
              onPress={() => setDiscountType("PERCENTAGE")}
            >
              <Text style={[styles.typeBtnText, discountType === "PERCENTAGE" && { color: "#fff" }]}>PERCENTAGE</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholderTextColor="#94a3b8" placeholder="Discount Value" value={discountValue} onChangeText={setDiscountValue} keyboardType="numeric" />
          <TextInput style={styles.input} placeholderTextColor="#94a3b8" placeholder="Minimum Order Value" value={minOrderValue} onChangeText={setMinOrderValue} keyboardType="numeric" />
          
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <TextInput style={styles.input} editable={false} pointerEvents="none" placeholderTextColor="#94a3b8" placeholder="Expiry Date (YYYY-MM-DD)" value={expiryDate} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateValue}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreateOffer} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Offer</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item._id}
          renderItem={renderOffer}
          contentContainerStyle={{ padding: 16 }}
          refreshing={loading}
          onRefresh={fetchOffers}
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 50, color: "#94a3b8" }}>No offers found</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#334155" },
  
  formContainer: { padding: 20, backgroundColor: "#fff", m: 16, borderRadius: 12, margin: 16, elevation: 2 },
  formTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16, color: "#0f766e" },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: "#334155" },
  typeBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: "#14b8a6", borderRadius: 8, alignItems: "center" },
  typeBtnActive: { backgroundColor: "#14b8a6" },
  typeBtnText: { color: "#14b8a6", fontWeight: "600" },
  submitBtn: { backgroundColor: "#0f766e", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 8 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  offerCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  codeText: { fontSize: 18, fontWeight: "800", color: "#14b8a6", marginBottom: 4 },
  titleText: { fontSize: 15, fontWeight: "600", color: "#334155", marginBottom: 8 },
  detailText: { fontSize: 13, color: "#64748b", marginBottom: 2 },
});
