import { StyleSheet, Text, TextInput, View } from "react-native";

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboard = "default",
  multiline = false,
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboard}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={[
          styles.input,
          multiline && styles.multiline,
        ]}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569", // slate-600
    marginBottom: 4,
  },

  input: {
    backgroundColor: "#f8fafc", // slate-50
    borderWidth: 1,
    borderColor: "#e2e8f0", // slate-200
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#0f172a",
  },

  multiline: {
    height: 96,
    textAlignVertical: "top",
  },
});
