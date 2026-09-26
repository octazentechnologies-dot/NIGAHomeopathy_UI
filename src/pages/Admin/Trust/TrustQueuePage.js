import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Container, Input, Spinner, Table } from "reactstrap";
import {
  decideTrust,
  listTrustQueue,
  listReviewAppeals,
  resolveReviewAppeal,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";

/**
 * TRU — admin trust verification queue + review appeals (New API :5002).
 */
const TrustQueuePage = () => {
  const [queue, setQueue] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [reasonById, setReasonById] = useState({});

  document.title = "Trust queue | Niga Homeocentrum";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [qRes, aRes] = await Promise.all([listTrustQueue(), listReviewAppeals()]);
      const qData = unwrapS4(qRes);
      const aData = unwrapS4(aRes);
      setQueue(Array.isArray(qData) ? qData : Array.isArray(qData?.items) ? qData.items : []);
      setAppeals(Array.isArray(aData) ? aData : Array.isArray(aData?.appeals) ? aData.appeals : []);
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
    try {
      await decideTrust(doctorId, {
        decision,
        note: reasonById[`trust-${doctorId}`] || "",
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
    <div className="page-content">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-1">Trust queue</h4>
            <p className="text-muted mb-0">Approve, reject, or request more info for doctor trust badges.</p>
          </div>
          <Button size="sm" color="soft-secondary" onClick={load} disabled={loading}>Refresh</Button>
        </div>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Card className="mb-3">
          <CardBody>
            {loading ? (
              <div className="text-center py-4"><Spinner size="sm" /> Loading…</div>
            ) : queue.length === 0 ? (
              <p className="text-muted mb-0">No doctors waiting for trust review.</p>
            ) : (
              <div className="table-responsive">
                <Table size="sm" className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th>Note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((row) => {
                      const id = row.doctorId || row.DoctorId;
                      return (
                        <tr key={id}>
                          <td>#{id} {row.displayName || row.DisplayName || row.doctorName || ""}</td>
                          <td>{row.status || row.Status || "PENDING"}</td>
                          <td>
                            <Input
                              bsSize="sm"
                              placeholder="Decision note"
                              value={reasonById[`trust-${id}`] || ""}
                              onChange={(e) => setReasonById({ ...reasonById, [`trust-${id}`]: e.target.value })}
                            />
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
        <Card>
          <CardBody>
            <h5>Review appeals</h5>
            {appeals.length === 0 ? (
              <p className="text-muted mb-0">No open appeals.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {appeals.map((row) => {
                  const id = row.appealId || row.AppealId || row.id;
                  return (
                    <li key={id} className="border-bottom py-2 d-flex justify-content-between gap-2">
                      <div>
                        <div className="fw-medium">Appeal #{id}</div>
                        <div className="text-muted small">{row.reason || row.Reason || row.note || "—"}</div>
                      </div>
                      <Button
                        size="sm"
                        color="soft-primary"
                        disabled={busyId === `appeal-${id}`}
                        onClick={async () => {
                          setBusyId(`appeal-${id}`);
                          try {
                            await resolveReviewAppeal(id, { decision: "Uphold", note: "" });
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
