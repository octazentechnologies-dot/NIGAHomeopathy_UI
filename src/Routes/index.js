import React from 'react';
import { Routes, Route, useLocation } from "react-router-dom";

//Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

//routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import { AuthProtected } from './AuthProtected';
import { AdminProtected } from './AdminProtected';
import { RoleProtected } from './RoleProtected';
import { isAdminRoutePath, isVelzonTemplatePath } from '../Components/constants/roles';
import { getLoggedinUser } from '../helpers/api_helper';
import { isSignedOut } from '../helpers/signedOutHistory';
import { isRegisteredAppPath } from '../helpers/menuDestination';
import { LANDING_PUBLIC_PATHS, LANDING_SPLAT_PATH } from '../constants/landingRoutes';
import PageNotAvailable from '../pages/Pages/PageNotAvailable';
import HomeoJobLanding from '../pages/Landing/HomeoJobLanding';

const pathPattern = (pattern) => {
    let path = String(pattern || "").trim();
    if (!path.startsWith("/")) path = `/${path}`;
    const body = path
        .split("/")
        .map((segment) => {
            if (!segment) return "";
            if (segment.startsWith(":")) return "[^/]+";
            return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("/");
    return new RegExp(`^${body}/?$`, "i");
};

const MARKETING_PATTERNS = LANDING_PUBLIC_PATHS.map(pathPattern);

/** Unknown clinic addresses stay signed in. The public site is only for real marketing pages. */
const LandingGate = () => {
    const { pathname } = useLocation();
    const signedIn = !isSignedOut() && !!getLoggedinUser()?.token;
    const marketing = MARKETING_PATTERNS.some((pattern) => pattern.test(pathname));
    if (signedIn && !marketing && !isRegisteredAppPath(pathname)) {
        return (
            <AuthProtected>
                <VerticalLayout>
                    <PageNotAvailable />
                </VerticalLayout>
            </AuthProtected>
        );
    }
    return <HomeoJobLanding />;
};

const Index = () => {
    return (
        <React.Fragment>
            <Routes>
                <Route>
                    {publicRoutes.map((route, idx) => (
                        <Route
                            path={route.path}
                            element={
                                <NonAuthLayout>
                                    {route.path === LANDING_SPLAT_PATH ? <LandingGate /> : route.component}
                                </NonAuthLayout>
                            }
                            key={idx}
                            exact={true}
                        />
                    ))}
                </Route>

                <Route>
                    {authProtectedRoutes
                    .filter((route) => {
                        // SEC-04.02 — keep Velzon demo URLs out of production unless explicitly enabled.
                        if (
                            isVelzonTemplatePath(route.path) &&
                            process.env.REACT_APP_SHOW_VELZON_DEMO !== "true"
                        ) {
                            return false;
                        }
                        return true;
                    })
                    .map((route, idx) => {
                        const requireAdmin =
                            route.requireAdmin === true || isAdminRoutePath(route.path);
                        const page = (
                            <VerticalLayout>{route.component}</VerticalLayout>
                        );
                        const roleGuarded = (
                            <RoleProtected allowedRoles={route.allowedRoles}>
                                {requireAdmin ? (
                                    <AdminProtected>{page}</AdminProtected>
                                ) : (
                                    page
                                )}
                            </RoleProtected>
                        );
                        return (
                            <Route
                                path={route.path}
                                element={
                                    <AuthProtected>
                                        {roleGuarded}
                                    </AuthProtected>
                                }
                                key={idx}
                                exact={true}
                            />
                        );
                    })}
                </Route>
            </Routes>
        </React.Fragment>
    );
};

export default Index;
