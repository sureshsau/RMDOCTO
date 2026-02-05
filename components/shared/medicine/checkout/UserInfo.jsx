import { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "../../../../context/AuthContext";
import { useMedicineCart } from "../../../../context/MedicineCartContext";

export default function UserInfo() {
  const { user } = useAuth();
  const { deliveryAddress, setDeliveryAddress } = useMedicineCart();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  /* ================= INIT FROM AUTH ================= */

  useEffect(() => {
    setDeliveryAddress((prev) => ({
      ...prev,
      fullName: prev?.fullName || user?.name || "",
      phone: prev?.phone || user?.phone || "",
    }));

    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user]);

  /* ================= SAVE ================= */

  const saveChanges = () => {
    if (!name || phone.length < 10) return;

    setDeliveryAddress((prev) => ({
      ...prev,
      fullName: name,
      phone,
    }));

    setEditing(false);
  };

  /* ================= UI ================= */

  return (
    <View>
      {/* NAME */}
      {!editing ? (
        <Text style={styles.name}>
          {deliveryAddress?.fullName || "User"}
        </Text>
      ) : (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full Name"
          style={styles.input}
        />
      )}

      {/* PHONE */}
      {!editing ? (
        <Text style={styles.text}>
          Phone: {deliveryAddress?.phone || "N/A"}
        </Text>
      ) : (
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="Phone Number"
          style={styles.input}
        />
      )}

      {/* ACTION */}
      <TouchableOpacity
        onPress={editing ? saveChanges : () => setEditing(true)}
      >
        <Text style={styles.link}>
          {editing ? "Save Details" : "Change Name / Number"}
        </Text>
      </TouchableOpacity>

      {/* SOURCE */}
      {deliveryAddress?.source && (
        <Text style={styles.source}>
          Source: {deliveryAddress.source}
        </Text>
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#020617",
  },

  text: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  input: {
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 13,
  },

  link: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#14b8a6",
  },

  source: {
    fontSize: 11,
    marginTop: 6,
    color: "#94a3b8",
  },
});
