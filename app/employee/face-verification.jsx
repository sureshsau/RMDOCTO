import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../../services/axios.js";

/* ================= CONSTANTS ================= */

const PRIMARY = "#14b8a6";
const { width, height } = Dimensions.get("window");

const OVAL_WIDTH = 260;
const OVAL_HEIGHT = 340;
const OVAL_CX = width / 2;
const OVAL_CY = height * 0.42;

export default function EmployeeFaceVerification() {
  const isFocused = useIsFocused();
  const cameraRef = useRef(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  /* ================= PERMISSIONS ================= */

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
  }, [cameraPermission]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Toast.show({
            type: "error",
            text1: "Location Required",
            text2: "Please allow location access",
          });
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        setLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      } catch {
        Toast.show({
          type: "error",
          text1: "Location Error",
          text2: "Failed to fetch location",
        });
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  /* ================= VERIFY ================= */

  const handleVerify = async () => {
    if (!cameraRef.current || !location) return;

    try {
      setVerifying(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      const formData = new FormData();

      formData.append("faceImage", {
        uri: photo.uri,
        name: "attendance.jpg",
        type: "image/jpeg",
      });

      formData.append("lat", String(location.lat));
      formData.append("lng", String(location.lng));
      formData.append("deviceId", "unknown");
      formData.append("timestamp", String(Date.now()));

      const res = await api.post("/attendance/mark", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Toast.show({
        type: "success",
        text1: "Attendance Marked ✅",
        text2: res.data?.message || "Successfully verified",
      });

      router.back();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Verification failed";

      Toast.show({
        type: "error",
        text1: "Attendance Failed",
        text2: msg,
      });
    } finally {
      setVerifying(false);
    }
  };

  if (!cameraPermission?.granted || !isFocused) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* CAMERA */}
      <CameraView
        ref={cameraRef}
        facing="front"
        style={StyleSheet.absoluteFill}
      />

      {/* BACK BUTTON */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>

      {/* OVAL FRAME */}
      <View
        style={[
          styles.oval,
          {
            width: OVAL_WIDTH,
            height: OVAL_HEIGHT,
            left: OVAL_CX - OVAL_WIDTH / 2,
            top: OVAL_CY - OVAL_HEIGHT / 2,
          },
        ]}
      />

      {/* STATUS */}
      <View style={styles.statusPill}>
        {locationLoading ? (
          <ActivityIndicator color={PRIMARY} />
        ) : (
          <Text style={styles.statusText}>Location Verified</Text>
        )}
      </View>

      {/* INSTRUCTION TEXT */}
      <Text style={styles.instruction}>
        Position your face inside the frame
      </Text>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          onPress={handleVerify}
          disabled={verifying || locationLoading}
          style={[
            styles.cta,
            (verifying || locationLoading) && { opacity: 0.7 },
          ]}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Mark Attendance</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  backBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 12,
    borderRadius: 24,
  },

  oval: {
    position: "absolute",
    borderWidth: 3,
    borderColor: PRIMARY,
    borderRadius: 999,
    shadowColor: PRIMARY,
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },

  statusPill: {
    position: "absolute",
    top: 48,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "600",
  },

  instruction: {
    position: "absolute",
    top: OVAL_CY + OVAL_HEIGHT / 2 + 18,
    alignSelf: "center",
    color: PRIMARY,
    fontSize: 15,
  },

  ctaContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },

  cta: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
