import React, { useMemo, useRef } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import ModalActionButton from "../../../Components/Common/ModalActionButton";

const formatRupee = (amount) =>
  `₹ ${Math.round(Number(amount) || 0).toLocaleString("en-IN")}`;

const display = (value, fallback = "—") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const CasePaperModal = ({
  isOpen,
  toggle,
  selectedPatient,
  allottedSchedule,
  appointmentDetails,
  vitalsDetails,
  paymentDetails,
  onCasePaperConfirmed,
}) => {
  const printRef = useRef(null);

  const casePaperNo = useMemo(() => {
    const stamp = new Date();
    const y = stamp.getFullYear();
    const m = String(stamp.getMonth() + 1).padStart(2, "0");
    const d = String(stamp.getDate()).padStart(2, "0");
    const patientId = selectedPatient?.id || selectedPatient?.mobileNo || "000";
    return `CP-${y}${m}${d}-${String(patientId).slice(-4).padStart(4, "0")}`;
  }, [selectedPatient]);

  const generatedAt = useMemo(() => {
    try {
      return new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }, [isOpen]);

  const appointmentLabel = allottedSchedule
    ? `${allottedSchedule.dateDisplay || "—"}, ${allottedSchedule.slot?.label || "—"}`
    : "—";

  const resetAndClose = () => {
    toggle();
  };

  const handleDone = () => {
    onCasePaperConfirmed?.({
      casePaperNo,
      generatedAt,
      patient: selectedPatient,
      schedule: allottedSchedule,
      appointment: appointmentDetails,
      vitals: vitalsDetails,
      payment: paymentDetails,
    });
    resetAndClose();
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Case Paper ${casePaperNo}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #0f172a;
      background: #fff;
      font-size: 12px;
      line-height: 1.45;
    }
    .case-paper {
      max-width: 760px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      padding: 28px 32px;
    }
    .case-paper__header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .case-paper__brand h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.02em;
    }
    .case-paper__brand p {
      margin: 4px 0 0;
      color: #475569;
      font-size: 11px;
    }
    .case-paper__meta {
      text-align: right;
      font-size: 11px;
      color: #334155;
    }
    .case-paper__meta strong {
      display: block;
      font-size: 13px;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .case-paper__section {
      margin-bottom: 16px;
    }
    .case-paper__section-title {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #1d4ed8;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .case-paper__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 20px;
    }
    .case-paper__grid--3 {
      grid-template-columns: 1fr 1fr 1fr;
    }
    .case-paper__field .label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .case-paper__field .value {
      display: block;
      font-size: 12.5px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 2px;
    }
    .case-paper__block {
      white-space: pre-wrap;
      font-size: 12.5px;
      color: #0f172a;
      font-weight: 500;
    }
    .case-paper__footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      gap: 24px;
      font-size: 11px;
      color: #475569;
    }
    .case-paper__sign {
      min-width: 180px;
      text-align: center;
    }
    .case-paper__sign-line {
      border-top: 1px solid #94a3b8;
      margin-top: 40px;
      padding-top: 6px;
    }
    @media print {
      body { padding: 0; }
      .case-paper { border: none; max-width: none; padding: 0; }
    }
  </style>
</head>
<body>
  ${content}
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <Modal
      size="lg"
      isOpen={isOpen}
      toggle={resetAndClose}
      className="patient-list-modal reception-case-paper-modal"
      backdrop="static"
    >
      <ModalHeader className="patient-list-modal__header d-print-none" toggle={resetAndClose}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-file-paper-2-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span>
            <span className="patient-list-modal__title-text d-block">Case Paper</span>
            <span className="reception-payment-subtitle">Generated case paper preview</span>
          </span>
        </span>
      </ModalHeader>

      <ModalBody className="reception-case-paper-modal__body">
        <div className="reception-case-paper-sheet" ref={printRef}>
          <article className="case-paper">
            <header className="case-paper__header">
              <div className="case-paper__brand">
                <h1>Niga Homeocentrum</h1>
                <p>Patient Case Paper · Reception Check-in</p>
              </div>
              <div className="case-paper__meta">
                <strong>{casePaperNo}</strong>
                <div>Generated: {generatedAt}</div>
                <div>
                  Status:{" "}
                  <span className="case-paper__status">
                    {display(paymentDetails?.paymentStatus, "Pending")}
                  </span>
                </div>
              </div>
            </header>

            <section className="case-paper__section">
              <h2 className="case-paper__section-title">Patient Details</h2>
              <div className="case-paper__grid">
                <div className="case-paper__field">
                  <span className="label">Name</span>
                  <span className="value">{display(selectedPatient?.fullName)}</span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Age / Sex</span>
                  <span className="value">
                    {display(selectedPatient?.age)} / {display(selectedPatient?.sex)}
                  </span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Mobile</span>
                  <span className="value">{display(selectedPatient?.mobileNo)}</span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Address</span>
                  <span className="value">{display(selectedPatient?.address)}</span>
                </div>
              </div>
            </section>

            <section className="case-paper__section">
              <h2 className="case-paper__section-title">Appointment</h2>
              <div className="case-paper__grid">
                <div className="case-paper__field">
                  <span className="label">Doctor</span>
                  <span className="value">{display(allottedSchedule?.doctor?.label)}</span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Date & Time</span>
                  <span className="value">{appointmentLabel}</span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Severity</span>
                  <span className="value">
                    {display(
                      appointmentDetails?.severityLabel || appointmentDetails?.severity
                    )}
                  </span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Duration</span>
                  <span className="value">{display(appointmentDetails?.duration)}</span>
                </div>
              </div>
              <div className="case-paper__field mt-2">
                <span className="label">Chief Complaints</span>
                <div className="case-paper__block">
                  {display(appointmentDetails?.chiefComplaints)}
                </div>
              </div>
            </section>

            <section className="case-paper__section">
              <h2 className="case-paper__section-title">Vitals</h2>
              <div className="case-paper__grid case-paper__grid--3">
                <div className="case-paper__field">
                  <span className="label">Blood Pressure</span>
                  <span className="value">
                    {display(vitalsDetails?.bloodPressure)}
                    {vitalsDetails?.bloodPressure ? " mmHg" : ""}
                  </span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Pulse</span>
                  <span className="value">
                    {display(vitalsDetails?.pulse)}
                    {vitalsDetails?.pulse ? " bpm" : ""}
                  </span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Temperature</span>
                  <span className="value">
                    {display(vitalsDetails?.temperature)}
                    {vitalsDetails?.temperature ? " °F" : ""}
                  </span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Weight</span>
                  <span className="value">
                    {display(vitalsDetails?.weight)}
                    {vitalsDetails?.weight ? " kg" : ""}
                  </span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Height</span>
                  <span className="value">
                    {display(vitalsDetails?.height)}
                    {vitalsDetails?.height ? " cm" : ""}
                  </span>
                </div>
                <div className="case-paper__field">
                  <span className="label">SpO2</span>
                  <span className="value">
                    {display(vitalsDetails?.spo2)}
                    {vitalsDetails?.spo2 ? " %" : ""}
                  </span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Respiratory Rate</span>
                  <span className="value">{display(vitalsDetails?.respiratoryRate)}</span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Blood Sugar</span>
                  <span className="value">
                    {display(vitalsDetails?.bloodSugar)}
                    {vitalsDetails?.bloodSugar ? " mg/dL" : ""}
                  </span>
                </div>
              </div>
              {vitalsDetails?.notes ? (
                <div className="case-paper__field mt-2">
                  <span className="label">Vitals Notes</span>
                  <div className="case-paper__block">{vitalsDetails.notes}</div>
                </div>
              ) : null}
            </section>

            <section className="case-paper__section">
              <h2 className="case-paper__section-title">Payment</h2>
              <div className="case-paper__grid case-paper__grid--3">
                <div className="case-paper__field">
                  <span className="label">Method</span>
                  <span className="value">{display(paymentDetails?.paymentMethod)}</span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Amount</span>
                  <span className="value">{formatRupee(paymentDetails?.amount)}</span>
                </div>
                <div className="case-paper__field">
                  <span className="label">GST / Tax</span>
                  <span className="value">{formatRupee(paymentDetails?.gst)}</span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Total</span>
                  <span className="value">{formatRupee(paymentDetails?.total)}</span>
                </div>
                <div className="case-paper__field">
                  <span className="label">Status</span>
                  <span className="value">{display(paymentDetails?.paymentStatus)}</span>
                </div>
              </div>
              {paymentDetails?.notes ? (
                <div className="case-paper__field mt-2">
                  <span className="label">Payment Notes</span>
                  <div className="case-paper__block">{paymentDetails.notes}</div>
                </div>
              ) : null}
            </section>

            <footer className="case-paper__footer">
              <div>
                This case paper is generated at reception check-in for clinical reference.
              </div>
              <div className="case-paper__sign">
                <div className="case-paper__sign-line">Doctor / Receptionist</div>
              </div>
            </footer>
          </article>
        </div>
      </ModalBody>

      <ModalFooter className="reception-patient-details-footer d-print-none">
        <ModalActionButton action="cancel" type="button" onClick={resetAndClose}>
          Close
        </ModalActionButton>
        <ModalActionButton
          action="update"
          type="button"
          iconClassName="ri-printer-line"
          onClick={handlePrint}
        >
          Print
        </ModalActionButton>
        <ModalActionButton
          action="save"
          type="button"
          iconClassName="ri-check-line"
          onClick={handleDone}
        >
          Done
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export default CasePaperModal;
