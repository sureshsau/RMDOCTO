"use client";

import { createContext, useContext, useState } from "react";
import api from "../services/axios";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [riders,setRiders]=useState([]);

  const handleError = (err, fallback) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      fallback;

    setError(message);
    return message;
  };

  // ---------------- CREATE USER ----------------
  const createUser = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.post("/user", payload);

      return {
        success: true,
        data: res.data.data,
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(err, "Failed to create user"),
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GET USERS ----------------
  const getUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/user");

      return {
        success: true,
        data: res.data.data || [],
      };
    } catch (err) {
      return {
        success: false,
        error: handleError(err, "Failed to load users"),
      };
    } finally {
      setLoading(false);
    }
  };
  // ---------------- GET RM RIDERS ----------------
const getRMRiders = async () => {
  try {
    setLoading(true);
    setError(null);

    const res = await api.get("/user/rmriders");
    console.log(res.data.data);
    setRiders()
    return {
      success: true,
      data: res.data.data || [],
    };
  } catch (err) {
    return {
      success: false,
      error: handleError(err, "Failed to load riders"),
    };
  } finally {
    setLoading(false);
  }
};
  return (
    <UserContext.Provider
      value={{
    loading,
    error,
    createUser,
    getUsers,
    getRMRiders, 
  }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used inside UserProvider");
  }
  return ctx;
};
