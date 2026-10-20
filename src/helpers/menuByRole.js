/**
 * ADM-B04.03 — Map API GetMenuByRole MenuMaster rows to SPA nav items.
 * Seed URLs from M02 W7 may differ from CRA routes; normalize those here.
 */
const SEED_URL_TO_SPA = {
  "/account/home": "/accountdashboard",
  "/account/earnings": "/account/doctor-earnings",
  "/pharmacy/home": "/pharmacydashboard",
  "/admin/dashboard": "/admin/dashboard",
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
      try {
        const token = user?.token || user?.Token || user?.data?.token;
        if (token && token.includes(".")) {
          const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
          const fromToken = Number(payload.DoctorUserID || payload.doctorUserId || payload.DoctorUserId || 0);
          if (Number.isFinite(fromToken) && fromToken > 0) return fromToken;
        }
      } catch {
        /* token is optional; fall through to the signed-in user id */
      }
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

const MENU_LINK_OVERRIDES = {
  "/admin/trust-queue": { label: "Trust & Verification", icon: "ri-shield-check-line" },
  "/admin/consult-payments": { icon: "ri-secure-payment-line" },
  "/admin/reports": { icon: "ri-bar-chart-line" },
  "/admin/pharmacy-partners": { label: "Pharmacy configuration", icon: "ri-store-3-line" },
};

export const mapMenuMasterToNavItems = (rows) => {
  const mapped = unwrapApiList(rows)
    .map((menu) => {
      const menuId = menu.menuId ?? menu.MenuId;
      const parentMenuId = menu.parentMenuId ?? menu.ParentMenuId ?? null;
      const link = normalizeMenuUrl(menu.menuUrl ?? menu.MenuUrl);
      const override = MENU_LINK_OVERRIDES[String(link || "").toLowerCase()] || {};
      const label = override.label || (menu.menuName ?? menu.MenuName);
      const icon = override.icon || (menu.menuIcon ?? menu.MenuIcon) || "ri-menu-line";
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

export const mergeMissingMenuItems = (existing, extras) => {
  const list = Array.isArray(existing) ? [...existing] : [];
  const seen = new Set(list.map((item) => String(item.link || "").toLowerCase()));
  (extras || []).forEach((item) => {
    const link = String(item.link || "").toLowerCase();
    if (!link || seen.has(link)) return;
    seen.add(link);
    list.push(item);
  });
  return list;
};

export const ADMIN_WEEK4_MENU = [
  { id: "platform-users", label: "Platform users", icon: "ri-team-line", link: "/admin/platform-users" },
  { id: "whatsapp-campaigns", label: "WhatsApp campaigns", icon: "ri-whatsapp-line", link: "/admin/whatsapp-campaigns" },
  { id: "trust-queue", label: "Trust & Verification", icon: "ri-shield-check-line", link: "/admin/trust-queue" },
  { id: "homemeds-exceptions", label: "HomeoMeds exceptions", icon: "ri-capsule-line", link: "/admin/homemeds-exceptions" },
  { id: "pharmacy-partners", label: "Pharmacy configuration", icon: "ri-store-3-line", link: "/admin/pharmacy-partners" },
  { id: "consult-payments", label: "Consult payments", icon: "ri-secure-payment-line", link: "/admin/consult-payments" },
  { id: "admin-reports", label: "Clinic reports", icon: "ri-bar-chart-line", link: "/admin/reports" },
  { id: "payment-exceptions", label: "Payment exceptions", icon: "ri-error-warning-line", link: "/admin/payment-exceptions" },
  { id: "admin-sms", label: "SMS templates", icon: "ri-message-2-line", link: "/admin/sms" },
  { id: "medicine-report", label: "Medicine report", icon: "ri-capsule-line", link: "/admin/medicine-report" },
  { id: "security-audit", label: "Security audit", icon: "ri-file-shield-2-line", link: "/admin/security-audit" },
  { id: "consent-audit", label: "Consent audit", icon: "ri-file-list-3-line", link: "/admin/consent-audit" },
];

const moreMenuKey = (item) =>
  `${String(item?.id || "").toLowerCase()}|${String(item?.link || "").split("?")[0].toLowerCase()}|${String(item?.label || "").trim().toLowerCase()}`;

const matchesMoreGroup = (item, { ids = [], linkParts = [], labelParts = [] }) => {
  const id = String(item?.id || "").toLowerCase();
  const link = String(item?.link || "").split("?")[0].toLowerCase();
  const label = String(item?.label || "").trim().toLowerCase();
  if (ids.some((value) => id === value || id.includes(value))) return true;
  if (linkParts.some((part) => link.includes(part))) return true;
  if (labelParts.some((part) => label.includes(part))) return true;
  return false;
};

const MORE_MENU_GROUPS = [
  {
    id: "more-exceptions",
    label: "Exceptions",
    icon: "ri-error-warning-line",
    match: {
      ids: ["homemeds-exceptions", "payment-exceptions"],
      linkParts: ["homemeds-exception", "payment-exception"],
      labelParts: ["homemeds exception", "payment exception"],
    },
  },
  {
    id: "more-audit",
    label: "Audit",
    icon: "ri-shield-keyhole-line",
    match: {
      ids: ["security-audit", "consent-audit"],
      linkParts: ["security-audit", "consent-audit", "/admin/security"],
      labelParts: ["security audit", "consent audit"],
    },
  },
  {
    id: "more-reports",
    label: "Reports",
    icon: "ri-bar-chart-box-line",
    match: {
      ids: [
        "admin-reports",
        "medicine-report",
        "clinic-report",
        "clinic-reports",
        "doctor-performance",
        "doctor-followup",
        "doctor-practice-analysis",
        "doctor-earning-analysis",
      ],
      linkParts: [
        "/admin/reports",
        "medicine-report",
        "clinic-report",
        "clinic-performance",
        "follow-up-analysis",
        "practice-analysis",
        "earning-analysis",
        "/doctor/reports",
      ],
      labelParts: [
        "clinic report",
        "medicine report",
        "clinic performance",
        "follow-up analysis",
        "practice analysis",
        "earning analysis",
        "reports",
      ],
    },
  },
];

/**
 * Nest flat More-menu links into Exceptions / Audit / Reports parents for hover flyouts.
 * Leaves other items (Trust, Pharmacy, SMS, …) as top-level entries; keeps relative order.
 */
export const groupMoreMenuFlyoutItems = (items = []) => {
  const buckets = Object.fromEntries(MORE_MENU_GROUPS.map((group) => [group.id, []]));
  const emittedGroup = new Set();
  const out = [];

  const normalizeChild = (child) =>
    child.id === "admin-reports" || String(child.label || "").trim().toLowerCase() === "reports"
      ? { ...child, label: "Clinic reports" }
      : child;

  (items || []).forEach((item) => {
    if (item?.isHeader || item?.childItems?.length || item?.subItems?.length) {
      out.push(item);
      return;
    }
    const group = MORE_MENU_GROUPS.find((entry) => matchesMoreGroup(item, entry.match));
    if (!group) {
      out.push(item);
      return;
    }
    buckets[group.id].push(normalizeChild(item));
    if (emittedGroup.has(group.id)) return;
    emittedGroup.add(group.id);
    out.push({
      id: group.id,
      label: group.label,
      icon: group.icon,
      // Placeholder; children filled after the full pass so all matches are included.
      childItems: buckets[group.id],
    });
  });

  return out.map((item) => {
    const group = MORE_MENU_GROUPS.find((entry) => entry.id === item.id);
    if (!group) return item;
    return { ...item, childItems: buckets[group.id] };
  });
};

/** Admin Enquiries live on Help & Support (Ticket Enquiries) — omit from More / horizontal nav. */
export const isAdminEnquiriesNavItem = (item) => {
  const label = String(item?.label || "").trim().toLowerCase();
  if (
    label === "enquiries" ||
    label === "enquiry" ||
    label === "enquiry inbox" ||
    label === "ticket enquiries" ||
    label.includes("enquir")
  ) {
    return true;
  }
  const link = String(item?.link || "").split("?")[0].toLowerCase();
  return (
    link === "/enquiries" ||
    link === "/admin/enquiries" ||
    link === "/enquiry" ||
    link.endsWith("/enquiries")
  );
};

/** Package top-ups admin screen removed from nav (route redirects to dashboard). */
export const isHiddenAdminNavItem = (item) => {
  const label = String(item?.label || "").trim().toLowerCase();
  const link = String(item?.link || "").split("?")[0].toLowerCase();
  if (link === "/admin/package-topups") return true;
  if (label === "package top-ups" || label === "package topups" || label === "package top up") return true;
  return false;
};

export const splitAdminApiNavItems = (items) => {
  const menuItems = [];
  const moreMenuItems = [];
  (items || []).forEach((item) => {
    if (item.link === "/dashboard") return;
    if (isAdminEnquiriesNavItem(item)) return;
    if (isHiddenAdminNavItem(item)) return;
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
  { id: "reception-schedule", label: "Schedule", icon: "ri-calendar-line", link: "/reception/schedule" },
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
  if (normalized === "/index") return true;
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

const receptionLinkKey = (link) => {
  const path = String(link || "").split("?")[0].toLowerCase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/reception" || normalized === "/reception/") return "home";
  if (normalized.startsWith("/reception/schedule")) return "schedule";
  if (normalized.startsWith("/reception/case-paper")) return "case";
  if (normalized === "/profile" || normalized.startsWith("/profile/")) return "profile";
  return "";
};

/** Keep the four front-desk items, in desk order, and drop the doctor dashboard. */
export const receptionChromeFromApi = (items) => {
  const filtered = filterReceptionChromeItems(items);
  const byKey = new Map();
  filtered.forEach((item) => {
    const key = receptionLinkKey(item.link);
    if (key && !byKey.has(key)) byKey.set(key, item);
  });
  const ordered = RECEPTION_FALLBACK_MENU.map((fallback) => {
    const key = receptionLinkKey(fallback.link);
    const fromApi = byKey.get(key);
    return fromApi ? { ...fromApi, label: fallback.label, link: fallback.link, icon: fromApi.icon || fallback.icon } : fallback;
  });
  const extras = filtered.filter((item) => !receptionLinkKey(item.link));
  return [...ordered, ...extras];
};

/** Matches Dev RoleDetails for Doctor (no Enquiries, no Family). Used only when GetMenuByRole fails. */
/** Doctor chrome may only list clinic routes — never Account / Pharmacy / Patient / Admin. */
export const isDoctorSpaLink = (link) => {
  if (!link || typeof link !== "string") return false;
  const path = (link.split("?")[0] || "").toLowerCase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return (
    normalized === "/doctordashboard" ||
    normalized.startsWith("/doctor/") ||
    normalized === "/profile"
  );
};

export const DOCTOR_FALLBACK_MENU = [
  { id: "doctor-home", label: "Dashboard", icon: "ri-dashboard-2-line", link: "/doctordashboard" },
  { id: "doctor-board", label: "Patient Board", icon: "ri-user-heart-line", link: "/doctor/patientboard" },
  { id: "doctor-tele", label: "Tele Consultation", icon: "ri-vidicon-line", link: "/doctor/tele-consultation" },
  { id: "doctor-anatomy", label: "Anatomy", icon: "ri-body-scan-line", link: "/doctor/anatomy" },
  { id: "doctor-staff", label: "Reception Staff", icon: "ri-user-star-line", link: "/doctor/reception-staff" },
  { id: "doctor-fees", label: "Consult fees", icon: "ri-money-dollar-circle-line", link: "/doctor/consult-fees" },
  { id: "doctor-earnings", label: "Earnings summary", icon: "ri-wallet-3-line", link: "/doctor/earnings" },
  { id: "doctor-sms", label: "SMS events", icon: "ri-message-2-line", link: "/doctor/sms" },
  { id: "doctor-followups-due", label: "Follow-ups due", icon: "ri-calendar-check-line", link: "/doctor/follow-ups" },
  { id: "doctor-followup", label: "Follow-up analysis", icon: "ri-line-chart-line", link: "/doctor/follow-up-analysis" },
  { id: "doctor-performance", label: "Clinic performance", icon: "ri-bar-chart-grouped-line", link: "/doctor/clinic-performance" },
  { id: "doctor-practice", label: "Practice", icon: "ri-pulse-line", link: "/doctor/practice" },
  { id: "doctor-erx", label: "eRx", icon: "ri-file-text-line", link: "/doctor/erx" },
  { id: "doctor-waitlist", label: "Waitlist", icon: "ri-time-line", link: "/doctor/waitlist" },
  { id: "doctor-schedule", label: "Schedule", icon: "ri-calendar-2-line", link: "/doctor/schedule" },
  { id: "doctor-carelink", label: "CareLink", icon: "ri-share-forward-line", link: "/doctor/carelink" },
  { id: "doctor-appt-requests", label: "Appointment requests", icon: "ri-mail-check-line", link: "/doctor/appointment-requests" },
  { id: "doctor-pharmacy-queries", label: "Pharmacy queries", icon: "ri-capsule-line", link: "/doctor/pharmacy-queries" },
  { id: "doctor-support", label: "Support", icon: "ri-customer-service-2-line", link: "/doctor/support" },
  { id: "doctor-videoroom", label: "Video room", icon: "ri-vidicon-line", link: "/doctor/mobile/videoroom" },
  { id: "doctor-refill", label: "Refill inbox", icon: "ri-medicine-bottle-line", link: "/doctor/mobile/refill" },
  { id: "doctor-profile", label: "Profile", icon: "ri-user-settings-line", link: "/profile" },
];

export const PATIENT_FALLBACK_MENU = [
  { id: "patient-home", label: "Dashboard", icon: "ri-dashboard-2-line", link: "/patientdashboard" },
  { id: "family", label: "Family", icon: "ri-group-line", link: "/family" },
  {
    id: "caregiver",
    label: "Caregiver",
    icon: "ri-user-heart-line",
    link: "/caregiver",
  },
  { id: "patient-continuity", label: "Care continuity", icon: "ri-heart-pulse-line", link: "/patient/continuity" },
  { id: "patient-summary", label: "Consultation summary", icon: "ri-file-text-line", link: "/patient/summary" },
  { id: "patient-chat", label: "Visit chat", icon: "ri-chat-1-line", link: "/patient/chat" },
  { id: "patient-rejoin", label: "Rejoin call", icon: "ri-refresh-line", link: "/patient/rejoin" },
  { id: "patient-meds", label: "Medicine orders", icon: "ri-capsule-line", link: "/patient/medicine-orders" },
  { id: "patient-erx", label: "Digital Prescription", icon: "ri-file-list-3-line", link: "/patient/prescriptions" },
  { id: "patient-addresses", label: "Delivery addresses", icon: "ri-map-pin-line", link: "/patient/addresses" },
  { id: "patient-reminders", label: "Reminders", icon: "ri-alarm-line", link: "/patient/reminders" },
  { id: "patient-requests", label: "Appointment requests", icon: "ri-mail-send-line", link: "/patient/appointment-requests" },
  { id: "patient-waitlist", label: "Waitlist offers", icon: "ri-time-line", link: "/patient/waitlist" },
  { id: "patient-checkin", label: "Check in", icon: "ri-checkbox-circle-line", link: "/patient/check-in" },
  { id: "patient-support", label: "Support", icon: "ri-customer-service-2-line", link: "/patient/support" },
  { id: "patient-profile", label: "Profile", icon: "ri-user-settings-line", link: "/profile" },
];

const normalizePatientMenuLink = (link) => {
  const path = String(link || "").split("?")[0].toLowerCase();
  return path.startsWith("/") ? path : path ? `/${path}` : "";
};

/** Primary patient top-nav links (rest go to topbar More). */
const PATIENT_PRIMARY_LINKS = new Set([
  "/patientdashboard",
  "/patient/home",
  "/family",
  "/caregiver",
  "/patient/medicine-orders",
  "/patient/prescriptions",
]);

/** Drop Profile (header avatar) and Support (Help icon); keep Dashboard first. */
export const normalizePatientHorizontalMenu = (items) => {
  const isDashboard = (link) => {
    const normalized = normalizePatientMenuLink(link);
    return normalized === "/patientdashboard" || normalized === "/patient/home";
  };
  const isHidden = (link) => {
    const normalized = normalizePatientMenuLink(link);
    if (normalized === "/profile" || normalized.startsWith("/profile")) return true;
    if (normalized === "/patient/support" || normalized.startsWith("/patient/support")) return true;
    return false;
  };
  const cleaned = (items || []).filter((item) => !isHidden(item.link));
  const dash = cleaned.find((item) => isDashboard(item.link));
  const rest = cleaned.filter((item) => !isDashboard(item.link));
  const home =
    dash ||
    PATIENT_FALLBACK_MENU.find((item) => isDashboard(item.link)) ||
    PATIENT_FALLBACK_MENU[0];
  return [home, ...rest];
};

/**
 * Slim patient nav strip (Dashboard / Family / Caregiver / Medicine / Prescriptions).
 * Remaining care links live in the topbar More menu (same pattern as admin/doctor).
 */
export const splitPatientNavItems = (items = []) => {
  const cleaned = normalizePatientHorizontalMenu(items);
  const byLink = new Map();
  cleaned.forEach((item) => {
    const link = normalizePatientMenuLink(item.link);
    if (link) byLink.set(link, item);
  });

  const primaryOrder = [
    "/patientdashboard",
    "/family",
    "/caregiver",
    "/patient/medicine-orders",
    "/patient/prescriptions",
  ];
  const primaryFallbackByLink = new Map(
    PATIENT_FALLBACK_MENU.map((item) => [normalizePatientMenuLink(item.link), item])
  );

  const menuItems = [];
  const seenPrimary = new Set();
  primaryOrder.forEach((link) => {
    const item =
      byLink.get(link) ||
      (link === "/patientdashboard" ? byLink.get("/patient/home") : null) ||
      primaryFallbackByLink.get(link);
    if (!item) return;
    const key = normalizePatientMenuLink(item.link) || link;
    if (seenPrimary.has(key)) return;
    seenPrimary.add(key);
    if (key === "/patient/home") seenPrimary.add("/patientdashboard");
    if (key === "/patientdashboard") seenPrimary.add("/patient/home");
    menuItems.push(item);
  });

  const moreMenuItems = [];
  const seenMore = new Set();
  cleaned.forEach((item) => {
    const link = normalizePatientMenuLink(item.link);
    if (!link || PATIENT_PRIMARY_LINKS.has(link) || seenMore.has(link)) return;
    seenMore.add(link);
    moreMenuItems.push(item);
  });

  return { menuItems, moreMenuItems };
};

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
    path.startsWith("/patient") ||
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
