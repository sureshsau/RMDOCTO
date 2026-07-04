import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import indiaStates from "../../constants/indiaStates.json";

export default function KycPersonalDetails({ name, setName, email, setEmail, address, setAddress, district, setDistrict, state, setState, pincode, setPincode }) {
  const [loadingPincode, setLoadingPincode] = useState(false);
  
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  // Derive states and districts from JSON
  const stateNames = indiaStates ? Object.keys(indiaStates).sort() : [];
  const districtNames = state && indiaStates && indiaStates[state] ? indiaStates[state].sort() : [];

  const handlePincodeChange = async (text) => {
    setPincode(text);
    if (text.length === 6) {
      try {
        setLoadingPincode(true);
        const res = await axios.get(`https://api.postalpincode.in/pincode/${text}`);
        const data = res.data[0];
        if (data.Status === "Success" && data.PostOffice && data.PostOffice.length > 0) {
          const postOffice = data.PostOffice[0];
          setState(postOffice.State);
          setDistrict(postOffice.District);
        }
      } catch (err) {
        console.log("Pincode fetch error:", err);
      } finally {
        setLoadingPincode(false);
      }
    }
  };

  const renderDropdownItem = ({ item }, onPress) => (
    <TouchableOpacity style={styles.dropdownItem} onPress={() => onPress(item)}>
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.formSection}>
      <Text style={styles.inputLabel}>Full Name</Text>
      <TextInput placeholderTextColor="#94a3b8" style={styles.input} value={name} onChangeText={setName} placeholder="Enter your full name" />
      
      <Text style={styles.inputLabel}>Email (Optional)</Text>
      <TextInput placeholderTextColor="#94a3b8" style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" />
      
      <Text style={styles.inputLabel}>Address</Text>
      <TextInput placeholderTextColor="#94a3b8" style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter your address" />
      
      <View style={styles.row}>
        <View style={[styles.flex1, { marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Pin Code</Text>
          <View style={styles.inputWrapper}>
            <TextInput placeholderTextColor="#94a3b8" 
              style={styles.inputNoMargin} 
              value={pincode} 
              onChangeText={handlePincodeChange} 
              placeholder="Enter pin code" 
              keyboardType="numeric" 
              maxLength={6}
            />
            {loadingPincode && <ActivityIndicator size="small" color="#6b6dbf" style={styles.inputLoader} />}
          </View>
        </View>
        <View style={styles.flex1}>
          <Text style={styles.inputLabel}>State</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowStateModal(true)}>
            <Text style={state ? styles.dropdownButtonText : styles.dropdownPlaceholder}>{state || "Select State"}</Text>
            <Ionicons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.inputLabel}>District</Text>
      <TouchableOpacity 
        style={[styles.dropdownButton, !state && styles.dropdownDisabled]} 
        onPress={() => state && setShowDistrictModal(true)}
        disabled={!state}
      >
        <Text style={district ? styles.dropdownButtonText : styles.dropdownPlaceholder}>
          {district || (state ? "Select District" : "Select State First")}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#64748b" />
      </TouchableOpacity>

      {/* State Picker Modal */}
      <Modal visible={showStateModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowStateModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={stateNames}
              keyExtractor={(item) => item}
              renderItem={(props) => renderDropdownItem(props, (selectedState) => {
                setState(selectedState);
                setDistrict(""); // Reset district when state changes
                setShowStateModal(false);
              })}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* District Picker Modal */}
      <Modal visible={showDistrictModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDistrictModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={districtNames}
              keyExtractor={(item) => item}
              renderItem={(props) => renderDropdownItem(props, (selectedDistrict) => {
                setDistrict(selectedDistrict);
                setShowDistrictModal(false);
              })}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 16,
    backgroundColor: "#f8fafc",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  inputNoMargin: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  inputLoader: {
    position: "absolute",
    right: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dropdownDisabled: {
    backgroundColor: "#e2e8f0",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#0f172a",
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: "#94a3b8",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#334155",
  },
});
