const UserRole = {
    ADMIN: "Admin",
    MANAGEMENT: "Management",
    DOCTOR: "Doctor",
    SUPERVISOR: "Supervisor",
    INSPECTOR: "Inspector",
    RECEPTION: "Reception",
};

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
    try {
        const sessionUser = JSON.parse(sessionStorage.getItem("authUser") || "null");
        return sessionUser?.role || sessionUser?.data?.role || null;
    } catch {
        return null;
    }
};

export { UserRole, usesDoctorDashboardLayout, usesAdminDashboardLayout, usesTopbarMoreMenu, resolveUserRole };