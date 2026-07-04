import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import api from "../../../services/axios";

export default function AdminKycDetails() {
  const { userStr } = useLocalSearchParams();
  const [kycLoading, setKycLoading] = useState(false);
  
  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch(e) {
    console.error("Error parsing user data", e);
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#ef4444" }}>Failed to load user details</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDownloadDocument = async (url, documentType) => {
    try {
      if (!url) return;
      Toast.show({ type: "info", text1: "Downloading..." });
      const fileName = `kyc_${documentType || "document"}_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Toast.show({ type: "success", text1: "Downloaded", text2: "Saved to device" });
      }
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: "Download Failed", text2: "Could not download the document" });
    }
  };

  const updateKycStatus = async (status) => {
    try {
      setKycLoading(true);
      const res = await api.patch(`/user/${user._id}/kyc/status`, { status });
      if (res.data.success) {
        Toast.show({ type: "success", text1: "KYC Status Updated", text2: res.data.message });
        router.back();
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: e.response?.data?.message || "Failed to update KYC status" });
    } finally {
      setKycLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Profile Overview */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            {user.faceImage?.url ? (
              <Image source={{ uri: user.faceImage.url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" }]}>
                <Ionicons name="person" size={32} color="#94a3b8" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.nameText}>{user.name}</Text>
              <Text style={styles.roleText}>{user.roles?.[0]?.toUpperCase()}</Text>
              <View style={[
                styles.statusBadge, 
                user.kycStatus === "verified" ? { backgroundColor: "#dcfce7" } 
                : user.kycStatus === "pending" ? { backgroundColor: "#fef3c7" }
                : user.kycStatus === "rejected" ? { backgroundColor: "#fee2e2" }
                : { backgroundColor: "#e2e8f0" }
              ]}>
                <Text style={[
                  styles.statusText,
                  user.kycStatus === "verified" ? { color: "#166534" } 
                  : user.kycStatus === "pending" ? { color: "#92400e" }
                  : user.kycStatus === "rejected" ? { color: "#991b1b" }
                  : { color: "#475569" }
                ]}>
                  {user.kycStatus ? user.kycStatus.toUpperCase() : "NONE"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Personal Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <DetailRow label="Phone Number" value={user.phone || "N/A"} />
          <DetailRow label="Email" value={user.email || "N/A"} />
          <DetailRow label="Address" value={user.address || "N/A"} />
          <DetailRow label="District" value={user.district || "N/A"} />
          <DetailRow label="State" value={user.state || "N/A"} />
          <DetailRow label="Pin Code" value={user.pincode || "N/A"} />
        </View>

        {/* Bank Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          {user.bankDetails ? (
            <>
              <DetailRow label="Account Holder" value={user.bankDetails.accountHolderName || "N/A"} />
              <DetailRow label="Bank Name" value={user.bankDetails.bankName || "N/A"} />
              <DetailRow label="Account Number" value={user.bankDetails.accountNumber || "N/A"} />
              <DetailRow label="IFSC Code" value={user.bankDetails.ifscCode || "N/A"} />
            </>
          ) : (
            <Text style={{ color: "#94a3b8", fontStyle: "italic" }}>No bank details provided.</Text>
          )}
        </View>

        {/* Documents */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Uploaded Documents</Text>
          
          {user.kycDocuments && user.kycDocuments.length > 0 ? (
            <View style={{ gap: 20, marginTop: 10 }}>
              {user.kycDocuments.map((doc, idx) => (
                <View key={idx} style={{ alignItems: "center", backgroundColor: "#f8fafc", padding: 16, borderRadius: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#64748b", marginBottom: 10 }}>
                    {doc.documentType === "agent_picture" ? "Agent Photo" : doc.documentType === "id_document_front" ? "ID Document Front" : doc.documentType === "id_document_back" ? "ID Document Back" : `Document ${idx + 1}`}
                  </Text>
                  <Image 
                    source={{ uri: doc.url }} 
                    style={{ width: "100%", height: 300, resizeMode: "contain", borderRadius: 8, backgroundColor: "#e2e8f0" }} 
                  />
                  <TouchableOpacity 
                    style={{ marginTop: 12, backgroundColor: "#6b6dbf", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 8 }}
                    onPress={() => handleDownloadDocument(doc.url, doc.documentType)}
                  >
                    <Ionicons name="download-outline" size={18} color="#fff" />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Download Document</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Text style={{ color: "#94a3b8" }}>No documents uploaded.</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
            onPress={() => updateKycStatus("verified")}
            disabled={kycLoading}
          >
            {kycLoading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Approve KYC</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
            onPress={() => updateKycStatus("rejected")}
            disabled={kycLoading}
          >
            {kycLoading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Reject KYC</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    backgroundColor: "#6b6dbf",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  nameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  }
});
