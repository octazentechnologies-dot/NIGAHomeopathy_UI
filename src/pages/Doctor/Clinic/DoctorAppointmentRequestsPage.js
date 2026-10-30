import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Container,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
} from "reactstrap";
import {
  acceptAppointmentRequest,
  clinicMessage,
  declineAppointmentRequest,
  listAppointmentRequests,
  proposeAppointmentRequest,
  unwrapClinic,
} from "../../../helpers/doctorClinicApi";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import { subscribeAppointmentChanged, subscribeAppointmentRequests } from "../../../helpers/clinicRealtime";

const asRows = (payload) => {
  const data = unwrapClinic(payload);
  return Array.isArray(data) ? data : [];
};

const DoctorAppointmentRequestsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [proposeId, setProposeId] = useState(null);
  const [proposeDate, setProposeDate] = useState("");
  const [proposeTime, setProposeTime] = useState("10:00");
  const [declineId, setDeclineId] = useState(null);
  const [declineReason, setDeclineReason] = useState("");

  document.title = "Appointment requests | Niga Homeocentrum";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(asRows(await listAppointmentRequests()));
    } catch (err) {
      setError(clinicMessage(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live inbox: SignalR push (no polling). Merge event or soft-reload list.
  useEffect(() => {
    const unsub = subscribeAppointmentRequests((payload) => {
      const id = payload?.appointmentRequestId ?? payload?.AppointmentRequestId;
      const status = payload?.status ?? payload?.Status;
      const eventType = String(payload?.eventType || payload?.EventType || "").toLowerCase();
      if (eventType === "created" && id != null) {
        setRows((prev) => {
          if (prev.some((r) => (r.appointmentRequestId ?? r.AppointmentRequestId) === id)) return prev;
          const row = {
            appointmentRequestId: id,
            patientId: payload.patientId ?? payload.PatientId,
            patientName: payload.patientName ?? payload.PatientName,
            requestedDate: payload.requestedDate ?? payload.RequestedDate,
            requestedTime: payload.requestedTime ?? payload.RequestedTime,
            consultMode: payload.consultMode ?? payload.ConsultMode,
            status: status || "PENDING",
            reason: payload.reason ?? payload.Reason,
            proposedDate: payload.proposedDate ?? payload.ProposedDate,
            proposedTime: payload.proposedTime ?? payload.ProposedTime,
            createdAt: payload.createdAt ?? payload.CreatedAt,
          };
          return [row, ...prev];
        });
        return;
      }
      if (id != null && status) {
        setRows((prev) =>
          prev.map((r) => {
            const rid = r.appointmentRequestId ?? r.AppointmentRequestId;
            if (rid !== id) return r;
            return {
              ...r,
              status,
              proposedDate: payload.proposedDate ?? payload.ProposedDate ?? r.proposedDate ?? r.ProposedDate,
              proposedTime: payload.proposedTime ?? payload.ProposedTime ?? r.proposedTime ?? r.ProposedTime,
            };
          })
        );
        return;
      }
      load();
    });
    return unsub;
  }, [load]);

  // Booked/cancelled appointments (not just requests) — soft refetch, debounced.
  useEffect(() => {
    let timer = null;
    const unsub = subscribeAppointmentChanged(() => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => load(), 400);
    });
    return () => {
      if (timer) window.clearTimeout(timer);
      unsub();
    };
  }, [load]);

  const onAccept = async (id) => {
    setBusyId(`a-${id}`);
    try {
      await acceptAppointmentRequest(id);
      await load();
    } catch (err) {
      setError(clinicMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onDecline = async () => {
    if (!declineId) return;
    setBusyId(`d-${declineId}`);
    try {
      await declineAppointmentRequest(declineId, declineReason || "Declined by clinic");
      setDeclineId(null);
      setDeclineReason("");
      await load();
    } catch (err) {
      setError(clinicMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onPropose = async () => {
    if (!proposeId || !proposeDate || !proposeTime) {
      setError("Proposed date and time are required.");
      return;
    }
    setBusyId(`p-${proposeId}`);
    try {
      await proposeAppointmentRequest(proposeId, {
        proposedDate: proposeDate,
        proposedTime: proposeTime,
      });
      setProposeId(null);
      await load();
    } catch (err) {
      setError(clinicMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title">Appointment requests</h2>
            <p className="clinic-page-subtitle mb-0">Accept, decline, or propose another slot for patient booking requests.</p>
          </div>
        </div>
        {error ? <Alert color="danger" className="py-2 small">{error}</Alert> : null}
        <Card className="admin-dash-card">
          <CardBody>
            {loading ? (
              <div className="py-3 text-muted"><Spinner size="sm" className="me-2" /> Loading…</div>
            ) : (
              <Table responsive className="table-nowrap align-middle mb-0 clinic-data-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Patient</th>
                    <th>Requested</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-muted">
                        No open requests.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const id = row.appointmentRequestId ?? row.AppointmentRequestId;
                      const status = String(row.status || row.Status || "");
                      const open = ["PENDING", "PROPOSED"].includes(status.toUpperCase());
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{row.patientName || row.PatientName}</td>
                          <td>
                            {String(row.requestedDate || row.RequestedDate || "").slice(0, 10)}{" "}
                            {row.requestedTime || row.RequestedTime || ""}
                          </td>
                          <td>{row.consultMode || row.ConsultMode || "—"}</td>
                          <td>{status}</td>
                          <td className="text-end">
                            {open ? (
                              <div className="clinic-table-actions">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-success clinic-action-btn"
                                  disabled={busyId != null}
                                  onClick={() => onAccept(id)}
                                >
                                  <i className="ri-check-line" aria-hidden="true" />
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-secondary clinic-action-btn"
                                  disabled={busyId != null}
                                  onClick={() => setDeclineId(id)}
                                >
                                  <i className="ri-close-line" aria-hidden="true" />
                                  Decline
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-primary clinic-action-btn"
                                  disabled={busyId != null}
                                  onClick={() => setProposeId(id)}
                                >
                                  <i className="ri-calendar-event-line" aria-hidden="true" />
                                  Propose
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Modal isOpen={proposeId != null} toggle={() => setProposeId(null)}>
          <ModalHeader toggle={() => setProposeId(null)}>Propose slot</ModalHeader>
          <ModalBody>
            <Label>Date</Label>
            <Input type="date" className="mb-2" value={proposeDate} onChange={(e) => setProposeDate(e.target.value)} />
            <Label>Time (HH:mm)</Label>
            <Input value={proposeTime} onChange={(e) => setProposeTime(e.target.value)} placeholder="10:30" />
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setProposeId(null)}>
              Cancel
            </Button>
            <ModalActionButton action="submit" loading={busyId === `p-${proposeId}`} onClick={onPropose}>
              Propose
            </ModalActionButton>
          </ModalFooter>
        </Modal>

        <Modal isOpen={declineId != null} toggle={() => setDeclineId(null)}>
          <ModalHeader toggle={() => setDeclineId(null)}>Decline request</ModalHeader>
          <ModalBody>
            <Label>Reason</Label>
            <Input type="textarea" rows={3} value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setDeclineId(null)}>
              Cancel
            </Button>
            <ModalActionButton action="confirm" loading={busyId === `d-${declineId}`} onClick={onDecline}>
              Decline
            </ModalActionButton>
          </ModalFooter>
        </Modal>
      </Container>
    </div>
  );
};

export default DoctorAppointmentRequestsPage;
