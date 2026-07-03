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
const BG = "#f8fafc";
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
              body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
              h1 { color: ${PRIMARY}; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f8fafc; color: ${PRIMARY}; }
              tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <h1>Medicine Orders Report</h1>
            <p><strong>Filter:</strong> ${filter || "30 Days"}</p>
            <p><strong>Total Records:</strong> ${orders.length}</p>
            <table>
              <tr>
                <th>Date</th>
                <th>Patient Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Revenue</th>
              </tr>
              ${orders
                .map((o) => {
                  const d = new Date(o.createdAt).toLocaleDateString();
                  return `
                  <tr>
                    <td>${d}</td>
                    <td>${o.deliveryAddress?.fullName}</td>
                    <td>${o.deliveryAddress?.phone}</td>
                    <td>${o.orderStatus}</td>
                    <td>₹${o.pricing?.payableAmount}</td>
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

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medicine Orders</Text>
        <TouchableOpacity style={styles.pdfBtn} onPress={generatePDF}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.pdfTxt}>PDF</Text>
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
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTxt}>No orders found for this period.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const d = new Date(item.createdAt);
            return (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.docName}>{item.deliveryAddress?.fullName || "Unknown"}</Text>
                  <Text style={styles.fee}>₹{item.pricing?.payableAmount}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.patient}>Status: {item.orderStatus}</Text>
                  <Text style={styles.date}>{d.toLocaleDateString()}</Text>
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
  header: { padding: 20, backgroundColor: CARD, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: TEXT_D },
  pdfBtn: { flexDirection: "row", alignItems: "center", backgroundColor: PRIMARY, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  pdfTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTxt: { fontSize: 14, color: TEXT_M },
  
  card: { backgroundColor: CARD, padding: 16, borderRadius: 12, elevation: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  docName: { fontSize: 16, fontWeight: "700", color: TEXT_D },
  fee: { fontSize: 16, fontWeight: "800", color: PRIMARY },
  patient: { fontSize: 14, color: TEXT_M },
  date: { fontSize: 13, color: TEXT_S, fontWeight: "600" },
});
