"use client";

import { createContext, useContext, useState } from "react";
import api from "../services/axios.js";

const RBACContext = createContext(null);

export const RBACProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ cached data
  const [roles, setRoles] = useState(null);
  const [permissions, setPermissions] = useState(null);

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
  const fetchPermissions = async (force = false) => {
    try {
      // ✅ return cached data
      if (permissions && !force) {
        return {
          success: true,
          data: permissions,
          cached: true,
        };
      }

      setLoading(true);
      setError(null);

      const res = await api.get("/permission");
      const data = res.data.permissions || {};

      setPermissions(data);

      return {
        success: true,
        data,
        cached: false,
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(err, "Failed to load permissions"),
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FETCH ROLES ----------------
  const fetchRoles = async (force = false) => {
    try {
      // ✅ return cached data
      if (roles && !force) {
        return {
          success: true,
          data: roles,
          cached: true,
        };
      }

      setLoading(true);
      setError(null);

      const res = await api.get("/roles");
      const data = res.data.data || [];

      setRoles(data);

      return {
        success: true,
        data,
        cached: false,
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(err, "Failed to load roles"),
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

      // ✅ update cache instead of refetch
      setRoles((prev) =>
        prev ? [...prev, res.data.data] : [res.data.data]
      );

      return {
        success: true,
        data: res.data.data,
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(err, "Role creation failed"),
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

        roles,
        permissions,

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
    throw new Error("useRBAC must be used inside RBACProvider");
  }
  return ctx;
};
