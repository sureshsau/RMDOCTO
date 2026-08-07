import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../../../services/axios";

/* ===== COLORS ===== */
const PRIMARY = "#0d9488";
const PRIMARY_LIGHT = "#ccfbf1";
const BG = "#f8fafc";
const CARD = "#ffffff";
const BORDER = "#e2e8f0";
const TEXT = "#1e293b";
const MUTED = "#64748b";

/* ================= HELPERS ================= */

/** 🔑 THIS FIXES LEVEL-3+ */
const buildLevels = (nodes = []) => {
  const levels = [];

  const dfs = (list, depth = 0) => {
    if (!Array.isArray(list) || list.length === 0) return;

    if (!levels[depth]) levels[depth] = [];

    list.forEach((node) => {
      levels[depth].push(node);
      if (Array.isArray(node.children) && node.children.length > 0) {
        dfs(node.children, depth + 1);
      }
    });
  };

  dfs(nodes);
  return levels;
};

/* ================= MAIN ================= */

export default function AgentNetwork() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchNetwork = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const res = await api.get("/agent/network");
      setData(res?.data?.data?.data || null);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Failed to load network",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNetwork(true);
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!data) return null;

  const { marketingAgent, parentAgent, self, downlineTree } = data;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ===== HEADER ===== */}
        <Text style={styles.title}>My Network</Text>
        <Text style={styles.subtitle}>
          RM Members referred by you
        </Text>

        {/* ===== TOP HIERARCHY ===== */}
        <View style={styles.topCard}>
          <HierarchyNode label="Marketing Executive" agent={marketingAgent} />
          <HierarchyNode label="Parent RM Member" agent={parentAgent} />
          <HierarchyNode label="You" agent={self} highlight />
        </View>

        {/* ===== DOWNLINE ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Downline</Text>

          {Array.isArray(downlineTree) && downlineTree.length === 0 && (
            <Text style={styles.emptyText}>
              No RM Members under you yet
            </Text>
          )}

          {buildLevels(downlineTree).map((level, index) => (
            <ScrollView
              key={index}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.levelRow}
            >
              {level.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onPress={setSelected}
                />
              ))}
            </ScrollView>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== MODAL ===== */}
      <Modal transparent visible={!!selected} animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelected(null)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>RM Member Details</Text>

            <InfoRow label="Name" value={selected?.name} />
            <InfoRow label="Phone" value={selected?.phone} />
            <InfoRow label="Level" value={`L${selected?.level}`} />

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelected(null)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= UI COMPONENTS ================= */

const HierarchyNode = ({ label, agent, highlight }) => {
  if (!agent) return null;

  return (
    <View style={[styles.hNode, highlight && styles.hHighlight]}>
      <Text style={styles.hLabel}>{label}</Text>
      <Text style={styles.hName}>{agent.name}</Text>
      <Text style={styles.hPhone}>📞 {agent.phone}</Text>
    </View>
  );
};

const AgentCard = ({ agent, onPress }) => (
  <TouchableOpacity
    style={styles.agentCard}
    onPress={() => onPress(agent)}
    activeOpacity={0.85}
  >
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {agent.name?.[0]}
      </Text>
    </View>

    <Text numberOfLines={1} style={styles.agentName}>
      {agent.name}
    </Text>

    <View style={styles.badge}>
      <Text style={styles.badgeText}>L{agent.level}</Text>
    </View>
  </TouchableOpacity>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    padding: 16,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
  },

  subtitle: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 16,
  },

  /* TOP */
  topCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },

  hNode: {
    paddingVertical: 10,
  },

  hHighlight: {
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: 12,
    padding: 12,
  },

  hLabel: {
    fontSize: 11,
    color: MUTED,
  },

  hName: {
    fontSize: 14,
    fontWeight: "800",
    color: TEXT,
  },

  hPhone: {
    fontSize: 12,
    color: MUTED,
  },

  /* SECTION */
  section: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },

  emptyText: {
    textAlign: "center",
    color: MUTED,
    marginVertical: 20,
  },

  levelRow: {
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 18,
  },

  agentCard: {
    width: 88,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  avatarText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  agentName: {
    fontSize: 12,
    fontWeight: "700",
    color: TEXT,
  },

  badge: {
    marginTop: 4,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: MUTED,
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    backgroundColor: CARD,
    width: "80%",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },

  closeBtn: {
    marginTop: 16,
    backgroundColor: PRIMARY,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  closeText: {
    color: "#fff",
    fontWeight: "800",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  infoLabel: {
    color: MUTED,
  },

  infoValue: {
    fontWeight: "700",
  },
});
