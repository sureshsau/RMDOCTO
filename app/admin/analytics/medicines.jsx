import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../services/axios";

const PRIMARY = "#14b8a6";
const BG = "#f1f5f9";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";

export default function MedicinesList() {
  const { filter } = useLocalSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      let fromDate = "";
      const now = new Date();
      if (filter === "today") {
        now.setHours(0, 0, 0, 0);
        fromDate = now.toISOString();
      } else if (filter === "7d") {
        now.setDate(now.getDate() - 7);
        fromDate = now.toISOString();
      } else if (filter === "30d") {
        now.setDate(now.getDate() - 30);
        fromDate = now.toISOString();
      }

      const params = { limit: 1000 };
      if (fromDate) {
        params.fromDate = fromDate;
      }

      const res = await api.get("/medicine/order/view/all", { params });
      setOrders(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const generatePDF = async () => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; background-color: #f8fafc; }
              .header-container { text-align: center; margin-bottom: 40px; }
              h1 { color: ${PRIMARY}; margin-bottom: 5px; font-size: 28px; }
              .subtitle { color: #64748b; font-size: 16px; margin-top: 0; }
              .summary-box { background-color: #fff; padding: 15px 20px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block; margin-bottom: 30px; }
              .summary-box p { margin: 5px 0; font-size: 14px; }
              table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              th, td { border-bottom: 1px solid #e2e8f0; padding: 14px 16px; text-align: left; vertical-align: top; }
              th { background-color: ${PRIMARY}; color: #ffffff; font-weight: 600; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px; }
              tr:last-child td { border-bottom: none; }
              tr:nth-child(even) { background-color: #f8fafc; }
              tr:nth-child(odd) { background-color: #ffffff; }
              .fee { font-weight: bold; color: #10b981; }
              .address-box { color: #64748b; font-size: 13px; line-height: 1.4; margin-top: 4px; }
            </style>
          </head>
          <body>
            <div class="header-container">
              <h1>Medicine Orders Report</h1>
              <p class="subtitle">RMDOCTO Analytics</p>
            </div>
            
            <div style="text-align: center;">
              <div class="summary-box">
                <p><strong>Period Filter:</strong> ${filter || "30 Days"}</p>
                <p><strong>Total Orders Processed:</strong> ${orders.length}</p>
              </div>
            </div>

            <table>
              <tr>
                <th>Date & Order ID</th>
                <th>Patient Details</th>
                <th>Delivery Address</th>
                <th>Status</th>
                <th>Revenue</th>
              </tr>
              ${orders
                .map((o) => {
                  const d = new Date(o.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                  const addr = o.deliveryAddress || {};
                  const addressString = [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
                  
                  return `
                  <tr>
                    <td>
                      <div style="font-weight: 600;">${d}</div>
                      <div style="color: #64748b; font-size: 12px; margin-top: 4px;">ID: ${o.orderId || o._id?.substring(0, 8) || "N/A"}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: #0f172a;">${addr.fullName || "Unknown"}</div>
                      <div style="color: #64748b; font-size: 13px;">${addr.phone || "No Phone"}</div>
                    </td>
                    <td>
                      <div class="address-box">${addressString || "No address provided"}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; font-size: 13px; text-transform: uppercase; color: ${getStatusColor(o.orderStatus)}">${o.orderStatus || "PENDING"}</div>
                    </td>
                    <td class="fee">₹${o.pricing?.payableAmount || 0}</td>
                  </tr>
                `;
                })
                .join("")}
            </table>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
    } catch (error) {
      console.error("PDF generation error:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered": 
      case "completed": return "#10b981";
      case "cancelled": return "#ef4444";
      case "processing":
      case "shipped": return "#3b82f6";
      case "pending": return "#f59e0b";
      default: return "#64748b";
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Medicine Orders</Text>
          <Text style={styles.headerSubtitle}>Analytics Overview</Text>
        </View>
        <TouchableOpacity style={styles.pdfBtn} onPress={generatePDF}>
          <Ionicons name="document-text-outline" size={20} color="#fff" />
          <Text style={styles.pdfTxt}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderId || item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} />}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="medical-outline" size={64} color="#cbd5e1" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTxt}>No medicine orders found for this period.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const d = new Date(item.createdAt);
            const statusColor = getStatusColor(item.orderStatus);
            const addr = item.deliveryAddress || {};
            const addressString = [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
            
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.dateBadge}>
                    <Ionicons name="time" size={14} color={PRIMARY} />
                    <Text style={styles.dateText}>{d.toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{(item.orderStatus || "PENDING").toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="person" size={18} color="#64748b" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Patient Name</Text>
                      <Text style={styles.detailValue}>{addr.fullName || "Unknown"}</Text>
                      <Text style={styles.subDetailValue}>{addr.phone || "No Phone"}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="location" size={18} color="#64748b" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Delivery Address</Text>
                      <Text style={styles.addressValue} numberOfLines={2}>{addressString || "No address provided"}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
                      <Ionicons name="cash" size={18} color="#10b981" />
                    </View>
                    <View>
                      <Text style={styles.detailLabel}>Order Revenue</Text>
                      <Text style={[styles.detailValue, { color: '#10b981', fontSize: 18 }]}>₹{item.pricing?.payableAmount || 0}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { 
    padding: 20, 
    backgroundColor: CARD, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    borderBottomWidth: 1, 
    borderBottomColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: TEXT_D },
  headerSubtitle: { fontSize: 14, color: TEXT_M, marginTop: 2 },
  pdfBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: PRIMARY, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    gap: 8,
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pdfTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTxt: { fontSize: 16, color: TEXT_M, textAlign: 'center' },
  
  card: { 
    backgroundColor: CARD, 
    borderRadius: 16, 
    padding: 16, 
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9"
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  dateText: {
    fontSize: 13,
    color: TEXT_D,
    fontWeight: "600"
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 16
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9"
  },
  detailLabel: {
    fontSize: 12,
    color: TEXT_S,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT_D
  },
  subDetailValue: {
    fontSize: 13,
    color: TEXT_M,
    marginTop: 2
  },
  addressValue: {
    fontSize: 13,
    color: TEXT_M,
    marginTop: 2,
    lineHeight: 18
  }
});
