"use client";

import { createContext, useContext, useState } from "react";
import api from "../services/axios.js";

const RBACContext = createContext(null);

export const RBACProvider = ({ children }) => {
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

  // ---------------- FETCH PERMISSIONS ----------------
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/permission");

      return {
        success: true,
        data: res.data.permissions || {},
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(
          err,
          "Failed to load permissions"
        ),
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FETCH ROLES ----------------
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/roles");

      return {
        success: true,
        data: res.data.data || [],
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(
          err,
          "Failed to load roles"
        ),
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CREATE ROLE ----------------
  const createRole = async ({ key, name, permissions }) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.post("/roles", {
        key,
        name,
        permissions,
      });

      return {
        success: true,
        data: res.data.data,
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(
          err,
          "Role creation failed"
        ),
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <RBACContext.Provider
      value={{
        loading,
        error,

        fetchRoles,
        fetchPermissions,
        createRole,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = () => {
  const ctx = useContext(RBACContext);
  if (!ctx) {
    throw new Error(
      "useRBAC must be used inside RBACProvider"
    );
  }
  return ctx;
};
