import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFound() {
  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="alert-circle-outline" size={80} color="#6b6dbf" />

      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>
        The page you are looking for doesn’t exist.
      </Text>

      <TouchableOpacity
        onPress={() => router.replace("/")}
        style={styles.button}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef0fa",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#6b6dbf",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 18,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
