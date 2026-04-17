import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import api from "../../../../services/axios";
import { useMedicineCart } from "../../../../context/MedicineCartContext";
import { useAuth } from "../../../../context/AuthContext";

export default function AddressSelector({ onAddressSelected }) {
  const { deliveryAddress, setDeliveryAddress } = useMedicineCart();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // New Address Form State
  const [label, setLabel] = useState("Home");
  const [addressLine1, setAddressLine1] = useState("");
  const [pincode, setPincode] = useState("");
  const [location, setLocation] = useState(null);

  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user/my/addresses");
      if (res.data.success) {
        const fetched = res.data.data;
        setAddresses(fetched);

        // ✅ Auto-select first address if none selected yet
        if (fetched.length > 0 && !deliveryAddress) {
          const first = fetched[0];
          setDeliveryAddress({
            ...first,
            fullName: user?.name,
            phone: user?.phone,
          });
          if (onAddressSelected) onAddressSelected();
        }
      }
    } catch (err) {
      console.log("Failed to fetch addresses", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id) => {
    Alert.alert("Delete Address", "Are you sure you want to delete this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await api.delete(`/user/my/addresses/${id}`);
            if (res.data.success) {
              const updated = res.data.data;
              setAddresses(updated);
              if (deliveryAddress?._id === id) {
                // Auto-select next available address after deletion
                if (updated.length > 0) {
                  setDeliveryAddress({ ...updated[0], fullName: user?.name, phone: user?.phone });
                } else {
                  setDeliveryAddress(null);
                }
              }
            }
          } catch (err) {
            Toast.show({ type: "error", text1: "Failed to delete address" });
          }
        },
      },
    ]);
  };

  const handleSelectAddress = (addr) => {
    const finalAddressInfo = {
      ...addr,
      fullName: user?.name,
      phone: user?.phone,
    };
    setDeliveryAddress(finalAddressInfo);
    if (onAddressSelected) onAddressSelected();
  };

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setLabel("Home");
    setAddressLine1("");
    setPincode("");
    setLocation(null);
    setAddingNew(false);
  };

  /* ================= ADD NEW ================= */
  const triggerAddNew = () => {
    setAddingNew(true);
    handleFetchGps();
  };

  /* ================= GPS FETCH ================= */
  const handleFetchGps = async () => {
    try {
      setGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Location permissions required" });
        resetForm();
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 1,
      });
      const geo = await Location.reverseGeocodeAsync(loc.coords);

      setAddressLine1(
        `${geo[0]?.street || ""} ${geo[0]?.name || ""}, ${geo[0]?.city || ""}, ${geo[0]?.region || ""}`.trim()
      );
      setPincode(geo[0]?.postalCode || "");
      setLocation({
        type: "Point",
        coordinates: [loc.coords.longitude, loc.coords.latitude],
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Could not detect location" });
      resetForm();
    } finally {
      setGpsLoading(false);
    }
  };

  /* ================= SAVE ADDRESS ================= */
  const handleSaveNewAddress = async () => {
    if (!addressLine1 || !pincode) {
      Toast.show({ type: "error", text1: "Address and Pincode are required" });
      return;
    }
    if (pincode.length !== 6) {
      Toast.show({ type: "error", text1: "Pincode must be 6 digits" });
      return;
    }
    try {
      const res = await api.post("/user/my/addresses", {
        label,
        addressLine1,
        pincode,
        source: location ? "GPS" : "MANUAL",
        location: location || { type: "Point", coordinates: [0, 0] },
      });

      if (res.data.success) {
        const updated = res.data.data;
        setAddresses(updated);
        resetForm();
        Toast.show({ type: "success", text1: "Address Saved Successfully" });
        // Auto-select newly added address
        const newest = updated[updated.length - 1];
        if (newest) {
          setDeliveryAddress({ ...newest, fullName: user?.name, phone: user?.phone });
        }
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to save address",
        text2: err.response?.data?.message || err.message,
      });
    }
  };

  /* ================= RENDERS ================= */

  if (loading) return <ActivityIndicator color="#14b8a6" style={{ marginVertical: 20 }} />;

  // ALWAYS render addresses on top, GPS/form below
  return (
    <View>

      {/* ── SAVED ADDRESSES (always visible) ── */}
      {addresses.length === 0 && !addingNew && (
        <View style={styles.emptyBox}>
          <Ionicons name="location-outline" size={32} color="#cbd5e1" />
          <Text style={styles.emptyText}>No saved addresses</Text>
          <Text style={styles.emptySubText}>Add one below to proceed</Text>
        </View>
      )}

      {addresses.map((addr) => {
        const isSelected = deliveryAddress?._id === addr._id;
        return (
          <TouchableOpacity
            key={addr._id}
            onPress={() => handleSelectAddress(addr)}
            style={[styles.addressCard, isSelected && styles.addressCardActive]}
          >
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons
                  name={addr.label === "Home" ? "home" : addr.label === "Office" ? "business" : "location"}
                  size={16}
                  color={isSelected ? "#14b8a6" : "#64748b"}
                />
                <Text style={[styles.cardLabel, isSelected && { color: "#14b8a6" }]}>
                  {addr.label}
                </Text>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  deleteAddress(addr._id);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <Text style={styles.cardAddress}>{addr.addressLine1}</Text>
            <Text style={styles.cardPin}>Pincode: {addr.pincode}</Text>
          </TouchableOpacity>
        );
      })}

      {/* ── GPS / FORM SECTION (below addresses) ── */}
      {!addingNew && (
        <TouchableOpacity onPress={triggerAddNew} style={styles.addNewBtn}>
          <Ionicons name="add-circle-outline" size={20} color="#14b8a6" />
          <Text style={styles.addNewBtnText}>Add New Address</Text>
        </TouchableOpacity>
      )}

      {/* GPS LOADING */}
      {addingNew && gpsLoading && (
        <View style={styles.gpsLoadingBox}>
          <ActivityIndicator color="#14b8a6" size="large" />
          <Text style={styles.gpsLoadingText}>Detecting accurate location...</Text>
        </View>
      )}

      {/* ADDRESS FORM (GPS pre-filled) */}
      {addingNew && !gpsLoading && (
        <View style={styles.formSection}>
          <View style={styles.formSectionHeader}>
            <Ionicons name="add-circle" size={18} color="#14b8a6" />
            <Text style={styles.formSectionTitle}>New Address</Text>
          </View>

          <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            We fetched your location. Add exact Flat/House details below.
          </Text>

          <View style={styles.labelRow}>
            {["Home", "Office", "Other"].map((lbl) => (
              <TouchableOpacity
                key={lbl}
                onPress={() => setLabel(lbl)}
                style={[styles.labelBadge, label === lbl && styles.labelBadgeActive]}
              >
                <Text style={[styles.labelText, label === lbl && styles.labelTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="Complete Address (House/Flat No, Block, Street)"
            multiline
            style={styles.inputArea}
          />

          <TextInput
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="6-digit Pincode"
            style={styles.input}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleFetchGps} style={styles.gpsBtn}>
              <Ionicons name="location-outline" size={16} color="#14b8a6" />
              <Text style={styles.gpsBtnText}>Retake GPS</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveNewAddress} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save Address</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={resetForm} style={{ alignSelf: "center", marginTop: 14 }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    paddingTop: 8,
  },
  labelRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  labelBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  labelBadgeActive: {
    backgroundColor: "#14b8a6",
    borderColor: "#14b8a6",
  },
  labelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  labelTextActive: {
    color: "#ffffff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  inputArea: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    minHeight: 80,
    textAlignVertical: "top",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  gpsBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#14b8a6",
    backgroundColor: "#ecfeff",
  },
  gpsBtnText: {
    color: "#14b8a6",
    fontWeight: "700",
  },
  saveBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#14b8a6",
  },
  saveBtnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  cancelText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },

  /* GPS loading (inline) */
  gpsLoadingBox: {
    alignItems: "center",
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: "#f8fafc",
  },
  gpsLoadingText: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: "600",
    fontSize: 13,
  },

  /* Inline new-address form */
  formSection: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#14b8a6",
    borderRadius: 14,
    backgroundColor: "#f0fdfa",
  },
  formSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f766e",
  },

  addressCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  addressCardActive: {
    borderColor: "#14b8a6",
    backgroundColor: "#f0fdfa",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  cardAddress: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  cardPin: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  selectedBadge: {
    backgroundColor: "#14b8a6",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  selectedBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#14b8a6",
    borderRadius: 12,
    backgroundColor: "#fafafa",
    marginTop: 4,
  },
  addNewBtnText: {
    color: "#14b8a6",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
});