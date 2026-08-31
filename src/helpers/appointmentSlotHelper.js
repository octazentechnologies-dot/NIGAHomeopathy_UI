import moment from 'moment';

export const APPOINTMENT_SLOT_INTERVALS = [5, 10, 15, 20, 30, 60];
export const CUSTOM_INTERVAL_VALUE = 'custom';
export const MIN_SLOT_INTERVAL_MINUTES = 1;
export const MAX_SLOT_INTERVAL_MINUTES = 180;

export const DEFAULT_WORK_START = '09:00:00';
export const DEFAULT_WORK_END = '21:00:00';

export const formatApiDate = (value) => {
  if (!value) return '';
  if (String(value).includes('T')) {
    const parsed = moment(value);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
  }
  const parsed = moment(value, ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM/DD/YYYY', 'M/D/YYYY', 'D-M-YYYY'], true);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
};

export const formatCalendarDateForSchedule = (displayDate) => {
  if (!displayDate) return '';
  if (String(displayDate).includes('T')) {
    const parsed = moment(displayDate);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
  }
  const parsed = moment(displayDate, ['DD-MM-YYYY', 'MM/DD/YYYY', 'M/D/YYYY', 'D-M-YYYY', 'YYYY-MM-DD'], true);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
};

export const timeInputToApiTime = (timeValue) => {
  if (!timeValue) return '';
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeValue)) return timeValue;
  if (/^\d{2}:\d{2}$/.test(timeValue)) return `${timeValue}:00`;
  const parsed = moment(timeValue, ['HH:mm', 'hh:mm A', 'h:mm A'], true);
  return parsed.isValid() ? parsed.format('HH:mm:ss') : '';
};

export const apiTimeToTimeInput = (apiTime, fallback = '09:00') => {
  if (!apiTime) return fallback;
  const parsed = moment(apiTime, ['HH:mm:ss', 'HH:mm', 'hh:mm A'], true);
  return parsed.isValid() ? parsed.format('HH:mm') : fallback;
};

export const normalizeAppointmentSlotsResponse = (response) => {
  const payload = response?.data ?? response ?? {};
  const slots = Array.isArray(payload.slots)
    ? payload.slots
    : (Array.isArray(payload.Slots) ? payload.Slots : []);

  return {
    doctorId: payload.doctorId ?? payload.DoctorId ?? null,
    appointmentDate: payload.appointmentDate ?? payload.AppointmentDate ?? null,
    intervalMinutes: payload.intervalMinutes ?? payload.IntervalMinutes ?? null,
    workStartTime: payload.workStartTime ?? payload.WorkStartTime ?? null,
    workEndTime: payload.workEndTime ?? payload.WorkEndTime ?? null,
    hasSchedule: Boolean(
      payload.hasSchedule ?? payload.HasSchedule ?? false
    ),
    slots: slots.map((slot) => ({
      time: slot.time ?? slot.Time ?? '',
      label: slot.label ?? slot.Label ?? slot.time ?? slot.Time ?? '',
      status: (slot.status ?? slot.Status ?? 'available').toLowerCase(),
      patientAppId: slot.patientAppId ?? slot.PatientAppId ?? null,
      patientName: slot.patientName ?? slot.PatientName ?? null,
    })),
  };
};

export const groupSlotsByHour = (slots = []) => {
  const groups = new Map();

  slots.forEach((slot) => {
    const hourKey = moment(slot.time, 'HH:mm:ss').format('h A');
    if (!groups.has(hourKey)) {
      groups.set(hourKey, []);
    }
    groups.get(hourKey).push(slot);
  });

  return [...groups.entries()];
};

export const getAuthSession = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const data = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
    return { raw, data: data || {} };
  } catch {
    return { raw: {}, data: {} };
  }
};

export const getAuthUserId = () => {
  const { data } = getAuthSession();
  return data.userId ?? data.UserId ?? data.user?.userId ?? data.user?.id ?? null;
};

export const getAuthDoctorId = () => {
  const { data } = getAuthSession();
  return data.doctorId ?? data.DoctorId ?? data.doctorID ?? data.user?.doctorId ?? null;
};

export const validateSlotIntervalMinutes = (minutes) => {
  const value = Number(minutes);
  if (!Number.isInteger(value) || value < MIN_SLOT_INTERVAL_MINUTES || value > MAX_SLOT_INTERVAL_MINUTES) {
    return {
      valid: false,
      message: `Enter a whole number between ${MIN_SLOT_INTERVAL_MINUTES} and ${MAX_SLOT_INTERVAL_MINUTES} minutes.`,
    };
  }
  return { valid: true, value };
};

export const formatSlotIntervalLabel = (intervalMinutes) => {
  const value = Number(intervalMinutes);
  if (!Number.isInteger(value) || value <= 0) return '';
  return `${value} minutes`;
};

export const getMaxSlotsPerHour = (slots = []) => {
  const grouped = groupSlotsByHour(slots);
  if (!grouped.length) return 12;
  return Math.max(...grouped.map(([, hourSlots]) => hourSlots.length), 1);
};

export const getSlotStatusSummary = (slots = []) => {
  const summary = { available: 0, booked: 0, past: 0, current: 0, total: slots.length };
  slots.forEach((slot) => {
    const status = (slot.status || 'available').toLowerCase();
    if (summary[status] != null) {
      summary[status] += 1;
    }
  });
  return summary;
};
