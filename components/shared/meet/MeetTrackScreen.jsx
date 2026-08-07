import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import Toast from "react-native-toast-message";

import ShopPhotoField from "./ShopPhotoField";
import {
  OUTCOMES,
  currentPosition,
  describePosition,
  fetchTrack,
  landmarkLine,
  markVisit,
  prettyDateTime,
  prettyDistance,
  sinceLabel,
  updateShopDetails,
  uploadShopImage,
} from "./meetApi";

const GOOGLE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

/* ================= BRAND ================= */

const PRIMARY = "#14b8a6";
const PRIMARY_DARK = "#0f766e";
const BG = "#f1f5f9";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const BORDER = "#e2e8f0";
const GREEN = "#15803d";
const AMBER = "#b45309";

/* ================= MAIN ================= */

/**
 * Track a single RM Member: where the shop is on the map, what the shop looks
 * like (the photo captured at registration), and the meet history — plus the
 * tick that closes the visit out without going back to the list.
 */
export default function MeetTrackScreen() {
  const { agentProfileId } = useLocalSearchParams();

  const alive = useRef(true);
  const mapRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  const [photoOpen, setPhotoOpen] = useState(false);
  const [mark, setMark] = useState(null); // { status, outcome, notes }
  const [submitting, setSubmitting] = useState(false);

  /* null = not editing. "" = editing with nothing picked yet. */
  const [shopEdit, setShopEdit] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* null = sheet closed, string = the draft being typed */
  const [landmarkDraft, setLandmarkDraft] = useState(null);
  const [savingLandmark, setSavingLandmark] = useState(false);

  /* ================= LOAD ================= */

  const load = useCallback(async () => {
    try {
      const res = await fetchTrack(agentProfileId, { range: "month" });
      if (alive.current) setData(res);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Could not load this RM Member",
        text2: err?.response?.data?.message || "Please try again.",
      });
    }
  }, [agentProfileId]);

  useEffect(() => {
    alive.current = true;

    load().finally(() => alive.current && setLoading(false));
    currentPosition().then((pos) => alive.current && setMe(pos));

    return () => {
      alive.current = false;
    };
  }, [load]);

  const member = data?.member;
  const hasShopPin =
    member?.latitude !== null &&
    member?.latitude !== undefined &&
    member?.longitude !== null &&
    member?.longitude !== undefined;

  const shopCoord = hasShopPin
    ? { latitude: member.latitude, longitude: member.longitude }
    : null;

  /* ================= ACTIONS ================= */

  const openInMaps = () => {
    if (!shopCoord) return;

    const { latitude, longitude } = shopCoord;
    const label = encodeURIComponent(member.shopName || member.name || "Shop");

    const url = Platform.select({
      ios: `maps://?q=${label}&ll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    Linking.openURL(url).catch(() =>
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      )
    );
  };

  const recenter = () => {
    if (!shopCoord) return;

    // Frame both pins when we know where the executive is, else just the shop
    if (me) {
      mapRef.current?.fitToCoordinates([shopCoord, me], {
        edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
        animated: true,
      });
      return;
    }

    mapRef.current?.animateCamera({ center: shopCoord, zoom: 16 });
  };

  /* Members registered before shop photos existed — and any shop that has
     since moved or been repainted — get their photo (and pin) refreshed from
     right here, standing outside it. */
  const saveShopPhoto = async () => {
    if (!shopEdit) return;

    setUploading(true);

    try {
      const pos = me || (await currentPosition());

      await uploadShopImage(agentProfileId, {
        uri: shopEdit,
        ...(hasShopPin || !pos
          ? {}
          : { latitude: pos.latitude, longitude: pos.longitude }),
      });

      if (!alive.current) return;

      setShopEdit(null);
      await load();

      Toast.show({ type: "success", text1: "Shop photo updated" });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Could not upload the photo",
        text2: err?.response?.data?.message || "Please try again.",
      });
    } finally {
      if (alive.current) setUploading(false);
    }
  };

  /* The geocoder cannot infer a landmark, so it is only ever typed in — and
     whoever is standing outside the shop is the person who knows it. */
  const saveLandmark = async () => {
    setSavingLandmark(true);

    try {
      await updateShopDetails(agentProfileId, {
        landmark: (landmarkDraft || "").trim() || null,
      });

      if (!alive.current) return;

      setLandmarkDraft(null);
      await load();

      Toast.show({ type: "success", text1: "Landmark saved" });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Could not save the landmark",
        text2: err?.response?.data?.message || "Please try again.",
      });
    } finally {
      if (alive.current) setSavingLandmark(false);
    }
  };

  const submitMark = async () => {
    if (!mark) return;

    setSubmitting(true);

    try {
      const pos = me || (await currentPosition());
      const address = pos ? await describePosition(pos) : null;

      const result = await markVisit(agentProfileId, {
        status: mark.status,
        outcome: mark.outcome,
        notes: mark.notes || null,
        visitType: "CUSTOM",
        ...(pos ? { latitude: pos.latitude, longitude: pos.longitude } : {}),
        ...(address ? { address } : {}),
      });

      if (!alive.current) return;

      setMark(null);
      await load();

      Toast.show({
        type: "success",
        text1:
          result.status === "COMPLETED" ? "Meet completed" : "Marked incomplete",
        text2:
          result.withinAllowedRadius === false
            ? `Logged ${prettyDistance(result.distanceInMeters)} from the shop.`
            : undefined,
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Could not save the meet",
        text2: err?.response?.data?.message || "Please try again.",
      });
    } finally {
      if (alive.current) setSubmitting(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={42} color={TEXT_S} />
        <Text style={styles.emptyTxt}>This RM Member could not be loaded.</Text>
      </View>
    );
  }

  const done = data.visitStatus === "COMPLETED";
  const address = [member.address, member.city, member.pincode]
    .filter(Boolean)
    .join(", ");
  const landmark = landmarkLine(member);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* ===== MAP ===== */}
        <View style={styles.mapWrap}>
          {shopCoord ? (
            <>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={{
                  ...shopCoord,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation
              >
                <Marker
                  coordinate={shopCoord}
                  title={member.shopName || member.name}
                  // Landmark first — it is the more useful half of the callout
                  description={
                    [landmark, address].filter(Boolean).join(" • ") || undefined
                  }
                  pinColor="#ea4335"
                />

                {me && GOOGLE_KEY ? (
                  <MapViewDirections
                    origin={me}
                    destination={shopCoord}
                    apikey={GOOGLE_KEY}
                    strokeWidth={5}
                    strokeColor={PRIMARY_DARK}
                    lineCap="round"
                  />
                ) : null}
              </MapView>

              <TouchableOpacity style={styles.mapBtn} onPress={recenter}>
                <Ionicons name="scan-outline" size={19} color={TEXT_D} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mapBtn, { bottom: 66 }]}
                onPress={openInMaps}
              >
                <Ionicons name="navigate" size={19} color={PRIMARY_DARK} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.noMap]}>
              <Ionicons name="map-outline" size={34} color={TEXT_S} />
              <Text style={styles.noMapTxt}>
                No shop location was captured for this RM Member yet.
              </Text>
            </View>
          )}
        </View>

        {/* ===== SHOP PHOTO ===== */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="storefront-outline" size={16} color={PRIMARY_DARK} />
            <Text style={styles.cardHeadTxt}>Shop</Text>

            <View
              style={[styles.badge, done ? styles.badgeDone : styles.badgePending]}
            >
              <Text style={[styles.badgeTxt, { color: done ? GREEN : AMBER }]}>
                {done ? "Met this month" : "Pending this month"}
              </Text>
            </View>
          </View>

          {shopEdit !== null ? (
            <>
              <ShopPhotoField
                uri={shopEdit || null}
                onChange={(uri) => setShopEdit(uri || "")}
              />

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={() => setShopEdit(null)}
                  disabled={uploading}
                >
                  <Text style={styles.ghostBtnTxt}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tickBtn,
                    (uploading || !shopEdit) && { opacity: 0.5 },
                  ]}
                  onPress={saveShopPhoto}
                  disabled={uploading || !shopEdit}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.tickBtnTxt}>Save photo</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : member.shopImage ? (
            <View>
              <Pressable onPress={() => setPhotoOpen(true)}>
                <Image source={{ uri: member.shopImage }} style={styles.shopPhoto} />
                <View style={styles.photoHint}>
                  <Ionicons name="expand-outline" size={13} color="#fff" />
                  <Text style={styles.photoHintTxt}>Tap to enlarge</Text>
                </View>
              </Pressable>

              <TouchableOpacity
                style={styles.replaceBtn}
                onPress={() => setShopEdit(member.shopImage)}
              >
                <Ionicons name="camera-outline" size={13} color={PRIMARY_DARK} />
                <Text style={styles.replaceBtnTxt}>Replace photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Pressable
              style={[styles.shopPhoto, styles.shopPhotoEmpty]}
              onPress={() => setShopEdit("")}
              accessibilityRole="button"
            >
              <Ionicons name="camera-outline" size={30} color={TEXT_S} />
              <Text style={styles.noPhotoTxt}>
                No shop photo yet — tap to add one
              </Text>
            </Pressable>
          )}

          <Text style={styles.shopName}>
            {member.shopName || member.name || "Unnamed shop"}
          </Text>

          {address ? <Text style={styles.shopAddress}>{address}</Text> : null}

          {/* Called out on its own: the pin gets you to the street, this is
              what confirms you are at the right shop. Tappable either way —
              a missing landmark is worth filling in while standing there. */}
          {landmark ? (
            <TouchableOpacity
              style={styles.landmarkCard}
              onPress={() => setLandmarkDraft(member.landmark || "")}
              activeOpacity={0.8}
            >
              <Ionicons name="flag" size={14} color={AMBER} />
              <Text style={styles.landmarkTxt}>{landmark}</Text>
              <Ionicons name="create-outline" size={14} color={AMBER} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.landmarkEmpty}
              onPress={() => setLandmarkDraft("")}
              activeOpacity={0.8}
            >
              <Ionicons name="flag-outline" size={14} color={TEXT_S} />
              <Text style={styles.landmarkEmptyTxt}>
                No landmark yet — tap to add one
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.metaRow}>
            <Meta icon="person-outline" text={member.name} />
            <Meta icon="repeat-outline" text={`${member.visitFrequency} visits`} />
            <Meta icon="time-outline" text={sinceLabel(member.lastVisitedAt)} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => member.phone && Linking.openURL(`tel:${member.phone}`)}
            >
              <Ionicons name="call-outline" size={16} color={PRIMARY_DARK} />
              <Text style={styles.ghostBtnTxt}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ghostBtn, !shopCoord && { opacity: 0.4 }]}
              onPress={openInMaps}
              disabled={!shopCoord}
            >
              <Ionicons name="map-outline" size={16} color={PRIMARY_DARK} />
              <Text style={styles.ghostBtnTxt}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== MARK ===== */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="checkmark-done-outline" size={16} color={PRIMARY_DARK} />
            <Text style={styles.cardHeadTxt}>Mark this meet</Text>
          </View>

          <View style={styles.markRow}>
            <TouchableOpacity
              style={styles.incompleteBtn}
              onPress={() =>
                setMark({
                  status: "INCOMPLETE",
                  outcome: OUTCOMES.INCOMPLETE[0].key,
                  notes: "",
                })
              }
            >
              <Ionicons name="close-circle-outline" size={16} color={AMBER} />
              <Text style={styles.incompleteBtnTxt}>Incomplete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tickBtn}
              onPress={() =>
                setMark({
                  status: "COMPLETED",
                  outcome: OUTCOMES.COMPLETED[0].key,
                  notes: "",
                })
              }
            >
              <Ionicons name="checkmark" size={17} color="#fff" />
              <Text style={styles.tickBtnTxt}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== HISTORY ===== */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="list-outline" size={16} color={PRIMARY_DARK} />
            <Text style={styles.cardHeadTxt}>Meet history</Text>
          </View>

          {data.recentVisits.length === 0 ? (
            <Text style={styles.noPhotoTxt}>No meets logged yet.</Text>
          ) : (
            data.recentVisits.map((v, i) => (
              <View
                key={String(v.visitId)}
                style={[
                  styles.historyRow,
                  i === data.recentVisits.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View
                  style={[
                    styles.historyDot,
                    {
                      backgroundColor:
                        v.status === "COMPLETED" ? "#dcfce7" : "#fef3c7",
                    },
                  ]}
                >
                  <Ionicons
                    name={v.status === "COMPLETED" ? "checkmark" : "close"}
                    size={13}
                    color={v.status === "COMPLETED" ? GREEN : AMBER}
                  />
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.historyTitle}>
                    {String(v.outcome || "").replace(/_/g, " ").toLowerCase()}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {[
                      prettyDateTime(v.visitedAt),
                      v.visitedBy?.name,
                      prettyDistance(v.distanceInMeters),
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>
                  {v.notes ? (
                    <Text style={styles.historyNotes}>{v.notes}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ===== PHOTO VIEWER ===== */}
      <Modal visible={photoOpen} transparent animationType="fade">
        <Pressable style={styles.photoBackdrop} onPress={() => setPhotoOpen(false)}>
          <Image
            source={{ uri: member.shopImage }}
            style={styles.photoFull}
            resizeMode="contain"
          />
          <Text style={styles.photoClose}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>

      {/* ===== LANDMARK SHEET ===== */}
      <Modal visible={landmarkDraft !== null} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Landmark</Text>
            <Text style={styles.sheetHint}>
              The nearest thing anyone would recognise — a temple, a bus stop,
              a well-known store. Shown to whoever visits this shop next.
            </Text>

            <Text style={styles.fieldLabel}>Near…</Text>
            <TextInput
              style={styles.landmarkInput}
              placeholder="e.g. opposite SBI ATM, beside Kali Mandir"
              placeholderTextColor={TEXT_S}
              value={landmarkDraft || ""}
              onChangeText={setLandmarkDraft}
              autoFocus
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetCancel]}
                onPress={() => setLandmarkDraft(null)}
                disabled={savingLandmark}
              >
                <Text style={styles.sheetCancelTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetBtn, savingLandmark && { opacity: 0.6 }]}
                onPress={saveLandmark}
                disabled={savingLandmark}
              >
                {savingLandmark ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sheetApplyTxt}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== MARK SHEET ===== */}
      <Modal visible={!!mark} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {mark?.status === "COMPLETED" ? "Complete meet" : "Mark incomplete"}
            </Text>
            <Text style={styles.sheetHint}>
              {member.shopName || member.name}
            </Text>

            <Text style={styles.fieldLabel}>What happened?</Text>
            <View style={styles.outcomeWrap}>
              {(OUTCOMES[mark?.status || "COMPLETED"] || []).map((o) => {
                const active = mark?.outcome === o.key;
                return (
                  <TouchableOpacity
                    key={o.key}
                    style={[styles.outcomeChip, active && styles.outcomeChipActive]}
                    onPress={() => setMark((m) => ({ ...m, outcome: o.key }))}
                  >
                    <Text
                      style={[
                        styles.outcomeChipTxt,
                        active && styles.outcomeChipTxtActive,
                      ]}
                    >
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Anything the next visit should know"
              placeholderTextColor={TEXT_S}
              value={mark?.notes || ""}
              onChangeText={(v) => setMark((m) => ({ ...m, notes: v }))}
              multiline
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetCancel]}
                onPress={() => setMark(null)}
                disabled={submitting}
              >
                <Text style={styles.sheetCancelTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetBtn, submitting && { opacity: 0.6 }]}
                onPress={submitMark}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sheetApplyTxt}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= PIECES ================= */

function Meta({ icon, text }) {
  if (!text) return null;

  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={TEXT_M} />
      <Text style={styles.metaTxt} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: BG,
  },
  emptyTxt: { fontSize: 13, color: TEXT_M, paddingHorizontal: 40, textAlign: "center" },

  /* MAP */
  mapWrap: { height: 260, backgroundColor: "#e2e8f0" },
  mapBtn: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  noMap: { alignItems: "center", justifyContent: "center", gap: 10, padding: 30 },
  noMapTxt: { fontSize: 12.5, color: TEXT_M, textAlign: "center" },

  /* CARDS */
  card: {
    backgroundColor: CARD,
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 },
  cardHeadTxt: { flex: 1, fontSize: 12, fontWeight: "900", color: PRIMARY_DARK, textTransform: "uppercase" },

  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  badgeDone: { backgroundColor: "#dcfce7" },
  badgePending: { backgroundColor: "#fef3c7" },
  badgeTxt: { fontSize: 10, fontWeight: "800" },

  shopPhoto: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: BG,
  },
  shopPhotoEmpty: { alignItems: "center", justifyContent: "center", gap: 8 },
  noPhotoTxt: {
    fontSize: 12,
    color: TEXT_S,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  photoHint: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15,23,42,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  photoHintTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },

  replaceBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#f0fdfa",
  },
  replaceBtnTxt: { fontSize: 11.5, fontWeight: "800", color: PRIMARY_DARK },

  shopName: { fontSize: 16, fontWeight: "900", color: TEXT_D, marginTop: 12 },
  shopAddress: { fontSize: 12.5, color: TEXT_M, marginTop: 4, lineHeight: 18 },

  landmarkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  landmarkTxt: { flex: 1, fontSize: 12.5, fontWeight: "800", color: AMBER },

  landmarkEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: BG,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  landmarkEmptyTxt: { flex: 1, fontSize: 12, fontWeight: "600", color: TEXT_S },

  landmarkInput: {
    backgroundColor: BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: TEXT_D,
    fontSize: 13,
  },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaTxt: { fontSize: 11.5, color: TEXT_M, fontWeight: "600" },

  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  ghostBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#f0fdfa",
  },
  ghostBtnTxt: { fontSize: 12.5, fontWeight: "800", color: PRIMARY_DARK },

  markRow: { flexDirection: "row", gap: 10 },
  incompleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: "#fffbeb",
  },
  incompleteBtnTxt: { fontSize: 12.5, fontWeight: "800", color: AMBER },
  tickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: PRIMARY,
  },
  tickBtnTxt: { fontSize: 13, fontWeight: "900", color: "#fff" },

  /* HISTORY */
  historyRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  historyDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT_D,
    textTransform: "capitalize",
  },
  historyMeta: { fontSize: 11, color: TEXT_M, marginTop: 2 },
  historyNotes: { fontSize: 11.5, color: TEXT_M, marginTop: 4, fontStyle: "italic" },

  /* PHOTO VIEWER */
  photoBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  photoFull: { width: "100%", height: "75%" },
  photoClose: { color: "rgba(255,255,255,0.7)", fontSize: 12 },

  /* SHEET */
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 22,
  },
  sheet: { backgroundColor: CARD, borderRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: TEXT_D },
  sheetHint: { fontSize: 12, color: TEXT_M, marginTop: 6 },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: TEXT_M,
    marginTop: 16,
    marginBottom: 7,
    textTransform: "uppercase",
  },

  outcomeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  outcomeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  outcomeChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  outcomeChipTxt: { fontSize: 12, fontWeight: "700", color: TEXT_M },
  outcomeChipTxtActive: { color: "#fff" },

  notesInput: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    textAlignVertical: "top",
    color: TEXT_D,
    fontSize: 13,
  },

  sheetActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  sheetBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancel: { backgroundColor: BG },
  sheetCancelTxt: { fontWeight: "800", color: TEXT_M, fontSize: 13 },
  sheetApplyTxt: { fontWeight: "900", color: "#fff", fontSize: 13 },
});
