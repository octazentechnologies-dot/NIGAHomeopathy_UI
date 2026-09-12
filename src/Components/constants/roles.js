const UserRole = {
    ADMIN: "Admin",
    MANAGEMENT: "Management",
    DOCTOR: "Doctor",
    SUPERVISOR: "Supervisor",
    INSPECTOR: "Inspector",
    RECEPTION: "Reception",
    ACCOUNT: "Account",
    PHARMACY: "Pharmacy",
};

/** Doctor dashboard UI without admin left sidebar */
const usesDoctorDashboardLayout = (role) =>
    role === UserRole.DOCTOR || role === UserRole.RECEPTION;

/** Account portal: horizontal top nav (same shell as admin) */
const usesAccountDashboardLayout = (role) => role === UserRole.ACCOUNT;

/** Pharmacy portal: horizontal top nav (same shell as admin) */
const usesPharmacyDashboardLayout = (role) => role === UserRole.PHARMACY;

/** Admin / Account / Pharmacy: full-width fixed topbar + horizontal nav */
const usesAdminDashboardLayout = (role) =>
    role === UserRole.ADMIN ||
    usesAccountDashboardLayout(role) ||
    usesPharmacyDashboardLayout(role);

/** Topbar briefcase "More" overflow menu (admin + doctor/reception) */
const usesTopbarMoreMenu = (role) =>
    role === UserRole.ADMIN || usesDoctorDashboardLayout(role);

const resolveUserRole = (userProfile) => {
    if (userProfile?.role) return userProfile.role;
    try {
        const sessionUser = JSON.parse(sessionStorage.getItem("authUser") || "null");
        return sessionUser?.role || sessionUser?.data?.role || null;
    } catch {
        return null;
    }
};

export {
    UserRole,
    usesDoctorDashboardLayout,
    usesAccountDashboardLayout,
    usesPharmacyDashboardLayout,
    usesAdminDashboardLayout,
    usesTopbarMoreMenu,
    resolveUserRole,
};
