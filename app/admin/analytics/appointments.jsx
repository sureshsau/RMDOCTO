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

const PRIMARY = "#6b6dbf";
const BG = "#f8fafc";
const CARD = "#ffffff";
const TEXT_D = "#0f172a";
const TEXT_M = "#475569";
const TEXT_S = "#94a3b8";

export default function AppointmentsList() {
  const { filter } = useLocalSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      let from = "";
      const now = new Date();
      if (filter === "today") {
        now.setHours(0, 0, 0, 0);
        from = now.toISOString();
      } else if (filter === "7d") {
        now.setDate(now.getDate() - 7);
        from = now.toISOString();
      } else if (filter === "30d") {
        now.setDate(now.getDate() - 30);
        from = now.toISOString();
      }

      const params = { limit: 1000 };
      if (from) {
        params.type = "custom";
        params.from = from;
      }

      const res = await api.get("/appointment/bookings", { params });
      setAppointments(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const generatePDF = async () => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
              h1 { color: #6b6dbf; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f8fafc; color: #6b6dbf; }
              tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <h1>Doctor Appointments Report</h1>
            <p><strong>Filter:</strong> ${filter || "30 Days"}</p>
            <p><strong>Total Records:</strong> ${appointments.length}</p>
            <table>
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Patient</th>
                <th>Phone</th>
                <th>Fee</th>
              </tr>
              ${appointments
                .map((a) => {
                  const d = new Date(a.appointmentDate).toLocaleDateString();
                  return `
                  <tr>
                    <td>${d} ${a.appointmentTime}</td>
                    <td>${a.doctorId?.name || "Unknown"}</td>
                    <td>${a.patientName}</td>
                    <td>${a.patientPhone}</td>
                    <td>₹${a.consultationFee}</td>
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
        <Text style={styles.headerTitle}>Appointments</Text>
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
          data={appointments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAppointments(true)} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTxt}>No appointments found for this period.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const d = new Date(item.appointmentDate);
            return (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.docName}>{item.doctorId?.name || "Unknown Doctor"}</Text>
                  <Text style={styles.fee}>₹{item.consultationFee}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.patient}>Patient: {item.patientName}</Text>
                  <Text style={styles.date}>{d.toLocaleDateString()} {item.appointmentTime}</Text>
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
