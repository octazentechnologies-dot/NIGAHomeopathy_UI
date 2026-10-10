import React, { useCallback, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

/**
 * Route parameters (patientId, caseId, patientAppId, ...) travel in history state
 * instead of the address bar. History state survives a page refresh in the same tab,
 * but not a link opened in a new tab.
 */
const STATE_KEY = "routeParams";

export const toHiddenLocation = (to) => {
  const raw = String(to || "");
  if (!raw.startsWith("/")) {
    return { to: raw, state: undefined };
  }
  const url = new URL(raw, window.location.origin);
  const pairs = [...url.searchParams.entries()];
  return {
    to: { pathname: url.pathname, hash: url.hash },
    state: pairs.length ? { [STATE_KEY]: pairs } : undefined,
  };
};

export const navigateHidden = (navigate, to, options = {}) => {
  const hidden = toHiddenLocation(to);
  const state = hidden.state || options.state ? { ...(options.state || {}), ...(hidden.state || {}) } : undefined;
  navigate(hidden.to, { ...options, state });
};

export const useHiddenNavigate = () => {
  const navigate = useNavigate();
  return useCallback((to, options) => navigateHidden(navigate, to, options), [navigate]);
};

export const HiddenLink = React.forwardRef(({ to, state, ...rest }, ref) => {
  const hidden = toHiddenLocation(to);
  const mergedState = hidden.state || state ? { ...(state || {}), ...(hidden.state || {}) } : undefined;
  return <Link ref={ref} {...rest} to={hidden.to} state={mergedState} />;
});
HiddenLink.displayName = "HiddenLink";

/**
 * Drop-in for useSearchParams(). A query that still arrives in the address bar
 * (old bookmark, server path, new tab) is moved into history state on first render.
 */
export const useHiddenSearchParams = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const statePairs = location.state?.[STATE_KEY];

  const params = useMemo(() => {
    if (location.search) return new URLSearchParams(location.search);
    return new URLSearchParams(Array.isArray(statePairs) ? statePairs : []);
  }, [location.search, statePairs]);

  useEffect(() => {
    if (!location.search) return;
    navigate(
      { pathname: location.pathname, hash: location.hash },
      { replace: true, state: { ...(location.state || {}), [STATE_KEY]: [...params.entries()] } }
    );
  }, [location, navigate, params]);

  const setParams = useCallback(
    (next, options = {}) => {
      const resolved = typeof next === "function" ? next(params) : next;
      navigate(
        { pathname: location.pathname, hash: location.hash },
        {
          replace: Boolean(options.replace),
          state: { ...(location.state || {}), [STATE_KEY]: [...new URLSearchParams(resolved).entries()] },
        }
      );
    },
    [location, navigate, params]
  );

  return [params, setParams];
};
