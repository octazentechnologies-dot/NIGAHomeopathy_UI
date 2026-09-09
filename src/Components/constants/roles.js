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
    PHARMACY_PARTNER: "PharmacyPartner",
};

/** Roles allowed to open Admin Portal / mutate clinical masters (M02 W0). */
const ADMIN_PORTAL_ROLES = [UserRole.ADMIN, UserRole.MANAGEMENT];

/** Doctor dashboard UI without admin left sidebar */
const usesDoctorDashboardLayout = (role) =>
    role === UserRole.DOCTOR || role === UserRole.RECEPTION;

/** Admin dashboard: full-width fixed topbar + horizontal nav */
const usesAdminDashboardLayout = (role) => role === UserRole.ADMIN;

/** Topbar briefcase "More" overflow menu (admin + doctor/reception) */
const usesTopbarMoreMenu = (role) =>
    usesAdminDashboardLayout(role) || usesDoctorDashboardLayout(role);

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

const isAdminRoutePath = (path) => {
    if (!path || typeof path !== "string") return false;
    const normalized = path.replace(/^\//, "");
    return (
        normalized === "dashboard" ||
        normalized.startsWith("admin/") ||
        normalized === "admin"
    );
};

export {
    UserRole,
    ADMIN_PORTAL_ROLES,
    usesDoctorDashboardLayout,
    usesAdminDashboardLayout,
    usesTopbarMoreMenu,
    resolveUserRole,
    resolveUserRoleId,
    canAccessAdminPortal,
    canMutateAdminMasters,
    isAdminRoutePath,
};
