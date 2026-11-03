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
  UncontrolledTooltip,
} from "reactstrap";
import Swal from "sweetalert2";
import {
  deleteSmsTemplate,
  listSmsEvents,
  listSmsTemplates,
  s4Message,
  saveSmsPreference,
  saveSmsTemplate,
  unwrapS4,
} from "../../../helpers/s5Week5Api";

const rowsOf = (value) => (Array.isArray(value) ? value : []);

const EMPTY_DRAFT = { smsTemplateId: null, code: "", body: "", isActive: true };

const templateIdOf = (row) => row?.smsTemplateId ?? row?.SmsTemplateId ?? null;
const codeOf = (row) => row?.code || row?.Code || "";
const bodyOf = (row) => row?.body || row?.Body || "";
const activeOf = (row, isAdmin) =>
  isAdmin ? Boolean(row?.isActive ?? row?.IsActive) : Boolean(row?.enabled ?? row?.Enabled);

/** COM-01.03 — doctor event switches and admin SMS templates (CRUD). */
const DoctorSmsPage = ({ mode = "doctor" }) => {
  const isAdmin = mode === "admin";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create | edit | view
  const [notice, setNotice] = useState("");

  document.title = isAdmin ? "SMS templates | Niga Homeocentrum" : "SMS events | Niga Homeocentrum";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = isAdmin ? await listSmsTemplates() : await listSmsEvents();
      setRows(rowsOf(unwrapS4(response)));
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isAdmin]);

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setFormMode("create");
    setFormOpen(true);
  };

  const openView = (row) => {
    setDraft({
      smsTemplateId: templateIdOf(row),
      code: codeOf(row),
      body: bodyOf(row),
      isActive: activeOf(row, true),
    });
    setFormMode("view");
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setDraft({
      smsTemplateId: templateIdOf(row),
      code: codeOf(row),
      body: bodyOf(row),
      isActive: activeOf(row, true),
    });
    setFormMode("edit");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setDraft(EMPTY_DRAFT);
    setFormMode("create");
  };

  const toggleEvent = async (row) => {
    const code = codeOf(row);
    setBusy(code);
    setError("");
    try {
      const response = await saveSmsPreference({
        templateCode: code,
        enabled: !activeOf(row, false),
      });
      setRows(rowsOf(unwrapS4(response)));
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusy("");
    }
  };

  const saveTemplate = async () => {
    const code = String(draft.code || "").trim().toUpperCase();
    const body = String(draft.body || "").trim();
    if (!code || !body) {
      setError("Code and body are required.");
      return;
    }
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const payload = {
        code,
        body,
        isActive: Boolean(draft.isActive),
      };
      if (draft.smsTemplateId) payload.smsTemplateId = Number(draft.smsTemplateId);
      const response = await saveSmsTemplate(payload);
      setRows(rowsOf(unwrapS4(response)));
      setNotice(draft.smsTemplateId ? "Template updated." : "Template created.");
      closeForm();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusy("");
    }
  };

  const toggleActive = async (row) => {
    const id = templateIdOf(row);
    if (!id) {
      setError("This row has no template id.");
      return;
    }
    const nextActive = !activeOf(row, true);
    setBusy(`active-${id}`);
    setError("");
    try {
      const response = await saveSmsTemplate({
        smsTemplateId: Number(id),
        code: codeOf(row),
        body: bodyOf(row),
        isActive: nextActive,
      });
      setRows(rowsOf(unwrapS4(response)));
      setNotice(nextActive ? `${codeOf(row)} activated.` : `${codeOf(row)} deactivated.`);
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusy("");
    }
  };

  const removeTemplate = async (row) => {
    const id = templateIdOf(row);
    const code = codeOf(row);
    if (!id) {
      setError("This row has no template id.");
      return;
    }
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete template?",
      text: `${code} will be removed. Clinic events that use this code will fall back to the catalog body.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc3545",
    });
    if (!confirm.isConfirmed) return;
    setBusy(`del-${id}`);
    setError("");
    try {
      const response = await deleteSmsTemplate(Number(id));
      setRows(rowsOf(unwrapS4(response)));
      setNotice(`${code} deleted.`);
      if (draft.smsTemplateId && Number(draft.smsTemplateId) === Number(id)) closeForm();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusy("");
    }
  };

  const readOnly = formMode === "view";
  const formTitle =
    formMode === "view" ? "View SMS template" : formMode === "edit" ? "Edit SMS template" : "New SMS template";

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title"><i className="ri-message-2-line" aria-hidden="true" />{isAdmin ? "SMS templates" : "SMS events"}</h2>
            <p className="clinic-page-subtitle mb-0">
              {isAdmin
                ? "Clinic message text. Provider keys stay in server configuration."
                : "Turn each clinic event on or off for your patients. Opted-out mobiles are still blocked."}
            </p>
          </div>
          {isAdmin ? (
            <div className="clinic-table-actions">
              <button type="button" className="btn btn-sm btn-soft-primary" onClick={openCreate}>
                <i className="ri-add-line me-1" aria-hidden="true" />
                New template
              </button>
              <button type="button" className="btn btn-sm btn-soft-secondary" onClick={load} disabled={loading}>
                <i className={`ri-refresh-line me-1 ${loading ? "" : ""}`} aria-hidden="true" />
                Refresh
              </button>
            </div>
          ) : null}
        </div>
        {error ? (
          <Alert color="danger" className="py-2 small" toggle={() => setError("")}>
            {error}
          </Alert>
        ) : null}
        {notice ? (
          <Alert color="success" className="py-2 small" toggle={() => setNotice("")}>
            {notice}
          </Alert>
        ) : null}
        {loading ? (
          <div className="py-3 text-muted">
            <Spinner size="sm" className="me-2" /> Loading…
          </div>
        ) : (
          <Card className="admin-dash-card">
            <CardBody>
              <Table responsive className="mb-0 clinic-data-table align-middle">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Message</th>
                    <th>{isAdmin ? "Active" : "Send for me"}</th>
                    {isAdmin ? <th className="text-end">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 4 : 3} className="text-muted">
                        No SMS templates yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const code = codeOf(row);
                      const id = templateIdOf(row);
                      const active = activeOf(row, isAdmin);
                      const viewId = `sms-view-${id || code}`;
                      const editId = `sms-edit-${id || code}`;
                      const toggleId = `sms-toggle-${id || code}`;
                      const delId = `sms-del-${id || code}`;
                      return (
                        <tr key={id || code}>
                          <td className="fw-medium text-nowrap">{code}</td>
                          <td>
                            <span className="text-break" title={bodyOf(row)}>
                              {bodyOf(row)}
                            </span>
                          </td>
                          <td>
                            {isAdmin ? (
                              <span className={`badge bg-${active ? "success" : "secondary"}-subtle text-${active ? "success" : "secondary"}`}>
                                {active ? "Yes" : "No"}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className={`btn btn-sm clinic-action-btn ${active ? "btn-soft-success" : "btn-soft-secondary"}`}
                                disabled={busy === code}
                                onClick={() => toggleEvent(row)}
                              >
                                {active ? "On" : "Off"}
                              </button>
                            )}
                          </td>
                          {isAdmin ? (
                            <td className="text-end text-nowrap">
                              <div className="d-inline-flex align-items-center gap-1">
                                <button
                                  id={viewId}
                                  type="button"
                                  className="btn btn-sm btn-icon btn-soft-info sms-action-btn"
                                  aria-label="View"
                                  onClick={() => openView(row)}
                                >
                                  <i className="ri-eye-line" />
                                </button>
                                <UncontrolledTooltip placement="top" target={viewId}>
                                  View
                                </UncontrolledTooltip>
                                <button
                                  id={editId}
                                  type="button"
                                  className="btn btn-sm btn-icon btn-soft-success sms-action-btn"
                                  aria-label="Edit"
                                  onClick={() => openEdit(row)}
                                >
                                  <i className="ri-pencil-fill" />
                                </button>
                                <UncontrolledTooltip placement="top" target={editId}>
                                  Edit
                                </UncontrolledTooltip>
                                <button
                                  id={toggleId}
                                  type="button"
                                  className={`btn btn-sm btn-icon sms-action-btn ${active ? "btn-soft-warning" : "btn-soft-primary"}`}
                                  aria-label={active ? "Deactivate" : "Activate"}
                                  disabled={busy === `active-${id}`}
                                  onClick={() => toggleActive(row)}
                                >
                                  <i className={active ? "ri-toggle-fill" : "ri-toggle-line"} />
                                </button>
                                <UncontrolledTooltip placement="top" target={toggleId}>
                                  {active ? "Deactivate" : "Activate"}
                                </UncontrolledTooltip>
                                <button
                                  id={delId}
                                  type="button"
                                  className="btn btn-sm btn-icon btn-soft-danger sms-action-btn"
                                  aria-label="Delete"
                                  disabled={busy === `del-${id}`}
                                  onClick={() => removeTemplate(row)}
                                >
                                  <i className="ri-delete-bin-line" />
                                </button>
                                <UncontrolledTooltip placement="top" target={delId}>
                                  Delete
                                </UncontrolledTooltip>
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {isAdmin ? (
          <Modal isOpen={formOpen} toggle={closeForm} centered size="lg" className="sms-template-modal">
            <ModalHeader toggle={closeForm}>
              <i
                className={formMode === "view" ? "ri-eye-line" : formMode === "edit" ? "ri-edit-line" : "ri-add-circle-line"}
                aria-hidden="true"
              />
              {formTitle}
            </ModalHeader>
            <ModalBody>
              <Row className="g-2">
                <Col md={4}>
                  <FormGroup className="mb-0">
                    <Label htmlFor="sms-code">Code</Label>
                    <Input
                      id="sms-code"
                      value={draft.code}
                      maxLength={40}
                      disabled={readOnly || formMode === "edit"}
                      onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. FOLLOW_UP"
                    />
                    {formMode === "edit" ? (
                      <small className="text-muted">Code stays fixed on edit so event keys do not break.</small>
                    ) : null}
                  </FormGroup>
                </Col>
                <Col md={8}>
                  <FormGroup className="mb-0">
                    <Label htmlFor="sms-active">Active</Label>
                    <Input
                      id="sms-active"
                      type="select"
                      value={draft.isActive ? "1" : "0"}
                      disabled={readOnly}
                      onChange={(e) => setDraft({ ...draft, isActive: e.target.value === "1" })}
                    >
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col xs={12}>
                  <FormGroup className="mb-0">
                    <Label htmlFor="sms-body">Body</Label>
                    <Input
                      id="sms-body"
                      type="textarea"
                      rows={3}
                      value={draft.body}
                      maxLength={500}
                      disabled={readOnly}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      placeholder="Message text. Tokens like {doctor}, {date}, {otp}, {url}."
                    />
                    <small className="text-muted">{String(draft.body || "").length}/500</small>
                  </FormGroup>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter>
              {formMode === "view" ? (
                <>
                  <Button color="soft-secondary" onClick={closeForm}>
                    <i className="ri-close-line" aria-hidden="true" /> Close
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => {
                      setFormMode("edit");
                    }}
                  >
                    <i className="ri-edit-line" aria-hidden="true" /> Edit
                  </Button>
                </>
              ) : (
                <>
                  <Button color="soft-secondary" className="app-cancel-btn" onClick={closeForm} disabled={busy === "save"}>
                    <i className="ri-close-line" aria-hidden="true" /> Cancel
                  </Button>
                  <Button color="primary" disabled={busy === "save"} onClick={saveTemplate}>
                    <i className="ri-save-line" aria-hidden="true" /> {busy === "save" ? "Saving…" : formMode === "edit" ? "Update template" : "Create template"}
                  </Button>
                </>
              )}
            </ModalFooter>
          </Modal>
        ) : null}
      </Container>
    </div>
  );
};

export default DoctorSmsPage;
