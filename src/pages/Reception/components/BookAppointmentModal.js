import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import Select from "react-select";
import ModalActionButton from "../../../Components/Common/ModalActionButton";

const SEVERITY_OPTIONS = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

const DURATION_UNIT_OPTIONS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
];

const EMPTY_FORM = {
  chiefComplaints: "",
  durationValue: "",
  durationUnit: "days",
  severity: "moderate",
};

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

const FieldError = ({ show, message }) => (
  <div className="new-patient-modal__error" role={show ? "alert" : undefined}>
    {show ? message : null}
  </div>
);

const BookAppointmentModal = ({
  isOpen,
  toggle,
  selectedPatient,
  allottedSchedule,
  initialAppointment = null,
  editMode = false,
  onAppointmentConfirmed,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      ...EMPTY_FORM,
      chiefComplaints: initialAppointment?.chiefComplaints || "",
      durationValue: initialAppointment?.durationValue || "",
      durationUnit: initialAppointment?.durationUnit || "days",
      severity: initialAppointment?.severity || "moderate",
    });
    setTouched({});
    setSubmitAttempted(false);
  }, [isOpen, initialAppointment]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const errors = useMemo(() => {
    const next = {};
    if (!String(form.chiefComplaints || "").trim()) {
      next.chiefComplaints = "Chief complaints are required";
    }
    if (!String(form.durationValue || "").trim()) {
      next.durationValue = "Duration is required";
    } else if (Number.isNaN(Number(form.durationValue)) || Number(form.durationValue) <= 0) {
      next.durationValue = "Enter a valid duration";
    }
    if (!form.severity) {
      next.severity = "Severity is required";
    }
    return next;
  }, [form]);

  const showError = (field) => Boolean(errors[field] && (touched[field] || submitAttempted));

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setTouched({});
    setSubmitAttempted(false);
    toggle();
  };

  const handleNext = () => {
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) return;

    onAppointmentConfirmed?.({
      patient: selectedPatient,
      schedule: allottedSchedule,
      chiefComplaints: form.chiefComplaints.trim(),
      duration: `${form.durationValue} ${form.durationUnit}`,
      durationValue: form.durationValue,
      durationUnit: form.durationUnit,
      severity: form.severity,
      severityLabel:
        SEVERITY_OPTIONS.find((option) => option.value === form.severity)?.label || form.severity,
    });
    resetAndClose();
  };

  const appointmentTimeLabel = allottedSchedule?.slot?.label || "—";
  const appointmentDateLabel = allottedSchedule?.dateDisplay || "—";
  const doctorLabel = allottedSchedule?.doctor?.label || "—";

  return (
    <Modal
      size="lg"
      isOpen={isOpen}
      toggle={resetAndClose}
      className="patient-list-modal new-patient-modal reception-book-appointment-modal"
      backdrop="static"
    >
      <ModalHeader className="patient-list-modal__header" toggle={resetAndClose}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-calendar-check-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">
            {editMode ? "Edit Appointment" : "Book Appointment"}
          </span>
        </span>
      </ModalHeader>

      <ModalBody>
        <div className="reception-book-appointment-summary mb-3">
          <div className="reception-book-appointment-summary__item">
            <span className="label">Patient</span>
            <strong>{selectedPatient?.fullName || "—"}</strong>
            <span className="meta">
              {selectedPatient?.age || "—"} / {selectedPatient?.sex || "—"}
              {selectedPatient?.mobileNo ? ` · ${selectedPatient.mobileNo}` : ""}
            </span>
          </div>
          <div className="reception-book-appointment-summary__item">
            <span className="label">Doctor</span>
            <strong>{doctorLabel}</strong>
          </div>
          <div className="reception-book-appointment-summary__item">
            <span className="label">Appointment Date</span>
            <strong>{appointmentDateLabel}</strong>
          </div>
          <div className="reception-book-appointment-summary__item reception-book-appointment-summary__item--time">
            <span className="label">Appointment Time</span>
            <strong>{appointmentTimeLabel}</strong>
          </div>
        </div>

        <div className="row g-2 new-patient-modal__fields">
          <div className="col-12 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-heart-pulse-line" aria-hidden="true" />
              Chief Complaints <span className="text-danger">*</span>
            </Label>
            <Input
              type="textarea"
              rows={3}
              placeholder="Enter chief complaints"
              value={form.chiefComplaints}
              onChange={(e) => updateField("chiefComplaints", e.target.value)}
              onBlur={() => markTouched("chiefComplaints")}
              className={showError("chiefComplaints") ? "is-invalid" : ""}
            />
            <FieldError show={showError("chiefComplaints")} message={errors.chiefComplaints} />
          </div>

          <div className="col-md-6 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-time-line" aria-hidden="true" />
              Duration <span className="text-danger">*</span>
            </Label>
            <div className="d-flex gap-2 align-items-start">
              <div className="flex-grow-1">
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 3"
                  value={form.durationValue}
                  onChange={(e) => updateField("durationValue", e.target.value)}
                  onBlur={() => markTouched("durationValue")}
                  className={showError("durationValue") ? "is-invalid" : ""}
                />
                <FieldError show={showError("durationValue")} message={errors.durationValue} />
              </div>
              <div style={{ minWidth: "7.5rem" }}>
                <Select
                  value={DURATION_UNIT_OPTIONS.find((o) => o.value === form.durationUnit) || null}
                  onChange={(option) => updateField("durationUnit", option?.value || "days")}
                  options={DURATION_UNIT_OPTIONS}
                  isSearchable={false}
                  {...selectPortalProps}
                  styles={selectStyles}
                />
              </div>
            </div>
          </div>

          <div className="col-md-6 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-alarm-warning-line" aria-hidden="true" />
              Severity <span className="text-danger">*</span>
            </Label>
            <Select
              value={SEVERITY_OPTIONS.find((o) => o.value === form.severity) || null}
              onChange={(option) => {
                updateField("severity", option?.value || "");
                markTouched("severity");
              }}
              onBlur={() => markTouched("severity")}
              options={SEVERITY_OPTIONS}
              placeholder="Select severity..."
              isSearchable={false}
              {...selectPortalProps}
              styles={selectStyles}
            />
            <FieldError show={showError("severity")} message={errors.severity} />
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="reception-patient-details-footer">
        <ModalActionButton action="cancel" type="button" onClick={resetAndClose}>
          Cancel
        </ModalActionButton>
        <ModalActionButton
          action={editMode ? "save" : "update"}
          type="button"
          iconClassName={editMode ? "ri-save-line" : "ri-arrow-right-line"}
          onClick={handleNext}
        >
          {editMode ? "Save" : "Next"}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export default BookAppointmentModal;
