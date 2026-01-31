import { createContext, useContext, useEffect, useState } from "react";
import {
  clearAuth,
  getPermissions,
  getRoles,
  getToken,
  getUser,
  saveDashboard,
  savePermissions,
  saveRoles,
  saveToken,
  saveUser,
} from "../utils/secureStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------- SESSION HELPERS ----------------

  const saveSession = async ({ token, user }) => {
    await saveToken(token);
    await saveUser(user);
    await saveRoles(user.roles || []);
    await savePermissions(user.permissions || []);
    await saveDashboard(user.dashboard);

    setUser({
      ...user,
      roles: user.roles || [],
      permissions: user.permissions || [],
    });
  };

  const clearSession = async () => {
    await clearAuth();
    setUser(null);
  };

  // ---------------- LOGIN ----------------
  // used by LoginScreen
  const login = async ({ token, user }) => {
    await saveSession({ token, user });
  };

  // ---------------- LOGOUT ----------------

  const logout = async () => {
    await clearSession();
  };

  // ---------------- REHYDRATE SESSION ----------------

  const loadAuth = async () => {
    try {
      const token = await getToken();
      const storedUser = await getUser();

      if (!token || !storedUser) {
        setUser(null);
      } else {
        const roles = await getRoles();
        const permissions = await getPermissions();

        setUser({
          ...storedUser,
          roles,
          permissions,
        });
      }
    } catch (err) {
      await clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
