import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/axios";
import { useRouter } from "expo-router";
import KycPersonalDetails from "../../components/shared/KycPersonalDetails";
import KycBankDetails from "../../components/shared/KycBankDetails";

export default function ReceptionistKycScreen() {
  const { user, login, updateUser, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState(user?.address || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [state, setState] = useState(user?.state || "");
  const [pincode, setPincode] = useState(user?.pincode || "");

  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || "");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(user?.bankDetails?.accountNumber || "");
  const [ifscCode, setIfscCode] = useState(user?.bankDetails?.ifscCode || "");
  const [accountHolderName, setAccountHolderName] = useState(user?.bankDetails?.accountHolderName || "");
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || "");

  const [agentPicture, setAgentPicture] = useState(null);
  const [idDocumentFront, setIdDocumentFront] = useState(null);
  const [idDocumentBack, setIdDocumentBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // If status is pending
  const isPending = user?.kycStatus === "pending";
  const isRejected = user?.kycStatus === "rejected";

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const takeAgentPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Permission Denied", text2: "We need camera permissions to take a photo." });
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setAgentPicture(result.assets[0]);
    }
  };

  const pickDocumentImage = async (setDoc) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setDoc(result.assets[0]);
    }
  };

  const takeDocumentPhoto = async (setDoc) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Permission Denied", text2: "We need camera permissions to take a photo." });
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setDoc(result.assets[0]);
    }
  };

  const uploadKyc = async () => {
    if (!agentPicture || !idDocumentFront || !idDocumentBack || !name || !address || !district || !state || !pincode || !accountNumber || !confirmAccountNumber || !ifscCode || !accountHolderName || !bankName) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please provide all required details and documents.",
      });
      return;
    }

    if (accountNumber !== confirmAccountNumber) {
      Toast.show({
        type: "error",
        text1: "Account Mismatch",
        text2: "Account numbers do not match.",
      });
      return;
    }

    try {
      setLoading(true);

      // Update User Details
      const detailsRes = await api.patch(`/user/${user.id}/details`, {
        name,
        address,
        district,
        state,
        pincode,
        bankDetails: {
          accountNumber,
          ifscCode,
          accountHolderName,
          bankName
        }
      });

      if (!detailsRes.data.success) {
         throw new Error("Failed to update user details");
      }

      // Upload Agent Picture
      const formData1 = new FormData();
      formData1.append("documentType", "agent_picture");
      const uriParts1 = agentPicture.uri.split(".");
      const fileType1 = uriParts1[uriParts1.length - 1];
      formData1.append("document", {
        uri: Platform.OS === "ios" ? agentPicture.uri.replace("file://", "") : agentPicture.uri,
        name: `agent_picture.${fileType1}`,
        type: `image/${fileType1}`,
      });

      await api.post(`/user/${user.id}/kyc`, formData1, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Upload ID Document Front
      const formData2 = new FormData();
      formData2.append("documentType", "id_document_front");
      const uriParts2 = idDocumentFront.uri.split(".");
      const fileType2 = uriParts2[uriParts2.length - 1];
      formData2.append("document", {
        uri: Platform.OS === "ios" ? idDocumentFront.uri.replace("file://", "") : idDocumentFront.uri,
        name: `id_document_front.${fileType2}`,
        type: `image/${fileType2}`,
      });

      await api.post(`/user/${user.id}/kyc`, formData2, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Upload ID Document Back
      const formData3 = new FormData();
      formData3.append("documentType", "id_document_back");
      const uriParts3 = idDocumentBack.uri.split(".");
      const fileType3 = uriParts3[uriParts3.length - 1];
      formData3.append("document", {
        uri: Platform.OS === "ios" ? idDocumentBack.uri.replace("file://", "") : idDocumentBack.uri,
        name: `id_document_back.${fileType3}`,
        type: `image/${fileType3}`,
      });

      const res3 = await api.post(`/user/${user.id}/kyc`, formData3, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res3.data.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Documents uploaded successfully",
        });
        
        // Update local user context to reflect pending status and updated details
        updateUser({ 
          kycStatus: "pending", 
          kycDocuments: res3.data.kycDocuments,
          name,
          address,
          district,
          state,
          pincode,
          bankDetails: {
            accountNumber,
            ifscCode,
            accountHolderName,
            bankName
          }
        });
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Receptionist KYC</Text>
          <Text style={styles.subtitle}>
            Please provide your details, a live picture of yourself and a valid ID document (Aadhar/Voter/PAN).
          </Text>
        </View>

        {isRejected && (
          <View style={styles.alertBox}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.alertText}>
              Your previous KYC was rejected. Please re-upload clearer documents.
            </Text>
          </View>
        )}

                {/* Details Section */}
        <Text style={styles.sectionLabel}>1. Personal Details</Text>
        <KycPersonalDetails
          name={name} setName={setName}
          email={email} setEmail={setEmail}
          address={address} setAddress={setAddress}
          district={district} setDistrict={setDistrict}
          state={state} setState={setState}
          pincode={pincode} setPincode={setPincode}
        />

        {/* Section 2: Bank Details */}
        <Text style={styles.sectionLabel}>2. Bank Details</Text>
        <KycBankDetails
          accountNumber={accountNumber} setAccountNumber={setAccountNumber}
          confirmAccountNumber={confirmAccountNumber} setConfirmAccountNumber={setConfirmAccountNumber}
          ifscCode={ifscCode} setIfscCode={setIfscCode}
          accountHolderName={accountHolderName} setAccountHolderName={setAccountHolderName}
          bankName={bankName} setBankName={setBankName}
        />


        {/* Section 1: Agent Picture */}
        <Text style={styles.sectionLabel}>3. Live Selfie</Text>
        <View style={styles.uploadSection}>
          {agentPicture ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: agentPicture.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setAgentPicture(null)}>
                <Ionicons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera-outline" size={64} color="#94a3b8" />
              <Text style={styles.placeholderText}>No Photo Taken</Text>
            </View>
          )}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={takeAgentPhoto}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: ID Document Front */}
        <Text style={styles.sectionLabel}>4. ID Document Front (Aadhar/Voter/PAN)</Text>
        <View style={styles.uploadSection}>
          {idDocumentFront ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: idDocumentFront.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setIdDocumentFront(null)}>
                <Ionicons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="card-outline" size={64} color="#94a3b8" />
              <Text style={styles.placeholderText}>No Front Document Selected</Text>
            </View>
          )}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => takeDocumentPhoto(setIdDocumentFront)}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => pickDocumentImage(setIdDocumentFront)}>
              <Ionicons name="image" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: ID Document Back */}
        <Text style={styles.sectionLabel}>5. ID Document Back</Text>
        <View style={styles.uploadSection}>
          {idDocumentBack ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: idDocumentBack.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setIdDocumentBack(null)}>
                <Ionicons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="card-outline" size={64} color="#94a3b8" />
              <Text style={styles.placeholderText}>No Back Document Selected</Text>
            </View>
          )}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => takeDocumentPhoto(setIdDocumentBack)}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => pickDocumentImage(setIdDocumentBack)}>
              <Ionicons name="image" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (!agentPicture || !idDocumentFront || !idDocumentBack || !name || !address || !district || !state || !pincode || !accountNumber || !confirmAccountNumber || !ifscCode || !accountHolderName || !bankName || loading) && styles.disabledBtn]}
          onPress={uploadKyc}
          disabled={!agentPicture || !idDocumentFront || !idDocumentBack || !name || !address || !district || !state || !pincode || !accountNumber || !confirmAccountNumber || !ifscCode || !accountHolderName || !bankName || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit KYC</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    position: "relative",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 10,
    marginLeft: 4,
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
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 16,
    backgroundColor: "#f8fafc",
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
