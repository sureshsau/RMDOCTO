import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

import MedicineCard from "../../../components/shared/medicine/medicine-list/MedicineCard";
import { useMedicine } from "../../../context/MedicineContext";

/* ================= CONSTANTS ================= */

const CATEGORIES = ["All", "Tablet", "Capsule", "Syrup", "Injection","others"];

/* ================= MAIN ================= */

export default function Medicines() {
  const { getMedicines, loading } = useMedicine();

  const [medicines, setMedicines] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  /* ================= LOAD ================= */

  const loadMedicines = async ({ reset = false } = {}) => {
    const res = await getMedicines({
      page: reset ? 1 : page,
      search,
      dosageForm: category === "All" ? "" : category,
    });

    if (!res.success) {
      Toast.show({
        type: "error",
        text1: "Failed to load medicines",
        text2: res.error,
      });
      return;
    }

    setMedicines((prev) =>
      reset ? res.data : [...prev, ...res.data]
    );

    setHasMore(res.pagination.page < res.pagination.totalPages);
    setPage(res.pagination.page + 1);
  };

  useEffect(() => {
    loadMedicines({ reset: true });
  }, [search, category]);

  /* ================= REFRESH ================= */

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await loadMedicines({ reset: true });
    setRefreshing(false);
  }, [search, category]);

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* SEARCH */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            placeholder="Search medicine..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* CATEGORY */}
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                setCategory(item);
                setPage(1);
              }}
              style={[
                styles.categoryPill,
                category === item && styles.categoryActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === item && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LIST */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor="#6b6dbf"
          />
        }
      >
        {medicines.map((item) => (
          <MedicineCard
            key={item._id}
            medicine={item} // ✅ RAW DATA PASSED
          />
        ))}

        {hasMore && (
          <TouchableOpacity
            style={styles.loadMore}
            onPress={() => loadMedicines()}
            disabled={loading}
          >
            <Text style={styles.loadMoreText}>
              {loading ? "Loading..." : "Load More"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef0fa" },

  searchWrapper: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchBox: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  searchInput: { flex: 1, padding: 8 },

  categoryWrapper: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  categoryPill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryActive: { backgroundColor: "#6b6dbf" },
  categoryText: { fontWeight: "600", color: "#334155" },
  categoryTextActive: { color: "#fff" },

  list: { padding: 16, paddingBottom: 80 },

  loadMore: {
    backgroundColor: "#6b6dbf",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  loadMoreText: { color: "#fff", fontWeight: "700" },
});
