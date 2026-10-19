import React, { useCallback, useEffect, useState } from "react";
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
  Table,
} from "reactstrap";
import {
  clinicMessage,
  createPharmacyQuery,
  listPharmacyQueries,
  replyPharmacyQuery,
  unwrapClinic,
} from "../../../helpers/doctorClinicApi";
import ModalActionButton from "../../../Components/Common/ModalActionButton";

const asRows = (payload) => {
  const data = unwrapClinic(payload);
  return Array.isArray(data) ? data : [];
};

const DoctorPharmacyQueriesPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [question, setQuestion] = useState("");
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");

  document.title = "Pharmacy queries | Niga Homeocentrum";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(asRows(await listPharmacyQueries()));
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

  const openCreate = () => {
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const id = Number(patientId);
    if (!id || !question.trim()) {
      setError("Patient and question are required.");
      return;
    }
    setBusyId("create");
    try {
      await createPharmacyQuery({ patientId: id, question: question.trim() });
      setCreateOpen(false);
      setQuestion("");
      setPatientId("");
      await load();
    } catch (err) {
      setError(clinicMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const submitReply = async () => {
    if (!replyId || !replyText.trim()) {
      setError("Reply text is required.");
      return;
    }
    setBusyId(`r-${replyId}`);
    try {
      await replyPharmacyQuery(replyId, replyText.trim());
      setReplyId(null);
      setReplyText("");
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
            <h2 className="clinic-page-title">Pharmacy queries</h2>
            <p className="clinic-page-subtitle mb-0">Questions about a patient prescription for the pharmacy desk.</p>
          </div>
          <button type="button" className="btn btn-sm clinic-primary-btn" onClick={openCreate}>
            <i className="ri-add-line" aria-hidden="true" />
            New query
          </button>
        </div>
        {error ? <Alert color="danger" className="py-2 small">{error}</Alert> : null}
        <Card className="admin-dash-card">
          <CardBody>
            {loading ? (
              <div className="py-3 text-muted"><Spinner size="sm" className="me-2" /> Loading…</div>
            ) : (
              <Table responsive className="align-middle mb-0 clinic-data-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Patient</th>
                    <th>Question</th>
                    <th>Reply</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-muted">
                        No pharmacy queries.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const id = row.pharmacyQueryId ?? row.PharmacyQueryId;
                      const status = String(row.status || row.Status || "");
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{row.patientId ?? row.PatientId}</td>
                          <td style={{ maxWidth: 280, whiteSpace: "normal" }}>{row.question || row.Question}</td>
                          <td style={{ maxWidth: 220, whiteSpace: "normal" }}>{row.reply || row.Reply || "—"}</td>
                          <td>{status}</td>
                          <td className="text-end">
                            {status.toUpperCase() !== "REPLIED" ? (
                              <div className="clinic-table-actions">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-primary clinic-action-btn"
                                  disabled={busyId != null}
                                  onClick={() => setReplyId(id)}
                                >
                                  <i className="ri-reply-line" aria-hidden="true" />
                                  Reply
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted small">Replied</span>
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

        <Modal isOpen={createOpen} toggle={() => setCreateOpen(false)}>
          <ModalHeader toggle={() => setCreateOpen(false)}>New pharmacy query</ModalHeader>
          <ModalBody>
            <Row className="g-3">
              <Col md={12}>
                <Label>Patient id</Label>
                <Input
                  type="number"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="PatientId from Patient Board"
                />
              </Col>
              <Col md={12}>
                <Label>Question</Label>
                <Input type="textarea" rows={4} value={question} onChange={(e) => setQuestion(e.target.value)} />
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <ModalActionButton action="submit" loading={busyId === "create"} onClick={submitCreate}>
              Create
            </ModalActionButton>
          </ModalFooter>
        </Modal>

        <Modal isOpen={replyId != null} toggle={() => setReplyId(null)}>
          <ModalHeader toggle={() => setReplyId(null)}>Reply</ModalHeader>
          <ModalBody>
            <Input type="textarea" rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
          </ModalBody>
          <ModalFooter>
            <Button color="light" onClick={() => setReplyId(null)}>
              Cancel
            </Button>
            <ModalActionButton action="send" loading={busyId === `r-${replyId}`} onClick={submitReply}>
              Send reply
            </ModalActionButton>
          </ModalFooter>
        </Modal>
      </Container>
    </div>
  );
};

export default DoctorPharmacyQueriesPage;
