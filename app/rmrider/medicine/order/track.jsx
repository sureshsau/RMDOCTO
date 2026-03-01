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
  Polyline,
} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const GOOGLE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_KEY;;

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
  // const { destLat, destLng } = { destLat: 31.1471, destLng: 75.3412 };

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
  const [routeOrigin, setRouteOrigin] = useState(null);
  const routeOriginRef = useRef(null);
  const [fullRoute, setFullRoute] = useState([]);
  const lastClosestIdxRef = useRef(0);

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

          if (!routeOriginRef.current) {
            routeOriginRef.current = plainCoord;
            setRouteOrigin(plainCoord);

            // Instant zoom on first location fetch
            mapRef.current?.animateCamera(
              {
                center: plainCoord,
                heading: gpsHeading || 0,
                pitch: 60,
                zoom: 17,
              },
              { duration: 1000 }
            );
          }

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
                routeOriginRef.current = plainCoord;
                setRouteOrigin(plainCoord);
                routeCoordsRef.current = [];
                setFullRoute([]);
                lastClosestIdxRef.current = 0;
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

  /* ================= ROUTE SPLITTING ================= */
  const getSplitRoute = () => {
    if (!fullRoute.length || !driverCoord) return { past: [], future: fullRoute };

    let minDistance = Infinity;
    let closestIdx = lastClosestIdxRef.current;

    const searchStart = Math.max(0, lastClosestIdxRef.current - 5);
    const searchEnd = Math.min(fullRoute.length, lastClosestIdxRef.current + 20);

    for (let i = searchStart; i < searchEnd; i++) {
      const d = distanceBetween(driverCoord, fullRoute[i]);
      if (d < minDistance) {
        minDistance = d;
        closestIdx = i;
      }
    }

    if (minDistance > OFF_ROUTE_DISTANCE * 2) {
      for (let i = 0; i < fullRoute.length; i++) {
        const d = distanceBetween(driverCoord, fullRoute[i]);
        if (d < minDistance) {
          minDistance = d;
          closestIdx = i;
        }
      }
    }

    lastClosestIdxRef.current = closestIdx;

    const past = fullRoute.slice(0, closestIdx + 1);
    const future = [driverCoord, ...fullRoute.slice(closestIdx)];

    return { past, future };
  };

  const { past, future } = getSplitRoute();

  /* ================= MAP ================= */

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType={mapType}
        showsCompass={false}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPanDrag={() => (followRef.current = false)}
        initialRegion={{
          latitude: 20.5937,
          longitude: 78.9629,
          latitudeDelta: 30,
          longitudeDelta: 30,
        }}
      >
        {/* DRIVER */}
        {driverCoord && (
          <Marker
            coordinate={driverCoord}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={heading}
            flat
            tracksViewChanges={false}
          >
            <View style={styles.driverDotOuter}>
              <MaterialIcons name="navigation" size={60} color="#fb923c" />
            </View>
          </Marker>
        )}

        {/* DESTINATION */}
        <Marker coordinate={destination} pinColor="#ea4335" />

        {/* VISIBLE PATHS */}
        {past.length > 0 && (
          <Polyline
            coordinates={past}
            strokeColor="#9ca3af"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {future.length > 0 && (
          <Polyline
            coordinates={future}
            strokeColor="#1a73e8"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* ROUTE FETCHER (INVISIBLE) */}
        {routeOrigin && (
          <MapViewDirections
            key={rerouteKey}
            origin={routeOrigin}
            destination={destination}
            apikey={GOOGLE_KEY}
            strokeWidth={0}
            optimizeWaypoints
            onReady={(res) => {
              routeCoordsRef.current = res.coordinates;
              setFullRoute(res.coordinates);
              setEta(Math.ceil(res.duration));
              setDistance(
                res.distance < 1
                  ? `${Math.round(res.distance * 1000)} m`
                  : `${res.distance.toFixed(1)} km`
              );

              followRef.current = true;
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

  driverDotOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ea580c",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
});
