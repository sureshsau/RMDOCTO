import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/axios";

const PRIMARY = "#14b8a6";
const INPUT_BG = "rgba(20,184,166,0.25)";
const PLACEHOLDER = "rgba(255,255,255,0.7)";
const ICON = "#ffffff";

export default function LoginScreen() {
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const sanitizePhone = (value) =>
    value.replace(/\D/g, "").slice(-10);

  const handleLogin = async () => {
    if (loading) return;

    const cleanPhone = sanitizePhone(phone);

    if (cleanPhone.length !== 10 || !password) {
      Toast.show({
        type: "error",
        text1: "Invalid Input",
        text2: "Enter valid phone number and password",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        phone: cleanPhone, // ✅ web-compatible
        password,
      });

      const { token, user } = res.data || {};

      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      // 🔐 Save session via AuthContext
      await login({ token, user });

      Toast.show({
        type: "success",
        text1: "Login Successful 🎉",
        text2: `Welcome ${user.name || ""}`,
      });

      // 🔀 Role-based routing (safe)
      const role =
        user.role ||
        user.roles?.[0] ||
        "user";

      if (role === "admin") router.replace("/admin");
      else if (role === "doctor") router.replace("/doctor");
      else if (role === "marketing_agent") router.replace("/marketingAgent");
      else router.replace("/(tabs)");
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2:
          err?.response?.data?.message ||
          err?.message ||
          "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{
        uri: "https://i.pinimg.com/1200x/5d/74/2f/5d742f39c9a8e5be99d622e98c00de72.jpg",
      }}
      resizeMode="cover"
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.card}>
            <Text style={styles.logo}>
              RM<Text style={{ color: PRIMARY }}>Docto</Text>
            </Text>

            <Text style={styles.subtitle}>
              Login to your account
            </Text>

            {/* Phone */}
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={22} color={ICON} />
              <TextInput
                placeholder="Mobile Number"
                keyboardType="phone-pad"
                placeholderTextColor={PLACEHOLDER}
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                maxLength={15}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={22} color={ICON} />
              <TextInput
                placeholder="Password"
                secureTextEntry={!showPassword}
                placeholderTextColor={PLACEHOLDER}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={ICON}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.button,
                loading && { opacity: 0.7 },
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 24,
    padding: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 12,
    marginBottom: 32,
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: INPUT_BG,
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#fff",
  },
  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
