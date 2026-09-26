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
const usesDoctorDashboardLayout = (role) => role === UserRole.DOCTOR;

/** Account portal: horizontal top nav (same shell as admin) */
const usesAccountDashboardLayout = (role) => role === UserRole.ACCOUNT;

/** Pharmacy portal: horizontal top nav (same shell as admin) */
const usesPharmacyDashboardLayout = (role) => role === UserRole.PHARMACY;

/** Reception portal: horizontal top nav (same shell as admin/account) */
const usesReceptionDashboardLayout = (role) => role === UserRole.RECEPTION;

/** Admin / Account / Pharmacy / Reception: full-width fixed topbar + horizontal nav */
const usesAdminDashboardLayout = (role) =>
    role === UserRole.ADMIN ||
    usesAccountDashboardLayout(role) ||
    usesPharmacyDashboardLayout(role) ||
    usesReceptionDashboardLayout(role);

/** Topbar briefcase "More" overflow menu (admin + doctor) */
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
    usesReceptionDashboardLayout,
    usesAdminDashboardLayout,
    usesTopbarMoreMenu,
    resolveUserRole,
};
