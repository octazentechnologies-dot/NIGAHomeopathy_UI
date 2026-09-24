import React, { useEffect } from "react";
import { Route, useLocation } from "react-router-dom";
import { setAuthorization, getLoggedinUser } from "../helpers/api_helper";
import { bootToLoginIfSignedOut, isSignedOut } from "../helpers/signedOutHistory";

const AuthProtected = (props) => {
  const location = useLocation();
  const sessionUser = getLoggedinUser();
  const token = sessionUser?.token;
  const signedOut = isSignedOut();

  useEffect(() => {
    const ensureSignedIn = () => {
      if (isSignedOut() || !getLoggedinUser()?.token) {
        bootToLoginIfSignedOut();
        window.location.replace("/login");
        return;
      }
      setAuthorization(getLoggedinUser().token);
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
  }, [location.pathname]);

  if (!token || signedOut) {
    bootToLoginIfSignedOut();
    window.location.replace("/login");
    return null;
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
