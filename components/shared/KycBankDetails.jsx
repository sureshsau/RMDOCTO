import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

export default function KycBankDetails({ 
  accountNumber, setAccountNumber, 
  confirmAccountNumber, setConfirmAccountNumber, 
  ifscCode, setIfscCode, 
  accountHolderName, setAccountHolderName, 
  bankName, setBankName 
}) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.inputLabel}>Account Holder Name</Text>
      <TextInput placeholderTextColor="#94a3b8" 
        style={styles.input} 
        value={accountHolderName} 
        onChangeText={setAccountHolderName} 
        placeholder="Enter account holder name" 
      />
      
      <Text style={styles.inputLabel}>Bank Name</Text>
      <TextInput placeholderTextColor="#94a3b8" 
        style={styles.input} 
        value={bankName} 
        onChangeText={setBankName} 
        placeholder="Enter bank name" 
      />

      <Text style={styles.inputLabel}>Account Number</Text>
      <TextInput placeholderTextColor="#94a3b8" 
        style={styles.input} 
        value={accountNumber} 
        onChangeText={setAccountNumber} 
        placeholder="Enter account number" 
        keyboardType="numeric" 
      />

      <Text style={styles.inputLabel}>Confirm Account Number</Text>
      <TextInput placeholderTextColor="#94a3b8" 
        style={[styles.input, confirmAccountNumber && accountNumber !== confirmAccountNumber ? styles.inputError : null]} 
        value={confirmAccountNumber} 
        onChangeText={setConfirmAccountNumber} 
        placeholder="Re-enter account number" 
        keyboardType="numeric" 
      />
      {confirmAccountNumber && accountNumber !== confirmAccountNumber ? (
        <Text style={styles.errorText}>Account numbers do not match</Text>
      ) : null}
      
      <Text style={styles.inputLabel}>IFSC Code</Text>
      <TextInput placeholderTextColor="#94a3b8" 
        style={styles.input} 
        value={ifscCode} 
        onChangeText={setIfscCode} 
        placeholder="Enter IFSC code" 
        autoCapitalize="characters"
      />
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
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  }
});
