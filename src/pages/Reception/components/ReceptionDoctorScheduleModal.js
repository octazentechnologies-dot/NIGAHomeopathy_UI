import React, { useEffect, useMemo, useState } from "react";
import {
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "reactstrap";
import Select from "react-select";
import moment from "moment";
import ModalActionButton from "../../../Components/Common/ModalActionButton";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEMO_DOCTORS = [
  { value: "doc-1", label: "Dr. Priya Sharma" },
  { value: "doc-2", label: "Dr. Rahul Mehta" },
  { value: "doc-3", label: "Dr. Anjali Kulkarni" },
];

const DEMO_SLOT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

const buildDemoSlots = (selectedDate) => {
  const isToday = selectedDate.isSame(moment(), "day");
  const nowHour = moment().hour();
  return DEMO_SLOT_HOURS.map((hour, index) => {
    let status = "available";
    if (isToday && hour < nowHour) status = "past";
    else if (index === 2 || index === 5) status = "booked";
    else if (index === 4) status = "break";
    return {
      hour,
      time: moment({ hour, minute: 0 }).format("HH:mm:ss"),
      label: moment({ hour, minute: 0 }).format("hh:mm A"),
      status,
    };
  });
};

const getWeekStart = (anchor) => moment(anchor).startOf("isoWeek");
const buildWeekDays = (weekStart) =>
  Array.from({ length: 7 }, (_, index) => weekStart.clone().add(index, "day"));

const DOCTOR_MODAL_SELECT_MENU_Z = 10600;
const selectPortalProps = {
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed",
  className: "react-select-container",
  classNamePrefix: "react-select",
};
const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: DOCTOR_MODAL_SELECT_MENU_Z }),
  indicatorSeparator: () => ({ display: "none" }),
};

const statusLabel = {
  available: "Available",
  booked: "Booked",
  break: "Break",
  past: "Past",
};

