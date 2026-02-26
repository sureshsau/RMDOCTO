import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  AnimatedRegion,
  Marker,
} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const GOOGLE_KEY =Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_KEY;;

/* ================= CONSTANTS ================= */

const STOP_SPEED = 0.8; // m/s
const DEFAULT_ZOOM = 15;
const MIN_MOVE_DISTANCE = 3; // meters
const CAMERA_THROTTLE = 1200; // ms

const OFF_ROUTE_DISTANCE = 40; // meters
const REROUTE_DELAY = 3000; // ms

/* ================= MAIN ================= */

export default function AgentOrderTrack() {
  const { destLat, destLng } = useLocalSearchParams();

  const mapRef = useRef(null);
  const watchRef = useRef(null);

  const followRef = useRef(true);
  const lastHeadingRef = useRef(0);
  const lastCameraUpdateRef = useRef(0);
  const lastCoordRef = useRef(null);

  const routeCoordsRef = useRef([]);
  const rerouteTimeoutRef = useRef(null);

  /* ================= DESTINATION ================= */

  const destLatitude = Number(destLat);
  const destLongitude = Number(destLng);

  if (!Number.isFinite(destLatitude) || !Number.isFinite(destLongitude)) {
    console.warn("Invalid destination params");
    return null;
  }

  const destination = {
    latitude: destLatitude,
    longitude: destLongitude,
  };

  /* ================= DRIVER STATE ================= */

  const driverAnimated = useRef(
    new AnimatedRegion({
      latitude: destLatitude,
      longitude: destLongitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  ).current;

  const [driverCoord, setDriverCoord] = useState(null);
  const [heading, setHeading] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [rerouteKey, setRerouteKey] = useState(0);

  const [mapType, setMapType] = useState("standard");

  /* ================= LOCATION TRACKING ================= */

  useEffect(() => {
    startTracking();
    return () => watchRef.current?.remove();
  }, []);

  const startTracking = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    watchRef.current =
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (loc) => {
          const {
            latitude,
            longitude,
            heading: gpsHeading,
            speed,
          } = loc.coords;

          const plainCoord = { latitude, longitude };
          setDriverCoord(plainCoord);

          /* ===== SMOOTH MARKER ===== */
          driverAnimated.timing({
            latitude,
            longitude,
            duration: 800,
            useNativeDriver: false,
          }).start();

          /* ===== HEADING ===== */
          if (speed >= STOP_SPEED && gpsHeading != null) {
            lastHeadingRef.current = gpsHeading;
            setHeading(gpsHeading);
          }
          if (speed < STOP_SPEED) setHeading(0);

          /* ===== CAMERA (STABLE) ===== */
          const now = Date.now();
          const moved = distanceBetween(
            lastCoordRef.current,
            plainCoord
          );

          if (
            followRef.current &&
            moved > MIN_MOVE_DISTANCE &&
            now - lastCameraUpdateRef.current > CAMERA_THROTTLE
          ) {
            lastCameraUpdateRef.current = now;
            lastCoordRef.current = plainCoord;

            mapRef.current?.animateCamera(
              {
                center: plainCoord,
                heading:
                  speed < STOP_SPEED
                    ? 0
                    : lastHeadingRef.current,
                pitch: 60,
                zoom,
              },
              { duration: 700 }
            );
          }

          /* ===== OFF-ROUTE DETECTION ===== */
          const deviation = distanceToRoute(
            plainCoord,
            routeCoordsRef.current
          );

          if (deviation > OFF_ROUTE_DISTANCE) {
            if (!rerouteTimeoutRef.current) {
              rerouteTimeoutRef.current = setTimeout(() => {
                setRerouteKey((k) => k + 1);
                routeCoordsRef.current = [];
                rerouteTimeoutRef.current = null;
              }, REROUTE_DELAY);
            }
          } else {
            if (rerouteTimeoutRef.current) {
              clearTimeout(rerouteTimeoutRef.current);
              rerouteTimeoutRef.current = null;
            }
          }
        }
      );
  };

  /* ================= CONTROLS ================= */

  const zoomIn = () => {
    const z = Math.min(zoom + 1, 20);
    setZoom(z);
    mapRef.current?.animateCamera({ zoom: z });
  };

  const zoomOut = () => {
    const z = Math.max(zoom - 1, 14);
    setZoom(z);
    mapRef.current?.animateCamera({ zoom: z });
  };

  const recenter = () => {
    if (!driverCoord) return;
    followRef.current = true;
    lastCoordRef.current = driverCoord;

    mapRef.current?.animateCamera(
      {
        center: driverCoord,
        heading: lastHeadingRef.current,
        pitch: 60,
        zoom,
      },
      { duration: 600 }
    );
  };

  const refreshMap = () => {
    if (!driverCoord) return;
    followRef.current = true;
    lastCoordRef.current = null;
    lastCameraUpdateRef.current = 0;
    setRerouteKey((k) => k + 1);
    recenter();
  };

  const toggleMapType = () => {
    setMapType((prev) =>
      prev === "standard"
        ? "satellite"
        : prev === "satellite"
        ? "hybrid"
        : "standard"
    );
  };

  /* ================= MAP ================= */

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType={mapType}
        showsCompass={false}
        showsMyLocationButton={false}
        onPanDrag={() => (followRef.current = false)}
      >
        {/* DRIVER */}
       <Marker.Animated
  coordinate={driverAnimated}
  anchor={{ x: 0.5, y: 0.5 }}
  rotation={heading}
  flat
>
  <View
    style={{
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 20,
      elevation: 4
    }}
  >
    <MaterialIcons
      name="navigation"
      size={26}
      color="#1a73e8"
    />
  </View>
</Marker.Animated>

        {/* DESTINATION */}
        <Marker coordinate={destination} pinColor="#ea4335" />

        {/* ROUTE */}
        {driverCoord && (
          <MapViewDirections
            key={rerouteKey}
            origin={driverCoord}
            destination={destination}
            apikey={GOOGLE_KEY}
            strokeWidth={7}
            strokeColor="#1a73e8"
            lineCap="round"
            lineJoin="round"
            optimizeWaypoints
            onReady={(res) => {
              routeCoordsRef.current = res.coordinates;
              setEta(Math.ceil(res.duration));
              setDistance(
                res.distance < 1
                  ? `${Math.round(res.distance * 1000)} m`
                  : `${res.distance.toFixed(1)} km`
              );
            }}
          />
        )}
      </MapView>

      {/* ETA */}
      {eta !== null && (
  <View style={styles.etaCard}>
    <Text style={styles.etaText}>
      {eta} min • {distance}
    </Text>
  </View>
)}

      {/* CONTROLS */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={zoomIn}>
          <MaterialIcons name="add" size={24} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={zoomOut}>
          <MaterialIcons name="remove" size={24} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={recenter}>
          <MaterialIcons name="my-location" size={22} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={refreshMap}>
          <MaterialIcons name="refresh" size={22} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={toggleMapType}>
          <MaterialIcons name="layers" size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= HELPERS ================= */

function distanceBetween(a, b) {
  if (!a || !b) return Infinity;

  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;

  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

function distanceToRoute(point, routeCoords) {
  if (!point || !routeCoords?.length) return Infinity;

  let min = Infinity;
  for (const c of routeCoords) {
    const d = distanceBetween(point, c);
    if (d < min) min = d;
  }
  return min;
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  controls: {
    position: "absolute",
    right: 16,
    bottom: 120,
    gap: 12,
  },

  btn: {
    width: 44,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  etaCard: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "#1a73e8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 6,
  },

  etaText: {
    color: "#fff",
    fontWeight: "800",
  },
});
