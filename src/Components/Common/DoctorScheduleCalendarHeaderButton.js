import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ModalBody, ModalHeader, Spinner } from 'reactstrap';
import moment from 'moment';
import { UserRole } from '../constants/roles';
import {
  getAuthDoctorId,
  getSlotStatusSummary,
  normalizeAppointmentSlotsResponse,
} from '../../helpers/appointmentSlotHelper';
import { getAppointmentSlots, getAvailabilityMe } from '../../helpers/realbackend_helper';
import {
  DOCTOR_DASHBOARD_OPEN_SCHEDULE_CALENDAR_EVENT,
  DOCTOR_SCHEDULE_CHANGED_EVENT,
} from '../../helpers/dashboard_helper';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const POLL_MS = 30000;

const getWeekStart = (anchor) => moment(anchor).startOf('isoWeek');

const buildWeekDays = (weekStart) =>
  Array.from({ length: 7 }, (_, index) => weekStart.clone().add(index, 'day'));

const statusLabel = {
  available: 'Available',
  booked: 'Booked',
  break: 'Break',
  past: 'Past',
  current: 'Current',
};

const slotStatusClass = (status) => {
  const key = String(status || '').toLowerCase();
  if (key === 'booked' || key === 'current') return 'booked';
  if (key === 'break') return 'break';
  if (key === 'past') return 'past';
  if (key === 'available') return 'available';
  return 'empty';
};

