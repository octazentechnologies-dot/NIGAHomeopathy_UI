import React, { useEffect } from "react";
import { Navigate, Route, useLocation, useNavigate } from "react-router-dom";
import { setAuthorization, getLoggedinUser } from "../helpers/api_helper";

const AuthProtected = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionUser = getLoggedinUser();
  const token = sessionUser?.token;

  useEffect(() => {
    const ensureSignedIn = () => {
      const user = getLoggedinUser();
      if (!user?.token) {
        navigate("/login", { replace: true });
        return;
      }
      setAuthorization(user.token);
    };

    ensureSignedIn();
    window.addEventListener("popstate", ensureSignedIn);
    window.addEventListener("focus", ensureSignedIn);
    window.addEventListener("pageshow", ensureSignedIn);
    return () => {
      window.removeEventListener("popstate", ensureSignedIn);
      window.removeEventListener("focus", ensureSignedIn);
      window.removeEventListener("pageshow", ensureSignedIn);
    };
  }, [navigate, location.pathname]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  setAuthorization(token);
  return <>{props.children}</>;
};

const AccessRoute = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props => {
        return (<> <Component {...props} /> </>);
      }}
    />
  );
};

export { AuthProtected, AccessRoute };
