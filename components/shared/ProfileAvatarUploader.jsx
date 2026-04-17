import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import api from "../../services/axios.js";

export default function ProfileAvatarUploader({ user, onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleSelectImage = () => {
    if (loading) return;
    setShowPicker(true);
  };

  const openGallery = async () => {
    setShowPicker(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    setShowPicker(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Camera permission denied!" });
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (uri) => {
    if (!uri) return;

    const userId = user?._id || user?.id;
    if (!userId) {
      Toast.show({ type: "error", text1: "User ID missing!" });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", {
        uri: uri,
        name: `profile_${userId}.jpg`,
        type: "image/jpeg",
      });

      const res = await api.post(`/user/${userId}/profile-picture`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        Toast.show({
          type: "success",
          text1: "Profile picture updated!",
        });
        
        if (onUploadSuccess) {
           const newUrl = res.data?.data?.faceImage?.url || res.data?.data?.profileImage || uri;
           onUploadSuccess(newUrl);
        }
      } else {
        throw new Error(res.data?.message || "Failed to update");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: error.response?.data?.message || error.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  let displayImage = user?.profileImage || 
                       user?.faceImage?.url || 
                       (typeof user?.faceImage === "string" ? user?.faceImage : null) || 
                       user?.faceUri || 
                       null;
                       
  if (displayImage === "null" || displayImage === "undefined" || displayImage === "") {
    displayImage = null;
  }

  return (
    <TouchableOpacity 
       style={styles.avatarContainer} 
       onPress={handleSelectImage} 
       activeOpacity={0.8}
       disabled={loading}
    >
      {displayImage ? (
        <Image
          source={{ uri: displayImage }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color="#94A3B8" />
        </View>
      )}

      {/* Upload Badge Icon overlay */}
      <View style={styles.editBadge}>
        <Ionicons name="camera" size={16} color="#fff" />
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* CUSTOM PICKER MODAL */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Profile Picture</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.modalOption} onPress={openCamera}>
              <View style={styles.modalIconBox}>
                <Ionicons name="camera" size={24} color="#1BA6A6" />
              </View>
              <Text style={styles.modalOptionText}>Take a Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={openGallery}>
              <View style={styles.modalIconBox}>
                <Ionicons name="images" size={24} color="#1BA6A6" />
              </View>
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 12,
    position: "relative",
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1BA6A6", // Matches app primary
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eefdfb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  }
});
