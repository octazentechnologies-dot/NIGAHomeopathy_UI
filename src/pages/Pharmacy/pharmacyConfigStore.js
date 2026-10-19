import moment from "moment";

import { getPharmacyConfig } from "../../helpers/s5Week5Api";

/**
 * MED-05.03 — pharmacy operating hours / working days / service areas / delivery charges / capacity,
 * stored by GET/PUT /Pharmacy/{id}/Config (shared by the admin Pharmacy configuration page and the pharmacy console).
 */
export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const EMPTY_PHARMACY_CONFIG = {
  configured: false,
  openTime: "",
  closeTime: "",
  days: [],
  areas: [],
  deliveryCharge: "",
  freeAbove: "",
  capacity: "",
  updatedAt: null,
};

const text = (value) => (value == null ? "" : String(value));

const toHHmm = (value) => {
  const raw = text(value).trim();
  if (!raw) return "";
  const m = moment(raw, ["HH:mm:ss", "HH:mm", "H:mm"], true);
  return m.isValid() ? m.format("HH:mm") : raw.slice(0, 5);
};

export const configFromApi = (data, partner) => {
  if (!data) return { ...EMPTY_PHARMACY_CONFIG, areas: partner?.area ? [partner.area] : [] };
  const areas = Array.isArray(data.areas) ? data.areas.filter(Boolean) : [];
  return {
    configured: Boolean(data.configured),
    openTime: toHHmm(data.openTime),
    closeTime: toHHmm(data.closeTime),
    days: Array.isArray(data.days) ? WEEK_DAYS.filter((d) => data.days.includes(d)) : [],
    areas: areas.length ? areas : partner?.area ? [partner.area] : [],
    deliveryCharge: text(data.deliveryCharge),
    freeAbove: text(data.freeAbove),
    capacity: text(data.capacity),
    updatedAt: data.updatedAt || null,
  };
};

export const loadPharmacyConfig = async (partner) => {
  if (!partner?.id) return { ...EMPTY_PHARMACY_CONFIG };
  const response = await getPharmacyConfig(partner.id);
  const payload = response?.data?.data ?? response?.data ?? response;
  return configFromApi(payload, partner);
};

export const formatConfigTime = (value) => {
  if (!value) return "—";
  const m = moment(value, ["HH:mm:ss", "HH:mm", "H:mm"], true);
  return m.isValid() ? m.format("h:mm A") : "—";
};

/** Whether the pharmacy is open right now according to its config; null until hours and days are set. */
export const pharmacyOpenState = (config, now = moment()) => {
  if (!config?.openTime || !config?.closeTime || !config?.days?.length) return null;
  const today = now.format("ddd");
  const time = now.format("HH:mm");
  const worksToday = config.days.includes(today);
  if (worksToday && time >= config.openTime && time < config.closeTime) return { open: true };
  if (worksToday && time < config.openTime) return { open: false, next: `today at ${formatConfigTime(config.openTime)}` };
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = now.clone().add(offset, "days");
    if (config.days.includes(day.format("ddd"))) {
      const label = offset === 1 ? "tomorrow" : day.format("dddd");
      return { open: false, next: `${label} at ${formatConfigTime(config.openTime)}` };
    }
  }
  return { open: false, next: "" };
};
