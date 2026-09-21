const UserRole = {
    ADMIN: "Admin",
    MANAGEMENT: "Management",
    DOCTOR: "Doctor",
    SUPERVISOR: "Supervisor",
    INSPECTOR: "Inspector",
    RECEPTION: "Reception",
    /* M01 FND-01.02 — ecosystem roles (seeded in RoleMaster via M01_Foundation_Security_Server.sql) */
    PATIENT: "Patient",
    ACCOUNT: "Account",
    /* Dev portal role name */
    PHARMACY: "Pharmacy",
    /* M01 seed name — kept for RoleMaster / older stubs compatibility */
    PHARMACY_PARTNER: "PharmacyPartner",
};

/** Roles allowed to open Admin Portal / mutate clinical masters (M02 W0). */
const ADMIN_PORTAL_ROLES = [UserRole.ADMIN, UserRole.MANAGEMENT];

/** Doctor dashboard UI without admin left sidebar */
const usesDoctorDashboardLayout = (role) =>
    role === UserRole.DOCTOR || role === UserRole.RECEPTION;

/** Account portal: horizontal top nav (same shell as admin) */
const usesAccountDashboardLayout = (role) => role === UserRole.ACCOUNT;

/** Pharmacy portal: horizontal top nav (same shell as admin) */
const usesPharmacyDashboardLayout = (role) =>
    role === UserRole.PHARMACY || role === UserRole.PHARMACY_PARTNER;

/** Patient portal: family / caregiver screens (S1 CON-01.03) */
const usesPatientDashboardLayout = (role) => role === UserRole.PATIENT;

/** Admin / Account / Pharmacy / Patient: full-width fixed topbar + horizontal nav */
const usesAdminDashboardLayout = (role) =>
    role === UserRole.ADMIN ||
    usesAccountDashboardLayout(role) ||
    usesPharmacyDashboardLayout(role) ||
    usesPatientDashboardLayout(role);

/** Topbar briefcase "More" overflow menu (admin + doctor/reception) */
const usesTopbarMoreMenu = (role) =>
    role === UserRole.ADMIN || usesDoctorDashboardLayout(role);

const resolveUserRole = (userProfile) => {
    if (userProfile?.role) return userProfile.role;
    if (userProfile?.Role) return userProfile.Role;
    try {
        const sessionUser = JSON.parse(sessionStorage.getItem("authUser") || "null");
        return (
            sessionUser?.role ||
            sessionUser?.Role ||
            sessionUser?.data?.role ||
            sessionUser?.data?.Role ||
            null
        );
    } catch {
        return null;
    }
};

const resolveUserRoleId = (userProfile) => {
    const fromProfile = userProfile?.roleId ?? userProfile?.RoleId;
    if (fromProfile != null) return Number(fromProfile);
    try {
        const sessionUser = JSON.parse(sessionStorage.getItem("authUser") || "null");
        const id =
            sessionUser?.roleId ??
            sessionUser?.RoleId ??
            sessionUser?.data?.roleId ??
            sessionUser?.data?.RoleId;
        return id != null ? Number(id) : null;
    } catch {
        return null;
    }
};

/**
 * M02 W0 — Admin Portal access (route guard + mutate UI).
 * RoleId 1 = SuperUser/Admin in RoleMaster; also Admin / Management by name.
 */
const canAccessAdminPortal = (userOrRole) => {
    if (userOrRole == null) return false;

    if (typeof userOrRole === "string") {
        return ADMIN_PORTAL_ROLES.some(
            (r) => r.toLowerCase() === userOrRole.trim().toLowerCase()
        );
    }

    const role = resolveUserRole(userOrRole);
    const roleId = resolveUserRoleId(userOrRole);
    if (roleId === 1) return true;
    if (!role) return false;
    return ADMIN_PORTAL_ROLES.some(
        (r) => r.toLowerCase() === String(role).trim().toLowerCase()
    );
};

/** Alias — same rule as portal access for W0 (per-master ACL refined in W1+). */
const canMutateAdminMasters = (userOrRole) => canAccessAdminPortal(userOrRole);

/** FND-02.02 — deny-by-default ACL for new portal routes. */
const ACCOUNT_ROUTE_ROLES = [UserRole.ACCOUNT];
const PHARMACY_ROUTE_ROLES = [UserRole.PHARMACY, UserRole.PHARMACY_PARTNER];
const PATIENT_APP_ROUTE_ROLES = [
    UserRole.PATIENT,
    UserRole.ADMIN,
    UserRole.MANAGEMENT,
];
/** DOC-02.02 — Reception may share doctor chrome until Phase 5 splits it. */
const DOCTOR_DASHBOARD_ROUTE_ROLES = [UserRole.DOCTOR, UserRole.RECEPTION];
/** CLN-02.02 — full case taking is treating doctor only, not Reception. */
const DOCTOR_CASE_ROUTE_ROLES = [UserRole.DOCTOR];
/** DOC-09 — reception-staff CRUD is owned by the treating doctor. */
const DOCTOR_STAFF_ROUTE_ROLES = [UserRole.DOCTOR];

const isAdminRoutePath = (path) => {
    if (!path || typeof path !== "string") return false;
    const normalized = path.replace(/^\//, "");
    return (
        normalized === "dashboard" ||
        normalized.startsWith("admin/") ||
        normalized === "admin" ||
        normalized === "enquiries"
    );
};

/**
 * SEC-04.02 — Velzon template dashboards/apps stay out of production.
 * Direct URLs must not expose CRM/ecommerce demos unless REACT_APP_SHOW_VELZON_DEMO=true.
 * `/dashboard` is the Admin portal home, not a Velzon demo.
 */
const isVelzonTemplatePath = (path) => {
    if (!path || typeof path !== "string") return false;
    const normalized = path.replace(/^\//, "").toLowerCase();
    if (normalized === "dashboard" || normalized === "index" || normalized === "profile") {
        return false;
    }
    const prefixes = [
        "dashboard-",
        "apps-",
        "charts-",
        "ui-",
        "advance-ui",
        "widgets",
        "forms-",
        "tables-",
        "icons-",
        "maps-",
        "pages-",
    ];
    return prefixes.some(
        (prefix) => normalized === prefix || normalized.startsWith(prefix)
    );
};

export {
    UserRole,
    ADMIN_PORTAL_ROLES,
    usesDoctorDashboardLayout,
    usesAccountDashboardLayout,
    usesPharmacyDashboardLayout,
    usesPatientDashboardLayout,
    usesAdminDashboardLayout,
    usesTopbarMoreMenu,
    resolveUserRole,
    resolveUserRoleId,
    canAccessAdminPortal,
    canMutateAdminMasters,
    isAdminRoutePath,
    ACCOUNT_ROUTE_ROLES,
    PHARMACY_ROUTE_ROLES,
    PATIENT_APP_ROUTE_ROLES,
    DOCTOR_DASHBOARD_ROUTE_ROLES,
    DOCTOR_CASE_ROUTE_ROLES,
    DOCTOR_STAFF_ROUTE_ROLES,
    isVelzonTemplatePath,
};
