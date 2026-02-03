"use client";

import { createContext, useContext, useState } from "react";
import api from "../services/axios.js";

const MedicineContext = createContext(null);

export const MedicineProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔍 SEARCH STATE
  const [searchQuery, setSearchQuery] = useState("");

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

      const res = await api.post("/medicines", payload);

      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        error: handleError(err, "Failed to add medicine"),
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GET MEDICINES ----------------
  const getMedicines = async ({
    page = 1,
    limit = 10,
    search = "",
    dosageForm = "",
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(dosageForm && { dosageForm }),
      }).toString();

      const res = await api.get(`/medicines?${query}`);

      return {
        success: true,
        data: res.data.data || [],
        pagination: res.data.pagination,
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(err, "Failed to load medicines"),
      };
    } finally {
      setLoading(false);
    }
  };

  // 🔥 SEARCH MEDICINES (WRAPPER)
  const searchMedicines = async ({
    page = 1,
    limit = 10,
  } = {}) => {
    return getMedicines({
      page,
      limit,
      search: searchQuery,
    });
  };

  // ---------------- GET BY ID ----------------
  const getMedicineById = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/medicines/${id}`);

      return { success: true, data: res.data.data };
    } catch (err) {
      return {
        success: false,
        error: handleError(err, "Failed to load medicine details"),
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DELETE ----------------
  const deleteMedicine = async (medicineId) => {
    try {
      setLoading(true);
      setError(null);

      await api.delete(`/medicines/${medicineId}`);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: handleError(err, "Failed to delete medicine"),
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

        // CRUD
        addMedicine,
        deleteMedicine,
        getMedicines,
        getMedicineById,

        // 🔍 SEARCH
        searchQuery,
        setSearchQuery,
        searchMedicines,
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
