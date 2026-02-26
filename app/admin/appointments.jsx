import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppointments } from "../../context/AppointmentContext";

export default function ReceptionistAppointments() {
  const {
    appointments,
    pagination,
    loading,
    fetchAppointments,
    resetAppointments,
  } = useAppointments();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("today");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    resetAppointments();
    fetchAppointments(1, filterType, true);
  }, [filterType]);

  /* ================= SEARCH FILTER ================= */

  const filteredAppointments = useMemo(() => {
    if (!search.trim()) return appointments;

    const keyword = search.toLowerCase();

    return appointments.filter((a) =>
      a.patientName?.toLowerCase().includes(keyword) ||
      a.patientPhone?.includes(search) ||
      a.doctorId?.name?.toLowerCase().includes(keyword)
    );
  }, [appointments, search]);

  /* ================= REFRESH ================= */

  const onRefresh = async () => {
    setRefreshing(true);
    resetAppointments();
    await fetchAppointments(1, filterType, true);
    setRefreshing(false);
  };

  /* ================= PAGINATION ================= */

  const loadMore = async () => {
    if (
      pagination.page >= pagination.totalPages ||
      loadingMore
    )
      return;

    setLoadingMore(true);
    await fetchAppointments(
      pagination.page + 1,
      filterType
    );
    setLoadingMore(false);
  };

  /* ================= LOADING ================= */

  if (loading && appointments.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1BA6A6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Search patient / doctor / phone"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* FILTER */}
      <View style={styles.filterRow}>
        {["today", "month"].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilterType(type)}
            style={[
              styles.filterChip,
              filterType === type &&
                styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filterType === type && {
                  color: "#fff",
                },
              ]}
            >
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        onMomentumScrollEnd={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent;

          if (
            layoutMeasurement.height +
              contentOffset.y >=
            contentSize.height - 20
          ) {
            loadMore();
          }
        }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          ALL APPOINTMENTS
        </Text>

        {filteredAppointments.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color="#CBD5E1"
            />
            <Text style={styles.emptyText}>
              No appointments found
            </Text>
          </View>
        )}

        {filteredAppointments.map((item) => (
          <AppointmentCard
            key={item._id}
            appointment={item}
          />
        ))}

        {loadingMore && (
          <ActivityIndicator
            color="#1BA6A6"
            style={{ marginVertical: 20 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= CARD ================= */

function AppointmentCard({ appointment }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={22}
            color="#1BA6A6"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>
            {appointment.patientName}
          </Text>
          <Text style={styles.doctorName}>
            Dr. {appointment.doctorId?.name}
          </Text>
        </View>

        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>
            {appointment.appointmentTime}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <DetailItem
          icon="call-outline"
          text={appointment.patientPhone}
        />
        <DetailItem
          icon="calendar-outline"
          text={new Date(
            appointment.appointmentDate
          ).toDateString()}
        />
      </View>

      <View style={styles.detailsRow}>
        <DetailItem
          icon="person-outline"
          text={`${appointment.patientGender} • ${appointment.patientAge} yrs`}
        />
        <DetailItem
          icon="cash-outline"
          text={`₹${appointment.consultationFee}`}
        />
      </View>

      {appointment.symptoms && (
        <View style={styles.symptomsBox}>
          <Text style={styles.symptomsLabel}>
            Symptoms
          </Text>
          <Text style={styles.symptomsText}>
            {appointment.symptoms}
          </Text>
        </View>
      )}
    </View>
  );
}

function DetailItem({ icon, text }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons
        name={icon}
        size={14}
        color="#64748B"
      />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  searchInput: { flex: 1, marginLeft: 10 },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },

  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },

  filterChipActive: {
    backgroundColor: "#1BA6A6",
  },

  filterText: { fontWeight: "600" },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 12,
    color: "#64748B",
  },

  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },

  emptyText: {
    marginTop: 10,
    color: "#94A3B8",
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ECFEFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  patientName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  doctorName: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  timeBadge: {
    backgroundColor: "#1BA6A6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  timeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  detailText: {
    fontSize: 12,
    color: "#475569",
  },

  symptomsBox: {
    marginTop: 10,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
  },

  symptomsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1BA6A6",
    marginBottom: 4,
  },

  symptomsText: {
    fontSize: 12,
    color: "#334155",
  },
});
