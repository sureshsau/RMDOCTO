import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import MedicineCard from "../../../../components/shared/medicine/medicine-list/MedicineCard";
import { useMedicine } from "../../../../context/MedicineContext";

/* ================= CONSTANTS ================= */

const CATEGORIES = ["All", "Tablet", "Capsule", "Syrup", "Injection", "other"];
const PAGE_LIMIT = 10;

/* ================= MAIN ================= */

export default function Medicines() {
  const { getMedicines, loading, searchQuery } = useMedicine();

  const [medicines, setMedicines] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  /* ================= LOAD ================= */

  const loadMedicines = async ({ reset = false } = {}) => {
    if (loading) return;
    if (!hasMore && !reset) return;

    const currentPage = reset ? 1 : page;

    const res = await getMedicines({
      page: currentPage,
      limit: PAGE_LIMIT,
      search: searchQuery,
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

    setMedicines((prev) => {
      const incoming = reset ? res.data : [...prev, ...res.data];
      const map = new Map();
      incoming.forEach((item) => map.set(item._id, item));
      return Array.from(map.values());
    });

    setHasMore(res.pagination.page < res.pagination.totalPages);
    setPage(currentPage + 1);
  };

  /* ================= EFFECTS ================= */

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadMedicines({ reset: true });
  }, [searchQuery, category]);

  /* ================= REFRESH ================= */

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadMedicines({ reset: true });
    setRefreshing(false);
  }, [searchQuery, category]);

  /* ================= LOAD MORE ================= */

  const loadMore = () => {
    if (!loading && hasMore) {
      loadMedicines();
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* ================= CATEGORY ================= */}
      <View style={styles.categoryWrapper}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setCategory(item);
                setPage(1);
                setHasMore(true);
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
          )}
        />
      </View>

      {/* ================= GRID LIST ================= */}
      <FlatList
        data={medicines}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        renderItem={({ item }) => (
          <MedicineCard medicine={item} />
        )}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14b8a6"
          />
        }
        ListFooterComponent={
          loading && hasMore ? (
            <Text style={styles.loadingText}>Loading more…</Text>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No medicines found</Text>
          ) : null
        }
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  categoryWrapper: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  categoryPill: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 12,
  },

  categoryActive: {
    backgroundColor: "#14b8a6",
  },

  categoryText: {
    fontWeight: "600",
    color: "#334155",
  },

  categoryTextActive: {
    color: "#fff",
  },

  list: {
    padding: 16,
    paddingBottom: 80,
  },

  column: {
    justifyContent: "space-between",
  },

  loadingText: {
    textAlign: "center",
    paddingVertical: 16,
    color: "#64748b",
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#94a3b8",
    fontWeight: "600",
  },
});
