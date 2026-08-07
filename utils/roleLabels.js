/**
 * Display names for role / dashboard keys.
 *
 * The keys are what the API, the route guards and every stored user document
 * use — they must never change. Only what a person reads changes here, so
 * this is the one place to edit when a role is renamed.
 */
export const ROLE_LABELS = {
  admin: "Admin",
  subadmin: "Sub Admin",
  doctor: "Doctor",
  employee: "Employee",
  receptionist: "Receptionist",
  rmrider: "RM Rider",
  agent: "RM Member",
  marketing_agent: "Marketing Executive",
  user: "Customer",
};

/**
 * "marketing_agent" -> "Marketing Executive".
 * An unmapped key degrades to Title Case rather than showing a raw key.
 */
export const roleLabel = (key, fallback = "User") => {
  if (!key) return fallback;

  return (
    ROLE_LABELS[key] ||
    String(key)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

/** Dashboard values reuse the role keys. */
export const dashboardLabel = (key, fallback = "User") =>
  roleLabel(key, fallback);
