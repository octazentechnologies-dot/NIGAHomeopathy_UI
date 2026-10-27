import moment from 'moment';
import { listNotifications, patchNotification } from './s5Week5Api';

export const REMINDER_INBOX_REFRESH_EVENT = 'homeocentrum-inbox-refresh';
export const REMINDER_DASHBOARD_REFRESH_EVENT = 'homeocentrum-doctor-reminders-refresh';
/** Fired when user opens a reminder from toast / bell (works even if already on dashboard). */
export const REMINDER_OPEN_EVENT = 'homeocentrum-open-doctor-reminder';
export const REMINDER_FIRE_POLL_MS = 30000;
export const REMINDER_SNOOZE_MINUTES = 10;
export const REMINDER_DASHBOARD_PATH = '/doctordashboard';
const REMINDER_ALERT_DISMISSED_KEY = 'hc_doctor_reminder_alert_dismissed';

const API_DATE = 'YYYY-MM-DD';

export const mapDoctorReminder = (row) => ({
  id: row.doctorReminderId ?? row.DoctorReminderId,
  date: moment(row.reminderDate ?? row.ReminderDate).format(API_DATE),
  time: row.reminderTime ?? row.ReminderTime ?? null,
  title: row.title ?? row.Title ?? '',
  description: row.description ?? row.Description ?? '',
  contact: row.contactNumber ?? row.ContactNumber ?? '',
  isDone: Boolean(row.isDone ?? row.IsDone),
  firedAt: row.firedAt ?? row.FiredAt ?? null,
  snoozedUntil: row.snoozedUntil ?? row.SnoozedUntil ?? null,
  lastNotifiedAt: row.lastNotifiedAt ?? row.LastNotifiedAt ?? null,
});

const normalizeTime = (time) => {
  if (!time) return null;
  if (typeof time === 'string') {
    const m = moment(time, ['HH:mm:ss', 'HH:mm'], true);
    return m.isValid() ? m : null;
  }
  return null;
};

/** Due when date+time passed (or start of day if no time), not done, and not snoozed. */
export const isReminderDueNow = (reminder, now = moment()) => {
  if (!reminder || reminder.isDone) return false;
  const day = moment(reminder.date, API_DATE, true);
  if (!day.isValid()) return false;

  const t = normalizeTime(reminder.time);
  const dueAt = t
    ? day.clone().hour(t.hour()).minute(t.minute()).second(0).millisecond(0)
    : day.clone().startOf('day');

  if (dueAt.isAfter(now)) return false;

  if (reminder.snoozedUntil) {
    const until = moment(reminder.snoozedUntil);
    if (until.isValid() && until.isAfter(now)) return false;
  }
  return true;
};

export const formatReminderTimeDisplay = (time) => {
  if (!time) return '';
  const m = moment(String(time), ['HH:mm:ss', 'HH:mm'], true);
  return m.isValid() ? m.format('hh.mm A') : '';
};

export const dispatchReminderInboxRefresh = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REMINDER_INBOX_REFRESH_EVENT));
  }
};

export const dispatchReminderDashboardRefresh = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REMINDER_DASHBOARD_REFRESH_EVENT));
  }
};

export const buildReminderDeepLink = ({ reminderDate, reminderId } = {}) => {
  const qs = new URLSearchParams();
  if (reminderDate) qs.set('reminderDate', String(reminderDate));
  if (reminderId != null && reminderId !== '') qs.set('reminderId', String(reminderId));
  const query = qs.toString();
  return query ? `${REMINDER_DASHBOARD_PATH}?${query}` : REMINDER_DASHBOARD_PATH;
};

export const parseReminderDeepLink = (toOrSearch) => {
  if (!toOrSearch) return { reminderDate: null, reminderId: null };
  let search = '';
  const raw = String(toOrSearch);
  if (raw.includes('?')) search = raw.slice(raw.indexOf('?') + 1);
  else if (raw.includes('=')) search = raw.replace(/^\?/, '');
  else if (typeof window !== 'undefined' && raw.startsWith(REMINDER_DASHBOARD_PATH)) {
    search = window.location.search.replace(/^\?/, '');
  }
  const params = new URLSearchParams(search);
  const reminderDate = params.get('reminderDate');
  const reminderId = params.get('reminderId');
  return {
    reminderDate: reminderDate && moment(reminderDate, API_DATE, true).isValid() ? reminderDate : null,
    reminderId: reminderId ? String(reminderId) : null,
  };
};

