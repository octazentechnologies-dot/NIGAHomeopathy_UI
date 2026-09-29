import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner, Table } from "reactstrap";
import {
  decideTrust,
  listTrustQueue,
  listReviewAppeals,
  resolveReviewAppeal,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.appeals)) return payload.appeals;
  return [];
};

const doctorName = (row) => {
  const named = `${row.firstName || row.FirstName || ""} ${row.lastName || row.LastName || ""}`.trim();
  return row.displayName || row.DisplayName || row.doctorName || named || "";
};

/**
 * TRU — admin trust verification queue + review appeals (New API :5002).
 */
const TrustQueuePage = () => {
  const [queue, setQueue] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [reasonById, setReasonById] = useState({});
  const [noteErrorKey, setNoteErrorKey] = useState("");

  document.title = "Trust queue | Niga Homeocentrum";

  const load = async (filterOverride) => {
    const filter = filterOverride ?? statusFilter;
    setLoading(true);
    setError("");
    try {
      const [qRes, aRes] = await Promise.all([listTrustQueue(filter), listReviewAppeals()]);
      const qData = unwrapS4(qRes);
      const aData = unwrapS4(aRes);
      let list = asList(qData);
      if (list.length === 0 && filter !== "All") {
        const allRes = await listTrustQueue("All");
        list = asList(unwrapS4(allRes));
        if (list.length > 0) {
          setStatusFilter("All");
          setNote("No doctors waiting. Showing all clinic doctors so you can review status.");
        }
      }
      setQueue(list);
      setAppeals(asList(aData));
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (doctorId, decision) => {
    setBusyId(`trust-${doctorId}`);
    setError("");
    const noteText = String(reasonById[`trust-${doctorId}`] || "").trim();
    if ((decision === "Reject" || decision === "NeedsInfo") && !noteText) {
      setBusyId(null);
      setNoteErrorKey(`trust-${doctorId}`);
      setError("Enter a decision note before Reject or Needs info.");
      return;
    }
    setNoteErrorKey("");
    try {
      await decideTrust(doctorId, {
        decision,
        note: noteText,
      });
      setNote(`Trust ${decision} for doctor #${doctorId}.`);
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="clinic-page-title mb-1">Trust queue</h2>
            <p className="clinic-page-subtitle mb-0">
              Approve, reject, or request more info for doctor trust badges. Waiting = Pending or Needs info.
            </p>
          </div>
          <Button size="sm" color="soft-secondary" onClick={() => load()} disabled={loading}>Refresh</Button>
        </div>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Card className="admin-dash-card mb-3">
          <CardBody>
            <Row className="g-2 align-items-end mb-3">
              <Col md={4}>
                <Label>Show</Label>
                <Input
                  type="select"
                  value={statusFilter}
                  onChange={(e) => {
                    const next = e.target.value;
                    setStatusFilter(next);
                    load(next);
                  }}
                >
                  <option value="All">All doctors</option>
                  <option value="Pending">Waiting (pending / needs info)</option>
                  <option value="Verified">Verified</option>
                  <option value="NeedsInfo">Needs info</option>
                  <option value="Rejected">Rejected</option>
                </Input>
              </Col>
            </Row>
            {loading ? (
              <div className="text-center py-4"><Spinner size="sm" /> Loading…</div>
            ) : queue.length === 0 ? (
              <p className="text-muted mb-0">No doctors in this filter.</p>
            ) : (
              <div className="table-responsive">
                <Table size="sm" className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Decision note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((row) => {
                      const id = row.doctorId || row.DoctorId;
                      return (
                        <tr key={id}>
                          <td>#{id} {doctorName(row)}</td>
                          <td className="small">{row.emailId || row.EmailId || "—"}</td>
                          <td>{row.verificationStatus || row.VerificationStatus || row.status || row.Status || "Pending"}</td>
                          <td>
                            <Input
                              bsSize="sm"
                              invalid={noteErrorKey === `trust-${id}`}
                              placeholder="Required for Reject / Needs info"
                              value={reasonById[`trust-${id}`] || ""}
                              style={noteErrorKey === `trust-${id}` ? { borderColor: "#dc3545", boxShadow: "0 0 0 0.15rem rgba(220,53,69,.25)" } : undefined}
                              onChange={(e) => {
                                setReasonById({ ...reasonById, [`trust-${id}`]: e.target.value });
                                if (noteErrorKey === `trust-${id}` && e.target.value.trim()) setNoteErrorKey("");
                              }}
                            />
                            {noteErrorKey === `trust-${id}` ? (
                              <div className="text-danger small mt-1">Decision note is required.</div>
                            ) : null}
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              <Button size="sm" color="soft-success" disabled={busyId === `trust-${id}`} onClick={() => decide(id, "Approve")}>Approve</Button>
                              <Button size="sm" color="soft-warning" disabled={busyId === `trust-${id}`} onClick={() => decide(id, "NeedsInfo")}>Needs info</Button>
                              <Button size="sm" color="soft-danger" disabled={busyId === `trust-${id}`} onClick={() => decide(id, "Reject")}>Reject</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
        <Card className="admin-dash-card">
          <CardBody>
            <h5>Review appeals</h5>
            <p className="text-muted small">Open when a doctor appeals a patient review. Empty until an appeal exists.</p>
            {appeals.length === 0 ? (
              <p className="text-muted mb-0">No open appeals.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {appeals.map((row) => {
                  const id = row.reviewAppealId || row.ReviewAppealId || row.appealId || row.AppealId || row.id;
                  return (
                    <li key={id} className="border-bottom py-2 d-flex justify-content-between gap-2">
                      <div>
                        <div className="fw-medium">Appeal #{id} · Doctor #{row.doctorId || row.DoctorId || "—"}</div>
                        <div className="text-muted small">{row.reason || row.Reason || row.note || "—"}</div>
                      </div>
                      <Button
                        size="sm"
                        color="soft-primary"
                        disabled={busyId === `appeal-${id}`}
                        onClick={async () => {
                          setBusyId(`appeal-${id}`);
                          try {
                            await resolveReviewAppeal(id, { decision: "Uphold", note: "Kept from Trust queue" });
                            setNote(`Appeal #${id} resolved.`);
                            await load();
                          } catch (err) {
                            setError(s4Message(err));
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Resolve
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default TrustQueuePage;
