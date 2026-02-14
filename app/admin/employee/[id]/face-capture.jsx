import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const PRIMARY = "#6b6dbf";
const { width, height } = Dimensions.get("window");

const OVAL_WIDTH = 260;
const OVAL_HEIGHT = 340;
const OVAL_CX = width / 2;
const OVAL_CY = height * 0.42;

export default function FaceCapture() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { returnTo } = useLocalSearchParams();
  const isFocused = useIsFocused();
  const cameraRef = useRef(null);

  const [cameraPermission, requestCameraPermission] =
    useCameraPermissions();

  const [verifying, setVerifying] = useState(false);
  const [facing, setFacing] = useState("front");

  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
  }, [cameraPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setVerifying(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
        skipProcessing: true,
      });

      // 🔹 Send image back to the caller page (attendance or edit)
      if (returnTo === 'attendance') {
        router.replace({
          pathname: `/admin/employee/${id}/attendance`,
          params: { faceUri: photo.uri },
        });
      } else {
        router.replace({
          pathname: `/admin/employee/${id}/edit`,
          params: { faceUri: photo.uri },
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  if (!cameraPermission?.granted || !isFocused) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        ref={cameraRef}
        facing={facing}
        style={StyleSheet.absoluteFill}
      />

      {/* BEAUTIFUL BACK BUTTON */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-back" size={20} color="white" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* CAMERA SWAP */}
      <TouchableOpacity
        style={styles.swapBtn}
        onPress={() =>
          setFacing((prev) => (prev === "front" ? "back" : "front"))
        }
      >
        <Ionicons name="camera-reverse-outline" size={22} color="white" />
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

      {/* INSTRUCTION */}
      <Text style={styles.instruction}>
        Position your face inside the frame
      </Text>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          onPress={handleCapture}
          disabled={verifying}
          style={[
            styles.cta,
            verifying && { opacity: 0.7 },
          ]}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Capture Face</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  oval: {
    position: "absolute",
    borderWidth: 3,
    borderColor: PRIMARY,
    borderRadius: 999,
    shadowColor: PRIMARY,
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },

  instruction: {
    position: "absolute",
    top: OVAL_CY + OVAL_HEIGHT / 2 + 18,
    alignSelf: "center",
    color: PRIMARY,
    fontSize: 15,
    opacity: 0.95,
    fontWeight: "600",
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
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  ctaText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  swapBtn: {
    position: "absolute",
    top: 52,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 10,
    borderRadius: 30,
  },

  backBtn: {
    position: "absolute",
    top: 52,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 30,
  },

  backText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
});
