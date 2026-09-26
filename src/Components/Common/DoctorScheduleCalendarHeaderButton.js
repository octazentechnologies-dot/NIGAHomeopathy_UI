import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ModalBody, ModalHeader, Spinner } from 'reactstrap';
import moment from 'moment';
import { UserRole } from '../constants/roles';
import {
  getAuthDoctorId,
  normalizeAppointmentSlotsResponse,
} from '../../helpers/appointmentSlotHelper';
import { getAppointmentSlots } from '../../helpers/realbackend_helper';
import { DOCTOR_DASHBOARD_OPEN_SCHEDULE_CALENDAR_EVENT } from '../../helpers/dashboard_helper';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_HOUR_START = 9;
const DEFAULT_HOUR_END = 21;

const getWeekStart = (anchor) => moment(anchor).startOf('isoWeek');

const buildWeekDays = (weekStart) =>
  Array.from({ length: 7 }, (_, index) => weekStart.clone().add(index, 'day'));

const hourLabel = (hour) => moment({ hour, minute: 0 }).format('hh:mm A');

const resolveHourStatus = (hourSlots = []) => {
  if (!hourSlots.length) return null;
  const statuses = hourSlots.map((slot) => String(slot.status || '').toLowerCase());
  if (statuses.some((status) => status === 'booked' || status === 'current')) {
    return 'booked';
  }
  if (statuses.some((status) => status === 'break')) {
    return 'break';
  }
  if (statuses.some((status) => status === 'available')) {
    return 'available';
  }
  if (statuses.every((status) => status === 'past')) {
    return 'available';
  }
  return null;
};

