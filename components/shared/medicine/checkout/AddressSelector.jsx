import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useMedicineCart } from "../../../../context/MedicineCartContext";

export default function AddressSelector() {
  const { deliveryAddress, setDeliveryAddress } =
    useMedicineCart();

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);

  const [addressLine1, setAddressLine1] = useState(
    deliveryAddress?.addressLine1 || ""
  );
  const [pincode, setPincode] = useState(
    deliveryAddress?.pincode || ""
  );

  /* ================= AUTO FETCH ON MOUNT ================= */

  useEffect(() => {
    if (!deliveryAddress?.addressLine1 && !locationFetched) {
      fetchCurrentLocation();
      setLocationFetched(true);
    }
  }, []);

  /* ================= FETCH GPS ================= */

  const fetchCurrentLocation = async () => {
    try {
      setLoading(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const geo = await Location.reverseGeocodeAsync(
        loc.coords
      );

      setDeliveryAddress((prev) => {
        const newAddress = {
          ...prev,
          addressLine1: `${geo[0]?.street || ""}, ${geo[0]?.city || ""}, ${geo[0]?.region || ""}`,
          addressLine2: "",
          city: geo[0]?.city || "",
          state: geo[0]?.region || "",
          pincode: geo[0]?.postalCode || "",
          location: {
            type: "Point",
            coordinates: [
              loc.coords.longitude,
              loc.coords.latitude,
            ],
          },
          source: "GPS",
          updatedAt: Date.now(),
        };

        setAddressLine1(newAddress.addressLine1);
        setPincode(newAddress.pincode);
        return newAddress;
      });

      setEditing(false);
    } catch (e) {
      console.log("Location error", e);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE MANUAL ================= */

  const saveManualAddress = () => {
    if (!addressLine1 || !pincode) return;

    setDeliveryAddress((prev) => ({
      ...prev,
      addressLine1,
      pincode,
      source: "MANUAL",
      updatedAt: Date.now(),
    }));

    setEditing(false);
  };

  /* ================= LOADING / EMPTY ================= */

  if ((!deliveryAddress || loading) && !editing) {
    return (
      <View style={styles.btn}>
        <ActivityIndicator color="#0f766e" />
        <Text style={styles.btnText}>
          Fetching your location...
        </Text>
      </View>
    );
  }

  /* ================= EDIT ================= */

  if (editing) {
    return (
      <View>
        <TextInput
          value={addressLine1}
          onChangeText={setAddressLine1}
          placeholder="Address line"
          style={styles.input}
        />

        <TextInput
          value={pincode}
          onChangeText={setPincode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="Pincode"
          style={styles.input}
        />

        <View style={styles.actions}>
          <TouchableOpacity onPress={saveManualAddress}>
            <Text style={styles.link}>Save Address</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={fetchCurrentLocation}>
            <Text style={styles.link}>Use GPS</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ================= VIEW ================= */

  return (
    <View>
      <Text style={styles.text}>
        {deliveryAddress.addressLine1}
      </Text>

      <Text style={styles.text}>
        Pincode: {deliveryAddress.pincode}
      </Text>

      {deliveryAddress.source && (
        <Text style={styles.source}>
          Source: {deliveryAddress.source}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setEditing(true)}>
          <Text style={styles.link}>Change Address</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={fetchCurrentLocation}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#14b8a6"
            />
          ) : (
            <Text style={styles.link}>Use GPS</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#ecfeff",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  btnText: {
    color: "#0f766e",
    fontWeight: "700",
  },

  text: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  source: {
    fontSize: 11,
    marginTop: 6,
    color: "#94a3b8",
  },

  input: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 13,
  },

  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },

  link: {
    fontSize: 12,
    fontWeight: "700",
    color: "#14b8a6",
  },
});