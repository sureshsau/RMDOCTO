import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import {
  deleteAppointmentPrescription,
  uploadAppointmentPrescription,
} from "../../../utils/appointmentApi";
import PrescriptionAttachment from "./PrescriptionAttachment";
import PrescriptionPicker from "./PrescriptionPicker";

const TEXT_S = "#94a3b8";

/**
 * Prescription block for an already-booked appointment.
 *
 * Read-only by default (what doctors and staff lists show). With `editable`,
 * the person who booked can attach one after the fact, or remove it.
 */
export default function AppointmentPrescriptionRow({
  appointment,
  editable = false,
  onUpdated,
}) {
  const [prescription, setPrescription] = useState(appointment?.prescription || null);
  const [busy, setBusy] = useState(false);

  const hasPrescription = !!prescription?.url;

  const handlePick = async (asset) => {
    if (!asset) return;

    try {
      setBusy(true);
      const res = await uploadAppointmentPrescription(appointment._id, asset);

      const next = res?.data || { url: asset.uri, uploadedAt: new Date().toISOString() };
      setPrescription(next);
      onUpdated?.(next);

      Toast.show({ type: "success", text1: "Prescription uploaded" });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Upload failed",
        text2: e?.response?.data?.message || "Please try again",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    try {
      setBusy(true);
      await deleteAppointmentPrescription(appointment._id);
      setPrescription(null);
      onUpdated?.(null);
      Toast.show({ type: "success", text1: "Prescription removed" });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Could not remove",
        text2: e?.response?.data?.message || "Please try again",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!hasPrescription && !editable) return null;

  if (busy) {
    return (
      <View style={styles.busy}>
        <ActivityIndicator size="small" color="#1BA6A6" />
      </View>
    );
  }

  if (hasPrescription) {
    return (
      <View>
        <PrescriptionAttachment prescription={prescription} />
        {editable && (
          <TouchableOpacity style={styles.removeRow} onPress={handleRemove} hitSlop={6}>
            <Ionicons name="trash-outline" size={13} color="#ef4444" />
            <Text style={styles.removeTxt}>Remove prescription</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.addWrap}>
      <Text style={styles.addLabel}>Add a prescription (optional)</Text>
      <PrescriptionPicker value={null} onChange={handlePick} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  busy: { paddingVertical: 14, alignItems: "center" },

  addWrap: { marginTop: 10 },
  addLabel: { fontSize: 11, fontWeight: "700", color: TEXT_S, marginBottom: 8 },

  removeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: 6,
    paddingVertical: 2,
  },
  removeTxt: { fontSize: 11, fontWeight: "700", color: "#ef4444" },
});
