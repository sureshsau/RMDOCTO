import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, Linking, ActivityIndicator,
  Animated, PanResponder, Dimensions, TouchableOpacity, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import api from '../../../../services/axios';

const GOOGLE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

const ACCENT = '#14b8a6'; // RMDOCTO PRIMARY
const DARK = '#1A1B1F';
const CARD = '#23242A';
const GREY_ROUTE = 'rgba(255,255,255,0.22)';
const { width: SW, height: SH } = Dimensions.get('window');
const SHEET_MIN = 300;
const SHEET_MAX = SH * 0.70;
const ROUTE_REFETCH_DISTANCE_M = 30;
const ROUTE_REFETCH_INTERVAL_MS = 20000;

const CAM_MIN_DIST_M = 3;    
const CAM_MIN_HEADING_DEG = 5; 
const TRIM_SNAP_M = 30;
const TAB_BAR_HEIGHT = 72;

const INDIA = { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 8, longitudeDelta: 8 };

const isValidPt = (pt) => {
  if (!pt) return false;
  return (
    Number.isFinite(pt.latitude) &&
    Number.isFinite(pt.longitude) &&
    Math.abs(pt.latitude) <= 90 &&
    Math.abs(pt.longitude) <= 180
  );
};

const sanitizePts = (pts) => pts.filter(isValidPt);

const samePt = (a, b) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.latitude === b.latitude && a.longitude === b.longitude;
};

const haversineM = (a, b) => {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

const decodePoly = (enc) => {
  let idx = 0, lat = 0, lng = 0;
  const pts = [];
  try {
    while (idx < enc.length) {
      let r = 0, sh = 0, b;
      do {
        const ch = enc.charCodeAt(idx++);
        if (!Number.isFinite(ch)) return sanitizePts(pts);
        b = ch - 63;
        r |= (b & 0x1f) << sh;
        sh += 5;
      } while (b >= 0x20);
      lat += (r & 1) ? ~(r >> 1) : r >> 1;
      r = 0; sh = 0;
      do {
        const ch = enc.charCodeAt(idx++);
        if (!Number.isFinite(ch)) return sanitizePts(pts);
        b = ch - 63;
        r |= (b & 0x1f) << sh;
        sh += 5;
      } while (b >= 0x20);
      lng += (r & 1) ? ~(r >> 1) : r >> 1;
      const pt = { latitude: lat / 1e5, longitude: lng / 1e5 };
      if (isValidPt(pt)) pts.push(pt);
    }
  } catch {
    return sanitizePts(pts);
  }
  return sanitizePts(pts);
};

const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

const zoomForSpeed = (kmh) => {
  if (kmh < 20) return 18.5;
  if (kmh < 40) return 17.8;
  return 17.0;
};

const Shadows = {
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  }
};

const RiderBeacon = React.memo(() => {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 2.2, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: ACCENT, transform: [{ scale: pulse }], opacity }} />
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: DARK, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: ACCENT, ...Shadows.strong }}>
        <Ionicons name="navigate" size={16} color={ACCENT} style={{ transform: [{ rotate: '0deg' }] }} />
      </View>
    </View>
  );
});

