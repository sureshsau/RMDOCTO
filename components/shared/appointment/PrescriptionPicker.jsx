import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const TEAL = "#1BA6A6";
const TEXT_D = "#0F172A";
const TEXT_M = "#475569";
const TEXT_S = "#94A3B8";

/**
 * Turn a picked asset into the { uri, name, type } shape React Native's
 * FormData expects. Mirrors the KYC upload pattern used elsewhere in the app.
 */
export function toUploadFile(asset, fallbackName = "prescription") {
  if (!asset) return null;

  const uri = asset.uri;
  const extFromUri = uri.split("?")[0].split(".").pop()?.toLowerCase();
  const ext = extFromUri && extFromUri.length <= 5 ? extFromUri : "jpg";

  const type =
    asset.mimeType ||
    (ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`);

  return {
    uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
    name: asset.name || asset.fileName || `${fallbackName}.${ext}`,
    type,
  };
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024; // matches the server's 10 MB limit

function validate(asset) {
  const file = toUploadFile(asset);

  if (!ALLOWED.includes(file.type)) {
    Toast.show({
      type: "error",
      text1: "Unsupported file",
      text2: "Upload a JPG, PNG, WEBP image or a PDF",
    });
    return false;
  }

  if (asset.fileSize && asset.fileSize > MAX_BYTES) {
    Toast.show({
      type: "error",
      text1: "File too large",
      text2: "Prescription must be under 10 MB",
    });
    return false;
  }

  return true;
}

/**
 * Optional prescription attachment for a doctor booking.
 *
 * @param value    picked asset ({ uri, mimeType, ... }) or null
 * @param onChange (asset | null) => void
 */
export default function PrescriptionPicker({ value, onChange, disabled, compact = false }) {
  const isPdf = value && toUploadFile(value).type === "application/pdf";

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      return Toast.show({
        type: "error",
        text1: "Permission denied",
        text2: "Camera access is needed to photograph the prescription",
      });
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && validate(result.assets[0])) {
      onChange(result.assets[0]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && validate(result.assets[0])) {
      onChange(result.assets[0]);
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (!result.canceled && validate(result.assets[0])) {
      onChange(result.assets[0]);
    }
  };

  return (
    <View style={styles.wrap}>
      {!compact && (
        <View style={styles.headerRow}>
          <Text style={styles.label}>Prescription</Text>
          <Text style={styles.optional}>Optional</Text>
        </View>
      )}

      {value ? (
        <View style={styles.previewCard}>
          {isPdf ? (
            <View style={styles.pdfThumb}>
              <Ionicons name="document-text" size={26} color={TEAL} />
            </View>
          ) : (
            <Image source={{ uri: value.uri }} style={styles.thumb} />
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.fileName} numberOfLines={1}>
              {toUploadFile(value).name}
            </Text>
            <Text style={styles.fileHint}>Attached to this booking</Text>
          </View>

          <TouchableOpacity
            onPress={() => onChange(null)}
            disabled={disabled}
            style={styles.removeBtn}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <PickAction icon="camera-outline" text="Camera" onPress={takePhoto} disabled={disabled} />
          <PickAction icon="image-outline" text="Gallery" onPress={pickImage} disabled={disabled} />
          <PickAction icon="document-outline" text="PDF" onPress={pickPdf} disabled={disabled} />
        </View>
      )}

      {!compact && (
        <Text style={styles.helper}>
          Attach the patient&apos;s prescription so the doctor can see it before the visit.
        </Text>
      )}
    </View>
  );
}

function PickAction({ icon, text, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.action, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={20} color={TEAL} />
      <Text style={styles.actionTxt}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "700", color: TEXT_M },
  optional: {
    fontSize: 10,
    fontWeight: "700",
    color: TEXT_S,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },

  actionsRow: { flexDirection: "row", gap: 10 },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    backgroundColor: "#fff",
  },
  actionTxt: { fontSize: 12, fontWeight: "700", color: TEAL },

  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
  },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#F1F5F9" },
  pdfThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: TEAL + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { fontSize: 13, fontWeight: "700", color: TEXT_D },
  fileHint: { fontSize: 11, color: TEXT_S, marginTop: 2 },
  removeBtn: { padding: 2 },

  helper: { fontSize: 11, color: TEXT_S, marginTop: 8 },
});
