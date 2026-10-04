import moment from "moment";

/**
 * MED-05.03 — pharmacy operating hours / service areas / delivery charges.
 * Hours, areas and capacity are also pushed to PUT /Pharmacy/Routing; delivery charges and
 * working days have no API yet, so the full config is kept per partner in localStorage
 * (shared by the admin Pharmacy configuration page and the pharmacy console).
 */
const CONFIG_STORAGE_KEY = "niga.pharmacyConfig.v1";

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const DEFAULT_PHARMACY_CONFIG = {
  openTime: "09:00",
  closeTime: "20:00",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  areas: [],
  deliveryCharge: "50",
  freeAbove: "500",
  capacity: "20",
};

export const readPharmacyConfigs = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CONFIG_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
};

export const writePharmacyConfig = (partnerId, config) => {
  const all = readPharmacyConfigs();
  all[partnerId] = config;
  window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(all));
};

export const pharmacyConfigFor = (partner) => {
  if (!partner) return { ...DEFAULT_PHARMACY_CONFIG };
  const saved = readPharmacyConfigs()[partner.id];
  if (saved) return { ...DEFAULT_PHARMACY_CONFIG, ...saved };
  return { ...DEFAULT_PHARMACY_CONFIG, areas: partner.area ? [partner.area] : [] };
};

export const formatConfigTime = (value) => (value ? moment(value, "HH:mm").format("h:mm A") : "—");

/** Whether the pharmacy is open right now according to its config. */
export const pharmacyOpenState = (config, now = moment()) => {
  const today = now.format("ddd");
  const time = now.format("HH:mm");
  const worksToday = (config.days || []).includes(today);
  if (worksToday && time >= config.openTime && time < config.closeTime) return { open: true };
  if (worksToday && time < config.openTime) return { open: false, next: `today at ${formatConfigTime(config.openTime)}` };
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = now.clone().add(offset, "days");
    if ((config.days || []).includes(day.format("ddd"))) {
      const label = offset === 1 ? "tomorrow" : day.format("dddd");
      return { open: false, next: `${label} at ${formatConfigTime(config.openTime)}` };
    }
  }
  return { open: false, next: "" };
};
