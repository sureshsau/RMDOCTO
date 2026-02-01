"use client";

import { createContext, useContext, useState } from "react";
import api from "../services/axios.js";

const MedicineContext = createContext(null);

export const MedicineProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ---------------- ERROR HANDLER ----------------
  const handleError = (err, fallback) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      fallback;

    setError(message);
    return message;
  };

  // ---------------- ADD MEDICINE ----------------
  const addMedicine = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.post("/medicine", payload);

      return {
        success: true,
        data: res.data,
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(
          err,
          "Failed to add medicine"
        ),
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GET MEDICINES ----------------
  const getMedicines = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/medicine", {
        params,
      });

      return {
        success: true,
        data: res.data.data || [],
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(
          err,
          "Failed to load medicines"
        ),
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <MedicineContext.Provider
      value={{
        loading,
        error,

        addMedicine,
        getMedicines,
      }}
    >
      {children}
    </MedicineContext.Provider>
  );
};

export const useMedicine = () => {
  const ctx = useContext(MedicineContext);
  if (!ctx) {
    throw new Error(
      "useMedicine must be used inside MedicineProvider"
    );
  }
  return ctx;
};
