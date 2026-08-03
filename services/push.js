import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import api from "./axios";

/* Must match ANDROID_CHANNEL_ID in the backend push.service.js — if the channel
   the server names does not exist on the device, Android drops the heads-up
   banner silently. */
export const ANDROID_CHANNEL_ID = "rmdocto-default";

/**
 * How a notification behaves when it arrives while the app is open and in the
 * foreground. Android/iOS handle the background and closed cases themselves.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Android requires a channel before any notification can be displayed.
 * Creating one that already exists is a no-op, so this is safe to call often.
 */
export const ensureAndroidChannel = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "RMDOCTO Alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#6b6dbf",
    sound: "default",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

/**
 * Ask for notification permission if we do not already have it.
 * Returns true when notifications are allowed.
 */
export const requestPushPermission = async () => {
  const { status: existing } = await Notifications.getPermissionsAsync();

  if (existing === "granted") return true;

  // Only prompt when we have not been permanently denied — re-asking after a
  // hard "no" does nothing on Android 13+ and just returns denied.
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
};

/**
 * Get the native FCM registration token for this device install.
 *
 * Deliberately uses getDevicePushTokenAsync (raw FCM) rather than
 * getExpoPushTokenAsync, because the backend talks to Firebase directly
 * through firebase-admin.
 *
 * Returns null when push is unavailable — simulator, permission denied, or a
 * build without google-services.json — never throws.
 */
export const getFcmToken = async () => {
  try {
    // Push tokens are not issued to simulators/emulators without Play Services.
    if (!Device.isDevice) {
      console.log("PUSH: skipped — not a physical device");
      return null;
    }

    const granted = await requestPushPermission();
    if (!granted) {
      console.log("PUSH: permission not granted");
      return null;
    }

    await ensureAndroidChannel();

    const devicePushToken = await Notifications.getDevicePushTokenAsync();

    return {
      token: devicePushToken.data,
      platform: Platform.OS,
    };
  } catch (err) {
    // A missing google-services.json throws here. Push stays off; the in-app
    // inbox is unaffected.
    console.log("PUSH: could not get FCM token —", err?.message);
    return null;
  }
};

/* ================= BACKEND REGISTRY ================= */

export const registerDeviceWithBackend = async () => {
  const result = await getFcmToken();
  if (!result) return null;

  try {
    await api.post("/notifications/device-token", {
      token: result.token,
      platform: result.platform,
    });

    return result.token;
  } catch (err) {
    console.log("PUSH: failed to register device —", err?.message);
    return null;
  }
};

/**
 * Detach this device from the account being logged out of, so the next person
 * to use the phone does not receive the previous user's notifications.
 * Must be called while the auth token is still valid.
 */
export const unregisterDeviceWithBackend = async (token) => {
  const deviceToken = token || (await getFcmToken())?.token;
  if (!deviceToken) return;

  try {
    await api.delete("/notifications/device-token", {
      data: { token: deviceToken },
    });
  } catch (err) {
    console.log("PUSH: failed to unregister device —", err?.message);
  }
};

/* ================= BADGE ================= */

export const setAppBadgeCount = async (count) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Badge counts are unsupported on some Android launchers — non-fatal.
  }
};
