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
              Health<Text style={{ color: PRIMARY }}>Care</Text>
            </Text>

            <Text style={styles.subtitle}>
              Login with OTP
            </Text>

            {/* PHONE INPUT */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="call-outline"
                size={22}
                color={ICON}
              />
              <TextInput
                placeholder="Mobile Number"
                keyboardType="phone-pad"
                placeholderTextColor={PLACEHOLDER}
                style={styles.input}
                value={phone}
                editable={!otpSent}
                onChangeText={(text) =>
                  setPhone(sanitizePhone(text))
                }
              />
            </View>

            {/* OTP INPUT */}
            {otpSent && (
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="key-outline"
                  size={22}
                  color={ICON}
                />
                <TextInput
                  placeholder="Enter OTP"
                  keyboardType="number-pad"
                  placeholderTextColor={PLACEHOLDER}
                  style={styles.input}
                  value={otp}
                  onChangeText={(text) =>
                    setOtp(
                      text.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                />
              </View>
            )}

            {/* TIMER + ACTIONS */}
            {otpSent && (
              <View style={styles.otpActions}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Resend OTP in {timer}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                  >
                    <Text style={styles.resendText}>
                      Resend OTP
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    setOtpSent(false);
                    setOtp("");
                    setTimer(0);
                  }}
                >
                  <Text style={styles.changeNumberText}>
                    Change Number
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* BUTTON */}
            <TouchableOpacity
              style={[
                styles.button,
                loading && { opacity: 0.7 },
              ]}
              onPress={
                otpSent
                  ? handleVerifyOtp
                  : handleSendOtp
              }
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {otpSent
                    ? "Verify OTP"
                    : "Send OTP"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ================= STYLES ================= */

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
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: "#fff",
  },

  subtitle: {
    textAlign: "center",
    marginTop: 12,
    marginBottom: 32,
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
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

  otpActions: {
    alignItems: "center",
    marginBottom: 20,
  },

  timerText: {
    color: "#fff",
    fontSize: 14,
  },

  resendText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "600",
  },

  changeNumberText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 13,
    textDecorationLine: "underline",
  },

  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
