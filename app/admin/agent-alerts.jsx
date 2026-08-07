import { Stack } from "expo-router";
import AgentOrderAlerts from "../../components/shared/agent/AgentOrderAlerts";

export default function AdminAgentAlerts() {
  return (
    <>
      <Stack.Screen options={{ title: "RM Member Alerts" }} />
      <AgentOrderAlerts />
    </>
  );
}
