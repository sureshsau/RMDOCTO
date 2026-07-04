import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
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

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const sanitizePhone = (value) =>
    value.replace(/\D/g, "").slice(-10);

  /* ================= TIMER ================= */

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  /* ================= SEND OTP ================= */

  const handleSendOtp = async () => {
    if (loading) return;

    const cleanPhone = sanitizePhone(phone);

    if (cleanPhone.length !== 10) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone Number",
        text2: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/login/send-otp",
        { phone: cleanPhone },
        {
          headers: {
            "User-Agent":
              Platform.OS === "android"
                ? "Android Mobile Expo"
                : "iPhone Mobile Expo",
          },
        }
      );

      setOtpSent(true);
      setTimer(30);

      Toast.show({
        type: "success",
        text1: "OTP Sent Successfully",
        text2:
          "A verification code has been sent to your mobile number.",
      });

    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to Send OTP",
        text2:
          err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */

  const handleVerifyOtp = async () => {
    if (loading) return;

    if (otp.length !== 6) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: "Please enter the 6-digit verification code.",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await api.post(
        "/login/verify-otp",
        { phone: sanitizePhone(phone), otp },
        {
          headers: {
            "User-Agent":
              Platform.OS === "android"
                ? "Android Mobile Expo"
                : "iPhone Mobile Expo",
          },
        }
      );

      const { token, user } = res.data;

      await login({ token, user });

      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2:
          "Welcome back! Redirecting to dashboard...",
      });

      router.replace("/");

    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2:
          err?.response?.data?.message ||
          "The OTP you entered is incorrect or expired.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <View style={styles.topBackground}>
         {/* Decorative circles for modern look */}
         <View style={styles.circle1} />
         <View style={styles.circle2} />
      </View>

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.logo}>
                RM<Text style={{ color: "#fff", fontWeight: "300" }}>DOCTO</Text>
              </Text>
              <Text style={styles.tagline}>Your Health, Our Priority</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.subtitle}>
                {otpSent ? "Enter the verification code sent to your number" : "Login or create a new account with your mobile number"}
              </Text>

              {/* PHONE INPUT */}
              <View style={[styles.inputWrapper, otpSent && { opacity: 0.6 }]}>
                <Ionicons name="call-outline" size={20} color="#64748b" />
                <View style={styles.prefixContainer}>
                  <Text style={styles.prefixText}>+91</Text>
                </View>
                <TextInput
                  placeholder="Mobile Number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={phone}
                  editable={!otpSent}
                  onChangeText={(text) => setPhone(sanitizePhone(text))}
                  maxLength={10}
                />
              </View>

              {/* OTP INPUT */}
              {otpSent && (
                <View style={styles.inputWrapper}>
                  <Ionicons name="keypad-outline" size={20} color="#64748b" />
                  <TextInput
                    placeholder="Enter 6-digit OTP"
                    keyboardType="number-pad"
                    placeholderTextColor="#94a3b8"
                    style={[styles.input, { paddingLeft: 12 }]}
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    autoFocus
                  />
                </View>
              )}

              {/* BUTTON */}
              <TouchableOpacity
                style={[
                  styles.button,
                  (loading || (otpSent ? otp.length !== 6 : phone.length !== 10)) && { opacity: 0.7 }
                ]}
                onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                disabled={loading || (otpSent ? otp.length !== 6 : phone.length !== 10)}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {otpSent ? "Verify OTP" : "Continue"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* TIMER + ACTIONS */}
              {otpSent && (
                <View style={styles.otpActions}>
                  {timer > 0 ? (
                    <Text style={styles.timerText}>
                      Resend code in <Text style={{ fontWeight: "700", color: PRIMARY }}>00:{timer < 10 ? `0${timer}` : timer}</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp}>
                      <Text style={styles.resendText}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={{ marginTop: 16 }}
                    onPress={() => {
                      setOtpSent(false);
                      setOtp("");
                      setTimer(0);
                    }}
                  >
                    <Text style={styles.changeNumberText}>Change Mobile Number</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  topBackground: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: "45%",
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  circle2: {
    position: "absolute",
    top: 100,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 46,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: 8,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  prefixContainer: {
    marginLeft: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#CBD5E1",
  },
  prefixText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "600",
  },
  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  otpActions: {
    alignItems: "center",
    marginTop: 24,
  },
  timerText: {
    color: "#64748b",
    fontSize: 14,
  },
  resendText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "700",
  },
  changeNumberText: {
    color: "#94a3b8",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
