import * as Location from "expo-location";
import api from "../../../services/axios";

/* ================= RANGES ================= */

export const RANGE_TABS = [
  { key: "day", label: "Today", hint: "Daily calls" },
  { key: "week", label: "Week", hint: "Weekly calls" },
  { key: "month", label: "Month", hint: "Monthly calls" },
  { key: "custom", label: "Custom", hint: "Pick dates" },
];

export const STATUS_TABS = [
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

export const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

export const OUTCOMES = {
  COMPLETED: [
    { key: "MET", label: "Met the owner" },
    { key: "ORDER_PLACED", label: "Met + order placed" },
  ],
  INCOMPLETE: [
    { key: "SHOP_CLOSED", label: "Shop was closed" },
    { key: "OWNER_UNAVAILABLE", label: "Owner not available" },
    { key: "REFUSED", label: "Refused to meet" },
    { key: "WRONG_LOCATION", label: "Wrong / stale location" },
    { key: "OTHER", label: "Other reason" },
  ],
};

/* ================= FORMATTING ================= */

/** "YYYY-MM-DD" — what the API expects for a custom range. */
export const toYmd = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const prettyDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const prettyDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const prettyDistance = (meters) => {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
};

/** "Never met" / "12 days ago" — the number that decides who to visit next. */
export const sinceLabel = (date) => {
  if (!date) return "Never met";

  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

  if (days <= 0) return "Met today";
  if (days === 1) return "Met yesterday";
  if (days < 30) return `Met ${days} days ago`;

  const months = Math.floor(days / 30);
  return `Met ${months} month${months === 1 ? "" : "s"} ago`;
};

/* Landmark is deliberately left out — GPS cannot infer it and it is the one
   line that actually gets someone to the door, so the screens show it on its
   own rather than letting it get truncated inside the address. */
export const addressLine = (member) =>
  [member.address, member.city, member.pincode].filter(Boolean).join(", ");

export const landmarkLine = (member) =>
  member?.landmark ? `Near ${member.landmark}` : null;

/* ================= LOCATION ================= */

/** Current GPS fix, or null when permission is denied / the fix times out.
 *  Never throws — a missing fix must not block marking a meet. */
export const currentPosition = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  } catch {
    return null;
  }
};

/** Best-effort reverse geocode so the meet record carries a readable address. */
export const describePosition = async ({ latitude, longitude }) => {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) return null;

    return [place.name, place.street, place.city, place.postalCode]
      .filter(Boolean)
      .join(", ");
  } catch {
    return null;
  }
};

/* ================= API ================= */

const rangeParams = ({ range, customFrom, customTo }) =>
  range === "custom"
    ? { range, from: toYmd(customFrom), to: toYmd(customTo) }
    : { range };

export const fetchPlan = ({
  range,
  customFrom,
  customTo,
  status,
  search,
  route,
  marketingAgentId,
  page = 1,
  limit = 20,
}) =>
  api
    .get("/visits/plan", {
      params: {
        ...rangeParams({ range, customFrom, customTo }),
        status,
        page,
        limit,
        ...(search ? { search } : {}),
        ...(route
          ? {
              latitude: route.latitude,
              longitude: route.longitude,
              radiusKm: route.radiusKm,
            }
          : {}),
        ...(marketingAgentId && marketingAgentId !== "all"
          ? { marketingAgentId }
          : {}),
      },
    })
    .then((r) => r.data);

export const fetchRoutes = ({
  range,
  customFrom,
  customTo,
  marketingAgentId,
  search,
}) =>
  api
    .get("/visits/locations", {
      params: {
        ...rangeParams({ range, customFrom, customTo }),
        ...(search ? { search } : {}),
        ...(marketingAgentId && marketingAgentId !== "all"
          ? { marketingAgentId }
          : {}),
      },
    })
    .then((r) => r.data);

export const fetchTrack = (agentProfileId, { range = "month" } = {}) =>
  api
    .get(`/visits/member/${agentProfileId}`, { params: { range } })
    .then((r) => r.data?.data);

export const markVisit = (agentProfileId, body) =>
  api.post(`/visits/member/${agentProfileId}`, body).then((r) => r.data?.data);

export const undoVisit = (visitId) =>
  api.delete(`/visits/${visitId}`).then((r) => r.data);

export const fetchMarketingExecutives = () =>
  api.get("/admin/network/marketing-agents").then((r) => r.data?.data || []);

/** Shop fields that carry no file — landmark, shop name, frequency, address. */
export const updateShopDetails = (agentProfileId, body) =>
  api
    .patch(`/visits/member/${agentProfileId}/shop`, body)
    .then((r) => r.data?.data);

/** Multipart upload of the shop front photo captured at registration. */
export const uploadShopImage = (agentProfileId, { uri, shopName, latitude, longitude }) => {
  const form = new FormData();

  if (uri) {
    const name = uri.split("/").pop() || "shop.jpg";
    const ext = name.split(".").pop()?.toLowerCase() || "jpg";

    form.append("image", {
      uri,
      name,
      type: `image/${ext === "jpg" ? "jpeg" : ext}`,
    });
  }

  if (shopName) form.append("shopName", shopName);
  if (latitude != null) form.append("latitude", String(latitude));
  if (longitude != null) form.append("longitude", String(longitude));

  return api
    .patch(`/visits/member/${agentProfileId}/shop`, form)
    .then((r) => r.data?.data);
};
