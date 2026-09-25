/**
 * ADM-B04.03 — Map New-API GetMenuByRole MenuMaster rows to SPA nav items.
 * Seed URLs from M02 W7 may differ from CRA routes; normalize those here.
 */
const SEED_URL_TO_SPA = {
  "/account/home": "/accountdashboard",
  "/account/earnings": "/account/doctor-earnings",
  "/pharmacy/home": "/pharmacydashboard",
  "/admin/dashboard": "/dashboard",
  "/admin/enquiries": "/enquiries",
};

export const getAuthUserId = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("authUser") || "null");
    const role = user?.role || user?.Role || user?.data?.role || user?.data?.Role;
    // Reception NameIdentifier / userId may be staff id. Dashboard queries need Doctor.UserId.
    if (String(role || "").toLowerCase() === "reception") {
      const doctorUserId = Number(
        user?.doctorUserId ??
          user?.DoctorUserID ??
          user?.DoctorUserId ??
          user?.data?.doctorUserId ??
          user?.data?.DoctorUserID ??
          user?.data?.DoctorUserId
      );
      if (Number.isFinite(doctorUserId) && doctorUserId > 0) return doctorUserId;
    }
    const raw =
      user?.userId ??
      user?.UserId ??
      user?.doctorUserId ??
      user?.DoctorUserID ??
      user?.data?.userId ??
      user?.data?.UserId ??
      user?.data?.doctorUserId ??
      user?.data?.DoctorUserID;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : 0;
  } catch {
    return 0;
  }
};

export const unwrapApiList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  // Newtonsoft ReferenceLoop / $values wrappers must not empty the family relation dropdown.
  if (Array.isArray(raw.$values)) return raw.$values;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.data?.$values)) return raw.data.$values;
  if (Array.isArray(raw.Data)) return raw.Data;
  if (Array.isArray(raw.Data?.$values)) return raw.Data.$values;
  if (Array.isArray(raw.resultObject)) return raw.resultObject;
  if (Array.isArray(raw.ResultObject)) return raw.ResultObject;
  return [];
};

export const normalizeMenuUrl = (url) => {
  if (!url || typeof url !== "string") return "/#";
  const path = url.startsWith("/") ? url : `/${url}`;
  return SEED_URL_TO_SPA[path] || path;
};

const ADMIN_HORIZONTAL_MAIN_LABELS = new Set([
  "Existance Questions",
  "Clinical Patterns",
  "Repertory",
  "Materia Medica",
  "Adverse Effect",
  "Deep Analytics",
  "BU Mgmt.",
  "3D Parts",
  "Rubric Intelligence",
]);

