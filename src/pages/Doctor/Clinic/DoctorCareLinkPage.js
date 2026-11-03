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
  careLinkInfoRequest,
  careLinkOpinion,
  careLinkPackage,
  clinicMessage,
  createCareLink,
  doctorDirectory,
  listCareLinks,
  respondCareLink,
  unwrapClinic,
} from "../../../helpers/doctorClinicApi";
import ModalActionButton from "../../../Components/Common/ModalActionButton";

const asRows = (payload) => {
  const data = unwrapClinic(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const DoctorCareLinkPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ toDoctorId: "", patientId: "", note: "", feeAmount: "" });
  const [packageOpen, setPackageOpen] = useState(false);
  const [packageBody, setPackageBody] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoId, setInfoId] = useState(null);
  const [infoNote, setInfoNote] = useState("");
  const [opinionOpen, setOpinionOpen] = useState(false);
  const [opinionId, setOpinionId] = useState(null);
  const [opinionText, setOpinionText] = useState("");

  document.title = "CareLink | Niga Homeocentrum";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listCareLinks();
      setRows(asRows(response));
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

  const openCreate = async () => {
    setCreateOpen(true);
    setError("");
    try {
      const dir = await doctorDirectory({ page: 1, pageSize: 30 });
      const dirData = unwrapClinic(dir);
      setDoctors(Array.isArray(dirData?.data) ? dirData.data : asRows(dir));
    } catch (err) {
      setError(clinicMessage(err));
    }
  };

  const searchDoctors = async () => {
    try {
      const dir = await doctorDirectory({ search: doctorSearch.trim() || undefined, page: 1, pageSize: 30 });
      const dirData = unwrapClinic(dir);
      setDoctors(Array.isArray(dirData?.data) ? dirData.data : asRows(dir));
    } catch (err) {
      setError(clinicMessage(err));
    }
  };

  const submitCreate = async () => {
    const toDoctorId = Number(form.toDoctorId);
    const patientId = Number(form.patientId);
    if (!toDoctorId || !patientId) {
      setError("Choose a doctor and a patient.");
      return;
    }
    setBusyId("create");
    try {
      await createCareLink({
        toDoctorId,
        patientId,
        note: form.note || null,
        feeAmount: form.feeAmount === "" ? null : Number(form.feeAmount),
      });
      setCreateOpen(false);
      setForm({ toDoctorId: "", patientId: "", note: "", feeAmount: "" });
      await load();
    } catch (err) {
      setError(clinicMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onRespond = async (id, status) => {
    setBusyId(`${id}-${status}`);
    try {
      await respondCareLink(id, status);
      await load();
    } catch (err) {
      setError(clinicMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const openPackage = async (id) => {
    setBusyId(`pkg-${id}`);
    try {
      const response = await careLinkPackage(id);
      setPackageBody(unwrapClinic(response));
      setPackageOpen(true);
    } catch (err) {
      setError(clinicMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const submitInfo = async () => {
    if (!infoId) return;
    setBusyId(`info-${infoId}`);
    try {
      await careLinkInfoRequest(infoId, { options: ["photos", "reports", "modalities"], note: infoNote || null });
      setInfoOpen(false);
      setInfoNote("");
      await load();
    } catch (err) {
      setError(clinicMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const submitOpinion = async () => {
    if (!opinionId || !opinionText.trim()) {
      setError("Opinion text is required.");
      return;
    }
    setBusyId(`op-${opinionId}`);
    try {
      await careLinkOpinion(opinionId, opinionText.trim());
      setOpinionOpen(false);
      setOpinionText("");
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
            <h2 className="clinic-page-title"><i className="ri-share-forward-line" aria-hidden="true" />CareLink</h2>
            <p className="clinic-page-subtitle mb-0">Refer a case, accept offers, open the package, ask for info.</p>
          </div>
          <button type="button" className="btn btn-sm btn-soft-primary" onClick={openCreate}>
            <i className="ri-add-line" aria-hidden="true" />
            New CareLink
          </button>
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
                    <th>From → To</th>
                    <th>Status</th>
                    <th>Fee</th>
                    <th>Expiry</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-muted">
                        No CareLinks yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const id = row.careLinkRequestId ?? row.CareLinkRequestId;
                      const status = String(row.status || row.Status || "");
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{row.patientName || row.PatientName}</td>
                          <td>
                            {row.fromDoctorId ?? row.FromDoctorId} → {row.toDoctorId ?? row.ToDoctorId}
                          </td>
                          <td>{status}</td>
                          <td>{row.feeAmount ?? row.feeInr ?? "—"}</td>
                          <td>{row.expiry ? String(row.expiry).replace("T", " ").slice(0, 16) : "—"}</td>
                          <td className="text-end">
                            <div className="clinic-table-actions">
                              {status.toUpperCase() === "OPEN" ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-soft-success clinic-action-btn"
                                    disabled={busyId != null}
                                    onClick={() => onRespond(id, "ACCEPTED")}
                                  >
                                    <i className="ri-check-line" aria-hidden="true" />
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-soft-secondary clinic-action-btn"
                                    disabled={busyId != null}
                                    onClick={() => onRespond(id, "DECLINED")}
                                  >
                                    <i className="ri-close-line" aria-hidden="true" />
                                    Decline
                                  </button>
                                </>
                              ) : null}
                              <button
                                type="button"
                                className="btn btn-sm btn-soft-primary clinic-action-btn"
                                disabled={busyId != null}
                                onClick={() => openPackage(id)}
                              >
                                <i className="ri-folder-open-line" aria-hidden="true" />
                                Package
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-soft-primary clinic-action-btn"
                                disabled={busyId != null}
                                onClick={() => {
                                  setInfoId(id);
                                  setInfoOpen(true);
                                }}
                              >
                                <i className="ri-question-line" aria-hidden="true" />
                                Ask info
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-soft-primary clinic-action-btn"
                                disabled={busyId != null}
                                onClick={() => {
                                  setOpinionId(id);
                                  setOpinionText(row.opinion || row.Opinion || "");
                                  setOpinionOpen(true);
                                }}
                              >
                                <i className="ri-quill-pen-line" aria-hidden="true" />
                                Opinion
                              </button>
                            </div>
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

        <Modal isOpen={createOpen} toggle={() => setCreateOpen(false)} size="lg">
          <ModalHeader toggle={() => setCreateOpen(false)}><i className="ri-add-circle-line" aria-hidden="true" />Create CareLink</ModalHeader>
          <ModalBody>
            <Row className="g-3">
              <Col md={8}>
                <Label>Find doctor</Label>
                <div className="d-flex gap-2">
                  <Input value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)} placeholder="Name or city" />
                  <Button color="light" onClick={searchDoctors}>
                    <i className="ri-search-line" aria-hidden="true" /> Search
                  </Button>
                </div>
                <Input
                  type="select"
                  className="mt-2"
                  value={form.toDoctorId}
                  onChange={(e) => setForm((f) => ({ ...f, toDoctorId: e.target.value }))}
                >
                  <option value="">Select receiving doctor</option>
                  {doctors.map((d) => (
                    <option key={d.doctorId ?? d.DoctorId} value={d.doctorId ?? d.DoctorId}>
                      {d.displayName ?? d.DisplayName}
                      {d.city || d.City ? ` · ${d.city || d.City}` : ""}
                    </option>
                  ))}
                </Input>
              </Col>
              <Col md={4}>
                <Label>Fee (optional)</Label>
                <Input
                  type="number"
                  value={form.feeAmount}
                  onChange={(e) => setForm((f) => ({ ...f, feeAmount: e.target.value }))}
                />
              </Col>
              <Col md={12}>
                <Label>Patient id</Label>
                <Input
                  type="number"
                  value={form.patientId}
                  onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                  placeholder="PatientId from Patient Board"
                />
              </Col>
              <Col md={12}>
                <Label>Note</Label>
                <Input type="textarea" rows={3} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="light" className="app-cancel-btn" onClick={() => setCreateOpen(false)}>
              <i className="ri-close-line" aria-hidden="true" /> Cancel
            </Button>
            <ModalActionButton action="submit" loading={busyId === "create"} onClick={submitCreate}>
              Create
            </ModalActionButton>
          </ModalFooter>
        </Modal>

        <Modal isOpen={packageOpen} toggle={() => setPackageOpen(false)}>
          <ModalHeader toggle={() => setPackageOpen(false)}>Case package</ModalHeader>
          <ModalBody>
            {packageBody ? (
              <>
                <p className="mb-1">
                  <strong>From:</strong> {packageBody.fromDoctorName}
                </p>
                <p className="mb-1">
                  <strong>Patient:</strong> {packageBody.patientName} (#{packageBody.patientId})
                </p>
                <p className="mb-1">
                  <strong>Status:</strong> {packageBody.status}
                </p>
                <p className="mb-1">
                  <strong>Note:</strong> {packageBody.note || "—"}
                </p>
                <p className="mb-0">
                  <strong>Fee:</strong> {packageBody.feeInr ?? "—"}
                </p>
              </>
            ) : null}
          </ModalBody>
        </Modal>

        <Modal isOpen={infoOpen} toggle={() => setInfoOpen(false)}>
          <ModalHeader toggle={() => setInfoOpen(false)}>Ask for info</ModalHeader>
          <ModalBody>
            <Label>Note</Label>
            <Input type="textarea" rows={3} value={infoNote} onChange={(e) => setInfoNote(e.target.value)} />
            <div className="text-muted small mt-2">Sends options: photos, reports, modalities.</div>
          </ModalBody>
          <ModalFooter>
            <Button color="light" className="app-cancel-btn" onClick={() => setInfoOpen(false)}>
              <i className="ri-close-line" aria-hidden="true" /> Cancel
            </Button>
            <ModalActionButton action="send" loading={busyId === `info-${infoId}`} onClick={submitInfo}>
              Send
            </ModalActionButton>
          </ModalFooter>
        </Modal>

        <Modal isOpen={opinionOpen} toggle={() => setOpinionOpen(false)}>
          <ModalHeader toggle={() => setOpinionOpen(false)}>Written opinion</ModalHeader>
          <ModalBody>
            <Input type="textarea" rows={5} value={opinionText} onChange={(e) => setOpinionText(e.target.value)} />
          </ModalBody>
          <ModalFooter>
            <Button color="light" className="app-cancel-btn" onClick={() => setOpinionOpen(false)}>
              <i className="ri-close-line" aria-hidden="true" /> Cancel
            </Button>
            <ModalActionButton action="save" loading={busyId === `op-${opinionId}`} onClick={submitOpinion}>
              Save
            </ModalActionButton>
          </ModalFooter>
        </Modal>
      </Container>
    </div>
  );
};

export default DoctorCareLinkPage;
