import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../../services/axios";

export default function RMCreditHistory() {
  const [history, setHistory] = useState([]);

  const totalTransferred = useMemo(() => {
    return history
      .filter((tx) => tx.type === "credit")
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [history]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async (pageNumber = 1, isRefresh = false) => {
    if (loading) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get(`/rmcredit/history?page=${pageNumber}&limit=20`);

      if (res.data.success) {
        const newTransactions = res.data.data.history || [];
        const pagination = res.data.data.pagination;

        if (isRefresh || pageNumber === 1) {
          setHistory(newTransactions);
        } else {
          setHistory((prev) => [...prev, ...newTransactions]);
        }

        setHasMore(pagination.currentPage < pagination.totalPages);
        setPage(pagination.currentPage + 1);
      }
    } catch (error) {
      console.error("Failed to fetch RM Credit history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const onRefresh = useCallback(() => {
    setHasMore(true);
    fetchHistory(1, true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchHistory(page);
    }
  };

  const renderItem = ({ item }) => {
    const isCredit = item.type === "credit";
    const amountColor = isCredit ? "#16a34a" : "#dc2626";
    const amountSign = isCredit ? "+" : "-";

    const dateStr = new Date(item.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
          if (item.agent?.id) {
            router.push({
              pathname: "/admin/rmcredit/details",
              params: {
                id: item.agent.id,
                name: item.agent.name || "Unknown Agent",
                phone: item.agent.phone || "",
              },
            });
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.agentName}>{item.agent?.name || "Unknown Agent"}</Text>
            {item.agent?.phone ? (
              <Text style={styles.agentPhone}>{item.agent.phone}</Text>
            ) : null}
          </View>
          <Text style={[styles.amount, { color: amountColor }]}>
            {amountSign}₹{item.amount?.toLocaleString("en-IN") || 0}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.descriptionText}>{item.description}</Text>
          <View style={[styles.badge, isCredit ? styles.badgeGreen : styles.badgeRed]}>
            <Text style={[styles.badgeText, isCredit ? styles.badgeTextGreen : styles.badgeTextRed]}>
              {item.type.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.dateText}>{dateStr}</Text>
          {item.performedBy?.name ? (
            <Text style={styles.performedByText}>By: {item.performedBy.name}</Text>
          ) : null}
        </View>

        {item.wallet && item.wallet.currentBalance !== undefined ? (
          <View style={styles.walletRow}>
            <Text style={styles.walletText}>
              Balance: ₹{item.wallet.currentBalance?.toLocaleString("en-IN") || 0}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item, index) => item.transactionId || String(index)}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Total Credit Transferred</Text>
            <Text style={styles.statsAmount}>₹{totalTransferred.toLocaleString("en-IN")}</Text>
            <Text style={styles.statsSub}>Based on loaded history</Text>
          </View>
        )}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6b6dbf"
          />
        }
        ListFooterComponent={() =>
          loading && !refreshing ? (
            <ActivityIndicator size="small" color="#6b6dbf" style={{ marginVertical: 20 }} />
          ) : null
        }
        ListEmptyComponent={() =>
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptySub}>RM Credit history will appear here.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  statsCard: {
    backgroundColor: "#6b6dbf",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  statsTitle: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "600",
  },
  statsAmount: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginVertical: 4,
  },
  statsSub: {
    color: "#cbd5e1",
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  agentPhone: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "800",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#475569",
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeGreen: {
    backgroundColor: "#dcfce7",
  },
  badgeRed: {
    backgroundColor: "#fee2e2",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  badgeTextGreen: {
    color: "#16a34a",
  },
  badgeTextRed: {
    color: "#dc2626",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  dateText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  performedByText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  walletRow: {
    marginTop: 8,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
  },
  walletText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
    textAlign: "right"
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#475569",
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
  },
});
