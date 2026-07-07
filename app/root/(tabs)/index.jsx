import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Image, Dimensions, FlatList, ActivityIndicator, Alert, Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/axios";

const { width: W } = Dimensions.get("window");
const PRIMARY = "#14b8a6";
const BG = "#eef2f7";   // matches sceneContainerStyle in _layout so the carved notch blends
const BANNER_W = W - 32;

const SPECIALTIES = [
  { label: "General\nPhysician", icon: "person-outline", color: "#0ea5e9" },
  { label: "Pediatrician", icon: "happy-outline", color: "#ec4899" },
  { label: "Gynecologist", icon: "female-outline", color: "#8b5cf6" },
  { label: "Dermatologist", icon: "color-palette-outline", color: "#f59e0b" },
  { label: "Dentist", icon: "medkit-outline", color: "#14b8a6" },
  { label: "Cardiologist", icon: "heart-outline", color: "#ef4444" },
  { label: "Neurologist", icon: "pulse-outline", color: "#6366f1" },
  { label: "Orthopedist", icon: "fitness-outline", color: "#10b981" },
  { label: "ENT Specialist", icon: "ear-outline", color: "#f97316" },
  { label: "More", icon: "grid-outline", color: "#64748b" },
];

const QUICK_ACTIONS = [
  { label: "Book\nDoctor", icon: "medkit-outline", route: "/doctor-booking" },
  { label: "My\nAppointments", icon: "calendar-outline", route: "/doctor-booking/my-appointments" },
  { label: "Medicine\nStore", icon: "storefront-outline", route: "/medicine-store" },
  { label: "Lab\nTests", icon: "flask-outline", route: "/lab" },
  { label: "My\nOrders", icon: "cube-outline", route: "/mymedicineorder" },
];

const BANNER_COLORS = [
  ["#0d9488", "#0f766e"],
  ["#0284c7", "#0369a1"],
  ["#7c3aed", "#6d28d9"],
  ["#d97706", "#b45309"],
  ["#dc2626", "#b91c1c"],
];

