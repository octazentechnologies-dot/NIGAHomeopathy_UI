import React from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "../Components/Hooks/UserHooks";
import {
  canAccessAdminPortal,
  resolveUserRole,
} from "../Components/constants/roles";
import { getHomeDashboardPath } from "../helpers/dashboard_helper";

/**
 * M02 W0 — Blocks Doctor/Reception (and other non-admin roles) from Admin Portal routes.
 * Wrap inside AuthProtected. Allowed: Admin, Management, RoleId 1.
 */
const AdminProtected = ({ children }) => {
  const { userProfile, loading, token } = useProfile();

  if (loading && !token) {
    return null;
  }

  if (!canAccessAdminPortal(userProfile)) {
    const role = resolveUserRole(userProfile);
    return (
      <Navigate
        to={getHomeDashboardPath(role)}
        replace
        state={{ reason: "admin-acl-denied" }}
      />
    );
  }

  return <>{children}</>;
};

export { AdminProtected };
