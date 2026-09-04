import React, { useMemo } from "react";
import { Col, Input, Label, Row } from "reactstrap";
import Select from "react-select";

import { neutralSelectProps } from "../../helpers/neutralSelectStyles";
import WhatsAppFormLabel from "./WhatsAppFormLabel";

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
    <div className="whatsapp-modal__recipient-block">
      <div>
        <WhatsAppFormLabel icon="ri-group-line">Recipients</WhatsAppFormLabel>
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
      </div>

      {helperText && mode === RECIPIENT_MODE.BULK ? (
        <div className="whatsapp-modal__subtle">{helperText}</div>
      ) : null}

      {mode === RECIPIENT_MODE.INDIVIDUAL ? (
        <div>
          <WhatsAppFormLabel icon="ri-user-search-line">Search Patient</WhatsAppFormLabel>
          <Select
            value={selectedPatient}
            onChange={onChangeSelectedPatient}
            options={safePatientOptions}
            placeholder="Type name or phone..."
            isClearable
            isSearchable
            {...neutralSelectProps}
          />
        </div>
      ) : hideBulkModeDropdown ? null : (
        <Row className="g-3">
          <Col md={12}>
            <WhatsAppFormLabel icon="ri-stack-line">Bulk Mode</WhatsAppFormLabel>
              <Select
                value={selectedBulkMode}
                onChange={(v) => onChangeBulkFilter?.(v?.value)}
                options={bulkModeOptions}
                isClearable={false}
                isSearchable={false}
                {...neutralSelectProps}
              />
            </Col>
            {bulk === "department" ? (
              <Col md={12}>
                <WhatsAppFormLabel icon="ri-building-2-line">Department Filter</WhatsAppFormLabel>
                <Select
                  value={departmentFilter}
                  onChange={onChangeDepartmentFilter}
                  options={safeDepartmentOptions}
                  isMulti
                  isClearable
                  placeholder="Select department(s)..."
                  {...neutralSelectProps}
                />
              </Col>
            ) : null}
            {bulk === "doctor" ? (
              <Col md={12}>
                <WhatsAppFormLabel icon="ri-stethoscope-line">Doctor Filter</WhatsAppFormLabel>
                <Select
                  value={doctorFilter}
                  onChange={onChangeDoctorFilter}
                  options={safeDoctorOptions}
                  isClearable
                  placeholder="Select doctor..."
                  {...neutralSelectProps}
                />
              </Col>
            ) : null}
        </Row>
      )}
    </div>
  );
}

