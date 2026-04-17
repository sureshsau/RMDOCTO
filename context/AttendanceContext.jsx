import { createContext, useCallback, useContext, useState } from "react";
import api from "../services/axios.js";

const AttendanceContext = createContext(null);

export const AttendanceProvider = ({ children }) => {
  const [todayRecord, setTodayRecord]   = useState(null);
  const [history, setHistory]           = useState([]);
  const [summary, setSummary]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]               = useState(null);

  /* -------- helpers -------- */
  const handleError = (err, fallback) => {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      fallback;
    setError(msg);
    return msg;
  };

  /* -------- FETCH TODAY -------- */
  const fetchToday = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/attendance/today");
      setTodayRecord(res.data.data || null);
      return { success: true, data: res.data.data };
    } catch (err) {
      // 404 means no record yet – that's fine
      if (err?.response?.status === 404) {
        setTodayRecord(null);
        return { success: true, data: null };
      }
      return { success: false, error: handleError(err, "Failed to load today's attendance") };
    } finally {
      setLoading(false);
    }
  }, []);

  /* -------- CLOCK IN -------- */
  const clockIn = useCallback(async (note = "") => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.post("/attendance/clockin", { note });
      setTodayRecord(res.data.data);
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, error: handleError(err, "Clock-in failed") };
    } finally {
      setActionLoading(false);
    }
  }, []);

  /* -------- CLOCK OUT -------- */
  const clockOut = useCallback(async (note = "") => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.post("/attendance/clockout", { note });
      setTodayRecord(res.data.data);
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, error: handleError(err, "Clock-out failed") };
    } finally {
      setActionLoading(false);
    }
  }, []);

  /* -------- FETCH HISTORY -------- */
  const fetchHistory = useCallback(async ({ month, year } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const now = new Date();
      const m = month ?? now.getMonth() + 1;
      const y = year  ?? now.getFullYear();
      const res = await api.get(`/attendance/history?month=${m}&year=${y}`);
      const records = res.data.data || [];
      setHistory(records);
      return { success: true, data: records };
    } catch (err) {
      return { success: false, error: handleError(err, "Failed to load attendance history") };
    } finally {
      setLoading(false);
    }
  }, []);

  /* -------- FETCH MONTHLY SUMMARY -------- */
  const fetchSummary = useCallback(async ({ month, year } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const now = new Date();
      const m = month ?? now.getMonth() + 1;
      const y = year  ?? now.getFullYear();
      const res = await api.get(`/attendance/summary?month=${m}&year=${y}`);
      setSummary(res.data.data || null);
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, error: handleError(err, "Failed to load summary") };
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AttendanceContext.Provider
      value={{
        todayRecord,
        history,
        summary,
        loading,
        actionLoading,
        error,
        fetchToday,
        clockIn,
        clockOut,
        fetchHistory,
        fetchSummary,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used inside AttendanceProvider");
  return ctx;
};
