const SIGNED_OUT_KEY = "hcSignedOut";
const LOGIN_PATH = "/login";
const TRAP_DEPTH = 40;

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/activate",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/find-doctor",
  "/book",
  "/privacy",
  "/terms",
  "/landing",
  "/pricing",
  "/about",
  "/contact",
  "/blog",
  "/news",
  "/features",
  "/account",
];

export const markSignedOut = () => {
  window.__hcSignedOut = true;
  window.__hcLoginSealed = false;
  try {
    sessionStorage.setItem(SIGNED_OUT_KEY, "1");
    sessionStorage.removeItem("authUser");
  } catch (e) {
    /* storage can be blocked */
  }
};

export const clearSignedOut = () => {
  window.__hcSignedOut = false;
  window.__hcLoginSealed = false;
  try {
    sessionStorage.removeItem(SIGNED_OUT_KEY);
  } catch (e) {
    /* storage can be blocked */
  }
};

export const isSignedOut = () => {
  if (window.__hcSignedOut === true) return true;
  try {
    return sessionStorage.getItem(SIGNED_OUT_KEY) === "1";
  } catch (e) {
    return false;
  }
};

export const isPublicPath = (pathname) => {
  const path = String(pathname || "/").toLowerCase();
  if (path === "/" || path === "") return true;
  return PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
};

const hideClinicPage = () => {
  window.__hcSignedOut = true;
  try {
    sessionStorage.removeItem("authUser");
    document.documentElement.style.visibility = "hidden";
    if (document.body) document.body.textContent = "";
  } catch (e) {
    /* page is already going away */
  }
};

export const mustLeaveClinic = () => {
  if (!isSignedOut()) return false;
  return !isPublicPath(window.location.pathname);
};

export const bootToLoginIfSignedOut = () => {
  if (!mustLeaveClinic()) return false;
  hideClinicPage();
  window.location.replace(LOGIN_PATH);
  return true;
};

const pushLoginTrap = () => {
  try {
    window.history.pushState({ hcSignedOut: true }, "", LOGIN_PATH);
  } catch (e) {
    /* history can reject pushState */
  }
};

const sealLoginStack = () => {
  for (let i = 0; i < TRAP_DEPTH; i += 1) {
    pushLoginTrap();
  }
};

/**
 * After logout the browser cannot hide its back arrow, but every back press
 * is forced to stay on sign-in. Clinic history behind login is never shown.
 */
export const holdLoginAgainstBack = () => {
  if (!isSignedOut()) return undefined;

  const hold = () => {
    if (!isSignedOut()) return;

    if (window.location.pathname !== LOGIN_PATH) {
      hideClinicPage();
      window.location.replace(LOGIN_PATH);
      return;
    }

    // Absorb this back and rebuild the buffer so another click cannot escape.
    pushLoginTrap();
    pushLoginTrap();
    pushLoginTrap();
  };

  if (!window.__hcLoginSealed) {
    window.__hcLoginSealed = true;
    sealLoginStack();
  }

  window.addEventListener("popstate", hold);
  return () => window.removeEventListener("popstate", hold);
};
