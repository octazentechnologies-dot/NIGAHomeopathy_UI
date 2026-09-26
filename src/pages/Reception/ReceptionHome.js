import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner } from "reactstrap";
import { callNextAppointment, getAppointmentQueue } from "../../helpers/realbackend_helper";
import { collectAtReception, s4Message, unwrapS4 } from "../../helpers/s4Week4Api";
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

/** Map UI labels to CollectAtReception method codes (PAY-04.02). */
const METHOD_OPTIONS = [
  { label: "Cash", value: "CASH" },
  { label: "UPI (offline)", value: "UPI_OFFLINE" },
  { label: "Card (POS)", value: "CARD_POS" },
  { label: "Payment link", value: "PAY_LINK" },
];

const ReceptionHome = () => {
  const doctorId = readReceptionDoctorId();
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [collecting, setCollecting] = useState(false);
  const [issuedReceipt, setIssuedReceipt] = useState(null);
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

  const submitCollect = async () => {
    if (!receipt?.appointmentId) {
      setError("Select an appointment before collecting.");
      return;
    }
    setCollecting(true);
    setError("");
    setNote("");
    setIssuedReceipt(null);
    try {
      const payload = {
        patientAppId: Number(receipt.appointmentId),
        method: receipt.method || "CASH",
      };
      if (receipt.amount !== "" && receipt.amount != null) {
        payload.amount = Number(receipt.amount);
      }
      const response = await collectAtReception(payload);
      const body = unwrapS4(response);
      const printed = body?.receipt || response?.receipt || body;
      setIssuedReceipt(printed);
      setNote(
        body?.message ||
          response?.message ||
          (payload.method === "PAY_LINK"
            ? "Pay link reserved. Visit stays unpaid until collection or webhook."
            : "Collected at reception.")
      );
      await load();
    } catch (err) {
      setError(s4Message(err) || apiMessage(err, "Collection failed"));
    } finally {
      setCollecting(false);
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
                    const firstUnpaid = queue.find((row) => {
                      const status = String(row.paymentStatus || row.PaymentStatus || "UNPAID").toUpperCase();
                      return status !== "PAID";
                    }) || queue[0];
                    const firstApp = firstUnpaid
                      ? String(firstUnpaid.patientAppId || firstUnpaid.PatientAppId || "")
                      : "";
                    setIssuedReceipt(null);
                    setReceipt({
                      amount: "",
                      method: "CASH",
                      appointmentId: firstApp,
                      gst: "GST applied by New API on collection",
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
              {queueLoading ? (
                <div className="text-center py-3"><Spinner size="sm" /> Loading queue…</div>
              ) : queue.length === 0 ? (
                <p className="text-muted mb-0">No patients in queue.</p>
              ) : (
                <ul className="list-unstyled mb-0" data-testid="reception-queue">
                  {queue.map((row) => {
                    const id = row.patientAppId || row.PatientAppId;
                    const name = row.patientName || row.PatientName || "Patient";
                    const wait = formatWaitLabel(row.waitMinutes ?? row.WaitMinutes);
                    const pay = paymentBadge(row);
                    return (
                      <li key={id} className="d-flex justify-content-between align-items-start border-bottom py-2 gap-2">
                        <div>
                          <div className="fw-medium">#{id} · {name}</div>
                          <div className="text-muted small">
                            {row.appointmentTime || row.AppointmentTime || "—"} · {wait}
                            {" · "}
                            <span className={`badge bg-${pay.color}-subtle text-${pay.color}`}>{pay.label}</span>
                          </div>
                        </div>
                        <div className="d-flex flex-shrink-0 gap-1">
                          <Button
                            size="sm"
                            color="soft-warning"
                            onClick={() => {
                              setIssuedReceipt(null);
                              setReceipt({
                                amount: "",
                                method: "CASH",
                                appointmentId: String(id),
                                gst: "GST applied by New API on collection",
                              });
                            }}
                          >
                            Collect
                          </Button>
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
              {/* PAY-04 / REC-13 — CollectAtReception on New API :5002 */}
              <Card data-testid="reception-receipt-shell">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Collect at reception</h5>
                    <Button size="sm" color="link" className="p-0" onClick={() => { setReceipt(null); setIssuedReceipt(null); }}>
                      Close
                    </Button>
                  </div>
                  <p className="text-muted small">
                    Cash, offline UPI, card POS, or reserve a pay link. Paid status is set by this API or the Razorpay webhook — not by the client alone.
                  </p>
                  <Label htmlFor="reception-receipt-amount">Amount (optional — must match fee when sent)</Label>
                  <Input
                    id="reception-receipt-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Leave blank to use configured fee"
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
                    {METHOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
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
                  <Button
                    color="primary"
                    className="mt-3"
                    disabled={collecting || !receipt.appointmentId}
                    onClick={submitCollect}
                    data-testid="reception-receipt-submit"
                  >
                    {collecting ? "Collecting…" : receipt.method === "PAY_LINK" ? "Reserve pay link" : "Collect & print receipt"}
                  </Button>
                  {issuedReceipt ? (
                    <div className="mt-3 border rounded p-3 bg-light" data-testid="reception-receipt-print">
                      <div className="fw-medium mb-1">Receipt</div>
                      <div className="small">Order #{issuedReceipt.paymentOrderId || issuedReceipt.PaymentOrderId || "—"}</div>
                      <div className="small">Visit #{issuedReceipt.patientAppId || issuedReceipt.PatientAppId || receipt.appointmentId}</div>
                      <div className="small">
                        Amount ₹{issuedReceipt.amount ?? issuedReceipt.Amount ?? "—"}
                        {" · "}
                        {issuedReceipt.method || issuedReceipt.Method || receipt.method}
                      </div>
                      <div className="small text-muted">
                        GST ₹{issuedReceipt.gstAmount ?? issuedReceipt.GstAmount ?? "—"}
                        {issuedReceipt.gstNote || issuedReceipt.GstNote
                          ? ` — ${issuedReceipt.gstNote || issuedReceipt.GstNote}`
                          : ""}
                      </div>
                      {issuedReceipt.linkToken || issuedReceipt.LinkToken ? (
                        <div className="small mt-1">Link token: {issuedReceipt.linkToken || issuedReceipt.LinkToken}</div>
                      ) : null}
                    </div>
                  ) : null}
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
