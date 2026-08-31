import { UserRole } from "../Components/constants/roles";

export const getAuthUserInfo = () => {
  const authUserStr = sessionStorage.getItem("authUser");
  if (!authUserStr) {
    return null;
  }
  try {
    const obj = JSON.parse(authUserStr);
    return obj?.data ?? obj;
  } catch {
    return null;
  }
};

export const getUserRoleFromAuthStorage = () => {
  const userInfo = getAuthUserInfo();
  return userInfo?.role ?? null;
};

/** daysRemaining from Account/Login — stored in session authUser */
export const getPlanDaysRemaining = (user) => {
  const info = user && Object.keys(user).length > 0 ? user : getAuthUserInfo();
  const days = info?.daysRemaining;
  if (days == null || Number.isNaN(Number(days))) {
    return null;
  }
  return Number(days);
};

export const formatPlanDaysRemaining = (days) => {
  if (days == null) return "—";
  if (days <= 0) return "Expired";
  return `${days} ${days === 1 ? "Day" : "Days"} Remaining`;
};

export const getPlanDaysRemainingToneClass = (days) => {
  if (days == null) return "text-muted";
  if (days <= 0) return "text-danger";
  if (days <= 3) return "text-danger";
  if (days <= 7) return "text-warning";
  return "text-success";
};

export const getHomeDashboardPath = (role) => {
  const userRole = role ?? getUserRoleFromAuthStorage();
  if (userRole === UserRole.DOCTOR || userRole === UserRole.RECEPTION) {
    return "/doctordashboard";
  }
  if (userRole === UserRole.ADMIN) {
    return "/dashboard";
  }
  return "/dashboard";
};

export const DOCTOR_DASHBOARD_OPEN_NEW_APPOINTMENT_EVENT = "doctor-dashboard:open-new-appointment";

export const buildPatientSelectOption = (patient) => {
  if (!patient) {
    return null;
  }
  const value = patient.patientID ?? patient.patientId ?? patient.PatientId ?? patient.value;
  const label = patient.patientName ?? patient.label ?? patient.name;
  if (value == null || !String(label || "").trim()) {
    return null;
  }
  return { value, label: String(label).trim() };
};

export const dispatchOpenNewAppointmentModal = (patient = null) => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(DOCTOR_DASHBOARD_OPEN_NEW_APPOINTMENT_EVENT, { detail: patient })
  );
};
