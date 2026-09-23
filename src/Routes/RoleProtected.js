import React from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "../Components/Hooks/UserHooks";
import { resolveUserRole } from "../Components/constants/roles";
import { getHomeDashboardPath } from "../helpers/dashboard_helper";

/**
 * FND-02.02 — Per-route ACL for NEW routes that declare allowedRoles.
 * Legacy Admin/Doctor/Reception routes without allowedRoles are unchanged.
 */
const RoleProtected = ({ allowedRoles, children }) => {
  const { userProfile, loading, token } = useProfile();

  if (!allowedRoles || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  if (loading && !token && !userProfile) {
    return null;
  }

  const role = resolveUserRole(userProfile);
  const allowed = allowedRoles.some(
    (r) => String(r).toLowerCase() === String(role || "").toLowerCase()
  );

  if (!allowed) {
    return <Navigate to={getHomeDashboardPath(role)} replace />;
  }

  return <>{children}</>;
};

export { RoleProtected };
