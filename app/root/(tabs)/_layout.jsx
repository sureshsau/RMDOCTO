import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Platform, Dimensions } from "react-native";

const W = Dimensions.get("window").width;
const PRIMARY = "#14b8a6";
const SCENE_BG = "#eef2f7";      // visible in the notch gap
const TAB_HEIGHT = Platform.OS === "ios" ? 82 : 70;

// Notch geometry
const NOTCH_HALF = 36;           // half-width of the transparent notch
const CURVE_R = 22;              // radius of the concave corner curve
const MID = W / 2;

/* ─── Curved background component ─── */
function CurvedTabBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>

      {/* ─── SHADOW BASE (the solid white floor beneath everything) ─── */}
      <View style={sh.shadow} />

      {/* ─── LEFT white panel: top strip ─── */}
      <View style={{
        position: "absolute", top: 0, left: 0,
        width: MID - NOTCH_HALF - CURVE_R,
        height: CURVE_R,
        backgroundColor: "#fff",
      }} />

      {/* ─── RIGHT white panel: top strip ─── */}
      <View style={{
        position: "absolute", top: 0, right: 0,
        width: MID - NOTCH_HALF - CURVE_R,
        height: CURVE_R,
        backgroundColor: "#fff",
      }} />

      {/* ─── LEFT CONCAVE CORNER ─── */}
      {/* A white square with a scene-colored circle punching through bottom-right */}
      <View style={{
        position: "absolute",
        top: 0,
        left: MID - NOTCH_HALF - CURVE_R,
        width: CURVE_R,
        height: CURVE_R,
        overflow: "hidden",
        backgroundColor: "#fff",
      }}>
        <View style={{
          position: "absolute",
          width: CURVE_R * 2,
          height: CURVE_R * 2,
          bottom: 0,
          right: 0,
          borderRadius: CURVE_R,
          backgroundColor: SCENE_BG,
        }} />
      </View>

      {/* ─── RIGHT CONCAVE CORNER ─── */}
      <View style={{
        position: "absolute",
        top: 0,
        left: MID + NOTCH_HALF,
        width: CURVE_R,
        height: CURVE_R,
        overflow: "hidden",
        backgroundColor: "#fff",
      }}>
        <View style={{
          position: "absolute",
          width: CURVE_R * 2,
          height: CURVE_R * 2,
          bottom: 0,
          left: 0,
          borderRadius: CURVE_R,
          backgroundColor: SCENE_BG,
        }} />
      </View>
    </View>
  );
}

/* ─── Tabs layout ─── */
export default function UserTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: "#94a3b8",
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: -2 },

        // Transparent so curved bg shows through
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: TAB_HEIGHT,
          paddingBottom: Platform.OS === "ios" ? 22 : 10,
          paddingTop: 8,
          elevation: 0,
          position: "absolute",
          left: 0, right: 0, bottom: 0,
        },

        // Custom curved background
        tabBarBackground: () => <CurvedTabBackground />,

        // The navigator container bg is what shows through the notch
        sceneContainerStyle: { backgroundColor: SCENE_BG },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "",
          tabBarIcon: () => (
            <View style={sh.fabBtn}>
              <Ionicons name="calendar" size={26} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const sh = StyleSheet.create({
  shadow: {
    position: "absolute",
    top: CURVE_R,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    elevation: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  fabBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    elevation: 10,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
});