const readDismissedAlerts = () => {
  try {
    return JSON.parse(sessionStorage.getItem(REMINDER_ALERT_DISMISSED_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

const writeDismissedAlerts = (map) => {
  try {
    sessionStorage.setItem(REMINDER_ALERT_DISMISSED_KEY, JSON.stringify(map));
  } catch {
    /* private mode */
  }
};

/** Hide due-alert after the doctor opens/reads the reminder. */
export const dismissReminderAlert = (reminderId) => {
  if (reminderId == null || reminderId === '') return;
  const map = readDismissedAlerts();
  map[String(reminderId)] = true;
  writeDismissedAlerts(map);
};

/** Allow alert again after a new fire cycle (e.g. post-snooze). */
export const clearReminderAlertDismiss = (reminderId) => {
  if (reminderId == null || reminderId === '') return;
  const map = readDismissedAlerts();
  if (!map[String(reminderId)]) return;
  delete map[String(reminderId)];
  writeDismissedAlerts(map);
};

export const isReminderAlertDismissed = (reminderId) => {
  if (reminderId == null || reminderId === '') return false;
  return Boolean(readDismissedAlerts()[String(reminderId)]);
};

/** Mark matching AppNotification inbox rows read so the bell badge clears. */
export const markReminderNotificationsRead = async (reminderId) => {
  if (reminderId == null || reminderId === '') return 0;
  const needle = `reminderId=${reminderId}`;
  let rows = [];
  try {
    const response = await listNotifications();
    rows = Array.isArray(response?.data) ? response.data : [];
  } catch {
    return 0;
  }
  const unread = rows.filter((row) => {
    const link = row.deepLink || row.DeepLink || '';
    const read = Boolean(row.isRead ?? row.IsRead);
    return !read && String(link).includes(needle);
  });
  await Promise.allSettled(
    unread.map((row) => {
      const id = row.appNotificationId ?? row.AppNotificationId;
      return id ? patchNotification(id, true) : Promise.resolve();
    })
  );
  dispatchReminderInboxRefresh();
  return unread.length;
};

/**
 * Open reminder on doctor dashboard (read-only view). Dispatches REMINDER_OPEN_EVENT
 * so TopSellers reacts even when already on /doctordashboard.
 * @param {object} opts
 * @param {string} [opts.to] deep link path
 * @param {string} [opts.reminderDate]
 * @param {string|number} [opts.reminderId]
 * @param {boolean} [opts.openView=true] show read-only detail (never edit)
 * @param {(path: string) => void} [opts.navigate]
 */
export const openDoctorReminder = ({ to, reminderDate, reminderId, openView = true, navigate } = {}) => {
  const fromLink = parseReminderDeepLink(to);
  const date = reminderDate || fromLink.reminderDate;
  const id = reminderId != null && reminderId !== '' ? String(reminderId) : fromLink.reminderId;
  const path = buildReminderDeepLink({ reminderDate: date, reminderId: id });

  if (id) {
    dismissReminderAlert(id);
    markReminderNotificationsRead(id).catch(() => {});
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(REMINDER_OPEN_EVENT, {
        detail: { reminderDate: date, reminderId: id, openView: Boolean(openView) },
      })
    );
  }

  if (typeof navigate === 'function') {
    navigate(path);
  } else if (typeof window !== 'undefined') {
    const current = `${window.location.pathname}${window.location.search || ''}`;
    if (current !== path) {
      window.history.pushState({}, '', path);
    }
  }

  return path;
};

/** Subtle non-blocking chime — fails silently if AudioContext blocked. */
export const playReminderChime = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t0 = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
    osc.start(t0);
    osc.stop(t0 + 0.3);
    osc.onended = () => {
      try {
        ctx.close();
      } catch {
        /* ignore */
      }
    };
  } catch {
    /* autoplay / permission — ignore */
  }
};
