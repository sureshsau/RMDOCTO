import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SectionCard from "./ui/SectionCard";

export default function MedicineImagesSection({ images, setImages }) {
  const addImages = (uris = []) => {
    setImages((prev) => {
      const combined = [...prev, ...uris];
      if (combined.length > 5) {
        Alert.alert("Limit reached", "Maximum 5 images allowed");
        return combined.slice(0, 5);
      }
      return combined;
    });
  };

  const openPickerOptions = () => {
    Alert.alert("Upload Medicine Image", "Choose an option", [
      {
        text: "Camera",
        onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
          });

          if (!res.canceled) {
            addImages([res.assets[0].uri]);
          }
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5 - images.length,
            quality: 0.7,
          });

          if (!res.canceled) {
            const uris = res.assets.map((a) => a.uri);
            addImages(uris);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SectionCard title="Medicine Images">
      {/* UPLOAD BUTTON */}
      <TouchableOpacity
        onPress={openPickerOptions}
        style={styles.uploadBox}
        activeOpacity={0.85}
      >
        <Ionicons name="camera" size={38} color="#4f46e5" />
        <Text style={styles.uploadTitle}>
          Upload Medicine Photo
        </Text>
        <Text style={styles.uploadSub}>
          Camera or Gallery • Max 5 images
        </Text>
      </TouchableOpacity>

      {/* THUMBNAILS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbRow}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const img = images[i];

          return (
            <View key={i} style={styles.thumb}>
              {img ? (
                <>
                  <Image
                    source={{ uri: img }}
                    style={styles.thumbImg}
                  />

                  {/* REMOVE IMAGE */}
                  <TouchableOpacity
                    onPress={() =>
                      setImages((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                    style={styles.removeBtn}
                  >
                    <Ionicons
                      name="close"
                      size={12}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyThumb}>
                  <Ionicons
                    name="image-outline"
                    size={26}
                    color="#94a3b8"
                  />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SectionCard>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#c7d2fe", // indigo-200
    borderRadius: 16,
    height: 176,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2ff", // indigo-50
  },

  uploadTitle: {
    marginTop: 8,
    fontWeight: "700",
    color: "#4f46e5", // indigo-600
  },

  uploadSub: {
    fontSize: 12,
    color: "#64748b", // slate-500
    marginTop: 4,
  },

  thumbRow: {
    marginTop: 16,
  },

  thumb: {
    width: 80,
    height: 80,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0", // slate-200
    backgroundColor: "#f1f5f9", // slate-100
    overflow: "hidden",
  },

  thumbImg: {
    width: "100%",
    height: "100%",
  },

  emptyThumb: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
});
