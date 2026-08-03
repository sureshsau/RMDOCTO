import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useRBAC } from "../../../context/RABACContext";
import { useUser } from "../../../context/UserContext";
import api from "../../../services/axios.js";

/* =============== ACTIONS CONFIG =============== */
// Edit these arrays to change available actions per role
const ACTIONS_MAP = {
  admin: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "give-role", label: "Give Role", route: "/admin/employee/roles" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],

  marketing_agent: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
    { id: "view-kyc", label: "View KYC", icon: "shield-checkmark-outline" },
  ],
  rmrider: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
    { id: "view-kyc", label: "View KYC", icon: "shield-checkmark-outline" },
  ],
  subadmin: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],

  receptionist: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
    { id: "view-kyc", label: "View KYC", icon: "shield-checkmark-outline" },
  ],
  employee: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
    { id: "view-kyc", label: "View KYC", icon: "shield-checkmark-outline" },
  ],
  doctor: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "set-attendance", label: "Set Attendance", route: "/admin/employee/:id/attendance" },
    { id: "view-attendance-log", label: "view Attendance log", route: "/admin/employee/:id/attendanceLog" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
    { id: "view-kyc", label: "View KYC", icon: "shield-checkmark-outline" },
  ],

  agent: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "rmcredit", label: "RM Credit", route: "/admin/rmcredit/details" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
    { id: "view-kyc", label: "View KYC", icon: "shield-checkmark-outline" },
  ],

  default: [
    { id: "view-orders", label: "View Orders", icon: "receipt-outline" },
    { id: "transfer-rmcoin", label: "Transfer RM Coins" },
    { id: "give-role", label: "Give Role", route: "/admin/employee/add" },
    { id: "update-profile", label: "Update Avatar", route: "/admin/employee/:id/settings" },
  ],
};

/* Roles an admin can hand out. "admin" is deliberately absent — the server
   rejects assigning it (assignRoleService). */
const ASSIGNABLE_ROLES = [
  { key: "doctor", label: "Doctor", icon: "medkit-outline" },
  { key: "receptionist", label: "Receptionist", icon: "desktop-outline" },
  { key: "rmrider", label: "RM Rider", icon: "bicycle-outline" },
  { key: "agent", label: "Agent", icon: "people-outline" },
  { key: "marketing_agent", label: "Marketing Agent", icon: "megaphone-outline" },
  { key: "employee", label: "Employee", icon: "briefcase-outline" },
  { key: "subadmin", label: "Sub Admin", icon: "shield-outline" },
  { key: "user", label: "Customer", icon: "person-outline" },
];

/* ================= MAIN ================= */

