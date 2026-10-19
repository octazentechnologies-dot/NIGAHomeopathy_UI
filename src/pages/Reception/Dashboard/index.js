import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";
import Swal from "sweetalert2";
import AssistedBookWizard from "../../../Components/Common/AssistedBookWizard";
import CancelAppointmentModal from "../../../Components/Common/CancelAppointmentModal";
import RescheduleModal from "../../../Components/Common/RescheduleModal";
import {
  formatApiDate,
  normalizeAppointmentSlotsResponse,
  timeInputToApiTime,
} from "../../../helpers/appointmentSlotHelper";
import { COMPLETED_APPOINTMENT_LOCKED_MESSAGE, isAppointmentCompleted } from "../../../helpers/appointmentStatus";
import {
  callNextAppointment,
  getAppointmentQueue,
  getAppointmentSlots,
  updateAppointmentTime,
} from "../../../helpers/realbackend_helper";
import { collectAtReception, getPublicFee, s4Message, unwrapS4 } from "../../../helpers/s4Week4Api";
import { paymentStatusMeta } from "../../../helpers/paymentStatusBadge";
import { apiMessage, readReceptionDoctorId, unwrap } from "../receptionSession";
import ReceptionCheckInFlow from "../components/ReceptionCheckInFlow";
import ReceptionNewPatientForm from "../components/ReceptionNewPatientForm";
import SummaryWidgets from "../components/SummaryWidgets";
import TodaysAppointments from "../components/TodaysAppointments";
import "../components/receptionDashboard.css";

const formatWaitLabel = (waitMinutes) => {
  if (waitMinutes == null || Number.isNaN(Number(waitMinutes))) return "—";
  const mins = Math.trunc(Number(waitMinutes));
  if (mins > 0) return `${mins}m wait`;
  if (mins < 0) return `in ${Math.abs(mins)}m`;
  return "due now";
};

const METHOD_OPTIONS = [
  { label: "Cash", value: "CASH" },
  { label: "UPI (offline)", value: "UPI_OFFLINE" },
  { label: "Card (POS)", value: "CARD_POS" },
  { label: "Payment link", value: "PAY_LINK" },
];

/**
 * Real reception desk UI (image-1 components): SummaryWidgets + Quick Actions +
 * queue / collect + today's list. Bound to live APIs.
 * Primary route: /reception (not ReceptionHome).
 */
