import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
  Table,
} from "reactstrap";
import {
  acceptMedicineQuote,
  completeFollowUp,
  createMedicineOrder,
  createMedicinePayment,
  erxHistory,
  getPatientDiary,
  getPatientFollowUps,
  getPatientProgress,
  getPatientTimeline,
  grantMedicineConsent,
  listPharmacySellers,
  medicineTracking,
  patientMedicineOrders,
  patientPayments,
  postDiaryEntry,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";

/**
 * CON / MED patient continuity — timeline, follow-ups, diary, medicine orders (New API :5002).
 */
const PatientContinuityPage = ({ section = "continuity" }) => {
  const medicineOnly = section === "medicine";
  const [timeline, setTimeline] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [diary, setDiary] = useState([]);
  const [progress, setProgress] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const [diarySeverity, setDiarySeverity] = useState("5");
  const [snapshots, setSnapshots] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [pharmacyPartnerId, setPharmacyPartnerId] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [confirmOrder, setConfirmOrder] = useState(null);

  document.title = `${medicineOnly ? "Medicine orders" : "Care continuity"} | Niga Homeocentrum`;

  const asList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.orders)) return payload.orders;
    if (Array.isArray(payload?.entries)) return payload.entries;
    if (Array.isArray(payload?.tasks)) return payload.tasks;
    if (Array.isArray(payload?.events)) return payload.events;
    return [];
  };

  const asTimeline = (payload) => {
    const inner =
      payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)
        ? payload.data
        : payload;
    const direct = asList(inner);
    if (direct.length) return direct;
    const visits = inner?.appointments || inner?.Appointments || [];
    const scripts = inner?.prescriptions || inner?.Prescriptions || [];
    const events = [];
    if (Array.isArray(visits)) {
      visits.forEach((row, idx) => {
        const status = String(row.title || row.status || row.Status || "").trim();
        if (status.toUpperCase() === "CANCELLED") return;
        events.push({
          eventId: `apt-${row.refId || row.patientAppId || row.PatientAppId || idx}`,
          title: `Visit ${status}`.trim(),
          eventType: "appointment",
          occurredAt: row.at || row.At || row.appointmentDate || row.AppointmentDate,
          summary: row.refId || row.patientAppId ? `Appointment ${row.refId || row.patientAppId || row.PatientAppId}` : "",
        });
      });
    }
    if (Array.isArray(scripts)) {
      scripts.forEach((row, idx) => {
        events.push({
          eventId: `erx-${row.erxSnapshotId || row.ErxSnapshotId || idx}`,
          title: "Signed prescription",
          eventType: "erx",
          occurredAt: row.signedAt || row.SignedAt,
          summary: `eRx ${row.erxSnapshotId || row.ErxSnapshotId || "—"} · visit ${row.patientAppId || row.PatientAppId || "—"}`,
        });
      });
    }
    return events.sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (medicineOnly) {
        const [o, h, s, pay] = await Promise.all([
          patientMedicineOrders(),
          erxHistory(),
          listPharmacySellers(),
          patientPayments(),
        ]);
        setOrders(asList(unwrapS4(o)));
        setSnapshots(asList(unwrapS4(h)));
        setSellers(asList(unwrapS4(s)));
        setPayments(asList(unwrapS4(pay)));
      } else {
        const [t, f, d, p, o] = await Promise.all([
          getPatientTimeline(),
          getPatientFollowUps(),
          getPatientDiary(),
          getPatientProgress(),
          patientMedicineOrders(),
        ]);
        setTimeline(asTimeline(unwrapS4(t)));
        setFollowUps(asList(unwrapS4(f)));
        setDiary(asList(unwrapS4(d)));
        setProgress(unwrapS4(p));
        setOrders(asList(unwrapS4(o)));
      }
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [medicineOnly]);

  const placeMedicineOrder = async (id) => {
    setBusyId(id);
    setError("");
    try {
      const payload = { erxSnapshotId: id };
      if (pharmacyPartnerId) payload.pharmacyPartnerId = Number(pharmacyPartnerId);
      const created = unwrapS4(await createMedicineOrder(payload));
      const orderId = created?.medicineOrderId || created?.MedicineOrderId;
      if (orderId) await grantMedicineConsent(orderId);
      setNote(`Medicine order ${orderId || ""} started. You are not charged until you accept a quote and choose Pay online or COD.`);
      setConfirmOrder(null);
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const askMedicineOrder = (id) => {
    const previous = orders.find((row) => String(row.erxSnapshotId || row.ErxSnapshotId) === String(id));
    if (previous) {
      setConfirmOrder({
        erxId: id,
        previousId: previous.medicineOrderId || previous.MedicineOrderId || previous.id,
        status: previous.status || previous.Status || "",
      });
      return;
    }
    placeMedicineOrder(id);
  };

  if (medicineOnly) {
    return (
      <div className="page-content admin-dashboard-page clinic-workspace-page">
        <Container fluid>
          <h2 className="clinic-page-title">Medicine orders</h2>
          <p className="clinic-page-subtitle">Order medicines does not take payment. Pay only after the pharmacy quotes and you accept.</p>
          {error ? <Alert color="danger">{error}</Alert> : null}
          {note ? <Alert color="success">{note}</Alert> : null}
          <Card className="admin-dash-card mb-3">
            <CardBody>
              <h5>Signed prescriptions</h5>
              <FormGroup>
                <Label>Pharmacy (optional)</Label>
                <Input
                  type="select"
                  value={pharmacyPartnerId}
                  onChange={(e) => setPharmacyPartnerId(e.target.value)}
                >
                  <option value="">Auto-route</option>
                  {sellers.map((row) => {
                    const id = row.pharmacyPartnerId || row.PharmacyPartnerId;
                    return (
                      <option key={id} value={id}>
                        {row.name || row.Name || `${id}`} {row.area || row.Area ? `(${row.area || row.Area})` : ""}
                      </option>
                    );
                  })}
                </Input>
              </FormGroup>
              {loading ? (
                <Spinner size="sm" />
              ) : snapshots.length === 0 ? (
                <p className="text-muted mb-0">No signed eRx yet. After the doctor signs, it appears here.</p>
              ) : (
                <Table size="sm">
                  <thead>
                    <tr>
                      <th>eRx</th>
                      <th>Visit</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((row) => {
                      const id = row.erxSnapshotId || row.ErxSnapshotId;
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{row.patientAppId || row.PatientAppId || "—"}</td>
                          <td>
                            <Button
                              size="sm"
                              className="clinic-primary-btn"
                              disabled={busyId === id}
                              onClick={() => askMedicineOrder(id)}
                            >
                              Order medicines
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
          <Card className="admin-dash-card">
            <CardBody>
              <h5>Orders</h5>
              {loading ? (
                <div className="text-center py-4"><Spinner size="sm" /> Loading…</div>
              ) : orders.length === 0 ? (
                <p className="text-muted mb-0">No medicine orders yet.</p>
              ) : (
                <Table size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((row) => {
                      const id = row.medicineOrderId || row.MedicineOrderId || row.id;
                      const status = String(row.status || row.Status || "");
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{status || "—"}</td>
                          <td>{row.quoteAmount ?? row.QuoteAmount ?? row.amount ?? "—"}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {status.toUpperCase() === "QUOTED" ? (
                                <Button
                                  size="sm"
                                  color="soft-success"
                                  disabled={busyId === id}
                                  onClick={async () => {
                                    setBusyId(id);
                                    try {
                                      await acceptMedicineQuote(id);
                                      setNote(`Quote accepted for ${id}.`);
                                      await load();
                                    } catch (err) {
                                      setError(s4Message(err));
                                    } finally {
                                      setBusyId(null);
                                    }
                                  }}
                                >
                                  Accept quote
                                </Button>
                              ) : null}
                              {status.toUpperCase() === "QUOTED_ACCEPTED" ? (
                                <>
                                  <Button
                                    size="sm"
                                    color="soft-primary"
                                    disabled={busyId === id}
                                    onClick={async () => {
                                      setBusyId(id);
                                      try {
                                        await createMedicinePayment({ medicineOrderId: id, payMode: "ONLINE" });
                                        setNote(`Online payment started for ${id}.`);
                                        await load();
                                      } catch (err) {
                                        setError(s4Message(err));
                                      } finally {
                                        setBusyId(null);
                                      }
                                    }}
                                  >
                                    Pay online
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="soft-secondary"
                                    disabled={busyId === id}
                                    onClick={async () => {
                                      setBusyId(id);
                                      try {
                                        await createMedicinePayment({ medicineOrderId: id, payMode: "COD" });
                                        setNote(`COD recorded for ${id}.`);
                                        await load();
                                      } catch (err) {
                                        setError(s4Message(err));
                                      } finally {
                                        setBusyId(null);
                                      }
                                    }}
                                  >
                                    COD
                                  </Button>
                                </>
                              ) : null}
                              <Button
                                size="sm"
                                color="soft-info"
                                disabled={busyId === id}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await medicineTracking(id);
                                    setNote(`Tracking refreshed for ${id}.`);
                                  } catch (err) {
                                    setError(s4Message(err));
                                  } finally {
                                    setBusyId(null);
                                  }
                                }}
                              >
                                Track
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
          <Card className="admin-dash-card mt-3">
            <CardBody>
              <h5>How payments work</h5>
              <ol className="mb-3 ps-3">
                <li>Patient — Order medicines creates the order and grants consent. No charge yet.</li>
                <li>Pharmacy — accepts with OTP, confirms stock, and saves a quote.</li>
                <li>Patient — Accept quote, then Pay online or COD.</li>
                <li>Pharmacy — marks the order ready and dispatches it.</li>
              </ol>
              <p className="text-muted small mb-3">
                Admin activates the pharmacy and handles exceptions. Account sees the medicine ledger.
                Reception collects visit fees only, not medicine orders.
              </p>
              <h5>Payments</h5>
              {payments.length === 0 ? (
                <p className="text-muted mb-0">No consult or medicine payments yet.</p>
              ) : (
                <Table size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Stream</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((row, idx) => (
                      <tr key={row.paymentOrderId || row.PaymentOrderId || idx}>
                        <td>{row.paymentOrderId || row.PaymentOrderId || "—"}</td>
                        <td>{row.stream || row.Stream || "—"}</td>
                        <td>{row.status || row.Status || "—"}</td>
                        <td>{row.amount ?? row.Amount ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
          <Modal isOpen={!!confirmOrder} toggle={() => setConfirmOrder(null)}>
            <ModalHeader toggle={() => setConfirmOrder(null)}>Order these medicines again?</ModalHeader>
            <ModalBody>
              This prescription already has order {confirmOrder?.previousId || ""}
              {confirmOrder?.status ? ` (${confirmOrder.status})` : ""}.
              A new order uses the same signed prescription.
            </ModalBody>
            <ModalFooter>
              <Button color="soft-secondary" onClick={() => setConfirmOrder(null)}>Cancel</Button>
              <Button
                className="clinic-primary-btn"
                disabled={busyId === confirmOrder?.erxId}
                onClick={() => placeMedicineOrder(confirmOrder.erxId)}
              >
                Order again
              </Button>
            </ModalFooter>
          </Modal>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">Care continuity</h2>
        <p className="clinic-page-subtitle">Timeline, follow-ups, diary, and progress from your clinic visits.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        {loading ? (
          <div className="py-4"><Spinner size="sm" /> Loading…</div>
        ) : (
          <Row className="g-3">
            <Col lg={6}>
              <Card className="admin-dash-card">
                <CardBody>
                  <h5>Timeline</h5>
                  {timeline.length === 0 ? (
                    <p className="text-muted mb-0">No timeline events yet.</p>
                  ) : (
                    <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    <ul className="list-unstyled mb-0">
                      {timeline.map((row, idx) => (
                        <li key={row.eventId || row.id || idx} className="border-bottom py-2">
                          <div className="fw-medium">{row.title || row.eventType || row.EventType || "Event"}</div>
                          <div className="text-muted small">
                            {String(row.occurredAt || row.OccurredAt || row.createdAt || "").slice(0, 16)}
                            {row.summary || row.Summary ? ` · ${row.summary || row.Summary}` : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                    </div>
                  )}
                </CardBody>
              </Card>
              <Card className="admin-dash-card mt-3">
                <CardBody>
                  <h5>Progress</h5>
                  {progress ? (
                    <>
                      <div className="fs-4 mb-2">{progress.visitCount ?? 0} visits</div>
                      {(progress.series || progress.Series || []).length ? (
                        <ul className="list-unstyled mb-0 small">
                          {(progress.series || progress.Series).map((row, idx) => (
                            <li key={idx} className="d-flex justify-content-between border-bottom py-1">
                              <span>{String(row.date || row.Date || "").slice(0, 10)}</span>
                              <span>Severity {row.severity ?? row.Severity ?? "—"}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted mb-0">No diary trend yet. Save a symptom diary entry to plot severity.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted mb-0">No progress snapshot yet.</p>
                  )}
                </CardBody>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="admin-dash-card">
                <CardBody>
                  <h5>Follow-ups</h5>
                  <p className="text-muted small">Your doctor adds these after a visit. Mark a task done when you have completed it.</p>
                  {followUps.length === 0 ? (
                    <p className="text-muted mb-0">No follow-up tasks.</p>
                  ) : (
                    <ul className="list-unstyled mb-0">
                      {followUps.map((row) => {
                        const id = row.followUpTaskId || row.FollowUpTaskId || row.taskId || row.TaskId || row.id;
                        return (
                          <li key={id} className="d-flex justify-content-between border-bottom py-2 gap-2">
                            <span>{row.title || row.Title || `${id}`}</span>
                            <Button
                              size="sm"
                              color="soft-success"
                              onClick={async () => {
                                try {
                                  await completeFollowUp(id);
                                  setNote(`Follow-up ${id} completed.`);
                                  await load();
                                } catch (err) {
                                  setError(s4Message(err));
                                }
                              }}
                            >
                              Done
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
              <Card className="admin-dash-card mt-3">
                <CardBody>
                  <h5>Symptom diary</h5>
                  <FormGroup>
                    <Label>Severity (0–10)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      className="mb-2"
                      value={diarySeverity}
                      onChange={(e) => setDiarySeverity(e.target.value)}
                    />
                    <Input
                      type="textarea"
                      rows={3}
                      value={diaryText}
                      onChange={(e) => setDiaryText(e.target.value)}
                      placeholder="How are you feeling today?"
                    />
                  </FormGroup>
                  <Button
                    size="sm"
                    className="clinic-primary-btn"
                    className="mb-3"
                    disabled={!diaryText.trim()}
                    onClick={async () => {
                      try {
                        await postDiaryEntry({
                          entryDate: new Date().toISOString(),
                          severity: Number(diarySeverity || 0),
                          note: diaryText.trim(),
                        });
                        setDiaryText("");
                        setNote("Diary entry saved.");
                        await load();
                      } catch (err) {
                        setError(s4Message(err));
                      }
                    }}
                  >
                    Save entry
                  </Button>
                  {diary.length === 0 ? (
                    <p className="text-muted mb-0">No diary entries.</p>
                  ) : (
                    <ul className="list-unstyled mb-0">
                      {diary.map((row) => {
                        const id = row.symptomDiaryId || row.SymptomDiaryId || row.diaryId || row.DiaryId || row.id;
                        const when = row.entryDate || row.EntryDate || row.createdAt || row.CreatedAt || "";
                        const severity = row.severity ?? row.Severity;
                        return (
                          <li key={id} className="border-bottom py-2">
                            <div>{row.note || row.Note || row.body || "—"}</div>
                            <div className="text-muted small">
                              {String(when).slice(0, 10)}
                              {severity != null && severity !== "" ? ` · severity ${severity}` : ""}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default PatientContinuityPage;
