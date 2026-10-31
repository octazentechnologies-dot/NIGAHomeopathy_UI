import React, { useCallback, useEffect, useRef } from 'react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './doctorReminderFire.css';

import { UserRole } from '../constants/roles';
import {
  actOnDoctorReminder,
  listDoctorReminders,
} from '../../helpers/s5Week5Api';
import {
  REMINDER_FIRE_POLL_MS,
  REMINDER_SNOOZE_MINUTES,
  dispatchReminderDashboardRefresh,
  dispatchReminderInboxRefresh,
  formatReminderTimeDisplay,
  isReminderDueNow,
  mapDoctorReminder,
  clearReminderAlertDismiss,
  openDoctorReminder,
  playReminderChime,
} from '../../helpers/doctorReminderFire';

const API_DATE = 'YYYY-MM-DD';
const TOAST_ID_PREFIX = 'doctor-reminder-fire-';
const TOAST_SESSION_KEY = 'hc_doctor_reminder_toasts';

const readToastSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(TOAST_SESSION_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

const markToastShown = (id, cycleKey) => {
  const map = readToastSession();
  map[String(id)] = cycleKey || '1';
  try {
    sessionStorage.setItem(TOAST_SESSION_KEY, JSON.stringify(map));
  } catch {
    /* private mode */
  }
};

const wasToastShown = (id, cycleKey) => {
  const map = readToastSession();
  return map[String(id)] === (cycleKey || '1');
};

const readSessionRole = (loginUser) => {
  let auth = null;
  try {
    auth = JSON.parse(sessionStorage.getItem('authUser') || 'null');
  } catch {
    auth = null;
  }
  const session = loginUser && Object.keys(loginUser).length > 0 ? loginUser : auth?.data || auth;
  return session?.role || auth?.role || null;
};

const ReminderToastContent = ({ reminder, onDone, onSnooze, onView }) => {
  const timeLabel = formatReminderTimeDisplay(reminder.time) || 'Today';
  const meta = [timeLabel, reminder.description].filter(Boolean).join(' · ');

  return (
    <div className="doctor-reminder-toast">
      <div className="doctor-reminder-toast__inner">
        <div className="doctor-reminder-toast__icon" aria-hidden="true">
          <i className="ri-notification-3-line" />
        </div>
        <div className="doctor-reminder-toast__body">
          <p className="doctor-reminder-toast__eyebrow">Reminder due</p>
          <p className="doctor-reminder-toast__title">{reminder.title}</p>
          {meta ? <p className="doctor-reminder-toast__meta">{meta}</p> : null}
        </div>
      </div>
      <div className="doctor-reminder-toast__actions">
        <button type="button" className="btn btn-soft-success btn-sm" onClick={onDone}>
          Done
        </button>
        <button type="button" className="btn btn-soft-warning btn-sm" onClick={onSnooze}>
          Snooze {REMINDER_SNOOZE_MINUTES}m
        </button>
        <button type="button" className="btn btn-soft-primary btn-sm" onClick={onView}>
          View
        </button>
      </div>
    </div>
  );
};

/**
 * Global doctor-web watcher: when a reminder's time is reached, soft-toast
 * anywhere in the app, write bell inbox via API, support Done / Snooze / View.
 */
const DoctorReminderFireWatcher = () => {
  const navigate = useNavigate();
  const loginUser = useSelector((state) => state?.Login?.user);
  const role = readSessionRole(loginUser);
  const isDoctor = role === UserRole.DOCTOR;

  const inFlightRef = useRef(new Set());
  const toastShownRef = useRef(new Set());
  const scanningRef = useRef(false);

  const closeToast = useCallback((id) => {
    toast.dismiss(`${TOAST_ID_PREFIX}${id}`);
    toastShownRef.current.delete(id);
  }, []);

  const showFireToast = useCallback(
    (reminder, cycleKey) => {
      if (!reminder?.id || toastShownRef.current.has(reminder.id)) return;
      if (wasToastShown(reminder.id, cycleKey)) return;
      toastShownRef.current.add(reminder.id);
      markToastShown(reminder.id, cycleKey);

      const toastId = `${TOAST_ID_PREFIX}${reminder.id}`;
      playReminderChime();

      toast(
        ({ closeToast: close }) => (
          <ReminderToastContent
            reminder={reminder}
            onDone={async () => {
              try {
                await actOnDoctorReminder(reminder.id, { action: 'done' });
              } catch {
                /* keep UI responsive */
              }
              closeToast(reminder.id);
              close();
              dispatchReminderInboxRefresh();
              dispatchReminderDashboardRefresh();
            }}
            onSnooze={async () => {
              try {
                await actOnDoctorReminder(reminder.id, {
                  action: 'snooze',
                  snoozeMinutes: REMINDER_SNOOZE_MINUTES,
                });
              } catch {
                /* keep UI responsive */
              }
              closeToast(reminder.id);
              close();
              dispatchReminderDashboardRefresh();
            }}
            onView={() => {
              closeToast(reminder.id);
              close();
              openDoctorReminder({
                reminderDate: reminder.date,
                reminderId: reminder.id,
                openView: true,
                navigate,
              });
            }}
          />
        ),
        {
          toastId,
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: true,
          className: 'doctor-reminder-toast',
          position: 'top-right',
        }
      );
    },
    [closeToast, navigate]
  );

  const scanDueReminders = useCallback(async () => {
    if (!isDoctor || scanningRef.current) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

    scanningRef.current = true;
    try {
      const today = moment().format(API_DATE);
      const res = await listDoctorReminders({ from: today, to: today });
      const rows = Array.isArray(res?.data) ? res.data.map(mapDoctorReminder) : [];
      const now = moment();
      const due = rows.filter((r) => isReminderDueNow(r, now));

      for (const reminder of due) {
        if (inFlightRef.current.has(reminder.id)) continue;
        inFlightRef.current.add(reminder.id);
        try {
          const result = await actOnDoctorReminder(reminder.id, { action: 'fire' });
          const payload = result?.data && typeof result.data === 'object' ? result.data : result;
          const notified = Boolean(payload?.notified);
          const cycleKey =
            payload?.lastNotifiedAt ||
            reminder.lastNotifiedAt ||
            moment().toISOString();
          if (notified) {
            clearReminderAlertDismiss(reminder.id);
            showFireToast(reminder, cycleKey);
            dispatchReminderInboxRefresh();
            dispatchReminderDashboardRefresh();
          }
        } catch {
          /* next poll retries */
        } finally {
          inFlightRef.current.delete(reminder.id);
        }
      }
    } catch {
      /* silent — dashboard list remains source of truth */
    } finally {
      scanningRef.current = false;
    }
  }, [isDoctor, showFireToast]);

  useEffect(() => {
    if (!isDoctor) return undefined;

    scanDueReminders();
    const timer = window.setInterval(scanDueReminders, REMINDER_FIRE_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') scanDueReminders();
    };
    const onFocus = () => scanDueReminders();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [isDoctor, scanDueReminders]);

  if (!isDoctor) return null;

  return (
    <ToastContainer
      position="top-right"
      newestOnTop
      limit={3}
      closeOnClick={false}
      pauseOnHover
      pauseOnFocusLoss
      style={{ zIndex: 10900 }}
    />
  );
};

export default DoctorReminderFireWatcher;
