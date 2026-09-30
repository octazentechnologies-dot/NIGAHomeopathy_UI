import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap";
import Swal from "sweetalert2";
import { callNextAppointment, getAppointmentQueue, getAppointmentSlots, updateAppointmentTime } from "../../helpers/realbackend_helper";
import { formatApiDate, normalizeAppointmentSlotsResponse, timeInputToApiTime } from "../../helpers/appointmentSlotHelper";
import { collectAtReception, s4Message, unwrapS4 } from "../../helpers/s4Week4Api";
import { paymentStatusMeta } from "../../helpers/paymentStatusBadge";
import TodaysAppointments from "./components/TodaysAppointments";
import ReceptionNewPatientForm from "./components/ReceptionNewPatientForm";
import RescheduleModal from "../../Components/Common/RescheduleModal";
import CancelAppointmentModal from "../../Components/Common/CancelAppointmentModal";
import AssistedBookWizard from "../../Components/Common/AssistedBookWizard";
import { apiMessage, readReceptionDoctorId, unwrap } from "./receptionSession";
import "./components/receptionDashboard.css";

/** REC-08.03 — format wait minutes from queue API (negative = not yet due). */
const formatWaitLabel = (waitMinutes) => {
  if (waitMinutes == null || Number.isNaN(Number(waitMinutes))) return "—";
  const mins = Math.trunc(Number(waitMinutes));
  if (mins > 0) return `${mins}m wait`;
  if (mins < 0) return `in ${Math.abs(mins)}m`;
  return "due now";
};