const TargetPin = React.memo(() => (
  <View style={{ alignItems: 'center' }}>
    <View style={{ backgroundColor: '#8B5CF6', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', gap: 4, alignItems: 'center', ...Shadows.strong }}>
      <Ionicons name={'home'} size={12} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>DROP</Text>
    </View>
    <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#8B5CF6' }} />
  </View>
));

const PhaseStepper = React.memo(({ status }) => {
  const steps = [
    { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle' },
    { key: 'pickup', label: 'Pickup', icon: 'restaurant' },
    { key: 'delivery', label: 'Delivering', icon: 'bicycle' },
  ];
  let activeIdx = 0;
  const s = (status || '').toLowerCase();
  if (s.includes('deliver')) activeIdx = 2;
  else if (s.includes('process') || s.includes('pick')) activeIdx = 1;
  else activeIdx = 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={s.key}>
            <View style={{ alignItems: 'center', gap: 3 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: done ? '#22C55E' : active ? ACCENT : '#333', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={s.icon} size={13} color={done ? '#fff' : active ? DARK : '#666'} />
              </View>
              <Text style={{ fontSize: 9, color: active ? ACCENT : done ? '#22C55E' : '#555', fontWeight: '700' }}>{s.label}</Text>
            </View>
            {i < steps.length - 1 && (
              <View style={{ flex: 1, height: 2, backgroundColor: done ? '#22C55E' : '#333', marginBottom: 14, marginHorizontal: 3 }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
});

export default function AgentOrderTrack() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const orderId = params.orderId || '';
  const customerName = params.customerName || 'Customer';
  const customerPhone = params.customerPhone || '';
  const deliveryAddress = params.deliveryAddress || 'Customer Location';
  
  const destLat = Number(params.deliveryLat);
  const destLng = Number(params.deliveryLng);
  const targetPt = (Number.isFinite(destLat) && Number.isFinite(destLng)) 
    ? { latitude: destLat, longitude: destLng } 
    : null;

  const orderShort = orderId ? "#" + orderId.slice(-8).toUpperCase() : "";

  const [status, setStatus] = useState(params.orderStatus || 'accepted');
  const [riderPt, setRiderPt] = useState(null);
  const [heading, setHeading] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [permDenied, setPermDenied] = useState(false);
  const [locLoading, setLocLoading] = useState(true);
  const [routeFull, setRouteFull] = useState([]);
  const [routeRemain, setRouteRemain] = useState([]);
  const [eta, setEta] = useState(null);
  const [turnInstr, setTurnInstr] = useState('');
  const [isMarkingDone, setIsMarkingDone] = useState(false);

  const [sheetExpanded, setSheetExpanded] = useState(false);
  const sheetExpandedRef = useRef(false);

  const [isNavigating, setIsNavigating] = useState(true);
  const isNavigatingRef = useRef(true);

  const sheetHeight = useRef(new Animated.Value(SHEET_MIN)).current;
  const mapRef = useRef(null);
  const watchRef = useRef(null);
  const latestPt = useRef(null);
  const lastFetchPt = useRef(null);
  const lastFetchTime = useRef(0);

  const lastCamPt = useRef(null);
  const lastCamHeading = useRef(0);
  const prevHeadingRef = useRef(0);
  const cameraTimerRef = useRef(null);
  const routeFullRef = useRef([]);
  const lastClosestIndexRef = useRef(0);

  const isDone = status.toLowerCase() === 'delivered';

  useEffect(() => {
    routeFullRef.current = routeFull;
  }, [routeFull]);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  const trimRoute = useCallback((riderPos, fullRoute) => {
    if (fullRoute.length < 2) return fullRoute;
    if (!isNavigatingRef.current) return fullRoute;

    const WINDOW = 150;
    const startIdx = Math.max(0, lastClosestIndexRef.current - 5);
    const endIdx = Math.min(fullRoute.length - 1, lastClosestIndexRef.current + WINDOW);

    let closestIdx = lastClosestIndexRef.current;
    let minDist = haversineM(riderPos, fullRoute[closestIdx]);
    for (let i = startIdx; i <= endIdx; i++) {
      const d = haversineM(riderPos, fullRoute[i]);
      if (d < minDist) { minDist = d; closestIdx = i; }
    }
    lastClosestIndexRef.current = closestIdx;

    if (minDist > TRIM_SNAP_M) return fullRoute;
    return fullRoute.slice(Math.max(0, closestIdx - 1));
  }, []);

  const updateCamera = useCallback((pt, hdg, kmh) => {
    if (!mapRef.current || !isNavigatingRef.current) return;
    const movedEnough = lastCamPt.current ? haversineM(lastCamPt.current, pt) >= CAM_MIN_DIST_M : true;
    const headingChanged = Math.abs(hdg - lastCamHeading.current) >= CAM_MIN_HEADING_DEG;

    if (!movedEnough && !headingChanged) return;

    if (cameraTimerRef.current) clearTimeout(cameraTimerRef.current);
    cameraTimerRef.current = setTimeout(() => {
      mapRef.current?.animateCamera(
        {
          center: pt,
          zoom: zoomForSpeed(kmh),
          pitch: 0,
          heading: hdg,
        },
        { duration: 400 }
      );
      lastCamPt.current = pt;
      lastCamHeading.current = hdg;
    }, 50);
  }, []);

  useEffect(() => {
    let active = true;
    const start = async () => {
      const { status: ps } = await Location.requestForegroundPermissionsAsync();
      if (ps !== 'granted') { if (active) { setPermDenied(true); setLocLoading(false); } return; }

      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown && active) {
          const pt = { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
          setRiderPt(pt);
          latestPt.current = pt;
          setLocLoading(false);
          if (lastKnown.coords.heading != null && lastKnown.coords.heading >= 0) {
            setHeading(lastKnown.coords.heading);
            prevHeadingRef.current = lastKnown.coords.heading;
          }
        }
      } catch { }

      const loadingFallback = setTimeout(() => { if (active) setLocLoading(false); }, 2000);

      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        if (active) {
          const pt = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setRiderPt(pt);
          latestPt.current = pt;
          setLocLoading(false);
          if (pos.coords.heading != null && pos.coords.heading >= 0) {
            setHeading(pos.coords.heading);
            prevHeadingRef.current = pos.coords.heading;
          }
        }
      } catch { if (active) setLocLoading(false); }
      clearTimeout(loadingFallback);

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 2, timeInterval: 500 },
        loc => {
          if (!active) return;
          const pt = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setRiderPt(pt);
          latestPt.current = pt;

          const spd = loc.coords.speed || 0;
          const kmh = Math.max(0, Math.round(spd * 3.6));
          setSpeedKmh(kmh);

          let newHeading = prevHeadingRef.current;
          if (loc.coords.heading != null && loc.coords.heading >= 0) {
            const raw = loc.coords.heading;
            const delta = Math.abs(raw - prevHeadingRef.current);
            const normalizedDelta = delta > 180 ? 360 - delta : delta;
            if (normalizedDelta > 2) {
              prevHeadingRef.current = raw;
              newHeading = raw;
              setHeading(raw);
            }
          }

          if (isNavigatingRef.current) {
            const trimmed = trimRoute(pt, routeFullRef.current);
            setRouteRemain(trimmed);
          }

          updateCamera(pt, newHeading, kmh);
        }
      );
    };
    start();
    return () => {
      active = false;
      watchRef.current?.remove();
      if (cameraTimerRef.current) clearTimeout(cameraTimerRef.current);
    };
  }, [trimRoute, updateCamera]);

  useEffect(() => {
    if (isNavigating && riderPt) {
      lastCamPt.current = null;
      updateCamera(riderPt, heading, speedKmh);
    }
  }, [isNavigating]);

  useEffect(() => {
    if (!riderPt || !targetPt) { setRouteFull([]); setRouteRemain([]); setEta(null); setTurnInstr(''); return; }
    const now = Date.now();
    const moved = lastFetchPt.current ? haversineM(lastFetchPt.current, riderPt) : Infinity;
    const elapsed = now - lastFetchTime.current;
    if (moved < ROUTE_REFETCH_DISTANCE_M && elapsed < ROUTE_REFETCH_INTERVAL_MS) return;
    
    let active = true;
    const fetchDirs = async () => {
      try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${riderPt.latitude},${riderPt.longitude}&destination=${targetPt.latitude},${targetPt.longitude}&key=${GOOGLE_KEY}`);
        const json = await res.json();
        if (!active) return;
        const leg = json?.routes?.[0]?.legs?.[0];
        if (!leg) {
          setRouteFull([riderPt, targetPt]); setRouteRemain([riderPt, targetPt]);
          lastFetchPt.current = riderPt; lastFetchTime.current = Date.now(); return;
        }
        const steps = leg.steps || [];
        const allPts = [];
        for (const step of steps) {
          const enc = step?.polyline?.points;
          if (enc) allPts.push(...decodePoly(enc));
        }
        let decodedPts = sanitizePts(allPts);
        if (decodedPts.length < 2) {
          const overviewEnc = json?.routes?.[0]?.overview_polyline?.points;
          if (overviewEnc) decodedPts = sanitizePts(decodePoly(overviewEnc));
        }
        const safeDecoded = decodedPts.length > 1 ? decodedPts : [riderPt, targetPt];
        lastClosestIndexRef.current = 0;
        setRouteFull(safeDecoded);
        setRouteRemain(trimRoute(riderPt, safeDecoded));
        setEta({ dist: leg.distance?.text || '', dur: leg.duration?.text || '' });
        const firstStep = leg.steps?.[0]?.html_instructions;
        if (firstStep) setTurnInstr(stripHtml(firstStep));
        lastFetchPt.current = riderPt; lastFetchTime.current = Date.now();
      } catch {
        if (!active) return;
        setRouteFull([riderPt, targetPt]); setRouteRemain([riderPt, targetPt]);
      }
    };
    fetchDirs();
    return () => { active = false; };
  }, [riderPt, targetPt, trimRoute]);

  const toggleSheet = useCallback((forceExpand) => {
    const nextState = forceExpand !== undefined ? forceExpand : !sheetExpandedRef.current;
    sheetExpandedRef.current = nextState;
    setSheetExpanded(nextState);
    Animated.spring(sheetHeight, { toValue: nextState ? SHEET_MAX : SHEET_MIN, useNativeDriver: false }).start();
  }, [sheetHeight]);

  const sheetPR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderEnd: (_, g) => {
      if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
        toggleSheet();
        return;
      }
      if (g.dy < -30) { toggleSheet(true); }
      else if (g.dy > 30) { toggleSheet(false); }
    },
  })).current;

  const fitRoute = useCallback(() => {
    isNavigatingRef.current = false;
    setIsNavigating(false);
    const pts = routeFull.length > 1 ? routeFull : riderPt && targetPt ? [riderPt, targetPt] : null;
    if (!pts) return;
    mapRef.current?.fitToCoordinates(pts, {
      edgePadding: { top: 140, right: 60, bottom: SHEET_MIN + 60, left: 60 },
      animated: true,
    });
  }, [routeFull, riderPt, targetPt]);

  const resumeNavigation = useCallback(() => {
    isNavigatingRef.current = true;
    setIsNavigating(true);
  }, []);


  const initRegion = useMemo(
    () => riderPt
      ? { ...riderPt, latitudeDelta: 0.012, longitudeDelta: 0.012 }
      : targetPt
        ? { ...targetPt, latitudeDelta: 0.012, longitudeDelta: 0.012 }
        : INDIA,
    [riderPt, targetPt]
  );

  if (permDenied) return (
    <SafeAreaView style={ss.permWrap}>
      <Ionicons name="location-outline" size={52} color={ACCENT} />
      <Text style={ss.permTitle}>Location Required</Text>
      <Text style={ss.permSub}>We need GPS to navigate you.</Text>
      <Pressable style={ss.permBtn} onPress={() => Linking.openSettings()}><Text style={ss.permBtnTxt}>Open Settings</Text></Pressable>
      <Pressable onPress={() => router.back()}><Text style={{ color: '#666', marginTop: 12 }}>Go Back</Text></Pressable>
    </SafeAreaView>
  );

  return (
    <View style={ss.root}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initRegion}
        showsUserLocation={false}
        showsCompass={false}
        mapType="standard"
        mapPadding={{ top: 0, right: 0, bottom: Math.round(SH * 0.35), left: 0 }}
        onPanDrag={() => { if (isNavigatingRef.current) { isNavigatingRef.current = false; setIsNavigating(false); } }}
      >
        {routeFull.length > 1 && (
          <Polyline coordinates={routeFull} strokeColor={GREY_ROUTE} strokeWidth={7} lineCap="round" lineJoin="round" />
        )}
        {routeRemain.length > 1 && (
          <Polyline coordinates={routeRemain} strokeColor={ACCENT} strokeWidth={5} lineCap="round" lineJoin="round" />
        )}
        {riderPt && (
          <Marker coordinate={riderPt} anchor={{ x: 0.5, y: 0.5 }} flat>
            <RiderBeacon />
          </Marker>
        )}
        {targetPt && (
          <Marker coordinate={targetPt} anchor={{ x: 0.5, y: 1 }}>
            <TargetPin />
          </Marker>
        )}
      </MapView>

      {locLoading && (
        <View style={ss.loadOver}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={ss.loadTxt}>Getting your location…</Text>
        </View>
      )}

      <SafeAreaView style={ss.topBar} edges={['top']}>
        <Pressable style={ss.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={DARK} />
        </Pressable>
        <View style={ss.turnBannerWrap}>
          {turnInstr ? (
            <View style={ss.turnBanner}>
              <View style={ss.turnIconWrap}><Ionicons name="arrow-up" size={18} color={DARK} /></View>
              <Text style={ss.turnTxt} numberOfLines={2}>{turnInstr}</Text>
            </View>
          ) : (
            <View style={ss.turnBanner}>
              <View style={ss.turnIconWrap}><Ionicons name="navigate" size={16} color={DARK} /></View>
              <Text style={ss.turnTxt}>Navigating…</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {!isNavigating && (
        <TouchableOpacity style={[ss.resumeBtn, { bottom: SHEET_MIN + 90 }]} onPress={resumeNavigation} activeOpacity={0.9}>
          <Ionicons name="navigate" size={16} color={DARK} />
          <Text style={ss.resumeTxt}>Resume Navigation</Text>
        </TouchableOpacity>
      )}

      <Animated.View style={[ss.sheet, { height: sheetHeight, paddingBottom: 110 }]}>
        <View style={ss.sheetHandle} {...sheetPR.panHandlers}>
          <Ionicons name={sheetExpanded ? 'chevron-down' : 'chevron-up'} size={16} color="#888" style={{ marginBottom: 4 }} />
          <View style={ss.handleBar} />
        </View>

        {isDone ? (
          <View style={ss.doneBanner}>
            <Ionicons name="checkmark-circle" size={30} color="#22C55E" />
            <Text style={ss.doneTxt}>Delivered!</Text>
            <Pressable style={ss.doneBtn} onPress={() => router.back()}>
              <Text style={ss.doneBtnTxt}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <View style={ss.destRow}>
              <View style={[ss.destIcon, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="person-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ss.destName}>{customerName}</Text>
                <Text style={ss.destId}>Order {orderShort}</Text>
              </View>
              <View style={ss.phasePill}>
                <Text style={ss.phaseTxt}>DELIVERING</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16 }}>
              <PhaseStepper status={status} />

              <View style={ss.addrRow}>
                <Ionicons name="location" size={13} color={ACCENT} />
                <Text style={ss.addrTxt} numberOfLines={2}>{deliveryAddress}</Text>
              </View>

              <View style={[ss.hudBar, { position: 'relative', top: 0, left: 0, right: 0, marginTop: 16, marginBottom: 8 }]}>
                <View style={ss.hudCol}>
                  <Text style={ss.hudLabel}>ETA</Text>
                  <Text style={ss.hudValue}>{eta?.dur ?? '—'}</Text>
                </View>
                <View style={ss.hudDivider} />
                <View style={ss.hudCol}>
                  <Text style={ss.hudLabel}>DISTANCE</Text>
                  <Text style={ss.hudValue}>{eta?.dist ?? '—'}</Text>
                </View>
                <View style={ss.hudDivider} />
                <View style={ss.hudCol}>
                  <Text style={ss.hudLabel}>SPEED</Text>
                  <Text style={ss.hudValue}>{speedKmh} <Text style={ss.hudUnit}>km/h</Text></Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginVertical: 16, justifyContent: 'center' }}>
                <TouchableOpacity style={[ss.fab, { width: '30%' }]} onPress={() => { if(customerPhone) Linking.openURL(`tel:${customerPhone.replace(/\s+/g, '')}`) }} activeOpacity={0.85}>
                  <Ionicons name="call" size={20} color={ACCENT} />
                  <Text style={{color: ACCENT, fontSize: 10, marginTop: 4, fontWeight: '700'}}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[ss.fab, { width: '30%' }]} onPress={() => { if(customerPhone) Linking.openURL(`sms:${customerPhone}`) }} activeOpacity={0.85}>
                  <Ionicons name="chatbubble-ellipses" size={20} color={ACCENT} />
                  <Text style={{color: ACCENT, fontSize: 10, marginTop: 4, fontWeight: '700'}}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[ss.fab, { width: '30%' }]} onPress={fitRoute} activeOpacity={0.85}>
                  <Ionicons name="scan-outline" size={20} color="#aaa" />
                  <Text style={{color: '#aaa', fontSize: 10, marginTop: 4, fontWeight: '700'}}>Fit Route</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>


          </View>
        )}
      </Animated.View>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  permWrap: { flex: 1, backgroundColor: DARK, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  permTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center' },
  permSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  permBtn: { backgroundColor: ACCENT, borderRadius: 28, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  permBtnTxt: { color: DARK, fontWeight: '800', fontSize: 15 },
  loadOver: { ...StyleSheet.absoluteFillObject, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.strong },
  turnBannerWrap: { flex: 1 },
  turnBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(26,27,31,0.92)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(20, 184, 166,0.15)' },
  turnIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  turnTxt: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  hudBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,27,31,0.92)', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 6, borderWidth: 1, borderColor: 'rgba(20, 184, 166,0.18)', ...Shadows.strong },
  hudCol: { flex: 1, alignItems: 'center', gap: 2 },
  hudDivider: { width: 1, height: 32, backgroundColor: '#2e2f36' },
  hudLabel: { fontSize: 9, color: '#6B7280', fontWeight: '700', letterSpacing: 0.8 },
  hudValue: { fontSize: 15, color: ACCENT, fontWeight: '900' },
  hudUnit: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  fab: { width: 48, height: 48, borderRadius: 24, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2e2f36', ...Shadows.strong },
  resumeBtn: { position: 'absolute', alignSelf: 'center', zIndex: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ACCENT, borderRadius: 30, paddingHorizontal: 20, paddingVertical: 12, ...Shadows.strong },
  resumeTxt: { color: DARK, fontWeight: '900', fontSize: 14 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, backgroundColor: DARK, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingBottom: 4, paddingTop: 6, gap: 14, overflow: "hidden", shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, elevation: 12 },
  sheetHandle: { alignItems: 'center', paddingVertical: 8 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#3A3B42' },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  destIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  destName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  destId: { color: '#6B7280', fontSize: 11, fontWeight: '600', marginTop: 2 },
  phasePill: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1E1F25', borderRadius: 12, borderWidth: 1, borderColor: '#2e2f36' },
  phaseTxt: { fontSize: 10, fontWeight: '800', color: ACCENT, letterSpacing: 0.5 },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 },
  addrTxt: { flex: 1, color: '#9CA3AF', fontSize: 12, lineHeight: 18 },
  pickupConfirmBtn: { height: 58, borderRadius: 29, backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#115e59' },
  pickupConfirmTxt: { color: DARK, fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  doneBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0D1F0D', borderRadius: 20, padding: 16 },
  doneTxt: { flex: 1, fontSize: 17, fontWeight: '800', color: '#22C55E' },
  doneBtn: { backgroundColor: '#22C55E', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  doneBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
