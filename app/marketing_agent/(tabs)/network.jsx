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
import api from "../../../services/axios.js";

/* ===== COLORS ===== */
const PRIMARY = "#0d9488";
const PRIMARY_LIGHT = "#ccfbf1";
const SECTION_BG = "#f0fdfa";
const BG = "#f8fafc";
const CARD = "#ffffff";
const BORDER = "#e2e8f0";
const TEXT = "#1e293b";
const MUTED = "#64748b";

/* ================= HELPERS ================= */

const buildLevels = (roots) => {
  const levels = [];
  const walk = (nodes, depth = 0) => {
    if (!levels[depth]) levels[depth] = [];
    nodes.forEach((n) => {
      levels[depth].push(n);
      if (n.children?.length) walk(n.children, depth + 1);
    });
  };
  walk(roots);
  return levels;
};

const countTotal = (nodes = []) =>
  nodes.reduce(
    (s, n) => s + 1 + countTotal(n.children || []),
    0
  );

const countDirect = (roots = []) =>
  roots.reduce((s, r) => s + (r.children?.length || 0), 0);

const maxLevel = (levels = []) =>
  Math.max(...levels.map((_, i) => i), 0);

/* ================= MAIN ================= */

export default function MarketingNetwork() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roots, setRoots] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchNetwork = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await api.get("/marketing-agent/network");
      console.log(res.data.data.tree)
      setRoots(res?.data?.data?.tree || []);
    } catch {
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
      >
        {/* HEADER */}
        <Text style={styles.title}>Network</Text>
        <Text style={styles.subtitle}>
          Your RM Member hierarchy overview
        </Text>

        {/* OVERVIEW */}
        <View style={styles.overviewCard}>
          <OverviewItem label="Direct RM Members" value={countDirect(roots)} />
          <Divider />
          <OverviewItem label="Total RM Members" value={countTotal(roots)} />
          <Divider />
          <OverviewItem label="Levels" value={`L${maxLevel(buildLevels(roots))}`} />
        </View>

        {/* ROOT SECTIONS */}
        {roots.map((root, index) => (
          <RootSection
            key={root.id}
            root={root}
            index={index}
            onPress={setSelected}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL */}
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

/* ================= ROOT SECTION ================= */

const RootSection = ({ root, index, onPress }) => {
  const levels = buildLevels([root]);

  return (
    <View style={styles.section}>
      {/* ROOT HEADER */}
      <View style={styles.rootHeader}>
        <Text style={styles.rootTitle}>
          Root RM Member {index + 1}
        </Text>
      </View>

      {/* TREE */}
      <View style={styles.treeBox}>
        {levels.map((row, i) => (
          <View key={i} style={styles.levelRow}>
            {row.map((node) => (
              <AgentNode
                key={node.id}
                node={node}
                highlight={i === 0}
                onPress={onPress}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

/* ================= UI COMPONENTS ================= */

const AgentNode = ({ node, highlight, onPress }) => (
  <TouchableOpacity
    style={[
      styles.node,
      highlight && styles.nodePrimary,
    ]}
    onPress={() => onPress(node)}
    activeOpacity={0.85}
  >
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {node.name?.[0]}
      </Text>
    </View>

    <Text numberOfLines={1} style={styles.nodeName}>
      {node.name}
    </Text>

    <View style={styles.badge}>
      <Text style={styles.badgeText}>L{node.level}</Text>
    </View>
  </TouchableOpacity>
);

const OverviewItem = ({ label, value }) => (
  <View style={styles.overviewItem}>
    <Text style={styles.overviewValue}>{value}</Text>
    <Text style={styles.overviewLabel}>{label}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, padding: 16 },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: { fontSize: 22, fontWeight: "900" },
  subtitle: { fontSize: 13, color: MUTED, marginBottom: 16 },

  /* OVERVIEW */
  overviewCard: {
    flexDirection: "row",
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: 18,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  overviewItem: { flex: 1, alignItems: "center" },
  overviewValue: {
    fontSize: 18,
    fontWeight: "900",
    color: PRIMARY,
  },
  overviewLabel: {
    fontSize: 12,
    color: TEXT,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: PRIMARY,
    opacity: 0.3,
  },

  /* SECTION */
  section: {
    backgroundColor: SECTION_BG,
    borderRadius: 22,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#99f6e4",
  },

  rootHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  rootTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: PRIMARY,
  },

  treeBox: {
    backgroundColor: CARD,
    borderRadius: 18,
    paddingVertical: 18,
  },

  levelRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 22,
  },

  node: {
    width: 84,
    paddingVertical: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    alignItems: "center",
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  nodePrimary: {
    backgroundColor: PRIMARY_LIGHT,
    borderColor: PRIMARY,
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

  nodeName: {
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
  closeText: { color: "#fff", fontWeight: "800" },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoLabel: { color: MUTED },
  infoValue: { fontWeight: "700" },
});