export const mapMenuMasterToNavItems = (rows) => {
  const mapped = unwrapApiList(rows)
    .map((menu) => {
      const menuId = menu.menuId ?? menu.MenuId;
      const parentMenuId = menu.parentMenuId ?? menu.ParentMenuId ?? null;
      const label = menu.menuName ?? menu.MenuName;
      const icon = (menu.menuIcon ?? menu.MenuIcon) || "ri-menu-line";
      const link = normalizeMenuUrl(menu.menuUrl ?? menu.MenuUrl);
      const seq = Number(menu.seqNo ?? menu.SeqNo ?? 0);
      if (!label) return null;
      return {
        id: menuId != null ? `menu-${menuId}` : `menu-${label}`,
        menuId,
        parentMenuId,
        label,
        icon,
        link,
        seq: Number.isFinite(seq) ? seq : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.seq - b.seq);

  const byId = new Map();
  mapped.forEach((item) => {
    byId.set(item.menuId, { ...item, subItems: [] });
  });

  const roots = [];
  byId.forEach((item) => {
    const parent = item.parentMenuId != null ? byId.get(item.parentMenuId) : null;
    if (parent) parent.subItems.push(item);
    else roots.push(item);
  });

  const clean = (item) => {
    const next = {
      id: item.id,
      label: item.label,
      icon: item.icon,
      link: item.link,
    };
    if (item.subItems?.length) {
      next.subItems = item.subItems.map(clean);
      if (!isSpaMenuLink(next.link)) next.link = "/#";
    }
    return next;
  };

  return roots.map(clean);
};

export const keepSpaNavItem = (item) => {
  const kids = (item.subItems || []).map(keepSpaNavItem).filter(Boolean);
  if (kids.length) {
    return { ...item, subItems: kids, link: item.link && isSpaMenuLink(item.link) ? item.link : "/#" };
  }
  return isSpaMenuLink(item.link) ? item : null;
};

export const splitAdminApiNavItems = (items) => {
  const menuItems = [];
  const moreMenuItems = [];
  (items || []).forEach((item) => {
    if (item.link === "/dashboard") return;
    if (ADMIN_HORIZONTAL_MAIN_LABELS.has(item.label) && item.subItems?.length) {
      menuItems.push(item);
      return;
    }
    moreMenuItems.push(item);
  });
  return { menuItems, moreMenuItems };
};

export const RECEPTION_FALLBACK_MENU = [
  { id: "reception-home", label: "Dashboard", icon: "ri-dashboard-2-line", link: "/reception" },
  { id: "reception-case-paper", label: "Case paper", icon: "ri-file-list-3-line", link: "/reception/case-paper" },
  { id: "reception-profile", label: "Profile", icon: "ri-user-settings-line", link: "/profile" },
];

const CLINICAL_NAV_MARKERS = ["patientboard", "anatomy", "repertor", "materia", "clinical", "doctordashboard"];

/** REC-03.01 — drop Patient Board / repertory / doctor-dashboard links from reception chrome. */
export const isClinicalNavLink = (link) => {
  if (!link || typeof link !== "string" || link === "/#") return false;
  const path = link.split("?")[0].toLowerCase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/reception" || normalized.startsWith("/reception/")) return false;
  return CLINICAL_NAV_MARKERS.some((marker) => normalized.includes(marker));
};

export const filterReceptionChromeItems = (items) =>
  (items || [])
    .map((item) => {
      const kids = filterReceptionChromeItems(item.subItems || []);
      if (kids.length) return { ...item, subItems: kids };
      if (isClinicalNavLink(item.link)) return null;
      if (!item.link || item.link === "/#") return null;
      return item;
    })
    .filter(Boolean);

export const receptionChromeFromApi = (items) => {
  const filtered = filterReceptionChromeItems(items);
  const hasHome = filtered.some((item) => String(item.link || "").toLowerCase().startsWith("/reception"));
  return hasHome ? filtered : [...RECEPTION_FALLBACK_MENU, ...filtered];
};

/** Matches Dev RoleDetails for Doctor (no Enquiries, no Family). Used only when GetMenuByRole fails. */
export const DOCTOR_FALLBACK_MENU = [
  { id: "doctor-home", label: "Dashboard", icon: "ri-dashboard-2-line", link: "/doctordashboard" },
  { id: "doctor-board", label: "Patient Board", icon: "ri-user-heart-line", link: "/doctor/patientboard" },
  { id: "doctor-anatomy", label: "Anatomy", icon: "ri-body-scan-line", link: "/doctor/anatomy" },
  { id: "doctor-staff", label: "Reception Staff", icon: "ri-user-star-line", link: "/doctor/reception-staff" },
  { id: "doctor-videoroom", label: "Video room", icon: "ri-vidicon-line", link: "/doctor/mobile/videoroom" },
  { id: "doctor-refill", label: "Refill inbox", icon: "ri-medicine-bottle-line", link: "/doctor/mobile/refill" },
  { id: "doctor-profile", label: "Profile", icon: "ri-user-settings-line", link: "/profile" },
];

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
  if (path.startsWith("/admin/nav/")) return false;
  return (
    path.startsWith("/admin") ||
    path.startsWith("/account") ||
    path.startsWith("/pharmacy") ||
    path.startsWith("/family") ||
    path.startsWith("/caregiver") ||
    path.startsWith("/doctor") ||
    path.startsWith("/reception") ||
    path.startsWith("/enquiries") ||
    path.startsWith("/profile") ||
    path === "/dashboard" ||
    path === "/accountdashboard" ||
    path === "/pharmacydashboard" ||
    path === "/doctordashboard"
  );
};
