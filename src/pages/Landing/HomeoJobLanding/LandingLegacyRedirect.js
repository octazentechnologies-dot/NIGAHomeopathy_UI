import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { legacyLandingTarget } from "../../../constants/landingRoutes";

const LandingLegacyRedirect = () => {
    const location = useLocation();
    const target = legacyLandingTarget(location.pathname, location.search, location.hash);

    if (target) {
        return <Navigate to={target} replace />;
    }

    return <Navigate to="/" replace />;
};

export default LandingLegacyRedirect;
