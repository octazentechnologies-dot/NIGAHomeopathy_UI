import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { legacyLandingTarget } from "../../../constants/landingRoutes";

const MinimalthemeLegacyRedirect = () => {
    const location = useLocation();
    const target = legacyLandingTarget(location.pathname, location.search, location.hash);

    if (!target) {
        return <Navigate to="/" replace />;
    }

    return <Navigate to={target} replace />;
};

export default MinimalthemeLegacyRedirect;
