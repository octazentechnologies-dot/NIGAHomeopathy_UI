import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import ModalActionButton from "../../../Components/Common/ModalActionButton";

const EMPTY_VITALS = {
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
  pulse: "",
  temperature: "",
  weight: "",
  height: "",
  spo2: "",
  respiratoryRate: "",
  bloodSugar: "",
  notes: "",
};

const FieldError = ({ show, message }) => (
  <div className="new-patient-modal__error" role={show ? "alert" : undefined}>
    {show ? message : null}
  </div>
);

const CollectVitalsModal = ({
  isOpen,
  toggle,
  selectedPatient,
  initialVitals = null,
  editMode = false,
  onVitalsConfirmed,
}) => {
  const [form, setForm] = useState(EMPTY_VITALS);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      ...EMPTY_VITALS,
      ...(initialVitals || {}),
    });
    setTouched({});
    setSubmitAttempted(false);
  }, [isOpen, initialVitals]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const errors = useMemo(() => {
    const next = {};
    if (!String(form.bloodPressureSystolic || "").trim() || !String(form.bloodPressureDiastolic || "").trim()) {
      next.bloodPressure = "Blood pressure is required";
    }
    if (!String(form.pulse || "").trim()) next.pulse = "Pulse is required";
    if (!String(form.temperature || "").trim()) next.temperature = "Temperature is required";
    if (!String(form.weight || "").trim()) next.weight = "Weight is required";
    return next;
  }, [form]);

  const showError = (field) => Boolean(errors[field] && (touched[field] || submitAttempted));

  const resetAndClose = () => {
    toggle();
  };

  const handleNext = () => {
    setSubmitAttempted(true);
    setTouched((prev) => ({
      ...prev,
      bloodPressure: true,
      pulse: true,
      temperature: true,
      weight: true,
    }));
    if (Object.keys(errors).length > 0) return;

    onVitalsConfirmed?.({
      ...form,
      bloodPressure: `${form.bloodPressureSystolic}/${form.bloodPressureDiastolic}`,
      patient: selectedPatient,
    });
    resetAndClose();
  };

  return (
    <Modal
      size="lg"
      isOpen={isOpen}
      toggle={resetAndClose}
      className="patient-list-modal new-patient-modal reception-collect-vitals-modal"
      backdrop="static"
    >
      <ModalHeader className="patient-list-modal__header" toggle={resetAndClose}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-heart-pulse-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">
            {editMode ? "Edit Vitals" : "Collect Vitals"}
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

        {initialVitals ? (
          <div className="reception-vitals-prefill-note mb-3">
            <i className="ri-information-line" aria-hidden="true" />
            Existing vitals loaded. Update if needed, then continue.
          </div>
        ) : null}

        <div className="row g-2 new-patient-modal__fields">
          <div className="col-md-6 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-heart-2-line" aria-hidden="true" />
              Blood Pressure (mmHg) <span className="text-danger">*</span>
            </Label>
            <div className="d-flex align-items-center gap-2">
              <Input
                type="number"
                placeholder="Systolic"
                value={form.bloodPressureSystolic}
                onChange={(e) => updateField("bloodPressureSystolic", e.target.value)}
                onBlur={() => markTouched("bloodPressure")}
                className={showError("bloodPressure") ? "is-invalid" : ""}
              />
              <span className="text-muted">/</span>
              <Input
                type="number"
                placeholder="Diastolic"
                value={form.bloodPressureDiastolic}
                onChange={(e) => updateField("bloodPressureDiastolic", e.target.value)}
                onBlur={() => markTouched("bloodPressure")}
                className={showError("bloodPressure") ? "is-invalid" : ""}
              />
            </div>
            <FieldError show={showError("bloodPressure")} message={errors.bloodPressure} />
          </div>

          <div className="col-md-3 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-pulse-line" aria-hidden="true" />
              Pulse (bpm) <span className="text-danger">*</span>
            </Label>
            <Input
              type="number"
              placeholder="e.g. 78"
              value={form.pulse}
              onChange={(e) => updateField("pulse", e.target.value)}
              onBlur={() => markTouched("pulse")}
              className={showError("pulse") ? "is-invalid" : ""}
            />
            <FieldError show={showError("pulse")} message={errors.pulse} />
          </div>

          <div className="col-md-3 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-temp-hot-line" aria-hidden="true" />
              Temperature (°F) <span className="text-danger">*</span>
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 98.6"
              value={form.temperature}
              onChange={(e) => updateField("temperature", e.target.value)}
              onBlur={() => markTouched("temperature")}
              className={showError("temperature") ? "is-invalid" : ""}
            />
            <FieldError show={showError("temperature")} message={errors.temperature} />
          </div>

          <div className="col-md-3 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-scales-3-line" aria-hidden="true" />
              Weight (kg) <span className="text-danger">*</span>
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 68"
              value={form.weight}
              onChange={(e) => updateField("weight", e.target.value)}
              onBlur={() => markTouched("weight")}
              className={showError("weight") ? "is-invalid" : ""}
            />
            <FieldError show={showError("weight")} message={errors.weight} />
          </div>

          <div className="col-md-3 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-ruler-line" aria-hidden="true" />
              Height (cm)
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 170"
              value={form.height}
              onChange={(e) => updateField("height", e.target.value)}
            />
          </div>

          <div className="col-md-3 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-lungs-line" aria-hidden="true" />
              SpO2 (%)
            </Label>
            <Input
              type="number"
              placeholder="e.g. 98"
              value={form.spo2}
              onChange={(e) => updateField("spo2", e.target.value)}
            />
          </div>

          <div className="col-md-3 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-windy-line" aria-hidden="true" />
              Respiratory Rate
            </Label>
            <Input
              type="number"
              placeholder="e.g. 16"
              value={form.respiratoryRate}
              onChange={(e) => updateField("respiratoryRate", e.target.value)}
            />
          </div>

          <div className="col-md-4 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-drop-line" aria-hidden="true" />
              Blood Sugar (mg/dL)
            </Label>
            <Input
              type="number"
              placeholder="Optional"
              value={form.bloodSugar}
              onChange={(e) => updateField("bloodSugar", e.target.value)}
            />
          </div>

          <div className="col-md-8 new-patient-modal__field">
            <Label className="form-label new-patient-modal__label">
              <i className="ri-sticky-note-line" aria-hidden="true" />
              Notes
            </Label>
            <Input
              type="textarea"
              rows={2}
              placeholder="Optional notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
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

export default CollectVitalsModal;
