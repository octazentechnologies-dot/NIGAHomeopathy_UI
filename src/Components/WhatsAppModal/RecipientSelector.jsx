import React, { useMemo } from "react";
import { Col, Input, Label, Row } from "reactstrap";
import Select from "react-select";

const RECIPIENT_MODE = {
  INDIVIDUAL: "individual",
  BULK: "bulk",
};

export default function RecipientSelector({
  recipientMode,
  onChangeRecipientMode,
  patientOptions,
  selectedPatient,
  onChangeSelectedPatient,
  bulkFilter,
  onChangeBulkFilter,
  departmentOptions,
  departmentFilter,
  onChangeDepartmentFilter,
  doctorOptions,
  doctorFilter,
  onChangeDoctorFilter,
  helperText,
  hideBulkModeDropdown = false,
}) {
  const mode = recipientMode || RECIPIENT_MODE.INDIVIDUAL;
  const bulk = bulkFilter || "all";

  const bulkModeOptions = useMemo(
    () => [
      { value: "new", label: "All New Patients (Today)" },
      { value: "all", label: "All Patients" },
      { value: "department", label: "Filter by Department" },
      { value: "doctor", label: "Filter by Doctor" },
    ],
    []
  );

  const selectedBulkMode = useMemo(
    () => bulkModeOptions.find((o) => o.value === bulk) || bulkModeOptions[0],
    [bulk, bulkModeOptions]
  );

  const safePatientOptions = useMemo(
    () => (Array.isArray(patientOptions) ? patientOptions : []),
    [patientOptions]
  );

  const safeDepartmentOptions = useMemo(
    () => (Array.isArray(departmentOptions) ? departmentOptions : []),
    [departmentOptions]
  );

  const safeDoctorOptions = useMemo(
    () => (Array.isArray(doctorOptions) ? doctorOptions : []),
    [doctorOptions]
  );

  return (
    <div>
      <Label className="form-label mb-1">Recipients</Label>
      <div className="d-flex align-items-center gap-4 flex-wrap">
        <div className="form-check">
          <Input
            id="wa-recipient-individual"
            type="radio"
            name="wa-recipient-mode"
            className="form-check-input"
            checked={mode === RECIPIENT_MODE.INDIVIDUAL}
            onChange={() => onChangeRecipientMode?.(RECIPIENT_MODE.INDIVIDUAL)}
          />
          <Label className="form-check-label" htmlFor="wa-recipient-individual">
            Individual
          </Label>
        </div>
        <div className="form-check">
          <Input
            id="wa-recipient-bulk"
            type="radio"
            name="wa-recipient-mode"
            className="form-check-input"
            checked={mode === RECIPIENT_MODE.BULK}
            onChange={() => onChangeRecipientMode?.(RECIPIENT_MODE.BULK)}
          />
          <Label className="form-check-label" htmlFor="wa-recipient-bulk">
            Bulk
          </Label>
        </div>
      </div>

      {helperText && mode === RECIPIENT_MODE.BULK ? (
        <div className="whatsapp-modal__subtle mt-1">{helperText}</div>
      ) : null}

      {mode === RECIPIENT_MODE.INDIVIDUAL ? (
        <div className="mt-2">
          <Label className="form-label mb-1">Search Patient</Label>
          <Select
            value={selectedPatient}
            onChange={onChangeSelectedPatient}
            options={safePatientOptions}
            placeholder="Type name or phone..."
            isClearable
            isSearchable
            classNamePrefix="select"
          />
        </div>
      ) : hideBulkModeDropdown ? null : (
        <div className="mt-2">
          <Row className="g-2">
            <Col md={12}>
              <Label className="form-label mb-1">Bulk Mode</Label>
              <Select
                value={selectedBulkMode}
                onChange={(v) => onChangeBulkFilter?.(v?.value)}
                options={bulkModeOptions}
                isClearable={false}
                isSearchable={false}
                classNamePrefix="select"
              />
            </Col>
            {bulk === "department" ? (
              <Col md={12}>
                <Label className="form-label mb-1">Department Filter</Label>
                <Select
                  value={departmentFilter}
                  onChange={onChangeDepartmentFilter}
                  options={safeDepartmentOptions}
                  isMulti
                  isClearable
                  placeholder="Select department(s)..."
                  classNamePrefix="select"
                />
              </Col>
            ) : null}
            {bulk === "doctor" ? (
              <Col md={12}>
                <Label className="form-label mb-1">Doctor Filter</Label>
                <Select
                  value={doctorFilter}
                  onChange={onChangeDoctorFilter}
                  options={safeDoctorOptions}
                  isClearable
                  placeholder="Select doctor..."
                  classNamePrefix="select"
                />
              </Col>
            ) : null}
          </Row>
        </div>
      )}
    </div>
  );
}