export default function UserHome() {
  const router = useRouter();
  const { user } = useAuth();

  const [offers, setOffers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [fetchingLoc, setFetchingLoc] = useState(false);
  const [displayAddress, setDisplayAddress] = useState(user?.address || "Your location");
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const bannerRef = useRef(null);

  useEffect(() => {
    fetchOffers();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (offers.length < 2) return;
    const t = setInterval(() => {
      setActiveBanner(prev => {
        const next = (prev + 1) % offers.length;
        try { bannerRef.current?.scrollToIndex({ index: next, animated: true }); } catch (_) { }
        return next;
      });
    }, 3500);
    return () => clearInterval(t);
  }, [offers]);

  const fetchOffers = async () => {
    try {
      const res = await api.get("/offers");
      if (res.data?.success) setOffers(res.data.offers);
    } catch (_) { }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/user/doctors");
      if (res.data?.success) setDoctors((res.data.data || []).slice(0, 8));
    } catch (_) { }
    finally { setLoadingDoctors(false); }
  };

  const fetchLocation = async () => {
    try {
      setFetchingLoc(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDisplayAddress("Permission denied");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const addr = [place.name, place.street, place.city, place.region].filter(Boolean).join(", ");
        setDisplayAddress(addr || "Unknown location");
      } else {
        setDisplayAddress("Location not found");
      }
    } catch (e) {
      setDisplayAddress("Failed to fetch location");
    } finally {
      setFetchingLoc(false);
    }
  };

  // ── BANNER ───────────────────────────────────────────
  const renderBanner = ({ item, index }) => {
    const [c1, c2] = BANNER_COLORS[index % BANNER_COLORS.length];
    return (
      <View style={[s.bannerCard, { backgroundColor: c1, width: BANNER_W }]}>
        <View style={s.bannerLeft}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <View style={[s.bannerPill, { marginBottom: 0 }]}>
              <Text style={s.bannerPillTxt}>SPECIAL OFFER</Text>
            </View>
            {item.code && (
              <TouchableOpacity 
                style={[s.bannerPill, { marginBottom: 0, backgroundColor: "rgba(255,255,255,0.4)", flexDirection: "row", alignItems: "center", gap: 4 }]} 
                onPress={() => {
                  Clipboard.setStringAsync(item.code);
                  Alert.alert("Code Copied", `${item.code} has been copied to your clipboard.`);
                }}
              >
                <Text style={[s.bannerPillTxt, { letterSpacing: 1 }]}>CODE: {item.code}</Text>
                <Ionicons name="copy-outline" size={10} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={s.bannerBig}>
            {item.discountType === "FLAT"
              ? `Flat ₹${item.discountValue} OFF`
              : `${item.discountValue}% OFF`}
          </Text>
          <Text style={s.bannerSub}>{item.title}</Text>
          <Text style={s.bannerMeta}>Minimum Order: ₹{item.minOrderValue}</Text>
          <Text style={s.bannerMeta}>Valid until: {new Date(item.expiryDate).toLocaleDateString("en-IN")}</Text>
          <TouchableOpacity style={s.bannerBtn} onPress={() => router.push("/medicine-store")}>
            <Text style={[s.bannerBtnTxt, { color: c1 }]}>Order Now →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.bannerRight}>
          <View style={[s.bannerCircleBig, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <View style={[s.bannerCircleSmall, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <Ionicons name="heart" size={28} color="#fff" />
            </View>
          </View>
          <View style={[s.bannerBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="medkit" size={16} color="#fff" />
          </View>
        </View>
      </View>
    );
  };

  // ── DOCTOR CARD ──────────────────────────────────────
  const renderDoctor = ({ item }) => {
    // The /doctors API returns user fields: name, faceImage.url, profiles.doctorId
    const doctorProfile = item.profiles?.doctorId;
    const photo = item.faceImage?.url || item.profileImage;
    const specialization = doctorProfile?.specialization || "Specialist";
    const fee = doctorProfile?.consultationFee || "300";
    const experience = doctorProfile?.yearsOfExperience;
    const rating = doctorProfile?.rating?.average || "4.8";
    const reviews = doctorProfile?.rating?.totalReviews || "120";

    return (
      <TouchableOpacity style={s.drCard} activeOpacity={0.85} onPress={() => router.push(`/doctor-booking/${item._id}`)}>
        <TouchableOpacity style={s.heartBtn}>
          <Ionicons name="heart-outline" size={15} color="#94a3b8" />
        </TouchableOpacity>
        {photo
          ? <Image source={{ uri: photo }} style={s.drImg} />
          : <View style={[s.drImg, s.drImgPh]}><Ionicons name="person" size={30} color="#94a3b8" /></View>
        }
        <Text style={s.drName} numberOfLines={1}>{item.name ? `Dr. ${item.name}` : "Dr. —"}</Text>
        <Text style={s.drSpec} numberOfLines={1}>{specialization}</Text>
        <View style={[s.drFooter, { justifyContent: "center", marginTop: 8 }]}>
          <TouchableOpacity style={s.drBtn} onPress={() => router.push(`/doctor-booking/${item._id}`)}>
            <Text style={s.drBtnTxt}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ── MAIN RENDER ──────────────────────────────────────
  const filteredDoctors = doctors.filter((doc) => {
    let match = true;
    const spec = (doc.profiles?.doctorId?.specialization || "specialist").toLowerCase();

    if (search) {
      const s = search.toLowerCase();
      const name = (doc.name || "").toLowerCase();
      if (!name.includes(s) && !spec.includes(s)) {
        match = false;
      }
    }

    if (match && selectedCategory) {
      if (spec !== selectedCategory.toLowerCase()) {
        match = false;
      }
    }

    return match;
  });

  const isSearching = search.trim().length > 0 || selectedCategory !== "";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{ backgroundColor: BG, paddingBottom: 130 }}
      >
        {/* ── TOP BAR (scrolls with page) ── */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.locationBtn} onPress={fetchLocation} disabled={fetchingLoc}>
            <Ionicons name="location" size={16} color={PRIMARY} />
            <View style={{ marginLeft: 6 }}>
              <View style={s.locRow}>
                <Text style={s.locLabel}>Deliver to Home</Text>
                {fetchingLoc ? (
                  <ActivityIndicator size="small" color={PRIMARY} style={{ marginLeft: 4 }} />
                ) : (
                  <Ionicons name="chevron-down-outline" size={13} color="#334155" />
                )}
              </View>
              <Text style={s.locSub} numberOfLines={1}>{fetchingLoc ? "Fetching..." : displayAddress}</Text>
            </View>
          </TouchableOpacity>
          <View style={s.topRight}>
            <TouchableOpacity style={s.topIconWrap} onPress={() => router.push("/medicine-store/checkOut")}>
              <Ionicons name="cart-outline" size={22} color="#334155" />
              <View style={s.cartDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SEARCH ── */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Ionicons name="search-outline" size={18} color="#b0bec5" />
            <TextInput
              style={s.searchInput}
              placeholder="Search doctors, specialties, clinics..."
              placeholderTextColor="#b0bec5"
              value={search}
              onChangeText={setSearch}
            />
            {isSearching && (
              <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={s.filterBtn} onPress={() => setFilterVisible(true)}>
            <Ionicons name="options-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* ── BANNERS ── */}
        {!isSearching && (
          <>
            {offers.length > 0 ? (
          <View style={s.bannerSection}>
            <FlatList
              ref={bannerRef}
              data={offers}
              keyExtractor={(it, idx) => it._id ? it._id.toString() : idx.toString()}
              renderItem={renderBanner}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              snapToInterval={BANNER_W + 12}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              onScrollToIndexFailed={() => { }}
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12));
                setActiveBanner(idx);
              }}
            />
            <View style={s.dots}>
              {offers.map((_, i) => (
                <View key={i} style={[s.dot, i === activeBanner && s.dotActive]} />
              ))}
            </View>
          </View>
        ) : (
          <View style={s.bannerSection}>
            <View style={[s.bannerCard, { backgroundColor: BANNER_COLORS[0][0], width: BANNER_W, alignSelf: "center" }]}>
              <View style={s.bannerLeft}>
                <View style={s.bannerPill}><Text style={s.bannerPillTxt}>WELCOME</Text></View>
                <Text style={s.bannerBig}>Hello, {user?.name?.split(" ")[0] || "User"} 👋</Text>
                <Text style={s.bannerSub}>Your health companion</Text>
                <TouchableOpacity style={s.bannerBtn} onPress={() => router.push("/doctor-booking")}>
                  <Text style={[s.bannerBtnTxt, { color: BANNER_COLORS[0][0] }]}>Book Now →</Text>
                </TouchableOpacity>
              </View>
              <View style={s.bannerRight}>
                <View style={[s.bannerCircleBig, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                  <View style={[s.bannerCircleSmall, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
                    <Ionicons name="heart" size={28} color="#fff" />
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── QUICK ACTIONS ── */}
        <View style={s.quickWrap}>
          {QUICK_ACTIONS.map(item => (
            <TouchableOpacity key={item.label} style={s.quickItem} onPress={() => router.push(item.route)}>
              <View style={s.quickIcon}>
                <Ionicons name={item.icon} size={24} color={PRIMARY} />
              </View>
              <Text style={s.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SPECIALTIES ── */}
        <View style={s.section}>
          <View style={s.secHdr}>
            <Text style={s.secTitle}>Popular Specialties</Text>
            <TouchableOpacity onPress={() => router.push("/doctor-booking")}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={s.specGrid}>
            {SPECIALTIES.map((sp, i) => (
              <TouchableOpacity key={i} style={s.specItem} onPress={() => router.push("/doctor-booking")}>
                <View style={[s.specIcon, { backgroundColor: sp.color + "18" }]}>
                  <Ionicons name={sp.icon} size={22} color={sp.color} />
                </View>
                <Text style={s.specLabel}>{sp.label}</Text>
              </TouchableOpacity>
            ))}
            </View>
          </View>
          </>
        )}

        {/* ── DOCTORS ── */}
        <View style={[s.section, { paddingHorizontal: 0 }]}>
          <View style={[s.secHdr, { paddingHorizontal: 16 }]}>
            <Text style={s.secTitle}>Popular Doctors</Text>
            <TouchableOpacity onPress={() => router.push("/doctor-booking")}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {loadingDoctors ? (
            <ActivityIndicator size="small" color={PRIMARY} style={{ marginVertical: 20 }} />
          ) : filteredDoctors.length > 0 ? (
            isSearching ? (
              <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 20 }}>
                {filteredDoctors.map((item, idx) => <View key={item._id ? item._id.toString() : idx.toString()}>{renderDoctor({ item })}</View>)}
              </View>
            ) : (
              <FlatList
                data={filteredDoctors}
                keyExtractor={(it, idx) => it._id ? it._id.toString() : idx.toString()}
                renderItem={renderDoctor}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6, gap: 12 }}
              />
            )
          ) : (
            <TouchableOpacity style={s.drCTA} onPress={() => router.push("/doctor-booking")}>
              <Ionicons name="medkit-outline" size={36} color={PRIMARY} />
              <Text style={s.drCTATxt}>Browse Available Doctors</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── OFFERS STRIP ── */}
        {!isSearching && (
          <View style={s.section}>
          <View style={s.secHdr}>
            <Text style={s.secTitle}>Special Offers</Text>
            <TouchableOpacity onPress={() => router.push("/offers")}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.offerStrip} onPress={() => router.push("/offers")}>
            <View style={s.offerLeft}>
              <View style={s.offerIcon}>
                <Ionicons name="pricetags" size={22} color={PRIMARY} />
              </View>
              <View>
                <Text style={s.offerTitle}>🎁 Exclusive Promo Codes</Text>
                <Text style={s.offerSub}>Tap to see and copy discount codes</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={filterVisible} transparent animationType="fade">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setFilterVisible(false)}>
          <View style={s.modalContent} onStartShouldSetResponder={() => true}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Filter by Category</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: "70%" }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={[s.catOption, selectedCategory === "" && s.catOptionActive]} 
                onPress={() => { setSelectedCategory(""); setFilterVisible(false); }}
              >
                <Text style={[s.catText, selectedCategory === "" && s.catTextActive]}>All Doctors</Text>
                {selectedCategory === "" && <Ionicons name="checkmark" size={20} color={PRIMARY} />}
              </TouchableOpacity>
              {SPECIALTIES.filter(sp => sp.label !== "More").map((sp) => {
                const labelStr = sp.label.replace("\n", " ");
                const isActive = selectedCategory === labelStr;
                return (
                  <TouchableOpacity 
                    key={sp.label} 
                    style={[s.catOption, isActive && s.catOptionActive]}
                    onPress={() => { setSelectedCategory(labelStr); setFilterVisible(false); }}
                  >
                    <Text style={[s.catText, isActive && s.catTextActive]}>{labelStr}</Text>
                    {isActive && <Ionicons name="checkmark" size={20} color={PRIMARY} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity 
              style={{ marginTop: 16, backgroundColor: PRIMARY, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
              onPress={() => { setSelectedCategory(""); setFilterVisible(false); }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>Reset Filter</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* TOP BAR */
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "transparent" },
  locationBtn: { flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 10 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locLabel: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  locSub: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  topIconWrap: { position: "relative", width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  cartDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", borderWidth: 1.5, borderColor: "#fff" },
  topAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: PRIMARY },
  topAvatarPh: { backgroundColor: "#fff", borderColor: "#e2e8f0" },

  /* MODAL */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  catOption: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  catOptionActive: { },
  catText: { fontSize: 15, color: "#475569", fontWeight: "600" },
  catTextActive: { color: PRIMARY, fontWeight: "800" },

  /* SEARCH */
  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 10, width: "100%" },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 13, color: "#334155", paddingVertical: 0 },
  filterBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },

  /* BANNER */
  bannerSection: { marginBottom: 8 },
  bannerCard: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  bannerLeft: { flex: 1, paddingRight: 8 },
  bannerRight: { width: 90, alignItems: "center", justifyContent: "center" },
  bannerPill: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.28)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  bannerPillTxt: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  bannerBig: { fontSize: 22, fontWeight: "900", color: "#fff", lineHeight: 28, marginBottom: 4 },
  bannerSub: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.88)", marginBottom: 6 },
  bannerMeta: { fontSize: 11, color: "rgba(255,255,255,0.68)", marginBottom: 2 },
  bannerBtn: { alignSelf: "flex-start", backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, marginTop: 14 },
  bannerBtnTxt: { fontSize: 13, fontWeight: "800" },
  bannerCircleBig: { width: 76, height: 76, borderRadius: 38, justifyContent: "center", alignItems: "center" },
  bannerCircleSmall: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  bannerBadge: { position: "absolute", bottom: -4, right: 0, width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  dots: { flexDirection: "row", justifyContent: "center", marginTop: 14, marginBottom: 4, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d1d5db" },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: PRIMARY },

  /* QUICK ACTIONS */
  quickWrap: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 20, paddingHorizontal: 8, backgroundColor: "#fff", marginVertical: 6, marginHorizontal: 16, borderRadius: 20, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  quickItem: { alignItems: "center", width: 62 },
  quickIcon: { width: 54, height: 54, borderRadius: 16, backgroundColor: "#f0fdfb", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  quickLabel: { fontSize: 10.5, fontWeight: "600", color: "#475569", textAlign: "center", lineHeight: 14 },

  /* SECTION */
  section: { paddingHorizontal: 16, marginTop: 22, marginBottom: 4 },
  secHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  secTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  viewAll: { fontSize: 13, fontWeight: "700", color: PRIMARY },

  /* SPECIALTIES – 5×2 grid */
  specGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 20 },
  specItem: { width: "18%", alignItems: "center" },
  specIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  specLabel: { fontSize: 10, fontWeight: "600", color: "#475569", textAlign: "center", lineHeight: 13 },

  /* DOCTOR CARDS */
  drCard: { width: 162, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, padding: 12, alignItems: "center" },
  heartBtn: { position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center", zIndex: 1 },
  drImg: { width: 82, height: 82, borderRadius: 41, marginBottom: 10, marginTop: 6 },
  drImgPh: { backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  drName: { fontSize: 13, fontWeight: "800", color: "#0f172a", textAlign: "center", marginBottom: 2 },
  drSpec: { fontSize: 11, color: "#64748b", textAlign: "center", marginBottom: 6 },
  drRatingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 3 },
  drRating: { fontSize: 12, fontWeight: "700", color: "#1e293b" },
  drReviews: { fontSize: 11, color: "#94a3b8" },
  drExp: { fontSize: 11, color: "#64748b", marginBottom: 8 },
  drFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 6 },
  drFee: { fontSize: 15, fontWeight: "900", color: "#0f172a" },
  drBtn: { backgroundColor: PRIMARY, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  drBtnTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },
  drCTA: { alignItems: "center", backgroundColor: "#f0fdfb", padding: 28, marginHorizontal: 16, borderRadius: 18, gap: 10, marginBottom: 16 },
  drCTATxt: { fontSize: 14, fontWeight: "700", color: PRIMARY },

  /* OFFERS STRIP */
  offerStrip: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f0fdfb", padding: 16, borderRadius: 16 },
  offerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  offerIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 1 },
  offerTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 3 },
  offerSub: { fontSize: 11, color: "#64748b" },
});