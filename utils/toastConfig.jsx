import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

const ToastCard = ({
  icon,
  color,
  title,
  message
}) => (
  <View
    style={{
      backgroundColor: "#ffffff",
      borderRadius: 18,
      padding: 16,
      marginHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 8
    }}
  >
    <View
      style={{
        backgroundColor: `${color}15`,
        borderRadius: 12,
        padding: 8,
        marginRight: 12
      }}
    >
      <Ionicons name={icon} size={22} color={color} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>
        {title}
      </Text>
      <Text
        style={{ fontSize: 13, color: "#555", marginTop: 2 }}
        numberOfLines={2}
      >
        {message}
      </Text>
    </View>
  </View>
);

export const toastConfig = {
  success: ({ text2 }) => (
    <ToastCard
      icon="checkmark-circle"
      color="#14b8a6"
      title="Success"
      message={text2}
    />
  ),

  error: ({ text2 }) => (
    <ToastCard
      icon="close-circle"
      color="#dc2626"
      title="Error"
      message={text2}
    />
  ),

  info: ({ text2 }) => (
    <ToastCard
      icon="information-circle"
      color="#0284c7"
      title="Info"
      message={text2}
    />
  )
};
