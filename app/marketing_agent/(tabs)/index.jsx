import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MarketingAgentHome() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Marketing Agent Dashboard</Text>

      <View style={styles.cardContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/marketing_agent/register-agent")}
        >
          <Text style={styles.cardTitle}>Register Agent</Text>
          <Text style={styles.cardSub}>Add new agents under you</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/marketing_agent/my-network")}
        >
          <Text style={styles.cardTitle}>My Network</Text>
          <Text style={styles.cardSub}>View your agent hierarchy</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/rmcoin")}
        >
          <Text style={styles.cardTitle}>wallet</Text>
          <Text style={styles.cardSub}>View your agent hierarchy</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/marketing_agent/medicine/order")}
        >
          <Text style={styles.cardTitle}>My Medicine Orders</Text>
          <Text style={styles.cardSub}>Track orders & commissions</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdfa",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f766e",
    marginBottom: 20,
    textAlign: "center",
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#14b8a6",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 14,
    color: "#ecfeff",
  },
});
