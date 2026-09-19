/**
 * ADM-B04.03 — Map New-API GetMenuByRole MenuMaster rows to SPA nav items.
 * Seed URLs from M02 W7 may differ from CRA routes; normalize those here.
 */
const SEED_URL_TO_SPA = {
  "/account/home": "/accountdashboard",
  "/account/earnings": "/account/doctor-earnings",
  "/pharmacy/home": "/pharmacydashboard",
};

export const getAuthUserId = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("authUser") || "null");
    const raw =
      user?.userId ??
      user?.UserId ??
      user?.data?.userId ??
      user?.data?.UserId;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : 0;
  } catch {
    return 0;
  }
};

export const unwrapApiList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.Data)) return raw.Data;
  if (Array.isArray(raw.resultObject)) return raw.resultObject;
  if (Array.isArray(raw.ResultObject)) return raw.ResultObject;
  return [];
};

export const normalizeMenuUrl = (url) => {
  if (!url || typeof url !== "string") return "/#";
  const path = url.startsWith("/") ? url : `/${url}`;
  return SEED_URL_TO_SPA[path] || path;
};

export const mapMenuMasterToNavItems = (rows) =>
  unwrapApiList(rows)
    .map((menu) => {
      const menuId = menu.menuId ?? menu.MenuId;
      const label = menu.menuName ?? menu.MenuName;
      const icon = (menu.menuIcon ?? menu.MenuIcon) || "ri-menu-line";
      const link = normalizeMenuUrl(menu.menuUrl ?? menu.MenuUrl);
      if (!label) return null;
      return {
        id: menuId != null ? `menu-${menuId}` : `menu-${label}`,
        label,
        icon,
        link,
      };
    })
    .filter(Boolean);

export const PATIENT_FALLBACK_MENU = [
  { id: "family", label: "Family", icon: "ri-group-line", link: "/family" },
  {
    id: "caregiver",
    label: "Caregiver",
    icon: "ri-user-heart-line",
    link: "/caregiver",
  },
];

/** ADM-B04.03 — keep API menus that map to SPA paths (drop legacy MVC URLs). */
export const isSpaMenuLink = (link) => {
  if (!link || typeof link !== "string" || link === "/#") return false;
  const path = link.startsWith("/") ? link : `/${link}`;
  return (
    path.startsWith("/admin") ||
    path.startsWith("/account") ||
    path.startsWith("/pharmacy") ||
    path.startsWith("/family") ||
    path.startsWith("/caregiver") ||
    path.startsWith("/doctor") ||
    path === "/dashboard" ||
    path === "/accountdashboard" ||
    path === "/pharmacydashboard" ||
    path === "/doctordashboard"
  );
};
