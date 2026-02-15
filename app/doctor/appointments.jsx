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
import api from "../../services/axios";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  const [filterType, setFilterType] = useState("today");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const LIMIT = 5;

  /* ================= FETCH FUNCTION ================= */

  const fetchAppointments = async (
    page = 1,
    isRefresh = false
  ) => {
    try {
      if (page === 1) setLoading(true);

      const params = {
        page,
        limit: LIMIT,
      };

      // filterType logic
      if (filterType === "custom") {
        params.from = "2026-02-01";
        params.to = "2026-02-10";
      } else {
        params.filterType = filterType;
      }

      const res = await api.get(
        "/appointment/doctor/bookings",
        { params }
      );

      const newData = res.data?.data || [];

      if (page === 1 || isRefresh) {
        setAppointments(newData);
      } else {
        setAppointments((prev) => [...prev, ...newData]);
      }

      setPagination({
        page,
        totalPages:
          res.data?.pagination?.totalPages || 1,
      });
    } catch (err) {
      console.log("Error fetching appointments", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    fetchAppointments(1, true);
  }, [filterType]);

  /* ================= SEARCH ================= */

  const filteredAppointments = useMemo(() => {
    if (!search.trim()) return appointments;

    const keyword = search.toLowerCase();

    return appointments.filter((a) =>
      a.patientName?.toLowerCase().includes(keyword) ||
      a.patientPhone?.includes(search)
    );
  }, [appointments, search]);

  /* ================= REFRESH ================= */

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments(1, true);
  };

  /* ================= LOAD MORE ================= */

  const loadMore = async () => {
    if (
      pagination.page >= pagination.totalPages ||
      loadingMore
    )
      return;

    setLoadingMore(true);
    await fetchAppointments(pagination.page + 1);
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
          placeholder="Search patient / phone"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* FILTERS */}
      <View style={styles.filterRow}>
        {["today", "week", "month"].map((type) => (
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
      >
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
            size={20}
            color="#1BA6A6"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>
            {appointment.patientName}
          </Text>
          <Text style={styles.phoneText}>
            {appointment.patientPhone}
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
        <Ionicons
          name="calendar-outline"
          size={14}
          color="#64748B"
        />
        <Text style={styles.detailText}>
          {new Date(
            appointment.appointmentDate
          ).toDateString()}
        </Text>
      </View>
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
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
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

  phoneText: {
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
    alignItems: "center",
    gap: 6,
  },

  detailText: {
    fontSize: 12,
    color: "#475569",
  },
});
