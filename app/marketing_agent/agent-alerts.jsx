import { Stack } from "expo-router";
import AgentOrderAlerts from "../../components/shared/agent/AgentOrderAlerts";

export default function MarketingAgentAlerts() {
  return (
    <>
      <Stack.Screen options={{ title: "My Agent Alerts" }} />
      <AgentOrderAlerts />
    </>
  );
}