const DoctorScheduleCalendarHeaderButton = ({ userRole }) => {
  const isDoctor = userRole === UserRole.DOCTOR;
  const [modalOpen, setModalOpen] = useState(false);
  const [weekAnchor, setWeekAnchor] = useState(() => moment().startOf('day'));
  const [selectedDate, setSelectedDate] = useState(() => moment().startOf('day'));
  const [loading, setLoading] = useState(false);
  const [daySchedule, setDaySchedule] = useState(null);
  const [scheduledDates, setScheduledDates] = useState(() => new Set());
  const [loadError, setLoadError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const requestIdRef = useRef(0);

  const weekStart = useMemo(() => getWeekStart(weekAnchor), [weekAnchor]);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const weekRangeLabel = useMemo(() => {
    const end = weekStart.clone().add(6, 'day');
    return `${weekStart.format('D MMM')} – ${end.format('D MMM YYYY')}`;
  }, [weekStart]);

  const slotSummary = useMemo(
    () => getSlotStatusSummary(daySchedule?.slots || []),
    [daySchedule]
  );

  const resolveDoctorId = useCallback(async () => {
    const fromAuth = getAuthDoctorId();
    if (fromAuth) return Number(fromAuth);
    try {
      const me = await getAvailabilityMe();
      const data = me?.data ?? me?.Data ?? me;
      const id = data?.doctorId ?? data?.DoctorId;
      return id ? Number(id) : null;
    } catch {
      return null;
    }
  }, []);

  const loadWeekMarkers = useCallback(async () => {
    try {
      const me = await getAvailabilityMe();
      const data = me?.data ?? me?.Data ?? me;
      const rows = data?.weekSchedules ?? data?.WeekSchedules ?? [];
      const next = new Set();
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        const raw = row?.scheduleDate ?? row?.ScheduleDate;
        if (!raw) return;
        const key = moment(raw).format('YYYY-MM-DD');
        if (key && key !== 'Invalid date') next.add(key);
      });
      setScheduledDates(next);
    } catch {
      // Selected-day slots still load from GetAppointmentSlots.
    }
  }, []);

  const loadSelectedDaySchedule = useCallback(async ({ silent = false } = {}) => {
    const dateKey = selectedDate.format('YYYY-MM-DD');
    const requestId = ++requestIdRef.current;
    if (!silent) {
      setLoading(true);
      setLoadError('');
    }

    try {
      const doctorId = await resolveDoctorId();
      if (!doctorId) {
        if (requestId !== requestIdRef.current) return;
        setDaySchedule({ hasSchedule: false, slots: [], workStartTime: null, workEndTime: null });
        setLoadError('Doctor profile not found for this login.');
        return;
      }

      const response = await getAppointmentSlots({
        doctorId,
        appointmentDate: dateKey,
      });
      if (requestId !== requestIdRef.current) return;

      const normalized = normalizeAppointmentSlotsResponse(response);
      setDaySchedule(normalized);
      setLastSyncedAt(moment());
      setScheduledDates((prev) => {
        const next = new Set(prev);
        if (normalized.hasSchedule) next.add(dateKey);
        else next.delete(dateKey);
        return next;
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error(`Failed to load schedule for ${dateKey}:`, error);
      setDaySchedule({ hasSchedule: false, slots: [], workStartTime: null, workEndTime: null });
      setLoadError(typeof error === 'string' ? error : error?.message || 'Could not load schedule.');
    } finally {
      if (requestId === requestIdRef.current && !silent) {
        setLoading(false);
      }
    }
  }, [resolveDoctorId, selectedDate]);

  const refreshAll = useCallback(
    async ({ silent = false } = {}) => {
      await Promise.all([loadWeekMarkers(), loadSelectedDaySchedule({ silent })]);
    },
    [loadWeekMarkers, loadSelectedDaySchedule]
  );

  useEffect(() => {
    if (!modalOpen) return undefined;
    refreshAll({ silent: false });
    return undefined;
  }, [modalOpen, refreshAll]);

  useEffect(() => {
    if (!modalOpen) return undefined;

    const poll = () => {
      if (document.visibilityState === 'hidden') return;
      loadSelectedDaySchedule({ silent: true });
    };

    const timer = window.setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshAll({ silent: true });
    };
    const onScheduleChanged = () => refreshAll({ silent: true });

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener(DOCTOR_SCHEDULE_CHANGED_EVENT, onScheduleChanged);
    window.addEventListener('focus', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(DOCTOR_SCHEDULE_CHANGED_EVENT, onScheduleChanged);
      window.removeEventListener('focus', onVisible);
    };
  }, [modalOpen, loadSelectedDaySchedule, refreshAll]);

  const openModal = useCallback(() => {
    const today = moment().startOf('day');
    setWeekAnchor(today.clone());
    setSelectedDate(today.clone());
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (!isDoctor) return undefined;
    const onOpenScheduleCalendar = () => openModal();
    window.addEventListener(DOCTOR_DASHBOARD_OPEN_SCHEDULE_CALENDAR_EVENT, onOpenScheduleCalendar);
    return () => {
      window.removeEventListener(DOCTOR_DASHBOARD_OPEN_SCHEDULE_CALENDAR_EVENT, onOpenScheduleCalendar);
    };
  }, [isDoctor, openModal]);

  if (!isDoctor) {
    return null;
  }

  const closeModal = () => setModalOpen(false);

  const selectDay = (day) => {
    const next = day.clone().startOf('day');
    setSelectedDate(next);
    setWeekAnchor(next.clone());
  };

  /** Move one day. On the last day of the week, next advances into the following week. */
  const shiftDay = (direction) => {
    selectDay(selectedDate.clone().add(direction, 'day'));
  };

  const shiftWeek = (direction) => {
    const lastDayOfWeek = weekStart.clone().add(6, 'day');
    const firstDayOfWeek = weekStart.clone();
    // From the last visible day, next arrow goes to the next calendar day (new week).
    if (direction > 0 && selectedDate.isSame(lastDayOfWeek, 'day')) {
      shiftDay(1);
      return;
    }
    if (direction < 0 && selectedDate.isSame(firstDayOfWeek, 'day')) {
      shiftDay(-1);
      return;
    }
    setWeekAnchor((prev) => {
      const nextWeekStart = getWeekStart(prev).add(direction * 7, 'day');
      const weekdayOffset = selectedDate.clone().startOf('day').diff(getWeekStart(selectedDate), 'days');
      setSelectedDate(nextWeekStart.clone().add(weekdayOffset, 'day'));
      return nextWeekStart;
    });
  };

  const goToPreviousPeriod = () => {
    setWeekAnchor((prev) => {
      const nextWeekStart = getWeekStart(prev).subtract(1, 'month').startOf('isoWeek');
      setSelectedDate(nextWeekStart.clone());
      return nextWeekStart;
    });
  };

  const handleRefresh = () => {
    if (loading) return;
    refreshAll({ silent: false });
  };

  const slots = daySchedule?.slots || [];
  const hoursNote =
    daySchedule?.hasSchedule && daySchedule.workStartTime && daySchedule.workEndTime
      ? `${moment(daySchedule.workStartTime, ['HH:mm:ss', 'HH:mm']).format('hh:mm A')} – ${moment(
          daySchedule.workEndTime,
          ['HH:mm:ss', 'HH:mm']
        ).format('hh:mm A')}${
          daySchedule.intervalMinutes ? ` · ${daySchedule.intervalMinutes} min slots` : ''
        }`
      : null;

  return (
    <>
      <div className="ms-1 header-item">
        <button
          type="button"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
          title="Doctor Schedule Calendar"
          aria-label="Doctor Schedule Calendar"
          onClick={openModal}
        >
          <i className="ri-calendar-2-line fs-20" />
        </button>
      </div>

      <Modal
        isOpen={modalOpen}
        toggle={closeModal}
        centered
        className="patient-list-modal doctor-schedule-calendar-modal doctor-schedule-calendar-modal--compact"
        backdrop="static"
      >
        <ModalHeader className="patient-list-modal__header" toggle={closeModal}>
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i className="ri-calendar-2-line" style={{ color: '#25a0e2', fontSize: 15 }} aria-hidden="true" />
            <span className="patient-list-modal__title-text">My Schedule</span>
          </span>
        </ModalHeader>
        <ModalBody>
          <div className="doctor-schedule-calendar doctor-schedule-calendar--compact">
            <div className="doctor-schedule-calendar__toolbar">
              <button
                type="button"
                className="doctor-schedule-calendar__nav-btn"
                onClick={goToPreviousPeriod}
                aria-label="Previous month"
              >
                <i className="ri-arrow-left-s-line" />
              </button>

              <div className="doctor-schedule-calendar__range">
                <span>{weekRangeLabel}</span>
                <button
                  type="button"
                  className="doctor-schedule-calendar__range-next"
                  onClick={() => shiftDay(1)}
                  aria-label="Next day"
                  title="Next day"
                >
                  <i className="ri-arrow-right-s-line" aria-hidden="true" />
                </button>
              </div>

              <div className="doctor-schedule-calendar__week-nav">
                <button
                  type="button"
                  className="doctor-schedule-calendar__nav-btn doctor-schedule-calendar__nav-btn--sm"
                  onClick={() => shiftWeek(-1)}
                  aria-label="Previous week"
                  title="Previous week"
                >
                  <i className="ri-arrow-left-s-line" />
                </button>
                <button
                  type="button"
                  className="doctor-schedule-calendar__nav-btn doctor-schedule-calendar__nav-btn--sm"
                  onClick={() => shiftWeek(1)}
                  aria-label="Next week"
                  title="Next week"
                >
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
            </div>

            <div className="doctor-schedule-calendar__days">
              {weekDays.map((day) => {
                const key = day.format('YYYY-MM-DD');
                const isSelected = selectedDate.isSame(day, 'day');
                const hasHours = scheduledDates.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`doctor-schedule-calendar__day-btn${isSelected ? ' is-selected' : ''}${
                      hasHours ? ' has-schedule' : ''
                    }`}
                    onClick={() => selectDay(day)}
                    title={hasHours ? 'Hours set in profile / daily schedule' : 'No hours saved for this day'}
                  >
                    <span>
                      {WEEKDAY_LABELS[day.isoWeekday() - 1]} {day.format('D')}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="doctor-schedule-calendar__meta">
              <span>{hoursNote || selectedDate.format('ddd D MMM YYYY')}</span>
              <span className="doctor-schedule-calendar__synced">
                {lastSyncedAt ? <span>Synced {lastSyncedAt.format('hh:mm:ss A')}</span> : null}
                <button
                  type="button"
                  className="doctor-schedule-calendar__refresh-btn"
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="Refresh schedule"
                  title="Refresh latest schedule"
                >
                  <i className={`ri-refresh-line${loading ? ' spinning' : ''}`} aria-hidden="true" />
                  Refresh
                </button>
              </span>
            </div>

            {daySchedule?.hasSchedule ? (
              <div className="doctor-schedule-calendar__summary">
                <span>{slotSummary.total} slots</span>
                <span>{slotSummary.available} available</span>
                <span>{slotSummary.booked + slotSummary.current} booked</span>
                <span>{slotSummary.break} break</span>
              </div>
            ) : null}

            {loading ? (
              <div className="doctor-schedule-calendar__loading">
                <Spinner size="sm" color="primary" />
                <span>Loading schedule...</span>
              </div>
            ) : (
              <div className="doctor-schedule-calendar__grid-wrap">
                <div className="doctor-schedule-calendar__day-list">
                  {loadError ? (
                    <div className="doctor-schedule-calendar__empty-note text-danger">{loadError}</div>
                  ) : null}
                  {!daySchedule?.hasSchedule && !loadError ? (
                    <div className="doctor-schedule-calendar__empty-note">
                      No schedule configured for this day. Set hours in Profile → Clinic Availability or
                      Appointment Slots.
                    </div>
                  ) : null}
                  {slots.map((slot) => {
                    const status = String(slot.status || 'available').toLowerCase();
                    const tone = slotStatusClass(status);
                    const label = slot.label || moment(slot.time, ['HH:mm:ss', 'HH:mm']).format('hh:mm A');
                    return (
                      <div key={`${slot.time}-${status}-${slot.patientAppId || ''}`} className="doctor-schedule-calendar__day-row">
                        <div className="doctor-schedule-calendar__hour">{label}</div>
                        <div className="doctor-schedule-calendar__cell">
                          <div className={`doctor-schedule-calendar__slot doctor-schedule-calendar__slot--${tone}`}>
                            <span>{statusLabel[status] || statusLabel.available}</span>
                            {slot.patientName ? (
                              <small className="doctor-schedule-calendar__slot-patient">{slot.patientName}</small>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="doctor-schedule-calendar__legend">
              <span className="doctor-schedule-calendar__legend-item">
                <span className="doctor-schedule-calendar__legend-swatch available" />
                Available
              </span>
              <span className="doctor-schedule-calendar__legend-item">
                <span className="doctor-schedule-calendar__legend-swatch booked" />
                Booked
              </span>
              <span className="doctor-schedule-calendar__legend-item">
                <span className="doctor-schedule-calendar__legend-swatch break" />
                Break
              </span>
              <span className="doctor-schedule-calendar__legend-item">
                <span className="doctor-schedule-calendar__legend-swatch past" />
                Past
              </span>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
};

export default DoctorScheduleCalendarHeaderButton;