const ReceptionDashboard = () => {
  document.title = "Reception | Homeocentrum";
  const navigate = useNavigate();
  const location = useLocation();
  const doctorId = readReceptionDoctorId();

  const [selectedRow, setSelectedRow] = useState(null);
  const [checkInRow, setCheckInRow] = useState(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [paymentPatch, setPaymentPatch] = useState(null);
  const [feeByType, setFeeByType] = useState({ inClinic: null, tele: null });
  const [deskPanel, setDeskPanel] = useState(null); // null | "patient" | "appointment" | "collect"
  const [assistedPatientId, setAssistedPatientId] = useState("");
  const [assistedPatientName, setAssistedPatientName] = useState("");
  const [assistedPickKey, setAssistedPickKey] = useState(0);
  const [rescheduleRow, setRescheduleRow] = useState(null);
  const [timeEditRow, setTimeEditRow] = useState(null);
  const [cancelRow, setCancelRow] = useState(null);
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const [queue, setQueue] = useState([]);
  const [dayVisits, setDayVisits] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [collecting, setCollecting] = useState(false);
  const [issuedReceipt, setIssuedReceipt] = useState(null);
  const [collectError, setCollectError] = useState("");

  const clearCheckIn = useCallback(() => setCheckInRow(null), []);
  const bumpList = useCallback(() => setListRefreshKey((n) => n + 1), []);

  const openNewPatient = useCallback(() => {
    setDeskPanel("patient");
    setBanner("");
  }, []);

  const openBookAppointment = useCallback(() => {
    setDeskPanel("appointment");
    setBanner("");
  }, []);

  const asRows = (response) => {
    const body = unwrap(response);
    const rows = body.queue || body.Queue || body.data || body;
    return Array.isArray(rows) ? rows : [];
  };

  const loadQueue = useCallback(async () => {
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
    } catch (err) {
      setError(apiMessage(err, "Queue failed"));
    } finally {
      setQueueLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    const hash = (location.hash || "").replace(/^#/, "");
    if (hash === "reception-new-patient") openNewPatient();
    if (hash === "reception-assisted") openBookAppointment();
  }, [location.hash, openNewPatient, openBookAppointment]);

  useEffect(() => {
    if (!doctorId) return undefined;
    let cancelled = false;
    getPublicFee(doctorId)
      .then((response) => {
        if (cancelled) return;
        const fee = unwrapS4(response) || {};
        const data = fee.data || fee.Data || fee;
        setFeeByType({
          inClinic: data.inClinicFee ?? data.InClinicFee ?? null,
          tele: data.teleFee ?? data.TeleFee ?? data.inClinicFee ?? data.InClinicFee ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setFeeByType({ inClinic: null, tele: null });
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  useEffect(() => {
    loadQueue().catch(() => {});
  }, [loadQueue, listRefreshKey]);

  const waitingCount = queue.filter(
    (row) => String(row.status || row.Status || "").toUpperCase() === "WAITING"
  ).length;

  const consultationFee = useMemo(() => {
    const row = selectedRow || checkInRow;
    if (!row) return feeByType.inClinic;
    const tele = String(row.type || "").toLowerCase().includes("tele");
    const fromRow = Number(String(row.payment || "").replace(/[^\d.]/g, ""));
    if (Number.isFinite(fromRow) && fromRow > 0) return fromRow;
    return tele ? feeByType.tele : feeByType.inClinic;
  }, [selectedRow, checkInRow, feeByType]);

  const markRowPaid = (patientAppId, method) => {
    const patch = (row) =>
      String(row.patientAppId || row.PatientAppId) === String(patientAppId)
        ? { ...row, paymentStatus: "PAID", PaymentStatus: "PAID", paymentMethod: method, PaymentMethod: method }
        : row;
    setQueue((rows) => rows.map(patch));
    setDayVisits((rows) => rows.map(patch));
    setPaymentPatch({ patientAppId, paymentStatus: "PAID", paymentMethod: method, at: Date.now() });
  };

  const pickSharedPatient = (patientId, label) => {
    if (!patientId) return;
    setAssistedPatientId(String(patientId));
    setAssistedPatientName(label || "");
    setAssistedPickKey((k) => k + 1);
    setDeskPanel("appointment");
    setBanner(`Patient ready for booking: ${label || patientId}`);
  };

  const callNext = async () => {
    try {
      const response = await callNextAppointment(doctorId);
      setBanner(unwrap(response).message || unwrap(response).Message || "Next patient called.");
      bumpList();
      await loadQueue();
    } catch (err) {
      setError(apiMessage(err, "No waiting patient"));
    }
  };

  const openCollect = (appointmentId = "") => {
    const source = dayVisits.length ? dayVisits : queue;
    const firstUnpaid =
      source.find((row) => {
        const status = String(row.paymentStatus || row.PaymentStatus || "UNPAID").toUpperCase();
        return status !== "PAID" && status !== "REFUNDED";
      }) || source[0];
    const firstApp = appointmentId
      || (firstUnpaid ? String(firstUnpaid.patientAppId || firstUnpaid.PatientAppId || "") : "");
    setIssuedReceipt(null);
    setCollectError("");
    setReceipt({
      amount: "",
      method: "CASH",
      appointmentId: firstApp,
      gst: "GST applied by API on collection",
    });
    setDeskPanel("collect");
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
    if (!receipt?.appointmentId) {
      setCollectError("Select an appointment before collecting.");
      return;
    }
    setCollecting(true);
    setCollectError("");
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
      setBanner(
        body?.message ||
          response?.message ||
          (payload.method === "PAY_LINK"
            ? "Pay link reserved. Visit stays unpaid until collection or webhook."
            : "Collected at reception.")
      );
      if (payload.method !== "PAY_LINK") {
        markRowPaid(payload.patientAppId, payload.method);
      }
      window.setTimeout(() => printReceiptWindow(printed, payload.method), 50);
      bumpList();
      await loadQueue();
    } catch (err) {
      setCollectError(s4Message(err) || apiMessage(err, "Collection failed"));
    } finally {
      setCollecting(false);
    }
  };

  if (!doctorId) {
    return (
      <div className="page-content clinic-workspace-page">
        <Container fluid>
          <Alert color="warning" className="mt-3">
            No doctor is linked to this reception login. Ask the clinic admin to map reception staff to a doctor.
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content admin-dashboard-page doctor-dashboard-page reception-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
          <div>
            <h2 className="clinic-page-title mb-1">Reception</h2>
            <p className="clinic-page-subtitle mb-0">
              KPI widgets, check-in steps, live queue, collect payment, and today&apos;s appointments.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm btn-soft-primary" onClick={openNewPatient}>
              New patient
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={openBookAppointment}>
              Book appointment
            </button>
            <button type="button" className="btn btn-sm btn-soft-warning" onClick={() => openCollect()}>
              Collect payment
            </button>
            <button
              type="button"
              className="btn btn-sm btn-soft-secondary"
              onClick={() => navigate("/reception/schedule")}
            >
              Schedule
            </button>
          </div>
        </div>

        {error ? (
          <Alert color="danger" toggle={() => setError("")} className="mt-2">
            {error}
          </Alert>
        ) : null}
        {banner ? (
          <Alert color="success" toggle={() => setBanner("")} className="mt-2">
            {banner}
          </Alert>
        ) : null}

        <SummaryWidgets refreshKey={listRefreshKey} />

        <ReceptionCheckInFlow
          selectedRow={selectedRow}
          checkInRow={checkInRow}
          consultationFee={consultationFee}
          onSelectRow={setSelectedRow}
          onCheckInHandled={clearCheckIn}
          onOpenNewPatient={openNewPatient}
          onOpenBookAppointment={openBookAppointment}
          onVisitStatusChanged={() => bumpList()}
          onPaymentConfirmed={(details, row) => {
            const patientAppId = row?.patientAppId || details?.patientAppId;
            if (!patientAppId) return;
            markRowPaid(patientAppId, details?.paymentMethod);
            bumpList();
            setBanner("Payment recorded for this visit.");
          }}
        />

        <Row className="g-3 mt-1">
          <Col md={6}>
            <Card className="admin-dash-card">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Queue</h5>
                  <Button
                    size="sm"
                    className="reception-primary-btn"
                    onClick={callNext}
                    disabled={!doctorId || waitingCount === 0 || queueLoading}
                  >
                    Call next
                  </Button>
                </div>
                {queueLoading ? (
                  <div className="text-center py-3">
                    <Spinner size="sm" /> Loading queue…
                  </div>
                ) : queue.length === 0 ? (
                  <p className="text-muted mb-0">No patients in queue.</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {queue.map((row) => {
                      const id = row.patientAppId || row.PatientAppId;
                      const name = row.patientName || row.PatientName || "Patient";
                      const wait = formatWaitLabel(row.waitMinutes ?? row.WaitMinutes);
                      const pay = paymentStatusMeta(row.paymentStatus || row.PaymentStatus);
                      return (
                        <li
                          key={id}
                          className="d-flex justify-content-between align-items-start border-bottom py-2 gap-2"
                        >
                          <div>
                            <div className="fw-medium">
                              {id} · {name}
                            </div>
                            <div className="text-muted small">
                              {row.appointmentTime || row.AppointmentTime || "—"} · {wait}
                              {" · "}
                              {row.status || row.Status || "—"}
                              {" · "}
                              <span className={`badge bg-${pay.tone}-subtle text-${pay.tone}`}>{pay.label}</span>
                            </div>
                          </div>
                          <div className="d-flex flex-shrink-0 gap-1">
                            <Button size="sm" color="soft-warning" onClick={() => openCollect(String(id))}>
                              Collect
                            </Button>
                            <span
                              className="d-flex gap-1"
                              title={
                                isAppointmentCompleted(row.status || row.Status)
                                  ? COMPLETED_APPOINTMENT_LOCKED_MESSAGE
                                  : undefined
                              }
                            >
                              <Button
                                size="sm"
                                color="soft-info"
                                disabled={isAppointmentCompleted(row.status || row.Status)}
                                onClick={() => setRescheduleRow(row)}
                              >
                                Reschedule
                              </Button>
                              <Button
                                size="sm"
                                color="soft-danger"
                                disabled={isAppointmentCompleted(row.status || row.Status)}
                                onClick={() => setCancelRow(row)}
                              >
                                Cancel
                              </Button>
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>
          </Col>

          {deskPanel === "collect" && receipt ? (
            <Col md={6}>
              <Card className="admin-dash-card" style={{ position: "relative", zIndex: 6 }}>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Collect at reception</h5>
                    <Button
                      size="sm"
                      color="link"
                      className="p-0"
                      type="button"
                      onClick={() => {
                        setDeskPanel(null);
                        setReceipt(null);
                        setIssuedReceipt(null);
                        setCollectError("");
                      }}
                    >
                      Close
                    </Button>
                  </div>
                  {collectError ? <Alert color="danger">{collectError}</Alert> : null}
                  <Label htmlFor="reception-receipt-amount">Amount (optional)</Label>
                  <Input
                    id="reception-receipt-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={receipt.amount}
                    onChange={(event) => setReceipt({ ...receipt, amount: event.target.value })}
                  />
                  <Label className="mt-2" htmlFor="reception-receipt-method">
                    Method
                  </Label>
                  <Input
                    id="reception-receipt-method"
                    type="select"
                    value={receipt.method}
                    onChange={(event) => setReceipt({ ...receipt, method: event.target.value })}
                  >
                    {METHOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Input>
                  <Label className="mt-2" htmlFor="reception-receipt-appointment">
                    Appointment
                  </Label>
                  <Input
                    id="reception-receipt-appointment"
                    type="select"
                    value={receipt.appointmentId}
                    onChange={(event) => setReceipt({ ...receipt, appointmentId: event.target.value })}
                  >
                    <option value="">Select appointment</option>
                    {(dayVisits.length ? dayVisits : queue).map((row) => {
                      const id = row.patientAppId || row.PatientAppId;
                      const name = row.patientName || row.PatientName || "Patient";
                      const time = row.appointmentTime || row.AppointmentTime || "";
                      return (
                        <option key={id} value={String(id)}>
                          {id} · {name}
                          {time ? ` · ${time}` : ""}
                        </option>
                      );
                    })}
                  </Input>
                  <Button
                    type="button"
                    className="reception-primary-btn mt-3"
                    disabled={collecting || !receipt.appointmentId}
                    onClick={submitCollect}
                  >
                    {collecting
                      ? "Collecting…"
                      : receipt.method === "PAY_LINK"
                        ? "Reserve pay link"
                        : "Collect & print receipt"}
                  </Button>
                  {issuedReceipt ? (
                    <div className="mt-3 border rounded p-3 bg-light">
                      <div className="fw-medium mb-1">Receipt</div>
                      <div className="small">
                        Order {issuedReceipt.paymentOrderId || issuedReceipt.PaymentOrderId || "—"}
                      </div>
                      <div className="small">
                        Visit {issuedReceipt.patientAppId || issuedReceipt.PatientAppId || receipt.appointmentId}
                      </div>
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
        </Row>

        <TodaysAppointments
          refreshKey={listRefreshKey}
          paymentPatch={paymentPatch}
          onCheckInEdit={(row) => {
            setSelectedRow(row);
            setCheckInRow(row);
          }}
          onEditAppointment={(row) => setTimeEditRow(row)}
          onReschedule={(row) => setRescheduleRow(row)}
          onCancel={(row) => setCancelRow(row)}
        />

        <Modal
          isOpen={deskPanel === "patient"}
          toggle={() => setDeskPanel(null)}
          size="md"
          centered
        >
          <ModalHeader toggle={() => setDeskPanel(null)}>New patient</ModalHeader>
          <ModalBody>
            <ReceptionNewPatientForm
              onCreated={(created) => {
                const label = `${created.patientName}${created.mobileNo ? ` · ${created.mobileNo}` : ""}`;
                if (created.patientId) pickSharedPatient(created.patientId, label);
                else {
                  setBanner(`Patient registered: ${label}`);
                  setDeskPanel(null);
                }
              }}
            />
          </ModalBody>
        </Modal>

        <Modal
          isOpen={deskPanel === "appointment"}
          toggle={() => setDeskPanel(null)}
          size="xl"
          centered
          scrollable
        >
          <ModalHeader toggle={() => setDeskPanel(null)}>Book appointment</ModalHeader>
          <ModalBody>
            <AssistedBookWizard
              doctorId={doctorId}
              showRequestQueue
              selectedPatientId={assistedPatientId}
              patientNameHint={assistedPatientName}
              patientPickKey={assistedPickKey}
              onPatientSelected={(picked) => pickSharedPatient(picked.patientId, picked.label)}
              onBooked={() => {
                bumpList();
                setDeskPanel(null);
                setBanner("Appointment booked.");
                loadQueue().catch(() => {});
              }}
            />
          </ModalBody>
        </Modal>

        <UpdateAppointmentTimeModal
          isOpen={!!timeEditRow}
          toggle={() => setTimeEditRow(null)}
          doctorId={doctorId}
          patientAppId={timeEditRow?.patientAppId}
          appointmentDate={timeEditRow?.appointmentDate}
          onSaved={() => {
            bumpList();
            setTimeEditRow(null);
          }}
        />
        <RescheduleModal
          isOpen={!!rescheduleRow}
          toggle={() => setRescheduleRow(null)}
          patientAppId={rescheduleRow?.patientAppId || rescheduleRow?.PatientAppId}
          doctorId={doctorId}
          appointmentDate={rescheduleRow?.appointmentDate || rescheduleRow?.AppointmentDate}
          appointmentTime={rescheduleRow?.appointmentTime || rescheduleRow?.AppointmentTime}
          onSaved={() => {
            bumpList();
            setRescheduleRow(null);
          }}
        />
        <CancelAppointmentModal
          isOpen={!!cancelRow}
          toggle={() => setCancelRow(null)}
          patientAppId={cancelRow?.patientAppId || cancelRow?.PatientAppId}
          onSaved={() => {
            bumpList();
            setCancelRow(null);
          }}
        />
      </Container>
    </div>
  );
};

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
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setNote(s4Message(err) || "Could not load slots.");
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
    } catch (err) {
      setErrorText(s4Message(err) || "Could not update the time.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>Update appointment time</ModalHeader>
      <ModalBody>
        {errorText ? <Alert color="danger">{errorText}</Alert> : null}
        <Label>Date</Label>
        <Input value={date || "—"} disabled />
        <Label className="mt-2">New slot</Label>
        <Input type="select" value={time} onChange={(event) => setTime(event.target.value)}>
          <option value="">{note || "Select a slot"}</option>
          {slots.map((slot) => (
            <option key={slot.time} value={slot.time}>
              {slot.label || slot.time}
            </option>
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

export default ReceptionDashboard;
