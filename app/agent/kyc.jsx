import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/axios";
import { useRouter } from "expo-router";

export default function AgentKycScreen() {
  const { user, login, updateUser, logout } = useAuth();
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // If status is pending
  const isPending = user?.kycStatus === "pending";
  const isRejected = user?.kycStatus === "rejected";

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "We need camera permissions to take a photo.",
      });
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const uploadKyc = async () => {
    if (!image) {
      Toast.show({
        type: "error",
        text1: "Missing Document",
        text2: "Please select an image first",
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("documentType", "aadhaar_pan");

      const uriParts = image.uri.split(".");
      const fileType = uriParts[uriParts.length - 1];

      formData.append("document", {
        uri: Platform.OS === "ios" ? image.uri.replace("file://", "") : image.uri,
        name: `kyc.${fileType}`,
        type: `image/${fileType}`,
      });

      const res = await api.post(`/user/${user.id}/kyc`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: res.data.message,
        });
        
        // Update local user context to reflect pending status
        updateUser({ kycStatus: "pending", kycDocuments: res.data.kycDocuments });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      setRefreshing(true);
      const res = await api.get("/user/me");
      if (res.data.success) {
        const freshUser = res.data.data;
        updateUser(freshUser);

        if (freshUser.kycStatus === "verified") {
           Toast.show({
             type: "success",
             text1: "Verified!",
             text2: "Your account is now verified. Welcome!",
           });
        } else {
           Toast.show({
             type: "info",
             text1: "Status Checked",
             text2: "Your KYC is still pending verification.",
           });
        }
      }
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to check status",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
        
        <View style={styles.center}>
          <Ionicons name="time-outline" size={80} color="#f59e0b" />
          <Text style={styles.title}>Verification Pending</Text>
          <Text style={styles.subtitle}>
            Your KYC document has been uploaded successfully and is currently under review by an administrator. 
            You will gain full access once approved.
          </Text>
          
          <TouchableOpacity style={styles.btnOutline} onPress={checkStatus} disabled={refreshing}>
            {refreshing ? <ActivityIndicator color="#6b6dbf" /> : <Text style={styles.btnOutlineText}>Check Status</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Agent KYC</Text>
        <Text style={styles.subtitle}>
          Please upload a clear photo of your Aadhar or PAN card to verify your identity.
        </Text>
      </View>

      {isRejected && (
        <View style={styles.alertBox}>
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
          <Text style={styles.alertText}>
            Your previous KYC was rejected. Please upload a clearer document.
          </Text>
        </View>
      )}

      <View style={styles.uploadSection}>
        {image ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(null)}>
              <Ionicons name="close-circle" size={28} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="document-text-outline" size={64} color="#94a3b8" />
            <Text style={styles.placeholderText}>No Document Selected</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.actionBtnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#fff" />
            <Text style={styles.actionBtnText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (!image || loading) && styles.disabledBtn]}
        onPress={uploadKyc}
        disabled={!image || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Document</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
    position: "relative",
  },
  logoutBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  alertBox: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  alertText: {
    flex: 1,
    color: "#b91c1c",
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  uploadSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeholderContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  placeholderText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
  previewContainer: {
    width: "100%",
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#6b6dbf",
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 20,
  },
  disabledBtn: {
    backgroundColor: "#9ca3af",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  btnOutline: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#6b6dbf",
    borderRadius: 12,
  },
  btnOutlineText: {
    color: "#6b6dbf",
    fontWeight: "600",
    fontSize: 16,
  }
});
