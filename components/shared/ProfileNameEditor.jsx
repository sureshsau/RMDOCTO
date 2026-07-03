import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import api from "../../services/axios.js";

export default function ProfileNameEditor({ user, onNameUpdated }) {
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [name, setName] = useState(user?.name || "");

  const handleUpdateName = async () => {
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Name cannot be empty!" });
      return;
    }

    const userId = user?._id || user?.id;
    if (!userId) return;

    setLoading(true);
    try {
      const res = await api.patch(`/user/${userId}/name`, { name: name.trim() });
      if (res.data?.success) {
        Toast.show({ type: "success", text1: "Name updated successfully!" });
        setShowEditor(false);
        if (onNameUpdated) onNameUpdated(name.trim());
      } else {
        throw new Error(res.data?.message || "Failed to update name");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.response?.data?.message || error.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.name || "User"}</Text>
      <TouchableOpacity onPress={() => setShowEditor(true)} style={styles.editBtn}>
        <Ionicons name="pencil" size={16} color="#64748B" />
      </TouchableOpacity>

      <Modal visible={showEditor} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Name</Text>
              <TouchableOpacity onPress={() => setShowEditor(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoFocus
            />

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleUpdateName}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  editBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: "#1BA6A6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