const ReceptionDoctorScheduleModal = ({
  isOpen,
  toggle,
  selectedPatient,
  initialSchedule = null,
  editMode = false,
  onScheduleConfirmed,
}) => {
  const [weekAnchor, setWeekAnchor] = useState(() => moment().startOf("day"));
  const [selectedDate, setSelectedDate] = useState(() => moment().startOf("day"));
  const [selectedDoctor, setSelectedDoctor] = useState(DEMO_DOCTORS[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  const weekStart = useMemo(() => getWeekStart(weekAnchor), [weekAnchor]);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const weekRangeLabel = useMemo(() => {
    const end = weekStart.clone().add(6, "day");
    return `${weekStart.format("D MMM")} – ${end.format("D MMM YYYY")}`;
  }, [weekStart]);

  const slots = useMemo(() => buildDemoSlots(selectedDate), [selectedDate]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialSchedule?.doctor) {
      const matchedDoctor =
        DEMO_DOCTORS.find((doctor) => doctor.label === initialSchedule.doctor.label) ||
        initialSchedule.doctor;
      setSelectedDoctor(matchedDoctor);
    } else {
      setSelectedDoctor(DEMO_DOCTORS[0]);
    }

    if (initialSchedule?.date) {
      const parsed = moment(initialSchedule.date, "YYYY-MM-DD", true);
      if (parsed.isValid()) {
        setSelectedDate(parsed.clone().startOf("day"));
        setWeekAnchor(parsed.clone().startOf("day"));
      }
    }

    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(timer);
  }, [isOpen, initialSchedule]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSlot(null);
      return;
    }
    if (!initialSchedule?.slot?.label) {
      setSelectedSlot(null);
      return;
    }
    const match = slots.find(
      (slot) =>
        slot.label === initialSchedule.slot.label ||
        slot.time === initialSchedule.slot.time
    );
    if (match) {
      setSelectedSlot({ ...match, status: "available" });
    } else {
      setSelectedSlot({
        ...initialSchedule.slot,
        status: "available",
        label: initialSchedule.slot.label,
      });
    }
  }, [isOpen, slots, initialSchedule]);

  const resetAndClose = () => {
    setSelectedSlot(null);
    toggle();
  };

  const shiftWeek = (direction) => {
    setWeekAnchor((prev) => {
      const nextWeekStart = getWeekStart(prev).add(direction * 7, "day");
      const weekdayOffset = selectedDate
        .clone()
        .startOf("day")
        .diff(getWeekStart(selectedDate), "days");
      setSelectedDate(nextWeekStart.clone().add(weekdayOffset, "day"));
      return nextWeekStart;
    });
  };

  const selectDay = (day) => {
    const next = day.clone().startOf("day");
    setSelectedDate(next);
    setWeekAnchor(next.clone());
    setSelectedSlot(null);
  };

  const handleSlotClick = (slot) => {
    if (slot.status !== "available") return;
    setSelectedSlot(slot);
  };

  const handleNext = () => {
    if (!selectedDoctor || !selectedSlot) return;
    onScheduleConfirmed?.({
      doctor: selectedDoctor,
      date: selectedDate.format("YYYY-MM-DD"),
      dateDisplay: selectedDate.format("DD MMM YYYY"),
      slot: selectedSlot,
      patient: selectedPatient,
    });
    resetAndClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={resetAndClose}
      centered
      size="lg"
      className="patient-list-modal doctor-schedule-calendar-modal doctor-schedule-calendar-modal--compact reception-doctor-schedule-modal"
      backdrop="static"
    >
      <ModalHeader className="patient-list-modal__header" toggle={resetAndClose}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-calendar-2-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">
            {editMode ? "Edit Doctor Schedule" : "Doctor Schedule"}
          </span>
        </span>
      </ModalHeader>

      <ModalBody>
        {selectedPatient?.fullName ? (
          <div className="reception-schedule-patient-banner mb-3">
            <i className="ri-user-heart-line" aria-hidden="true" />
            <div>
              <strong>{selectedPatient.fullName}</strong>
              <span>
                {selectedPatient.age || "—"} / {selectedPatient.sex || "—"}
                {selectedPatient.mobileNo ? ` · ${selectedPatient.mobileNo}` : ""}
              </span>
            </div>
          </div>
        ) : null}

        <div className="mb-3">
          <Label className="form-label new-patient-modal__label mb-1">
            <i className="ri-stethoscope-line" aria-hidden="true" />
            Select Doctor <span className="text-danger">*</span>
          </Label>
          <Select
            value={selectedDoctor}
            onChange={(option) => {
              setSelectedDoctor(option);
              setSelectedSlot(null);
            }}
            options={DEMO_DOCTORS}
            placeholder="Select doctor..."
            isSearchable
            {...selectPortalProps}
            styles={selectStyles}
          />
        </div>

        <div className="doctor-schedule-calendar doctor-schedule-calendar--compact">
          <div className="doctor-schedule-calendar__toolbar">
            <button
              type="button"
              className="doctor-schedule-calendar__nav-btn"
              onClick={() => shiftWeek(-1)}
              aria-label="Previous week"
            >
              <i className="ri-arrow-left-s-line" />
            </button>

            <div className="doctor-schedule-calendar__range">
              <span>{weekRangeLabel}</span>
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
              const isSelected = selectedDate.isSame(day, "day");
              return (
                <button
                  key={day.format("YYYY-MM-DD")}
                  type="button"
                  className={`doctor-schedule-calendar__day-btn${isSelected ? " is-selected" : ""}`}
                  onClick={() => selectDay(day)}
                >
                  <span>
                    {WEEKDAY_LABELS[day.isoWeekday() - 1]} {day.format("D")}
                  </span>
                </button>
              );
            })}
          </div>

          {!selectedDoctor ? (
            <div className="text-muted text-center py-4">Select a doctor to view schedule.</div>
          ) : loading ? (
            <div className="doctor-schedule-calendar__loading">
              <Spinner size="sm" color="primary" />
              <span>Loading schedule...</span>
            </div>
          ) : (
            <div className="doctor-schedule-calendar__grid-wrap">
              <div className="doctor-schedule-calendar__day-list">
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.time === slot.time;
                  const canSelect = slot.status === "available";
                  return (
                    <div key={slot.time} className="doctor-schedule-calendar__day-row">
                      <div className="doctor-schedule-calendar__hour">{slot.label}</div>
                      <div className="doctor-schedule-calendar__cell">
                        <button
                          type="button"
                          className={`doctor-schedule-calendar__slot doctor-schedule-calendar__slot--${slot.status}${
                            isSelected ? " is-selected" : ""
                          }`}
                          disabled={!canSelect}
                          onClick={() => handleSlotClick(slot)}
                        >
                          {statusLabel[slot.status] || slot.status}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="doctor-schedule-calendar__legend">
            <span>
              <i className="doctor-schedule-calendar__dot doctor-schedule-calendar__dot--available" /> Available
            </span>
            <span>
              <i className="doctor-schedule-calendar__dot doctor-schedule-calendar__dot--booked" /> Booked
            </span>
            <span>
              <i className="doctor-schedule-calendar__dot doctor-schedule-calendar__dot--break" /> Break
            </span>
          </div>
        </div>

        {selectedSlot ? (
          <div className="reception-schedule-selected-slot mt-3">
            <i className="ri-checkbox-circle-line" aria-hidden="true" />
            <span>
              Allotted: <strong>{selectedDoctor?.label}</strong> · {selectedDate.format("DD MMM YYYY")} ·{" "}
              <strong>{selectedSlot.label}</strong>
            </span>
          </div>
        ) : null}
      </ModalBody>

      <ModalFooter className="reception-patient-details-footer">
        <ModalActionButton action="cancel" type="button" onClick={resetAndClose}>
          Cancel
        </ModalActionButton>
        <ModalActionButton
          action={editMode ? "save" : "update"}
          type="button"
          iconClassName={editMode ? "ri-save-line" : "ri-arrow-right-line"}
          disabled={!selectedDoctor || !selectedSlot}
          onClick={handleNext}
        >
          {editMode ? "Save" : "Next"}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export default ReceptionDoctorScheduleModal;
