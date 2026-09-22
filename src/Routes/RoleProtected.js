import React from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "../Components/Hooks/UserHooks";
import { resolveUserRole, isTufanPrivilegedDoctor, ADMIN_PORTAL_ROLES, PATIENT_APP_ROUTE_ROLES, ACCOUNT_ROUTE_ROLES, PHARMACY_ROUTE_ROLES } from "../Components/constants/roles";
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
  let allowed = allowedRoles.some(
    (r) => String(r).toLowerCase() === String(role || "").toLowerCase()
  );

  if (!allowed && isTufanPrivilegedDoctor(userProfile)) {
    allowed = allowedRoles.some((r) => {
      const name = String(r || "").toLowerCase();
      return (
        ADMIN_PORTAL_ROLES.some((a) => a.toLowerCase() === name) ||
        PATIENT_APP_ROUTE_ROLES.some((a) => a.toLowerCase() === name) ||
        ACCOUNT_ROUTE_ROLES.some((a) => a.toLowerCase() === name) ||
        PHARMACY_ROUTE_ROLES.some((a) => a.toLowerCase() === name)
      );
    });
  }

  if (!allowed) {
    return <Navigate to={getHomeDashboardPath(role)} replace />;
  }

  return <>{children}</>;
};

export { RoleProtected };
