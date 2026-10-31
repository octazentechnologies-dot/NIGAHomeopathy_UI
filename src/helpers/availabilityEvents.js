export const AVAILABILITY_CHANGED_EVENT = "homeocentrum-availability-changed";

export const dispatchAvailabilityChanged = (detail = {}) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AVAILABILITY_CHANGED_EVENT, { detail }));
};