export default function Employees() {
  const { getUsers, createUser } = useUser();
  const { fetchRoles } = useRBAC();
  const kycScrollRef = useRef(null);
  const [currentKycIndex, setCurrentKycIndex] = useState(0);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(["All"]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [transferModal, setTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [specModalVisible, setSpecModalVisible] = useState(false);
  const [assigningRole, setAssigningRole] = useState(false);
  
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);

  /* Quick add: name + 10-digit phone + role, nothing else */
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", role: null });
  const [addLoading, setAddLoading] = useState(false);
  const [created, setCreated] = useState(null); // { name, phone, role, tempPassword }

  const DOCTOR_CATEGORIES = [
    "Allergy & Immunology", "Cardiologist", "Dermatologist", "Dentist", 
    "Dietitian & Nutritionist", "Endocrinologist", "ENT Specialist", 
    "Fertility Specialist", "Gastroenterologist", "General Physician", 
    "Gynecologist", "Hematologist", "Nephrologist", "Neurologist", 
    "Oncologist", "Ophthalmologist (Eye Specialist)", "Orthopedic", 
    "Pediatrician", "Physiotherapist", "Psychiatrist", "Psychologist", 
    "Pulmonologist", "Rheumatologist", "Urologist"
  ];



  const openActions = (user) => {
    setSelectedUser(user);
    setActionsModalVisible(true);
  };

  const closeActions = () => {
    setSelectedUser(null);
    setActionsModalVisible(false);
  };
  const handleAssignRole = async (roleKey, spec = null) => {
    try {
      setAssigningRole(true);
      const res = await api.post("/role-assignments/assign", {
        userId: selectedUser._id,
        roles: [roleKey],
        ...(spec && { specialization: spec }),
      });
      if (res.data.success) {
        Toast.show({ type: "success", text1: "Role assigned successfully!" });
        setRoleModalVisible(false);
        setSpecModalVisible(false);
        loadUsers();
      }
    } catch (e) {
      console.log(e);
      Toast.show({ type: "error", text1: e.response?.data?.message || "Failed to assign role" });
    } finally {
      setAssigningRole(false);
    }
  };

  const handleAction = (action) => {
    if (!selectedUser) return;

    if (action.id === "give-role") {
      setRoleModalVisible(true);
      setActionsModalVisible(false);
      return;
    }

    // ✅ VIEW ORDERS
    if (action.id === "view-orders") {
      router.push({
        pathname: "/admin/orders/user-orders",
        params: {
          userId: selectedUser._id,
          userName: selectedUser.name,
        },
      });
      setActionsModalVisible(false);
      return;
    }

    // ✅ OPEN TRANSFER MODAL
    if (action.id === "transfer-rmcoin") {
      setTransferModal(true);
      setActionsModalVisible(false);
      return;
    }

    // ✅ VIEW KYC
    if (action.id === "view-kyc") {
      router.push({
        pathname: `/admin/kyc/${selectedUser._id}`,
        params: { userStr: JSON.stringify(selectedUser) }
      });
      setActionsModalVisible(false);
      return;
    }

    if (action.route) {
      const route = action.route.includes(":id")
        ? action.route.replace(":id", selectedUser._id)
        : action.route;

      const faceUri =
        selectedUser?.faceImage?.url ||
        (typeof selectedUser?.faceImage === "string"
          ? selectedUser.faceImage
          : null) ||
        selectedUser?.faceUri ||
        "";

      if (
        action.id === "rmcredit" ||
        action.id === "rmcoin" ||
        route.includes("/rmcredit") ||
        route.includes("/rmcoin")
      ) {
        router.push({
          pathname: route,
          params: {
            id: selectedUser._id,
            name: selectedUser.name,
            phone: selectedUser.phone,
            email: selectedUser.email,
            role: selectedUser.roles?.[0] || "",
            faceUri,
          },
        });

        setActionsModalVisible(false);
        return;
      }

      router.push({ pathname: route });
    }

    setActionsModalVisible(false);
  };

  const toggleUserStatus = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.patch(`/user/${selectedUser._id}/toggle-status`);
      if (res.data.success) {
        Toast.show({
          type: "success",
          text1: "Status Updated",
          text2: res.data.message,
        });
        setUsers(users.map(u =>
          u._id === selectedUser._id ? { ...u, isActive: res.data.isActive } : u
        ));
      }
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: e.response?.data?.message || "Failed to update status",
      });
    } finally {
      closeActions();
    }
  };

  const updateKycStatus = async (status) => {
    if (!selectedUser) return;
    try {
      setKycLoading(true);
      const res = await api.patch(`/user/${selectedUser._id}/kyc/status`, { status });
      if (res.data.success) {
        Toast.show({ type: "success", text1: "KYC Status Updated", text2: res.data.message });
        setKycModalVisible(false);
        await loadUsers();
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: e.response?.data?.message || "Failed to update KYC status" });
    } finally {
      setKycLoading(false);
    }
  };


  /* ================= LOAD ================= */

  const loadUsers = async () => {
    const res = await getUsers();
    if (!res.success) {
      Toast.show({
        type: "error",
        text1: "Failed to load users",
        text2: res.error,
      });
      return;
    }
    setUsers(res.data);
  };

  const loadRoles = async () => {
    const res = await fetchRoles();
    if (!res.success) return;

    setRoles(["All", ...res.data.map((r) => r.key)]);
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  /* ================= FILTER ================= */

  const filteredEmployees = useMemo(() => {
    return users.filter((u) => {
      const role = u.roles?.[0] || "";
      const dashboard = u.dashboard || "";

      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        role.toLowerCase().includes(search.toLowerCase()) ||
        dashboard.toLowerCase().includes(search.toLowerCase());

      const matchFilter =
        filter === "All" || role === filter;

      return matchSearch && matchFilter;
    });
  }, [users, search, filter]);

  /* ================= QUICK ADD USER ================= */

  const openAddModal = () => {
    setAddForm({ name: "", phone: "", role: null });
    setCreated(null);
    setAddModal(true);
  };

  const handleAddUser = async () => {
    const name = addForm.name.trim();
    const phone = addForm.phone.trim();

    if (name.length < 2) {
      return Toast.show({ type: "error", text1: "Enter the user's name" });
    }
    if (!/^\d{10}$/.test(phone)) {
      return Toast.show({
        type: "error",
        text1: "Invalid phone",
        text2: "Enter exactly 10 digits",
      });
    }
    if (!addForm.role) {
      return Toast.show({ type: "error", text1: "Pick a role" });
    }

    try {
      setAddLoading(true);

      // Dashboard is intentionally omitted — the server maps it from the role
      const res = await createUser({
        name,
        phone,
        roles: [addForm.role.key],
      });

      if (!res.success) {
        return Toast.show({
          type: "error",
          text1: "Could not add user",
          text2: res.error,
        });
      }

      if (res.data?.tempPassword) {
        // Shown once — it cannot be retrieved again
        setCreated({
          name,
          phone,
          role: addForm.role.label,
          tempPassword: res.data.tempPassword,
        });
      } else if (res.data?.isNew) {
        // Created, but no password came back — an older server build
        Toast.show({
          type: "error",
          text1: "User created without a password",
          text2: "They cannot log in yet — restart the API server and re-add",
        });
        setAddModal(false);
      } else {
        // Phone already belonged to someone: the role was added to that account
        Toast.show({
          type: "success",
          text1: "Existing user updated",
          text2: `${addForm.role.label} role added to ${phone}`,
        });
        setAddModal(false);
      }

      await loadUsers();
    } finally {
      setAddLoading(false);
    }
  };

  const copyPassword = async () => {
    if (!created?.tempPassword) return;
    await Clipboard.setStringAsync(created.tempPassword);
    Toast.show({ type: "success", text1: "Password copied" });
  };

  const handleTransferSubmit = async () => {
    if (!transferAmount) {
      Toast.show({
        type: "error",
        text1: "Amount Required",
        text2: "Please enter transfer amount",
      });
      return;
    }

    try {
      setTransferLoading(true);

      const res = await api.post("/rmcoin/admin-transfer", {
        receiverId: selectedUser._id,
        amount: Number(transferAmount),
      });

      Toast.show({
        type: "success",
        text1: "Transfer Successful",
        text2: res?.data?.message || "RM Coins transferred successfully",
      });

      setTransferModal(false);
      setTransferAmount("");
      await loadUsers();

    } catch (error) {

      Toast.show({
        type: "error",
        text1: "Transfer Failed",
        text2:
          error?.response?.data?.message ||
          "Something went wrong",
      });
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDownloadDocument = async (url, documentType) => {
    try {
      if (!url) return;
      Toast.show({ type: "info", text1: "Downloading..." });
      const fileName = `kyc_${documentType || "document"}_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Toast.show({ type: "success", text1: "Downloaded", text2: "Saved to device" });
      }
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: "Download Failed", text2: "Could not download the document" });
    }
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
      {/* ROLE MODAL */}
      <Modal visible={roleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Role</Text>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 10 }}>
              {["admin", "subadmin", "agent", "marketing_agent", "rmrider", "receptionist", "employee", "doctor"].map((roleKey) => (
                <TouchableOpacity
                  key={roleKey}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderColor: "#e2e8f0",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                  onPress={() => {
                    if (roleKey === "doctor") {
                      setRoleModalVisible(false);
                      setSpecModalVisible(true);
                    } else {
                      handleAssignRole(roleKey);
                    }
                  }}
                  disabled={assigningRole}
                >
                  <Text style={{ fontSize: 16, color: "#0f172a", textTransform: "capitalize", fontWeight: "600" }}>
                    {roleKey.replace("_", " ")}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SPECIALIZATION MODAL */}
      <Modal visible={specModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setSpecModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 10 }}>
              {DOCTOR_CATEGORIES.map((cat, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderColor: "#e2e8f0",
                  }}
                  onPress={() => handleAssignRole("doctor", cat)}
                  disabled={assigningRole}
                >
                  <Text style={{ fontSize: 16, color: "#0f172a", fontWeight: "500" }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={transferModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setTransferModal(false)}>
          <View style={styles.actionsOverlay}>
            <TouchableOpacity activeOpacity={1} style={styles.actionsBox}>
                <Text style={styles.sectionText}>Transfer RM Coins</Text>

                <Text style={{ marginTop: 10, fontWeight: "600" }}>
                  Name: {selectedUser?.name}
                </Text>

                <Text style={{ marginBottom: 12, color: "#64748b" }}>
                  Phone: {selectedUser?.phone}
                </Text>

                <TextInput
                  placeholder="Enter Amount"
                  keyboardType="numeric"
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16,
                  }}
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: "#6b6dbf",
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={handleTransferSubmit}
                  disabled={transferLoading}
                >
                  {transferLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Transfer
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 12, alignItems: "center" }}
                  onPress={() => setTransferModal(false)}
                >
                  <Text style={{ color: "#6b6dbf" }}>Cancel</Text>
                </TouchableOpacity>
              </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ================= QUICK ADD USER ================= */}
      <Modal visible={addModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "85%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {created ? "User created" : "Add user"}
              </Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {created ? (
              /* ===== CREDENTIALS HANDOVER ===== */
              <ScrollView style={{ marginTop: 14 }}>
                <Text style={styles.addHint}>
                  Share these details with {created.name}. The password is shown
                  only once and cannot be viewed again.
                </Text>

                <View style={styles.credBox}>
                  <CredLine label="Name" value={created.name} />
                  <CredLine label="Role" value={created.role} />
                  <CredLine label="Login phone" value={created.phone} />

                  <View style={styles.credPwRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.credLabel}>Temporary password</Text>
                      <Text style={styles.credPw}>{created.tempPassword}</Text>
                    </View>

                    <TouchableOpacity style={styles.copyBtn} onPress={copyPassword}>
                      <Ionicons name="copy-outline" size={16} color="#fff" />
                      <Text style={styles.copyTxt}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.noteBox}>
                  <Ionicons name="shield-checkmark-outline" size={15} color="#b45309" />
                  <Text style={styles.noteTxt}>
                    On first login they land on the {created.role} dashboard and
                    must complete KYC before they can use it.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => setAddModal(false)}
                >
                  <Text style={styles.primaryTxt}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              /* ===== FORM ===== */
              <ScrollView style={{ marginTop: 14 }} keyboardShouldPersistTaps="handled">
                <Text style={styles.addLabel}>Full name</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="e.g. Rahul Das"
                  placeholderTextColor="#94a3b8"
                  value={addForm.name}
                  onChangeText={(v) => setAddForm((f) => ({ ...f, name: v }))}
                />

                <Text style={styles.addLabel}>Mobile number</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="10-digit number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={addForm.phone}
                  onChangeText={(v) =>
                    setAddForm((f) => ({ ...f, phone: v.replace(/[^\d]/g, "") }))
                  }
                />
                <Text style={styles.addHelp}>
                  This is the number they sign in with
                </Text>

                <Text style={styles.addLabel}>Role</Text>
                <View style={styles.roleGrid}>
                  {ASSIGNABLE_ROLES.map((r) => {
                    const active = addForm.role?.key === r.key;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.roleOpt, active && styles.roleOptActive]}
                        onPress={() => setAddForm((f) => ({ ...f, role: r }))}
                      >
                        <Ionicons
                          name={r.icon}
                          size={14}
                          color={active ? "#fff" : "#6b6dbf"}
                        />
                        <Text
                          style={[styles.roleOptTxt, active && { color: "#fff" }]}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, addLoading && { opacity: 0.6 }]}
                  onPress={handleAddUser}
                  disabled={addLoading}
                >
                  {addLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryTxt}>Create user</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.advancedLink}
                  onPress={() => {
                    setAddModal(false);
                    router.push("/admin/employee/add");
                  }}
                >
                  <Text style={styles.advancedTxt}>
                    Need custom permissions? Use the full form →
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* SEARCH + ADD USER */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6b6dbf" />
          <TextInput
            placeholder="Search by name, role, department"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
            <Ionicons name="person-add" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/admin/employee/register-agent")}
            style={[styles.addBtn, { backgroundColor: "#14b8a6" }]}
          >
            <Ionicons name="location" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* FILTER */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {roles.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setFilter(type)}
              style={[
                styles.filterChip,
                filter === type && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === type && styles.filterTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6b6dbf"
          />
        }
      >
        {/* STATS */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Employee Overview</Text>
          <Text style={styles.statsSubtitle}>
            Current staff summary
          </Text>

          <View style={styles.statsRow}>
            <Stat label="Total" value={users.length} />
            <Stat
              label="Active"
              value={users.filter((u) => u.isActive).length}
            />
            <Stat
              label="Inactive"
              value={users.filter((u) => !u.isActive).length}
            />
          </View>
        </View>

        <Section title="All Employees" />

        {filteredEmployees.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="people-outline"
              size={48}
              color="#94a3b8"
            />
            <Text style={styles.emptyText}>No employees found</Text>
          </View>
        )}

        {filteredEmployees.map((emp) => (
          <EmployeeCard key={emp._id} user={emp} onOpenActions={openActions} />
        ))}
      </ScrollView>

      {/* Actions Modal */}
      <Modal visible={actionsModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeActions}>
          <View style={styles.actionsOverlay}>
            <TouchableOpacity activeOpacity={1} style={styles.actionsBox}>
                <Text style={styles.sectionText}>Actions</Text>
                {(() => {
                  const roleRaw = selectedUser?.roles?.[0] || "";
                  const norm = roleRaw.toString().toLowerCase().replace(/\s+/g, "_");
                  const actions = ACTIONS_MAP[norm] || ACTIONS_MAP[roleRaw] || ACTIONS_MAP.default;
                  return actions.map((act) => (
                    <TouchableOpacity key={act.id} style={styles.actionItem} onPress={() => handleAction(act)}>
                      <Text style={styles.actionText}>{act.label}</Text>
                    </TouchableOpacity>
                  ));
                })()}

                {selectedUser && (
                  <TouchableOpacity
                    style={[styles.actionItem, { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 8, paddingTop: 16 }]}
                    onPress={toggleUserStatus}
                  >
                    <Text style={[styles.actionText, { color: selectedUser.isActive ? '#ef4444' : '#10b981', fontWeight: 'bold' }]}>
                      {selectedUser.isActive ? "Deactivate User" : "Activate User"}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.actionItem, styles.actionCancel, { marginTop: 8 }]} onPress={closeActions}>
                  <Text style={[styles.actionText, { color: '#6b6dbf' }]}>Close</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );

}

/* ================= COMPONENTS ================= */

function CredLine({ label, value }) {
  return (
    <View>
      <Text style={styles.credLabel}>{label}</Text>
      <Text style={styles.credValue}>{value}</Text>
    </View>
  );
}

function Section({ title }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionText}>{title}</Text>
    </View>
  );
}
function Stat({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmployeeCard({ user, onOpenActions }) {
  const role = user.roles?.[0] || "Staff";
  const status = user.isActive ? "Active" : "Inactive";

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          router.push({
            pathname: `/admin/employee/${user._id}/profile`,
            params: {
              id: user._id,
              name: user.name,
              role: user.roles?.join(", ") || "No Role",
              department: user.department?.[0] || "General",
              status: user.isActive ? "Active" : "Inactive",
              faceUri:
                user.faceImage?.url ||
                (typeof user.faceImage === "string" ? user.faceImage : null) ||
                user.faceUri ||
                "",
            },
          });
        }}
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
      >
        {/* AVATAR */}
        {(user.faceImage?.url ||
          typeof user.faceImage === "string" ||
          user.faceUri) ? (
          <Image
            source={{
              uri:
                user.faceImage?.url ||
                (typeof user.faceImage === "string"
                  ? user.faceImage
                  : user.faceUri),
            }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color="#6b6dbf" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.name}>{user.name}</Text>
            {user.kycStatus === "verified" && (
              <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginLeft: 4 }} />
            )}
            {user.kycStatus === "pending" && (
              <Ionicons name="time" size={16} color="#f59e0b" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.meta}>
            {role} • {user.dashboard}
          </Text>
          <Text style={styles.meta}>
            {user.phone}
            {user.email ? ` • ${user.email}` : ""}
          </Text>

          {/* 🔥 WALLET SECTION */}
          <View style={styles.walletRow}>
            <Ionicons
              name="wallet"
              size={14}
              color="#1BA6A6"
            />
            <Text style={styles.walletText}>
              {user.rmCoinsBalance || 0} RM Coins
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionBtn}
        onPress={() => onOpenActions && onOpenActions(user)}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={18}
          color="#6b6dbf"
        />
      </TouchableOpacity>

      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: user.isActive
              ? "#dcfce7"
              : "#fee2e2",
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            {
              color: user.isActive
                ? "#15803d"
                : "#b91c1c",
            },
          ]}
        >
          {status}
        </Text>
      </View>
    </View>
  );
}





/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#ECFDF5",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  walletText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
    marginLeft: 6,
  },

  container: { flex: 1, backgroundColor: "#eef0fa" },

  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { marginLeft: 12, flex: 1, color: "#1e293b" },

  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#6b6dbf",
    alignItems: "center",
    justifyContent: "center",
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    marginRight: 10,
  },
  filterChipActive: { backgroundColor: "#6b6dbf" },
  filterText: { fontWeight: "600", color: "#334155" },
  filterTextActive: { color: "#fff" },

  scrollContent: { padding: 20, paddingBottom: 80 },

  statsCard: {
    backgroundColor: "#6b6dbf",
    borderRadius: 28,
    padding: 20,
    marginBottom: 28,
  },
  statsTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statsSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: { alignItems: "center" },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "800" },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },

  section: { marginBottom: 12 },
  sectionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: "#eef0fa",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 48, height: 48, borderRadius: 24, marginRight: 16 },
  name: { fontWeight: "600", color: "#0f172a" },
  meta: { fontSize: 12, color: "#64748b", marginTop: 2 },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontSize: 12, fontWeight: "700" },

  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { marginTop: 16, color: "#64748b", fontWeight: "600" },
  optionBtn: { padding: 8, marginRight: 8, borderRadius: 8, backgroundColor: '#fff' },

  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  actionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionText: { fontSize: 16 },
  actionCancel: { borderBottomWidth: 0, marginTop: 8 },

  /* QUICK ADD USER */
  addLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 },
  addInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 12,
  },
  addHelp: { fontSize: 11, color: "#94a3b8", marginTop: -8, marginBottom: 14 },
  addHint: { fontSize: 12, color: "#475569", lineHeight: 17, marginBottom: 14 },

  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  roleOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  roleOptActive: { backgroundColor: "#6b6dbf", borderColor: "#6b6dbf" },
  roleOptTxt: { fontSize: 12, fontWeight: "700", color: "#475569" },

  primaryBtn: {
    backgroundColor: "#6b6dbf",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },

  advancedLink: { alignItems: "center", paddingVertical: 14 },
  advancedTxt: { fontSize: 12, color: "#6b6dbf", fontWeight: "600" },

  credBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  credLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "700" },
  credValue: { fontSize: 14, color: "#0f172a", fontWeight: "700", marginTop: 2 },
  credPwRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  credPw: {
    fontSize: 20,
    fontWeight: "900",
    color: "#6b6dbf",
    letterSpacing: 2,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#6b6dbf",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  copyTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },

  noteBox: {
    flexDirection: "row",
    gap: 7,
    backgroundColor: "#fffbeb",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  noteTxt: { flex: 1, fontSize: 11.5, color: "#92400e", lineHeight: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
});