const DoctorScheduleCalendarHeaderButton = ({ userRole }) => {
  const isDoctor = userRole === UserRole.DOCTOR;
  const [modalOpen, setModalOpen] = useState(false);
  const [weekAnchor, setWeekAnchor] = useState(() => moment().startOf('day'));
  const [selectedDate, setSelectedDate] = useState(() => moment().startOf('day'));
  const [loading, setLoading] = useState(false);
  const [daySchedule, setDaySchedule] = useState(null);

  const weekStart = useMemo(() => getWeekStart(weekAnchor), [weekAnchor]);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const weekRangeLabel = useMemo(() => {
    const end = weekStart.clone().add(6, 'day');
    return `${weekStart.format('D MMM')} – ${end.format('D MMM YYYY')}`;
  }, [weekStart]);

  const hourRows = useMemo(() => {
    let minHour = DEFAULT_HOUR_START;
    let maxHour = DEFAULT_HOUR_END;
    if (daySchedule?.hasSchedule) {
      const start = moment(daySchedule.workStartTime, ['HH:mm:ss', 'HH:mm'], true);
      const end = moment(daySchedule.workEndTime, ['HH:mm:ss', 'HH:mm'], true);
      if (start.isValid()) minHour = start.hour();
      if (end.isValid()) {
        maxHour = end.minute() > 0 || end.second() > 0 ? end.hour() : Math.max(end.hour() - 1, minHour);
      }
    }
    const hours = [];
    for (let hour = minHour; hour <= maxHour; hour += 1) {
      hours.push(hour);
    }
    return hours.length ? hours : [9, 10, 11, 12, 13, 14, 15];
  }, [daySchedule]);

  const loadSelectedDaySchedule = useCallback(async () => {
    const doctorId = getAuthDoctorId();
    const dateKey = selectedDate.format('YYYY-MM-DD');
    if (!doctorId) {
      setDaySchedule({ hasSchedule: false, slots: [], workStartTime: null, workEndTime: null });
      return;
    }

    setLoading(true);
    try {
      const response = await getAppointmentSlots({
        doctorId,
        appointmentDate: dateKey,
      });
      setDaySchedule(normalizeAppointmentSlotsResponse(response));
    } catch (error) {
      console.error(`Failed to load schedule for ${dateKey}:`, error);
      setDaySchedule({ hasSchedule: false, slots: [], workStartTime: null, workEndTime: null });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    loadSelectedDaySchedule();
    return undefined;
  }, [modalOpen, loadSelectedDaySchedule]);

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

  const shiftWeek = (direction) => {
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

  const selectDay = (day) => {
    const next = day.clone().startOf('day');
    setSelectedDate(next);
    setWeekAnchor(next.clone());
  };

  const getHourStatus = (hour) => {
    if (!daySchedule?.hasSchedule) return null;

    const hourSlots = (daySchedule.slots || []).filter((slot) => {
      const slotMoment = moment(slot.time, ['HH:mm:ss', 'HH:mm', 'hh:mm A'], true);
      return slotMoment.isValid() && slotMoment.hour() === hour;
    });

    const status = resolveHourStatus(hourSlots);
    if (status) return status;

    const workStart = moment(daySchedule.workStartTime, ['HH:mm:ss', 'HH:mm'], true);
    const workEnd = moment(daySchedule.workEndTime, ['HH:mm:ss', 'HH:mm'], true);
    if (workStart.isValid() && workEnd.isValid()) {
      const hourStart = selectedDate.clone().hour(hour).minute(0).second(0);
      const hourEnd = hourStart.clone().add(1, 'hour');
      if (hourEnd.isAfter(workStart) && hourStart.isBefore(workEnd)) {
        return 'break';
      }
    }
    return null;
  };

  const statusLabel = {
    available: 'Available',
    booked: 'Booked',
    break: 'Break',
  };

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
                <i className="ri-arrow-right-s-line" aria-hidden="true" />
              </div>

              <div className="doctor-schedule-calendar__week-nav">
                <button
                  type="button"
                  className="doctor-schedule-calendar__nav-btn doctor-schedule-calendar__nav-btn--sm"
                  onClick={() => shiftWeek(-1)}
                  aria-label="Previous week"
                >
                  <i className="ri-arrow-left-s-line" />
                </button>
                <button
                  type="button"
                  className="doctor-schedule-calendar__nav-btn doctor-schedule-calendar__nav-btn--sm"
                  onClick={() => shiftWeek(1)}
                  aria-label="Next week"
                >
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
            </div>

            <div className="doctor-schedule-calendar__days">
              {weekDays.map((day) => {
                const isSelected = selectedDate.isSame(day, 'day');
                return (
                  <button
                    key={day.format('YYYY-MM-DD')}
                    type="button"
                    className={`doctor-schedule-calendar__day-btn${isSelected ? ' is-selected' : ''}`}
                    onClick={() => selectDay(day)}
                  >
                    <span>{WEEKDAY_LABELS[day.isoWeekday() - 1]} {day.format('D')}</span>
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="doctor-schedule-calendar__loading">
                <Spinner size="sm" color="primary" />
                <span>Loading schedule...</span>
              </div>
            ) : (
              <div className="doctor-schedule-calendar__grid-wrap">
                <div className="doctor-schedule-calendar__day-list">
                  {hourRows.map((hour) => {
                    const status = getHourStatus(hour);
                    return (
                      <div key={`hour-${hour}`} className="doctor-schedule-calendar__day-row">
                        <div className="doctor-schedule-calendar__hour">{hourLabel(hour)}</div>
                        <div className="doctor-schedule-calendar__cell">
                          {status ? (
                            <div className={`doctor-schedule-calendar__slot doctor-schedule-calendar__slot--${status}`}>
                              {statusLabel[status]}
                            </div>
                          ) : (
                            <div className="doctor-schedule-calendar__slot doctor-schedule-calendar__slot--empty" aria-hidden="true" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!daySchedule?.hasSchedule ? (
                    <div className="doctor-schedule-calendar__empty-note">
                      No schedule configured for this day.
                    </div>
                  ) : null}
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
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
};

export default DoctorScheduleCalendarHeaderButton;
