import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import api from "../services/axios";
import { registerDeviceWithBackend, setAppBadgeCount } from "../services/push";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

/* How often the unread badge re-checks with the server while the app is open. */
const POLL_INTERVAL_MS = 60_000;

const PAGE_SIZE = 20;

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const pageRef = useRef(1);

  // Guards the cold-start notification replay so it happens at most once per
  // app launch, not once per login.
  const coldStartHandledRef = useRef(false);

  // Mirror of `notifications` so callbacks can read the current list
  // synchronously without taking it as a dependency.
  const notificationsRef = useRef([]);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const handleError = (err, fallback) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      fallback;

    setError(message);
    return message;
  };

  /* ---------------- UNREAD BADGE ---------------- */

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      // A failed badge poll is not worth surfacing to the user — the count
      // simply stays at its last known value until the next tick.
    }
  }, [isAuthenticated]);

  /* ---------------- LIST ---------------- */

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return { success: false };

    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/notifications", {
        params: { page: 1, limit: PAGE_SIZE },
      });

      const items = res.data?.data || [];
      pageRef.current = 1;

      setNotifications(items);
      setUnreadCount(res.data?.unreadCount || 0);
      setHasMore(items.length < (res.data?.total || 0));

      return { success: true, data: items };
    } catch (err) {
      return { success: false, error: handleError(err, "Failed to load notifications") };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadMore = useCallback(async () => {
    if (!isAuthenticated || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);

      const nextPage = pageRef.current + 1;
      const res = await api.get("/notifications", {
        params: { page: nextPage, limit: PAGE_SIZE },
      });

      const items = res.data?.data || [];
      pageRef.current = nextPage;

      const total = res.data?.total || 0;
      setNotifications((prev) => [...prev, ...items]);
      setHasMore(nextPage * PAGE_SIZE < total);
    } catch (err) {
      handleError(err, "Failed to load more notifications");
    } finally {
      setLoadingMore(false);
    }
  }, [isAuthenticated, loadingMore, hasMore]);

  /* ---------------- MARK READ ---------------- */

  const markAsRead = useCallback(async (id) => {
    // Optimistic: flip locally first so the row responds instantly, then
    // reconcile the badge from the server response.
    // Read the current value off the ref: a state updater runs asynchronously,
    // so deciding the badge delta inside one would race with this function.
    const target = notificationsRef.current.find((n) => n._id === id);
    const wasUnread = !!target && !target.isRead;

    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );

    if (wasUnread) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    try {
      await api.patch(`/notifications/${id}/read`);
      return { success: true };
    } catch (err) {
      // Roll the optimistic change back on failure.
      if (wasUnread) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: false } : n))
        );
        setUnreadCount((c) => c + 1);
      }

      return { success: false, error: handleError(err, "Failed to mark as read") };
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      return { success: true };
    } catch (err) {
      return { success: false, error: handleError(err, "Failed to mark all as read") };
    }
  }, []);

  /* ---------------- DELETE ---------------- */

  const deleteNotification = useCallback(
    async (id) => {
      try {
        await api.delete(`/notifications/${id}`);

        setNotifications((prev) => prev.filter((n) => n._id !== id));

        // Deleting an unread notification also drops it from the badge. Re-read
        // the count from the server rather than guessing at the delta.
        refreshUnreadCount();

        return { success: true };
      } catch (err) {
        return { success: false, error: handleError(err, "Failed to delete notification") };
      }
    },
    [refreshUnreadCount]
  );

  /* ---------------- ADMIN: SEND ---------------- */

  /**
   * payload: { title, message, severity, audience: "ALL"|"ROLES"|"USERS",
   *            roles?: string[], userIds?: string[] }
   */
  const sendNotification = useCallback(async (payload) => {
    try {
      const res = await api.post("/notifications/send", payload);

      return {
        success: true,
        message: res.data?.message,
        recipientCount: res.data?.recipientCount || 0,
        data: res.data?.data,
      };
    } catch (err) {
      return { success: false, error: handleError(err, "Failed to send notification") };
    }
  }, []);

  const getSentNotifications = useCallback(async (page = 1) => {
    try {
      const res = await api.get("/notifications/sent", {
        params: { page, limit: PAGE_SIZE },
      });

      return { success: true, data: res.data?.data || [], total: res.data?.total || 0 };
    } catch (err) {
      return { success: false, error: handleError(err, "Failed to load sent notifications") };
    }
  }, []);

  /* ---------------- POLLING ---------------- */

  useEffect(() => {
    if (!isAuthenticated) {
      // Logged out — drop anything belonging to the previous session.
      setNotifications([]);
      setUnreadCount(0);
      pageRef.current = 1;
      return;
    }

    refreshUnreadCount();

    const timer = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);

    // A user coming back to the app expects a current badge immediately rather
    // than waiting out the rest of the poll interval.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshUnreadCount();
    });

    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [isAuthenticated, refreshUnreadCount]);

  /* ---------------- FCM DEVICE REGISTRATION ---------------- */

  useEffect(() => {
    if (!isAuthenticated) return;

    // Re-registering on every login is intentional: FCM rotates tokens, and the
    // backend detaches the token from any previous account before attaching it
    // here — that is what stops a shared phone leaking the last user's alerts.
    registerDeviceWithBackend();
  }, [isAuthenticated]);

  /* ---------------- PUSH LISTENERS ---------------- */

  useEffect(() => {
    if (!isAuthenticated) return;

    // Arrives while the app is open/foregrounded.
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      refreshUnreadCount();
    });

    // User tapped the banner — from foreground, background, or a cold start.
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        refreshUnreadCount();

        const route = response?.notification?.request?.content?.data?.route;
        router.push(route || "/notifications");
      }
    );

    // A tap that launched the app from fully closed is already consumed by the
    // time the listener above mounts, so replay it once here. The ref guard
    // matters: the stored response survives a logout, and without it the next
    // login would yank the user to a screen they never asked for.
    let cancelled = false;

    if (!coldStartHandledRef.current) {
      coldStartHandledRef.current = true;

      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (cancelled || !response) return;

        const route = response?.notification?.request?.content?.data?.route;
        router.push(route || "/notifications");
      });
    }

    return () => {
      cancelled = true;
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isAuthenticated, refreshUnreadCount]);

  /* ---------------- APP ICON BADGE ---------------- */

  useEffect(() => {
    setAppBadgeCount(unreadCount);
  }, [unreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        error,
        fetchNotifications,
        loadMore,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        sendNotification,
        getSentNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return ctx;
};
