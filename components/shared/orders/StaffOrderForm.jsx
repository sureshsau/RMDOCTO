import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../../../services/axios";

const TEAL = "#1BA6A6";
const BG = "#F8FAFC";
const CARD = "#FFFFFF";
const TEXT_D = "#0F172A";
const TEXT_M = "#475569";
const TEXT_S = "#94A3B8";
const BORDER = "#E2E8F0";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * GET /medicines flattens the catalogue pricing — it returns price / mrp /
 * specialPrice at the root and no `pricing` object (see getMedicinesService).
 * The order screens work in terms of `pricing`, so reading it straight off the
 * search result quoted every medicine at ₹0. Normalise at the fetch boundary so
 * a single shape flows through the results, the cart and the estimate.
 */
const withPricing = (m) => ({
  ...m,
  pricing: m?.pricing ?? {
    price: m?.price,
    mrp: m?.mrp,
    specialPrice: m?.specialPrice,
  },
});

/**
 * Exact per-unit price the customer will be charged, mirroring
 * createMedicineOrder on the server:
 *   base = agent ? (specialPrice ?? price) : price
 *   payable = base + GST on base
 * Showing only `pricing.price` understates the bill by the GST amount.
 */
function unitPricing(medicine, isAgent) {
  const p = medicine?.pricing || {};
  const base = isAgent ? p.specialPrice ?? p.price ?? 0 : p.price ?? 0;
  const gstPercentage = medicine?.gstPercentage || 0;
  const gstAmount = (base * gstPercentage) / 100;

  return {
    base: Number(base.toFixed(2)),
    gstPercentage,
    gstAmount: Number(gstAmount.toFixed(2)),
    payable: Number((base + gstAmount).toFixed(2)),
    mrp: p.mrp ?? null,
    isSpecial: isAgent && p.specialPrice != null && p.specialPrice !== p.price,
  };
}

const emptyCustomer = { name: "", phone: "" };
const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  pincode: "",
};

/**
 * Counter order form — admin / receptionist places a medicine order for a
 * customer identified by name + phone. The order is stored under the
 * customer's own account (created on the fly if the number is new).
 */
