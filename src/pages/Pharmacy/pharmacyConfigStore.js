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

export const configFromApi = (data, partner) => {
  if (!data) return { ...EMPTY_PHARMACY_CONFIG, areas: partner?.area ? [partner.area] : [] };
  const areas = Array.isArray(data.areas) ? data.areas.filter(Boolean) : [];
  return {
    configured: Boolean(data.configured),
    openTime: text(data.openTime),
    closeTime: text(data.closeTime),
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
  return configFromApi(response?.data, partner);
};

export const formatConfigTime = (value) => (value ? moment(value, "HH:mm").format("h:mm A") : "—");

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
