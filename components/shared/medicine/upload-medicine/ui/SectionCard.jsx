import { StyleSheet, Text, View } from "react-native";

export default function SectionCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16, // rounded-2xl
    padding: 16,
    marginBottom: 24,
  },

  title: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155", // slate-700
    textTransform: "uppercase",
    letterSpacing: 1.5, // tracking-widest
    marginBottom: 16,
  },
});
