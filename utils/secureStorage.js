import * as SecureStore from "expo-secure-store";
import { SECURE_KEYS } from "./secureKeys";

export const saveToken = (token) =>
  SecureStore.setItemAsync(SECURE_KEYS.TOKEN, token);

export const getToken = () =>
  SecureStore.getItemAsync(SECURE_KEYS.TOKEN);

export const saveUser = (user) =>
  SecureStore.setItemAsync(
    SECURE_KEYS.USER,
    JSON.stringify(user)
  );

export const getUser = async () => {
  const data = await SecureStore.getItemAsync(SECURE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const saveRoles = (roles = []) =>
  SecureStore.setItemAsync(
    SECURE_KEYS.ROLES,
    JSON.stringify(roles)
  );

export const getRoles = async () => {
  const data = await SecureStore.getItemAsync(SECURE_KEYS.ROLES);
  return data ? JSON.parse(data) : [];
};

export const savePermissions = (permissions = []) =>
  SecureStore.setItemAsync(
    SECURE_KEYS.PERMISSIONS,
    JSON.stringify(permissions)
  );

export const getPermissions = async () => {
  const data = await SecureStore.getItemAsync(SECURE_KEYS.PERMISSIONS);
  return data ? JSON.parse(data) : [];
};

export const saveDashboard = (dashboard) =>
  dashboard
    ? SecureStore.setItemAsync(SECURE_KEYS.DASHBOARD, dashboard)
    : Promise.resolve();

export const clearAuth = () =>
  Promise.all([
    SecureStore.deleteItemAsync(SECURE_KEYS.TOKEN),
    SecureStore.deleteItemAsync(SECURE_KEYS.USER),
    SecureStore.deleteItemAsync(SECURE_KEYS.ROLES),
    SecureStore.deleteItemAsync(SECURE_KEYS.PERMISSIONS),
    SecureStore.deleteItemAsync(SECURE_KEYS.DASHBOARD),
  ]);
