import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../services/axios";

const PURPLE = "#6b6dbf";
const TEAL = "#14b8a6";
const BG = "#f1f5f9";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";

export default function DoctorBrowse() {
  const insets = useSafeAreaInsets();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get("/user/doctors");
      setDoctors(res.data?.data ?? []);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load doctors");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const q = search.toLowerCase();
    const name = doc.name?.toLowerCase() || "";
    const spec = doc.profiles?.doctorId?.specialization?.toLowerCase() || "";
    return name.includes(q) || spec.includes(q);
  });

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.heroIcon}>
          <Ionicons name="medkit" size={28} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Find a Doctor</Text>
          <Text style={styles.heroSub}>Book consultations effortlessly</Text>
        </View>
        <TouchableOpacity style={styles.ordersBtn} onPress={() => router.push("/doctor-booking/my-appointments")}>
          <Ionicons name="calendar-outline" size={20} color={PURPLE} />
          <Text style={styles.ordersBtnTxt}>Appointments</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={TEXT_S} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors by name or specialty…"
          placeholderTextColor={TEXT_S}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.centerTxt}>Finding doctors…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={46} color={TEXT_S} />
          <Text style={styles.errTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(i) => i._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[PURPLE]} />
          }
          ListHeaderComponent={
            <Text style={styles.totalTxt}>{filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""} available</Text>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="medical-outline" size={54} color={TEXT_S} />
              <Text style={styles.emptyTitle}>No Doctors Found</Text>
              <Text style={styles.emptyTxt}>Try a different search or check back later.</Text>
            </View>
          }
          renderItem={({ item }) => <DoctorCard doctor={item} />}
        />
      )}
    </View>
  );
}

function DoctorCard({ doctor }) {
  const profile = doctor.profiles?.doctorId;
  const spec = profile?.specialization || profile?.department || "General Physician";
  const fee = profile?.consultationFee || 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/doctor-booking/[doctorId]", params: { doctorId: doctor._id } })}
    >
      <View style={styles.cardLeft}>
        {doctor.faceImage?.url ? (
          <Image source={{ uri: doctor.faceImage.url }} style={styles.docAvatar} />
        ) : (
          <View style={[styles.docAvatar, { backgroundColor: PURPLE + "18", alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="person" size={24} color={PURPLE} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.docName} numberOfLines={1}>{doctor.name}</Text>
          <Text style={styles.docSpec} numberOfLines={1}>{spec}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
            {profile?.yearsOfExperience ? (
              <View style={styles.tag}><Text style={styles.tagTxt}>{profile.yearsOfExperience}y Exp</Text></View>
            ) : null}
            {profile?.qualification ? (
              <View style={styles.tag}><Text style={styles.tagTxt}>{profile.qualification}</Text></View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Ionicons name="chevron-forward" size={18} color={TEXT_S} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  safe: { flex: 1, backgroundColor: BG },

  hero: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: PURPLE, paddingHorizontal: 20, paddingVertical: 16,
  },
  heroIcon: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  ordersBtn: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: "center", gap: 4,
  },
  ordersBtnTxt: { fontSize: 11, fontWeight: "700", color: PURPLE },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    backgroundColor: CARD, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_D },

  totalTxt: { fontSize: 12, color: TEXT_M, fontWeight: "600", marginBottom: 10 },

  card: {
    backgroundColor: CARD, borderRadius: 18, padding: 16, elevation: 2,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  docAvatar: {
    width: 56, height: 56, borderRadius: 28,
  },
  docName: { fontSize: 16, fontWeight: "800", color: TEXT_D },
  docSpec: { fontSize: 13, color: TEXT_M, marginTop: 2 },

  tag: { backgroundColor: "#ede9fe", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt: { fontSize: 10, fontWeight: "600", color: PURPLE },

  cardRight: { alignItems: "flex-end", gap: 6 },
  docFee: { fontSize: 16, fontWeight: "900", color: TEAL },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerTxt: { color: TEXT_M, fontSize: 14 },
  errTxt: { color: "#ef4444", fontSize: 14, textAlign: "center" },
  retryBtn: { backgroundColor: PURPLE, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryTxt: { color: "#fff", fontWeight: "700" },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: TEXT_D },
  emptyTxt: { fontSize: 13, color: TEXT_M, textAlign: "center" },
});
