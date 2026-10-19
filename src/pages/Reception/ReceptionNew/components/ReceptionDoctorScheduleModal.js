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
import ModalActionButton from "../../../../Components/Common/ModalActionButton";
import { getAppointmentSlots, getDoctorList } from "../../../../helpers/realbackend_helper";
import { normalizeAppointmentSlotsResponse } from "../../../../helpers/appointmentSlotHelper";
import { getAuthUserId } from "../../../../helpers/menuByRole";
import { readReceptionDoctorId, unwrap } from "../../receptionSession";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const doctorLabel = (row) => {
  const named = row.doctorName || row.DoctorName || [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
  const text = String(named || "").trim();
  if (!text) return "";
  return /^dr\.?\s/i.test(text) ? text : `Dr. ${text}`;
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
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotNote, setSlotNote] = useState("");

  const weekStart = useMemo(() => getWeekStart(weekAnchor), [weekAnchor]);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const weekRangeLabel = useMemo(() => {
    const end = weekStart.clone().add(6, "day");
    return `${weekStart.format("D MMM")} – ${end.format("D MMM YYYY")}`;
  }, [weekStart]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    const loadDoctors = async () => {
      const userId = getAuthUserId();
      const fallbackId = readReceptionDoctorId();
      let options = [];
      try {
        if (userId) {
          const response = await getDoctorList({ userId });
          const body = unwrap(response);
          const list = Array.isArray(body) ? body : body.data || body.Data || [];
          options = (Array.isArray(list) ? list : [])
            .map((row) => {
              const id = Number(row.doctorID ?? row.doctorId ?? row.DoctorID ?? row.DoctorId);
              if (!id) return null;
              return { value: id, label: doctorLabel(row) || `Doctor ${id}` };
            })
            .filter(Boolean);
        }
      } catch {
        options = [];
      }
      if (!options.length && fallbackId) {
        options = [{ value: Number(fallbackId), label: "Clinic doctor" }];
      }
      if (cancelled) return;
      setDoctors(options);
      const preferred = initialSchedule?.doctor;
      const matched = preferred
        ? options.find((doctor) => Number(doctor.value) === Number(preferred.value) || doctor.label === preferred.label) || preferred
        : options[0] || null;
      setSelectedDoctor(matched);
    };
    loadDoctors();
    return () => {
      cancelled = true;
    };
  }, [isOpen, initialSchedule]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialSchedule?.date) {
      const parsed = moment(initialSchedule.date, "YYYY-MM-DD", true);
      if (parsed.isValid()) {
        setSelectedDate(parsed.clone().startOf("day"));
        setWeekAnchor(parsed.clone().startOf("day"));
      }
    }
  }, [isOpen, initialSchedule]);

  useEffect(() => {
    if (!isOpen || !selectedDoctor?.value) {
      setSlots([]);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setSlotNote("");
    getAppointmentSlots({
      doctorId: selectedDoctor.value,
      appointmentDate: selectedDate.format("YYYY-MM-DD"),
    })
      .then((response) => {
        if (cancelled) return;
        const data = normalizeAppointmentSlotsResponse(response);
        const mapped = (data.slots || []).map((slot) => ({
          time: slot.time,
          label: slot.label || moment(slot.time, ["HH:mm:ss", "HH:mm"]).format("hh:mm A"),
          status: slot.status || "available",
        }));
        setSlots(mapped);
        if (!mapped.length) {
          setSlotNote(data.hasSchedule ? "No slots for this day." : "No working day is saved for this date.");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
        setSlotNote("Could not load slots.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedDoctor, selectedDate]);

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
            options={doctors}
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
                {slotNote && slots.length === 0 ? (
                  <div className="text-muted text-center py-3">{slotNote}</div>
                ) : null}
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
