import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { StorageAccessFramework } from "expo-file-system/legacy";
import { useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { getToken } from "../../../utils/secureStorage";

/**
 * EXPO_PUBLIC_API_URL may or may not carry a trailing slash. Axios collapses
 * that when it joins baseURL to a path, but these URLs are built by hand and
 * go through FileSystem.downloadAsync, which sends them verbatim — and Express
 * does not match a path with a doubled leading slash, so `//medicine/order/…`
 * came back 404 while every axios call to the same server worked.
 */
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function InvoiceGenerator({ order }) {
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  if (!order || order.orderStatus !== "DELIVERED") {
    return null;
  }

  const invoiceUrl = `${API_BASE}/medicine/order/${
    order._id || order.orderId
  }/invoice`;

  /* ================= CORE: Fetch PDF from Backend ================= */
  const fetchInvoicePdf = async () => {
    const token = await getToken();
    const fileName = `Invoice_${order.orderId.slice(-6)}.pdf`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    const downloadResult = await FileSystem.downloadAsync(invoiceUrl, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (downloadResult.status !== 200) {
      throw new Error(`Server returned status ${downloadResult.status}`);
    }

    return downloadResult.uri;
  };

  /* ================= DOWNLOAD ================= */
  const handleDownloadInvoice = async () => {
    try {
      setDownloadLoading(true);
      const token = await getToken();

      // Ensure Invoices folder exists in app's private document directory
      const invoiceDir = FileSystem.documentDirectory + "Invoices/";
      const dirInfo = await FileSystem.getInfoAsync(invoiceDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(invoiceDir, { intermediates: true });
      }

      const fileName = `Invoice_${order.orderId.slice(-6)}.pdf`;
      const fileUri = invoiceDir + fileName;

      // Download PDF directly from backend into the default folder
      const downloadResult = await FileSystem.downloadAsync(invoiceUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadResult.status !== 200) {
        throw new Error(`Server returned status ${downloadResult.status}`);
      }

      Toast.show({
        type: "success",
        text1: "Invoice Downloaded! 📄",
        text2: `Saved as ${fileName}`,
        position: "top",
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Invoice Download Error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to Download Invoice",
        text2: error.message || "Please try again.",
        position: "top",
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  /* ================= SHARE ================= */
  const handleShareInvoice = async () => {
    try {
      setShareLoading(true);
      const localUri = await fetchInvoicePdf();

      await Sharing.shareAsync(localUri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Invoice",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Invoice Share Error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to Share Invoice",
        text2: error.message || "Please try again.",
        position: "top",
      });
    } finally {
      setShareLoading(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.btn}
        onPress={handleDownloadInvoice}
        disabled={downloadLoading || shareLoading}
      >
        {downloadLoading ? (
          <ActivityIndicator color="#14b8a6" size="small" />
        ) : (
          <>
            <Ionicons name="download-outline" size={20} color="#14b8a6" />
            <Text style={styles.btnText}>Download Invoice</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnOutline}
        onPress={handleShareInvoice}
        disabled={downloadLoading || shareLoading}
      >
        {shareLoading ? (
          <ActivityIndicator color="#14b8a6" size="small" />
        ) : (
          <>
            <Ionicons name="share-outline" size={20} color="#14b8a6" />
            <Text style={styles.btnText}>Share Invoice</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ecfeff",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  btnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  btnText: {
    color: "#14b8a6",
    fontWeight: "700",
    fontSize: 15,
  },
});
