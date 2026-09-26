import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row } from "reactstrap";
import { callNextAppointment, getAppointmentQueue } from "../../helpers/realbackend_helper";
import RescheduleModal from "../../Components/Common/RescheduleModal";
import CancelAppointmentModal from "../../Components/Common/CancelAppointmentModal";
import AssistedBookWizard from "../../Components/Common/AssistedBookWizard";
import { apiMessage, readReceptionDoctorId, unwrap } from "./receptionSession";

/** REC-08.03 — format wait minutes from queue API (negative = not yet due). */
const formatWaitLabel = (waitMinutes) => {
  if (waitMinutes == null || Number.isNaN(Number(waitMinutes))) return "—";
  const mins = Math.trunc(Number(waitMinutes));
  if (mins > 0) return `${mins}m wait`;
  if (mins < 0) return `in ${Math.abs(mins)}m`;
  return "due now";
};

const paymentBadge = (row) => {
  const raw = String(row.paymentStatus || row.PaymentStatus || "UNPAID").trim().toUpperCase();
  const paid = raw === "PAID";
  return {
    label: paid ? "Paid" : raw === "UNPAID" || !raw ? "Unpaid" : raw,
    color: paid ? "success" : "warning",
  };
};

const ReceptionHome = () => {
  const doctorId = readReceptionDoctorId();
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [note, setNote] = useState("");
  const [rescheduleRow, setRescheduleRow] = useState(null);
  const [cancelRow, setCancelRow] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [assistedPatientId, setAssistedPatientId] = useState("");
  const [assistedPatientName, setAssistedPatientName] = useState("");
  const [assistedPickKey, setAssistedPickKey] = useState(0);

  const load = async () => {
    if (!doctorId) return;
    setQueueLoading(true);
    try {
      const response = await getAppointmentQueue(doctorId);
      const body = unwrap(response);
      const rows = body.queue || body.Queue || body.data || body;
      setQueue(Array.isArray(rows) ? rows : []);
    } finally {
      setQueueLoading(false);
    }
  };

  const waitingCount = queue.filter((row) =>
    String(row.status || row.Status || "").toUpperCase() === "WAITING"
  ).length;

  useEffect(() => {
    document.title = "Reception | Homeocentrum";
    load().catch((err) => setError(apiMessage(err, "Queue failed")));
  }, [doctorId]);

  const callNext = async () => {
    try {
      const response = await callNextAppointment(doctorId);
      setNote(unwrap(response).message || unwrap(response).Message || "Next patient called.");
      await load();
    } catch (err) {
      setError(apiMessage(err, "No waiting patient"));
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h4>Reception</h4>
        <p className="text-muted">Clinical case-taking stays on the doctor. These actions are for this doctor only.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Row className="g-3">
          <Col md={6}>
            <Card><CardBody>
              {/* REC-03.02 — five front-desk quick actions */}
              <h5>Quick actions</h5>
              <div className="d-flex flex-wrap gap-2" data-testid="reception-quick-actions">
                <Link className="btn btn-primary" to="/doctordashboard?qa=newPatient">New patient</Link>
                <Link className="btn btn-primary" to="/doctordashboard?qa=newAppointment">New appointment</Link>
                <Button
                  color="soft-warning"
                  data-testid="reception-collect-payment"
                  onClick={() => {
                    const firstApp = queue[0]
                      ? String(queue[0].patientAppId || queue[0].PatientAppId || "")
                      : "";
                    setReceipt({
                      amount: "",
                      method: "Cash",
                      appointmentId: firstApp,
                      gst: "GST — Phase 6 placeholder",
                    });
                  }}
                >
                  Collect payment
                </Button>
                <Link className="btn btn-soft-secondary" to="/reception/case-paper">Case paper</Link>
                <Link className="btn btn-soft-secondary" to="/reception/schedule">Schedule</Link>
              </div>
            </CardBody></Card>
          </Col>
          <Col md={6}>
            <Card><CardBody>
              {/* REC-08.03 — queue panel: order, wait time, paid/unpaid, Call next */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Queue</h5>
                <Button
                  size="sm"
                  color="primary"
                  onClick={callNext}
                  disabled={!doctorId || waitingCount === 0 || queueLoading}
                  data-testid="reception-call-next"
                >
                  Call next
                </Button>
              </div>
              {queueLoading && queue.length === 0 ? (
                <p className="text-muted mb-0">Loading queue…</p>
              ) : queue.length === 0 ? (
                <p className="text-muted mb-0">No waiting visits.</p>
              ) : (
                <ul className="list-unstyled mb-0" data-testid="reception-queue-list">
                  {queue.map((row, index) => {
                    const rowId = row.patientAppId || row.PatientAppId;
                    const patientId = row.patientId || row.PatientId;
                    const order = row.queueOrder || row.QueueOrder || row.queuePosition || row.QueuePosition || index + 1;
                    const waitLabel = formatWaitLabel(row.waitMinutes ?? row.WaitMinutes);
                    const pay = paymentBadge(row);
                    const status = row.status || row.Status || "";
                    return (
                      <li
                        key={rowId}
                        className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 border-bottom"
                        data-testid={`reception-queue-row-${rowId}`}
                      >
                        <div className="d-flex align-items-start gap-2 flex-grow-1 me-2" style={{ minWidth: 0 }}>
                          <span
                            className="badge bg-secondary flex-shrink-0"
                            title="Queue order"
                            style={{ minWidth: "2rem" }}
                          >
                            #{order}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-medium text-truncate">
                              {row.patientName || row.PatientName || "Patient"}
                            </div>
                            <div className="text-muted small">
                              {row.appointmentTime || row.AppointmentTime}
                              {" · "}
                              <span title="Wait time">{waitLabel}</span>
                              {" · "}
                              <span className={`badge ${pay.color === "success" ? "bg-success" : "bg-warning text-dark"}`}>
                                {pay.label}
                              </span>
                              {status ? (
                                <>
                                  {" · "}
                                  <span className="text-uppercase">{status}</span>
                                </>
                              ) : null}
                            {patientId ? (
                              <>
                                {" · "}
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm p-0 align-baseline"
                                  title="Use this patient in Assisted booking"
                                  data-testid={`reception-queue-pick-patient-${patientId}`}
                                  onClick={() => {
                                    setAssistedPatientId(String(patientId));
                                    setAssistedPatientName(
                                      row.patientName || row.PatientName || ""
                                    );
                                    setAssistedPickKey((n) => n + 1);
                                  }}
                                >
                                  Book for {row.patientName || row.PatientName || "this patient"}
                                </button>
                                {" · "}
                                <Link
                                  className="small"
                                  to={`/reception/case-paper?patientId=${patientId}${rowId ? `&patientAppId=${rowId}` : ""}`}
                                  title="Open case paper for this patient"
                                >
                                  Case paper
                                </Link>
                              </>
                            ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex flex-shrink-0 gap-1">
                          <Button
                            size="sm"
                            color="soft-info"
                            onClick={() => setRescheduleRow(row)}
                          >
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            color="soft-danger"
                            onClick={() => setCancelRow(row)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody></Card>
          </Col>
          {receipt ? (
            <Col md={6}>
              {/* REC-13.01 — receipt field shell for Phase 6 (no PaymentStatus write) */}
              <Card data-testid="reception-receipt-shell">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Receipt preview</h5>
                    <Button size="sm" color="link" className="p-0" onClick={() => setReceipt(null)}>
                      Close
                    </Button>
                  </div>
                  <p className="text-muted small">
                    UI shell only. Phase 6 wires cash / UPI / card / payment link and issues the real receipt.
                  </p>
                  <Label htmlFor="reception-receipt-amount">Amount</Label>
                  <Input
                    id="reception-receipt-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={receipt.amount}
                    onChange={(event) => setReceipt({ ...receipt, amount: event.target.value })}
                    data-testid="reception-receipt-amount"
                  />
                  <Label className="mt-2" htmlFor="reception-receipt-method">Method</Label>
                  <Input
                    id="reception-receipt-method"
                    type="select"
                    value={receipt.method}
                    onChange={(event) => setReceipt({ ...receipt, method: event.target.value })}
                    data-testid="reception-receipt-method"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Payment link">Payment link</option>
                  </Input>
                  <Label className="mt-2" htmlFor="reception-receipt-appointment">Appointment</Label>
                  <Input
                    id="reception-receipt-appointment"
                    type="select"
                    value={receipt.appointmentId}
                    onChange={(event) => setReceipt({ ...receipt, appointmentId: event.target.value })}
                    data-testid="reception-receipt-appointment"
                  >
                    <option value="">Select appointment</option>
                    {queue.map((row) => {
                      const id = row.patientAppId || row.PatientAppId;
                      const name = row.patientName || row.PatientName || "Patient";
                      const time = row.appointmentTime || row.AppointmentTime || "";
                      return (
                        <option key={id} value={String(id)}>
                          #{id} · {name}{time ? ` · ${time}` : ""}
                        </option>
                      );
                    })}
                  </Input>
                  <Label className="mt-2" htmlFor="reception-receipt-gst">GST</Label>
                  <Input
                    id="reception-receipt-gst"
                    value={receipt.gst}
                    disabled
                    data-testid="reception-receipt-gst"
                  />
                  <p className="text-muted small mt-2 mb-0" data-testid="reception-receipt-no-paid">
                    REC-13.02 — This screen does not set PaymentStatus to PAID. Account / webhook is the source of truth in Phase 6.
                  </p>
                </CardBody>
              </Card>
            </Col>
          ) : null}
          <Col md={6}>
            <Card><CardBody>
              {/* SUP-07.03 — assisted-book wizard + open AssistedRequest queue */}
              <h5>Assisted booking</h5>
              <p className="text-muted small">
                Book on behalf of a patient who asked for help. Payment is not taken on this screen.
              </p>
              <AssistedBookWizard
                doctorId={doctorId}
                showRequestQueue
                selectedPatientId={assistedPatientId}
                patientNameHint={assistedPatientName}
                patientPickKey={assistedPickKey}
              />
            </CardBody></Card>
          </Col>
        </Row>
      </Container>
      <RescheduleModal
        isOpen={!!rescheduleRow}
        toggle={() => setRescheduleRow(null)}
        patientAppId={rescheduleRow?.patientAppId || rescheduleRow?.PatientAppId}
        doctorId={doctorId}
        appointmentDate={rescheduleRow?.appointmentDate || rescheduleRow?.AppointmentDate}
        appointmentTime={rescheduleRow?.appointmentTime || rescheduleRow?.AppointmentTime}
        onSaved={load}
      />
      <CancelAppointmentModal
        isOpen={!!cancelRow}
        toggle={() => setCancelRow(null)}
        patientAppId={cancelRow?.patientAppId || cancelRow?.PatientAppId}
        onSaved={load}
      />
    </div>
  );
};

export default ReceptionHome;
