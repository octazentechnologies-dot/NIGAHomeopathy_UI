import React from "react";
import { Navigate } from "react-router-dom";
import { getHomeDashboardPath } from "../../helpers/dashboard_helper";

const RoleBasedHomeRedirect = () => <Navigate to={getHomeDashboardPath()} replace />;

export default RoleBasedHomeRedirect;
