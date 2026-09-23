import { getAuthDoctorId } from "../../helpers/appointmentSlotHelper";

export const readReceptionDoctorId = () => {
  const direct = getAuthDoctorId();
  if (direct) return Number(direct);
  try {
    const raw = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    const token = raw.token || raw.Token || raw.data?.token;
    if (!token || !token.includes(".")) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const id = Number(payload.DoctorID || payload.doctorId || 0);
    return id || null;
  } catch {
    return null;
  }
};

export const unwrap = (response) => response?.data ?? response ?? {};
