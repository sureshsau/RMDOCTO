import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

const PRIMARY = "#14b8a6";
const PRIMARY_DARK = "#0f766e";
const BG = "#f8fafc";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";
const BORDER = "#e2e8f0";

/**
 * Shop front photo captured while registering an RM Member. It is what the
 * admin or marketing executive sees on the Track screen when they arrive, so
 * they can confirm they are standing outside the right shop.
 *
 * Holds only the local file URI — the caller uploads it once the RM Member
 * has an id to attach it to.
 *
 * Camera and gallery are plain inline buttons rather than an action sheet on
 * purpose: launching a native picker while a React Native <Modal> is still
 * animating out leaves the picker with no host to attach to, and it silently
 * never opens. Every other picker in this app launches straight from a
 * button for the same reason.
 */
export default function ShopPhotoField({ uri, onChange, required = false }) {
  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "We need camera permissions to take the shop photo.",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) onChange(result.assets[0].uri);
    } catch (err) {
      // Surfacing the real message — a swallowed error here is impossible to debug
      Toast.show({
        type: "error",
        text1: "Camera unavailable",
        text2: err?.message || "Could not open the camera.",
      });
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) onChange(result.assets[0].uri);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Gallery unavailable",
        text2: err?.message || "Could not open the gallery.",
      });
    }
  };

  return (
    <View>
      <Text style={styles.label}>Shop Photo{required ? " *" : ""}</Text>

      {uri ? (
        <>
          <Image source={{ uri }} style={styles.preview} />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btn} onPress={openCamera}>
              <Ionicons name="camera-outline" size={15} color={PRIMARY_DARK} />
              <Text style={styles.btnTxt}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={openGallery}>
              <Ionicons name="images-outline" size={15} color={PRIMARY_DARK} />
              <Text style={styles.btnTxt}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnDanger]}
              onPress={() => onChange(null)}
            >
              <Ionicons name="trash-outline" size={15} color="#b91c1c" />
              <Text style={[styles.btnTxt, { color: "#b91c1c" }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.dropzone}>
          <View style={styles.dropIcon}>
            <Ionicons name="storefront-outline" size={22} color={PRIMARY} />
          </View>

          <Text style={styles.dropTitle}>Add a photo of the shop front</Text>
          <Text style={styles.dropHint}>
            Shown on the map when someone visits this RM Member
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={openCamera}
            >
              <Ionicons name="camera-outline" size={16} color="#fff" />
              <Text style={[styles.btnTxt, { color: "#fff" }]}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={openGallery}>
              <Ionicons name="images-outline" size={16} color={PRIMARY_DARK} />
              <Text style={styles.btnTxt}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
    color: TEXT_M,
  },

  dropzone: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: BORDER,
  },
  dropIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ccfbf1",
    alignItems: "center",
    justifyContent: "center",
  },
  dropTitle: { fontSize: 13, fontWeight: "800", color: TEXT_D },
  dropHint: {
    fontSize: 11.5,
    color: TEXT_S,
    textAlign: "center",
    paddingHorizontal: 10,
  },

  preview: { width: "100%", height: 170, borderRadius: 14, backgroundColor: BG },

  btnRow: { flexDirection: "row", gap: 8, marginTop: 12, alignSelf: "stretch" },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: "#f0fdfa",
  },
  btnPrimary: { backgroundColor: PRIMARY },
  btnDanger: { backgroundColor: "#fef2f2" },
  btnTxt: { fontSize: 12, fontWeight: "800", color: PRIMARY_DARK },
});
