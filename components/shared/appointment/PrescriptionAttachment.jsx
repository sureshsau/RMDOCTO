import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TEAL = "#1BA6A6";
const TEXT_D = "#0F172A";
const TEXT_S = "#94A3B8";

const isPdfUrl = (url) => String(url || "").split("?")[0].toLowerCase().endsWith(".pdf");

/**
 * Read-only prescription attachment shown on an appointment card.
 * Renders nothing when the booking has no prescription (it is optional).
 *
 * Images open in an in-app viewer; PDFs open in the system browser.
 */
export default function PrescriptionAttachment({ prescription, compact = false }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const url = prescription?.url;
  if (!url) return null;

  const pdf = isPdfUrl(url);

  const open = async () => {
    if (pdf) {
      await WebBrowser.openBrowserAsync(url);
      return;
    }
    setImgLoading(true);
    setViewerOpen(true);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.row, compact && styles.rowCompact]}
        onPress={open}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name={pdf ? "document-text" : "image"}
            size={16}
            color={TEAL}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Prescription attached</Text>
          {!!prescription.uploadedAt && !compact && (
            <Text style={styles.meta}>
              Uploaded {new Date(prescription.uploadedAt).toDateString()}
            </Text>
          )}
        </View>

        <Text style={styles.viewTxt}>View</Text>
        <Ionicons name="chevron-forward" size={14} color={TEAL} />
      </TouchableOpacity>

      <Modal visible={viewerOpen} transparent animationType="fade">
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setViewerOpen(false)}
            hitSlop={10}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {imgLoading && (
            <ActivityIndicator size="large" color="#fff" style={StyleSheet.absoluteFill} />
          )}

          <Image
            source={{ uri: url }}
            style={styles.fullImage}
            resizeMode="contain"
            onLoadEnd={() => setImgLoading(false)}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: TEAL + "10",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  rowCompact: { paddingVertical: 8, marginTop: 8 },

  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 12, fontWeight: "700", color: TEXT_D },
  meta: { fontSize: 10, color: TEXT_S, marginTop: 2 },
  viewTxt: { fontSize: 12, fontWeight: "700", color: TEAL },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: { position: "absolute", top: 50, right: 20, zIndex: 2, padding: 6 },
  fullImage: { width: "100%", height: "80%" },
});