export default function StaffOrderForm({ ordersHref }) {
  /* ================= CUSTOMER ================= */
  const [customer, setCustomer] = useState(emptyCustomer);
  const [lookup, setLookup] = useState(null); // { exists, isAgent, customer }
  const [lookingUp, setLookingUp] = useState(false);

  // Agents are billed specialPrice — the quoted price must follow the tier
  const customerIsAgent = !!lookup?.isAgent;

  /* ================= ITEMS ================= */
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState([]); // [{ _id, name, brandName, price, gstPercentage, quantity }]

  /* ================= ADDRESS ================= */
  const [address, setAddress] = useState(emptyAddress);
  const [coords, setCoords] = useState(null); // [lng, lat]
  const [locating, setLocating] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  /* ================= CUSTOMER LOOKUP ================= */

  useEffect(() => {
    const phone = customer.phone.trim();

    if (!/^\d{10,15}$/.test(phone)) {
      setLookup(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLookingUp(true);
        const res = await api.get("/medicine/order/for-customer/lookup", {
          params: { phone },
        });
        if (cancelled) return;

        setLookup(res.data);

        // Prefill the registered name so staff don't retype it
        if (res.data?.exists && res.data.customer?.name) {
          setCustomer((c) => ({ ...c, name: c.name || res.data.customer.name }));
        }
      } catch {
        if (!cancelled) setLookup(null);
      } finally {
        if (!cancelled) setLookingUp(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [customer.phone]);

  /* ================= MEDICINE SEARCH ================= */

  useEffect(() => {
    const term = search.trim();

    if (term.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.get("/medicines", {
          params: { search: term, limit: 20 },
        });
        if (!cancelled) setResults((res.data?.data || []).map(withPricing));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  /* ================= CART ================= */

  const addToCart = (medicine) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === medicine._id);
      if (existing) {
        return prev.map((i) =>
          i._id === medicine._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          _id: medicine._id,
          name: medicine.name,
          brandName: medicine.brandName,
          // Keep the raw catalog pricing so the tier can be re-applied if the
          // customer's phone (and therefore their price tier) changes later
          pricing: medicine.pricing || {},
          gstPercentage: medicine.gstPercentage || 0,
          quantity: 1,
        },
      ];
    });
    setSearch("");
    setResults([]);
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i._id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  /**
   * Uses the same formula as the server, so the figure quoted at the counter
   * matches what the customer is billed.
   */
  const estimate = useMemo(() => {
    let subtotal = 0;
    let gst = 0;

    cart.forEach((i) => {
      const { base, gstPercentage } = unitPricing(i, customerIsAgent);

      // Rounded per line, exactly as createMedicineOrder does — rounding per
      // unit instead would drift by a paisa on some quantities
      const lineSubtotal = Number((base * i.quantity).toFixed(2));
      const lineGst = Number(((lineSubtotal * gstPercentage) / 100).toFixed(2));

      subtotal += lineSubtotal;
      gst += lineGst;
    });

    return {
      subtotal: Number(subtotal.toFixed(2)),
      gst: Number(gst.toFixed(2)),
      total: Number((subtotal + gst).toFixed(2)),
    };
  }, [cart, customerIsAgent]);

  /* ================= LOCATION ================= */

  const useCurrentLocation = async () => {
    try {
      setLocating(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return Toast.show({
          type: "error",
          text1: "Permission denied",
          text2: "Location is needed to route the delivery",
        });
      }

      const loc = await Location.getCurrentPositionAsync({});
      setCoords([loc.coords.longitude, loc.coords.latitude]);

      // Best-effort address prefill — staff can correct it
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geo?.length) {
          const p = geo[0];
          setAddress((a) => ({
            ...a,
            addressLine1:
              a.addressLine1 ||
              [p.name, p.street].filter(Boolean).join(", ") ||
              "",
            addressLine2: a.addressLine2 || [p.city, p.region].filter(Boolean).join(", "),
            pincode: a.pincode || p.postalCode || "",
          }));
        }
      } catch {
        // geocoding is optional — the coordinates are what matter
      }

      Toast.show({ type: "success", text1: "Location captured" });
    } catch {
      Toast.show({ type: "error", text1: "Could not get location" });
    } finally {
      setLocating(false);
    }
  };

  /* ================= VALIDATION ================= */

  const phoneOk = /^\d{10,15}$/.test(customer.phone.trim());
  const deliveryPhone = (address.phone || customer.phone).trim();

  const isValid =
    phoneOk &&
    customer.name.trim().length >= 2 &&
    cart.length > 0 &&
    address.addressLine1.trim().length > 0 &&
    address.pincode.trim().length > 0 &&
    /^\d{10,15}$/.test(deliveryPhone) &&
    Array.isArray(coords);

  /* ================= SUBMIT ================= */

  const submit = async () => {
    if (!isValid || submitting) return;

    try {
      setSubmitting(true);

      const payload = {
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
        },
        items: cart.map((i) => ({ medicineId: i._id, quantity: i.quantity })),
        deliveryAddress: {
          fullName: (address.fullName || customer.name).trim(),
          phone: deliveryPhone,
          addressLine1: address.addressLine1.trim(),
          addressLine2: address.addressLine2.trim(),
          pincode: address.pincode.trim(),
          location: { type: "Point", coordinates: coords },
        },
        paymentMode: "COD",
      };

      const res = await api.post("/medicine/order/for-customer", payload);

      Toast.show({
        type: "success",
        text1: "Order placed",
        text2: res.data?.customer?.isNewCustomer
          ? `New customer record created for ${payload.customer.phone}`
          : `Placed for ${res.data?.customer?.name || payload.customer.name}`,
      });

      // Reset for the next customer at the counter
      setCustomer(emptyCustomer);
      setAddress(emptyAddress);
      setCart([]);
      setCoords(null);
      setLookup(null);

      if (ordersHref) router.push(ordersHref);
    } catch (e) {
      const data = e?.response?.data;
      Toast.show({
        type: "error",
        text1: "Order failed",
        text2: data?.errors?.[0]?.message || data?.message || "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ============ CUSTOMER ============ */}
          <Text style={styles.section}>CUSTOMER</Text>
          <View style={styles.card}>
            <Field
              label="Phone number *"
              value={customer.phone}
              onChangeText={(t) =>
                setCustomer({ ...customer, phone: t.replace(/[^\d]/g, "") })
              }
              keyboardType="number-pad"
              placeholder="10-digit mobile number"
            />

            {lookingUp && <Text style={styles.hint}>Checking…</Text>}

            {!lookingUp && lookup?.exists && (
              <View style={[styles.banner, styles.bannerKnown]}>
                <Ionicons name="person-circle-outline" size={16} color="#0F766E" />
                <Text style={styles.bannerTxt}>
                  Existing customer: {lookup.customer?.name || "Unnamed"}
                </Text>
              </View>
            )}

            {!lookingUp && lookup && !lookup.exists && (
              <View style={[styles.banner, styles.bannerNew]}>
                <Ionicons name="person-add-outline" size={16} color="#B45309" />
                <Text style={[styles.bannerTxt, { color: "#B45309" }]}>
                  New number — a customer record will be created
                </Text>
              </View>
            )}

            <Field
              label="Customer name *"
              value={customer.name}
              onChangeText={(t) => setCustomer({ ...customer, name: t })}
              placeholder="Full name"
            />
          </View>

          {/* ============ MEDICINES ============ */}
          <Text style={styles.section}>MEDICINES</Text>
          <View style={styles.card}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={TEXT_S} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search medicines to add"
                placeholderTextColor={TEXT_S}
                value={search}
                onChangeText={setSearch}
              />
              {searching && <ActivityIndicator size="small" color={TEAL} />}
            </View>

            {results.map((m) => {
              const pr = unitPricing(m, customerIsAgent);

              return (
                <TouchableOpacity
                  key={m._id}
                  style={styles.resultRow}
                  onPress={() => addToCart(m)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{m.name}</Text>
                    <Text style={styles.resultMeta}>
                      {[m.brandName, m.dosageForm].filter(Boolean).join(" • ")}
                    </Text>
                  </View>

                  <View style={styles.priceCol}>
                    {/* Exact per-unit amount the customer is charged */}
                    <Text style={styles.resultPrice}>{money(pr.payable)}</Text>

                    <Text style={styles.priceBreakdown}>
                      {money(pr.base)}
                      {pr.gstPercentage > 0
                        ? ` + ${pr.gstPercentage}% GST`
                        : " • no GST"}
                    </Text>

                    {pr.isSpecial ? (
                      <Text style={styles.priceTag}>Agent price</Text>
                    ) : pr.mrp && pr.mrp > pr.base ? (
                      <Text style={styles.priceMrp}>MRP {money(pr.mrp)}</Text>
                    ) : null}
                  </View>

                  <Ionicons name="add-circle" size={22} color={TEAL} />
                </TouchableOpacity>
              );
            })}

            {search.trim().length >= 2 && !searching && results.length === 0 && (
              <Text style={styles.hint}>No medicines matched</Text>
            )}

            {cart.length === 0 ? (
              <Text style={styles.hint}>No items added yet</Text>
            ) : (
              cart.map((i) => {
                const pr = unitPricing(i, customerIsAgent);

                return (
                  <View key={i._id} style={styles.cartRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{i.name}</Text>
                      <Text style={styles.resultMeta}>
                        {money(pr.payable)} × {i.quantity} ={" "}
                        {money(pr.payable * i.quantity)}
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => changeQty(i._id, -1)} hitSlop={8}>
                      <Ionicons name="remove-circle-outline" size={24} color={TEXT_M} />
                    </TouchableOpacity>
                    <Text style={styles.qty}>{i.quantity}</Text>
                    <TouchableOpacity onPress={() => changeQty(i._id, 1)} hitSlop={8}>
                      <Ionicons name="add-circle-outline" size={24} color={TEAL} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            {cart.length > 0 && (
              <View style={styles.totalBox}>
                <View style={styles.totalLines}>
                  <TotalLine label="Subtotal" value={money(estimate.subtotal)} />
                  <TotalLine label="GST" value={money(estimate.gst)} />
                  {customerIsAgent && (
                    <Text style={styles.tierNote}>Agent pricing applied</Text>
                  )}
                </View>

                <View style={styles.totalFinal}>
                  <Text style={styles.totalLabel}>Total payable</Text>
                  <Text style={styles.totalValue}>{money(estimate.total)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* ============ DELIVERY ADDRESS ============ */}
          <Text style={styles.section}>DELIVERY ADDRESS</Text>
          <View style={styles.card}>
            <Field
              label="Receiver name"
              value={address.fullName}
              onChangeText={(t) => setAddress({ ...address, fullName: t })}
              placeholder={customer.name || "Same as customer"}
            />
            <Field
              label="Delivery phone"
              value={address.phone}
              onChangeText={(t) =>
                setAddress({ ...address, phone: t.replace(/[^\d]/g, "") })
              }
              keyboardType="number-pad"
              placeholder={customer.phone || "Same as customer"}
            />
            <Field
              label="Address line 1 *"
              value={address.addressLine1}
              onChangeText={(t) => setAddress({ ...address, addressLine1: t })}
              placeholder="House / street"
            />
            <Field
              label="Address line 2"
              value={address.addressLine2}
              onChangeText={(t) => setAddress({ ...address, addressLine2: t })}
              placeholder="Area / landmark"
            />
            <Field
              label="Pincode *"
              value={address.pincode}
              onChangeText={(t) =>
                setAddress({ ...address, pincode: t.replace(/[^\d]/g, "") })
              }
              keyboardType="number-pad"
              placeholder="6-digit pincode"
            />

            <TouchableOpacity
              style={[styles.locBtn, coords && styles.locBtnDone]}
              onPress={useCurrentLocation}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator size="small" color={TEAL} />
              ) : (
                <Ionicons
                  name={coords ? "checkmark-circle" : "location-outline"}
                  size={18}
                  color={coords ? "#0F766E" : TEAL}
                />
              )}
              <Text style={styles.locTxt}>
                {coords ? "Delivery location captured" : "Capture delivery location *"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ============ PAYMENT ============ */}
          <Text style={styles.section}>PAYMENT</Text>
          <View style={styles.card}>
            <View style={styles.codRow}>
              <Ionicons name="cash-outline" size={18} color={TEAL} />
              <Text style={styles.codTxt}>Cash on delivery</Text>
            </View>
            <Text style={styles.hint}>
              Counter orders are COD — a customer&apos;s wallet or online payment
              can&apos;t be charged on their behalf.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!isValid || submitting) && styles.submitDisabled]}
            onPress={submit}
            disabled={!isValid || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitTxt}>Place Order</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TotalLine({ label, value }) {
  return (
    <View style={styles.totalLine}>
      <Text style={styles.totalLineLabel}>{label}</Text>
      <Text style={styles.totalLineValue}>{value}</Text>
    </View>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={TEXT_S} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  section: {
    fontSize: 11,
    fontWeight: "800",
    color: TEXT_M,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
  },

  label: { fontSize: 11, fontWeight: "700", color: TEXT_M, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT_D,
    backgroundColor: "#fff",
  },

  hint: { fontSize: 11, color: TEXT_S, marginTop: 4 },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  bannerKnown: { backgroundColor: "#CCFBF1" },
  bannerNew: { backgroundColor: "#FEF3C7" },
  bannerTxt: { fontSize: 12, fontWeight: "700", color: "#0F766E", flex: 1 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_D },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  resultName: { fontSize: 13, fontWeight: "700", color: TEXT_D },
  resultMeta: { fontSize: 11, color: TEXT_S, marginTop: 2 },

  priceCol: { alignItems: "flex-end" },
  resultPrice: { fontSize: 14, fontWeight: "900", color: TEAL },
  priceBreakdown: { fontSize: 9.5, color: TEXT_S, marginTop: 1 },
  priceTag: { fontSize: 9, fontWeight: "800", color: "#7c3aed", marginTop: 1 },
  priceMrp: {
    fontSize: 9.5,
    color: TEXT_S,
    marginTop: 1,
    textDecorationLine: "line-through",
  },

  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  qty: { fontSize: 14, fontWeight: "800", color: TEXT_D, minWidth: 22, textAlign: "center" },

  totalBox: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 10,
    paddingTop: 10,
  },
  totalLines: { gap: 3, marginBottom: 8 },
  totalLine: { flexDirection: "row", justifyContent: "space-between" },
  totalLineLabel: { fontSize: 11, color: TEXT_M },
  totalLineValue: { fontSize: 11, fontWeight: "700", color: TEXT_D },
  tierNote: { fontSize: 10, fontWeight: "700", color: "#7c3aed", marginTop: 2 },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  },
  totalLabel: { fontSize: 12, fontWeight: "700", color: TEXT_M },
  totalValue: { fontSize: 18, fontWeight: "900", color: TEAL },

  locBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: TEAL,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 12,
  },
  locBtnDone: { borderStyle: "solid", borderColor: "#0F766E", backgroundColor: "#F0FDFA" },
  locTxt: { fontSize: 12, fontWeight: "700", color: TEXT_D },

  codRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  codTxt: { fontSize: 14, fontWeight: "700", color: TEXT_D },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  submitDisabled: { backgroundColor: "#CBD5E1" },
  submitTxt: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
