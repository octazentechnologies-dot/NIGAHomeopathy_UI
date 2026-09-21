import React from 'react';
import { Routes, Route } from "react-router-dom";

//Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

//routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import { AuthProtected } from './AuthProtected';
import { AdminProtected } from './AdminProtected';
import { RoleProtected } from './RoleProtected';
import { isAdminRoutePath } from '../Components/constants/roles';

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
                                    {route.component}
                                </NonAuthLayout>
                            }
                            key={idx}
                            exact={true}
                        />
                    ))}
                </Route>

                <Route>
                    {authProtectedRoutes.map((route, idx) => {
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
