import React, { useCallback, useEffect, useRef } from 'react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './doctorReminderFire.css';

import { UserRole } from '../constants/roles';
import { actOnDoctorReminder } from '../../helpers/s5Week5Api';
import {
  REMINDER_SNOOZE_MINUTES,
  dispatchReminderDashboardRefresh,
  dispatchReminderInboxRefresh,
  formatReminderTimeDisplay,
  mapDoctorReminder,
  clearReminderAlertDismiss,
  openDoctorReminder,
  playReminderChime,
} from '../../helpers/doctorReminderFire';
import {
  REMINDER_DUE_EVENT_NAME,
  ensureClinicRealtime,
  subscribeReminderDue,
} from '../../helpers/clinicRealtime';

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

const mapDuePayload = (payload) => {
  const raw = payload?.detail && typeof payload.detail === 'object' ? payload.detail : payload;
  if (!raw || typeof raw !== 'object') return null;
  if (raw.notified === false) return null;
  const id = raw.doctorReminderId ?? raw.DoctorReminderId;
  if (id == null) return null;
  return mapDoctorReminder({
    doctorReminderId: id,
    reminderDate: raw.reminderDate ?? raw.ReminderDate ?? moment().format('YYYY-MM-DD'),
    reminderTime: raw.reminderTime ?? raw.ReminderTime ?? null,
    title: raw.title ?? raw.Title ?? 'Reminder due',
    description: raw.description ?? raw.Description ?? '',
    contactNumber: raw.contactNumber ?? raw.ContactNumber ?? '',
    isDone: false,
    lastNotifiedAt: raw.lastNotifiedAt ?? raw.LastNotifiedAt ?? moment().toISOString(),
  });
};

/**
 * Global doctor-web watcher: server fires due reminders and pushes SignalR reminderDue.
 * No polling — toast appears as soon as the hub event arrives.
 */
const DoctorReminderFireWatcher = () => {
  const navigate = useNavigate();
  const loginUser = useSelector((state) => state?.Login?.user);
  const role = readSessionRole(loginUser);
  const isDoctor = role === UserRole.DOCTOR;

  const toastShownRef = useRef(new Set());

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

  const handleDuePayload = useCallback(
    (payload) => {
      const reminder = mapDuePayload(payload);
      if (!reminder) return;
      clearReminderAlertDismiss(reminder.id);
      const cycleKey = reminder.lastNotifiedAt || moment().toISOString();
      showFireToast(reminder, cycleKey);
      dispatchReminderInboxRefresh();
      dispatchReminderDashboardRefresh();
    },
    [showFireToast]
  );

  useEffect(() => {
    if (!isDoctor) return undefined;

    ensureClinicRealtime();
    const unsub = subscribeReminderDue(handleDuePayload);
    const onWindowDue = (evt) => handleDuePayload(evt?.detail || evt);
    window.addEventListener(REMINDER_DUE_EVENT_NAME, onWindowDue);

    return () => {
      unsub();
      window.removeEventListener(REMINDER_DUE_EVENT_NAME, onWindowDue);
    };
  }, [isDoctor, handleDuePayload]);

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
