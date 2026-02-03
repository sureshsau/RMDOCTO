import { StyleSheet, Switch, Text, View } from "react-native";
import SectionCard from "./ui/SectionCard";

export default function StatusSection({ isActive, onToggle }) {
  return (
    <SectionCard title="Status">
      <View style={styles.row}>
        <Text style={styles.label}>
          Active & Available
        </Text>

        <Switch
          value={isActive}
          onValueChange={onToggle}
        />
      </View>
    </SectionCard>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontWeight: "600",
    color: "#334155", // slate-700
    fontSize: 14,
  },
});