const paymentBadge = (row) => {
  const meta = paymentStatusMeta(row.paymentStatus || row.PaymentStatus);
  return { label: meta.label, color: meta.tone };
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
  const [dayVisits, setDayVisits] = useState([]);
  const [error, setError] = useState("");
  const [deskPanel, setDeskPanel] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [collecting, setCollecting] = useState(false);
  const [issuedReceipt, setIssuedReceipt] = useState(null);
  const [collectError, setCollectError] = useState("");
  const [note, setNote] = useState("");
  const [rescheduleRow, setRescheduleRow] = useState(null);
  const [timeEditRow, setTimeEditRow] = useState(null);
  const [cancelRow, setCancelRow] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [assistedPatientId, setAssistedPatientId] = useState("");
  const [assistedPatientName, setAssistedPatientName] = useState("");
  const [assistedPickKey, setAssistedPickKey] = useState(0);

  const load = async () => {
    if (!doctorId) return;
    setQueueLoading(true);
    try {
      const localIso = (offsetDays) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      };
      const [waitRes, todayRes, tomorrowRes] = await Promise.all([
        getAppointmentQueue(doctorId),
        getAppointmentQueue(doctorId, { date: localIso(0), scope: "day" }),
        getAppointmentQueue(doctorId, { date: localIso(1), scope: "day" }),
      ]);
      const asRows = (response) => {
        const body = unwrap(response);
        const rows = body.queue || body.Queue || body.data || body;
        return Array.isArray(rows) ? rows : [];
      };
      const waitRows = asRows(waitRes);
      const merged = [];
      const seen = new Set();
      [...asRows(todayRes), ...asRows(tomorrowRes), ...waitRows].forEach((row) => {
        const id = row.patientAppId || row.PatientAppId;
        if (!id || seen.has(String(id))) return;
        seen.add(String(id));
        merged.push(row);
      });
      setQueue(waitRows);
      setDayVisits(merged);
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
    const hash = String(window.location.hash || "").replace("#", "");
    if (hash) {
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
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

  const pickSharedPatient = (patientId, label) => {
    if (!patientId) return;
    setAssistedPatientId(String(patientId));
    setAssistedPatientName(label || "");
    setAssistedPickKey((n) => n + 1);
    setDeskPanel("appointment");
  };

  const printReceiptWindow = (printed, method) => {
    const orderId = printed?.paymentOrderId ?? printed?.PaymentOrderId ?? "—";
    const visitId = printed?.patientAppId ?? printed?.PatientAppId ?? receipt?.appointmentId ?? "—";
    const amount = printed?.amount ?? printed?.Amount ?? receipt?.amount ?? "—";
    const gst = printed?.gstAmount ?? printed?.GstAmount ?? "—";
    const gstNote = printed?.gstNote ?? printed?.GstNote ?? "";
    const payMethod = printed?.method ?? printed?.Method ?? method ?? "CASH";
    const html = `<!DOCTYPE html><html><head><title>Receipt ${orderId}</title>
      <style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#111}
      h1{font-size:18px;margin:0 0 12px} .row{margin:6px 0} .muted{color:#666;font-size:12px}</style></head>
      <body><h1>Homeocentrum receipt</h1>
      <div class="row">Order ${orderId}</div>
      <div class="row">Visit ${visitId}</div>
      <div class="row">Amount ₹ ${amount}</div>
      <div class="row">Method ${payMethod}</div>
      <div class="row">GST ₹ ${gst}</div>
      <div class="muted">${gstNote}</div>
      <div class="muted">Paid status is set by the clinic collection API or a payment webhook.</div>
      </body></html>`;
    const popup = window.open("", "receipt-print", "width=480,height=640");
    if (!popup) return;
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const submitCollect = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!receipt?.appointmentId) {
      setCollectError("Select an appointment before collecting.");
      return;
    }
    setCollecting(true);
    setError("");
    setCollectError("");
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
      const body = unwrapS4(response) || response || {};
      const printed = body?.receipt || response?.receipt || body?.data?.receipt || body;
      setIssuedReceipt(printed);
      setNote(
        body?.message ||
          response?.message ||
          (payload.method === "PAY_LINK"
            ? "Pay link reserved. Visit stays unpaid until collection or webhook."
            : "Collected at reception.")
      );
      window.setTimeout(() => printReceiptWindow(printed, payload.method), 50);
      await load();
    } catch (err) {
      const message = s4Message(err) || apiMessage(err, "Collection failed");
      setCollectError(message);
      setError(message);
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="page-content admin-dashboard-page reception-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title reception-page-title">Reception</h2>
        <p className="clinic-page-subtitle reception-page-subtitle">Clinical case-taking stays on the doctor. These actions are for this doctor only.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Row className="g-3">
          <Col md={6}>
            <Card className="admin-dash-card"><CardBody>
              <h5>Quick actions</h5>
              <p className="text-muted small mb-2">Case paper and Schedule stay in the top menu. Open one desk form at a time.</p>
              <div className="d-flex flex-wrap gap-2" data-testid="reception-quick-actions">
                <Button
                  className="btn btn-sm reception-primary-btn"
                  outline={deskPanel !== "patient"}
                  onClick={() => setDeskPanel((current) => (current === "patient" ? null : "patient"))}
                >
                  New patient
                </Button>
                <Button
                  className="btn btn-sm reception-primary-btn"
                  outline={deskPanel !== "appointment"}
                  onClick={() => setDeskPanel((current) => (current === "appointment" ? null : "appointment"))}
                >
                  New appointment
                </Button>
                <Button
                  color="soft-warning"
                  data-testid="reception-collect-payment"
                  onClick={() => {
                    if (deskPanel === "collect") {
                      setDeskPanel(null);
                      return;
                    }
                    const source = dayVisits.length ? dayVisits : queue;
                    const firstUnpaid = source.find((row) => {
                      const status = String(row.paymentStatus || row.PaymentStatus || "UNPAID").toUpperCase();
                      return status !== "PAID" && status !== "REFUNDED";
                    }) || source[0];
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
                    setDeskPanel("collect");
                  }}
                >
                  Collect payment
                </Button>
              </div>
            </CardBody></Card>
          </Col>
          <Col md={6}>
            <Card className="admin-dash-card"><CardBody>
              {/* REC-08.03 — queue panel: order, wait time, paid/unpaid, Call next */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Queue</h5>
                <Button
                  size="sm"
                  className="reception-primary-btn"
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
                          <div className="fw-medium">{id} · {name}</div>
                          <div className="text-muted small">
                            {row.appointmentTime || row.AppointmentTime || "—"} · {wait}
                            {" · "}
                            {row.status || row.Status || "—"}
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
                              setDeskPanel("collect");
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
          {deskPanel === "collect" && receipt ? (
            <Col md={6}>
              {/* PAY-04 / REC-13 — CollectAtReception on New API :5002 */}
              <Card className="admin-dash-card" data-testid="reception-receipt-shell" style={{ position: "relative", zIndex: 6 }}>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Collect at reception</h5>
                    <Button size="sm" color="link" className="p-0" type="button" onClick={() => { setDeskPanel(null); setReceipt(null); setIssuedReceipt(null); setCollectError(""); }}>
                      Close
                    </Button>
                  </div>
                  <p className="text-muted small">
                    Cash, offline UPI, card POS, or reserve a pay link. Paid status is set by this API or the Razorpay webhook — not by the client alone.
                  </p>
                  {collectError ? <Alert color="danger">{collectError}</Alert> : null}
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
                    {(dayVisits.length ? dayVisits : queue).map((row) => {
                      const id = row.patientAppId || row.PatientAppId;
                      const name = row.patientName || row.PatientName || "Patient";
                      const time = row.appointmentTime || row.AppointmentTime || "";
                      return (
                        <option key={id} value={String(id)}>
                          {id} · {name}{time ? ` · ${time}` : ""}
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
                    type="button"
                    className="reception-primary-btn mt-3"
                    disabled={collecting || !receipt.appointmentId}
                    onClick={submitCollect}
                    data-testid="reception-receipt-submit"
                  >
                    {collecting ? "Collecting…" : receipt.method === "PAY_LINK" ? "Reserve pay link" : "Collect & print receipt"}
                  </Button>
                  {issuedReceipt ? (
                    <div className="mt-3 border rounded p-3 bg-light" data-testid="reception-receipt-print">
                      <div className="fw-medium mb-1">Receipt</div>
                      <div className="small">Order {issuedReceipt.paymentOrderId || issuedReceipt.PaymentOrderId || "—"}</div>
                      <div className="small">Visit {issuedReceipt.patientAppId || issuedReceipt.PatientAppId || receipt.appointmentId}</div>
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
                      <Button
                        type="button"
                        size="sm"
                        className="reception-primary-btn mt-2"
                        onClick={() => printReceiptWindow(issuedReceipt, receipt.method)}
                      >
                        Print again
                      </Button>
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            </Col>
          ) : null}
          {deskPanel === "patient" ? (
          <Col md={6} id="reception-new-patient">
            <Card className="admin-dash-card"><CardBody>
              <h5>New patient</h5>
              <p className="text-muted small">Register a walk-in. They appear in search for booking and case paper.</p>
              <ReceptionNewPatientForm
                onCreated={(created) => {
                  const label = `${created.patientName}${created.mobileNo ? ` · ${created.mobileNo}` : ""}`;
                  if (created.patientId) pickSharedPatient(created.patientId, label);
                }}
              />
            </CardBody></Card>
          </Col>
          ) : null}
          {deskPanel === "appointment" ? (
          <Col md={6} id="reception-assisted">
            <Card className="admin-dash-card"><CardBody>
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
                onPatientSelected={(picked) => pickSharedPatient(picked.patientId, picked.label)}
                onBooked={() => load().catch(() => {})}
              />
            </CardBody></Card>
          </Col>
          ) : null}
        </Row>
        <TodaysAppointments
          onEditAppointment={(row) => setTimeEditRow(row)}
        />
      </Container>
      <UpdateAppointmentTimeModal
        isOpen={!!timeEditRow}
        toggle={() => setTimeEditRow(null)}
        doctorId={doctorId}
        patientAppId={timeEditRow?.patientAppId}
        appointmentDate={timeEditRow?.appointmentDate}
        onSaved={load}
      />
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

/** REC-10 — same-day time edit. Does not notify the patient. Reschedule is the other path. */
const UpdateAppointmentTimeModal = ({ isOpen, toggle, doctorId, patientAppId, appointmentDate, onSaved }) => {
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [note, setNote] = useState("");
  const [errorText, setErrorText] = useState("");
  const [busy, setBusy] = useState(false);
  const date = formatApiDate(appointmentDate);

  useEffect(() => {
    if (!isOpen) return undefined;
    setTime("");
    setErrorText("");
    let cancelled = false;
    const loadSlots = async () => {
      if (!doctorId || !date) {
        setSlots([]);
        setNote(doctorId ? "This visit has no date." : "Doctor is required before slots can load.");
        return;
      }
      setNote("Loading open slots…");
      try {
        const response = await getAppointmentSlots({
          doctorId,
          appointmentDate: date,
          currentPatientAppId: patientAppId,
        });
        const parsed = normalizeAppointmentSlotsResponse(response?.data ?? response);
        const open = (parsed.slots || []).filter((slot) => slot.status === "available" && slot.time);
        if (cancelled) return;
        setSlots(open);
        setNote(open.length ? `${open.length} open slot${open.length === 1 ? "" : "s"} on this day.` : "No open slots on this day.");
      } catch (error) {
        if (!cancelled) {
          setSlots([]);
          setNote(s4Message(error) || "Could not load slots.");
        }
      }
    };
    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [isOpen, doctorId, patientAppId, date]);

  const save = async () => {
    const appointmentTimeValue = timeInputToApiTime(time);
    if (!patientAppId || !date || !appointmentTimeValue) return;
    setBusy(true);
    setErrorText("");
    try {
      await updateAppointmentTime({
        patientAppId: Number(patientAppId),
        appointmentDate: date,
        appointmentTime: appointmentTimeValue,
      });
      if (toggle) toggle();
      Swal.fire({
        icon: "success",
        text: "Appointment time updated. The patient is not notified. Use Reschedule when they should be told.",
        timer: 2200,
        showConfirmButton: false,
      });
      if (onSaved) onSaved();
    } catch (error) {
      setErrorText(s4Message(error) || "Could not update the time.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>Update appointment time</ModalHeader>
      <ModalBody>
        <p className="text-muted small">
          This changes the time on the same day only. It does not notify the patient. Reschedule on the queue is the path that notifies them.
        </p>
        {errorText ? <Alert color="danger">{errorText}</Alert> : null}
        <Label>Date</Label>
        <Input value={date || "—"} disabled />
        <Label className="mt-2">New slot</Label>
        <Input type="select" value={time} onChange={(event) => setTime(event.target.value)}>
          <option value="">{note || "Select a slot"}</option>
          {slots.map((slot) => (
            <option key={slot.time} value={slot.time}>{slot.label || slot.time}</option>
          ))}
        </Input>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" disabled={busy || !time} onClick={save}>
          {busy ? "Saving…" : "Update time"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ReceptionHome;
