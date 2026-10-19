import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import Swal from "sweetalert2";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import { UserRole, resolveUserRole } from "../../../Components/constants/roles";
import { getAuthUserId } from "../../../helpers/menuByRole";
import {
  addReceptionStaff,
  deleteReceptionStaff,
  getReceptionStaffList,
  updateReceptionStaff,
} from "../../../helpers/realbackend_helper";

const emptyForm = {
  userID: "",
  password: "",
  fullName: "",
  emailId: "",
  contactNumber: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const unwrapList = (payload) => {
  const root =
    payload?.resultObject ??
    payload?.ResultObject ??
    payload?.data ??
    payload?.Data ??
    payload;
  if (Array.isArray(root)) return root;
  const nested =
    root?.items ??
    root?.Items ??
    root?.resultObject ??
    root?.ResultObject ??
    root?.data ??
    root?.Data;
  return Array.isArray(nested) ? nested : [];
};

const ReceptionStaffPage = () => {
  const userRole = resolveUserRole();
  const doctorUserId = getAuthUserId();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await getReceptionStaffList({
        doctorUserID: doctorUserId,
        pageNumber: 1,
        pageSize: 50,
      });
      setRows(unwrapList(payload));
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message || "Could not load reception staff.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [doctorUserId]);

  useEffect(() => {
    document.title = "Reception staff | Homeocentrum";
    if (userRole === UserRole.DOCTOR) load();
  }, [load, userRole]);

  if (userRole !== UserRole.DOCTOR) {
    return (
      <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
        <Container fluid>
          <h2 className="clinic-page-title">Reception staff</h2>
          <p className="clinic-page-subtitle mb-0">Only the treating doctor can manage reception staff.</p>
        </Container>
      </div>
    );
  }

  const openAdd = () => {
    setFormMode("add");
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setFormMode("edit");
    setEditingId(row.receptionStaffID ?? row.ReceptionStaffID);
    setForm({
      userID: row.userID ?? row.UserID ?? "",
      password: "",
      fullName: row.fullName ?? row.FullName ?? "",
      emailId: row.emailId ?? row.EmailId ?? "",
      contactNumber: row.contactNumber ?? row.ContactNumber ?? "",
    });
    setFieldErrors({});
    setFormOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (formMode === "add") {
      if (!form.userID.trim()) errors.userID = "Login user id is required.";
      if (!form.password) errors.password = "Password is required.";
      else if (form.password.length < 6) errors.password = "Password must be at least 6 characters.";
    }
    if (!form.fullName.trim()) errors.fullName = "Full name is required.";
    if (!form.contactNumber.trim()) errors.contactNumber = "Mobile number is required.";
    const email = form.emailId.trim();
    if (email && !EMAIL_PATTERN.test(email)) {
      errors.emailId = "Enter a valid email address.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveForm = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (formMode === "add") {
        await addReceptionStaff({
          doctorUserID: doctorUserId,
          userID: form.userID.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          emailId: form.emailId.trim() || null,
          contactNumber: form.contactNumber.trim(),
        });
      } else {
        await updateReceptionStaff({
          receptionStaffID: editingId,
          fullName: form.fullName.trim(),
          emailId: form.emailId.trim() || null,
          contactNumber: form.contactNumber.trim(),
        });
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: typeof err === "string" ? err : err?.message || "Could not save staff.",
      });
    } finally {
      setSaving(false);
    }
  };

  const disableRow = async (row) => {
    const id = row.receptionStaffID ?? row.ReceptionStaffID;
    const name = row.fullName ?? row.FullName;
    const ok = await Swal.fire({
      icon: "warning",
      title: "Disable staff?",
      text: `${name} will no longer be able to log in.`,
      showCancelButton: true,
      confirmButtonText: "Disable",
    });
    if (!ok.isConfirmed) return;
    try {
      await deleteReceptionStaff({ receptionStaffID: id });
      await load();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Disable failed",
        text: typeof err === "string" ? err : err?.message || "Could not disable staff.",
      });
    }
  };

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title">Reception staff</h2>
            <p className="clinic-page-subtitle mb-0">List, add, edit, and disable clinic reception logins.</p>
          </div>
          <button type="button" className="btn btn-sm clinic-primary-btn" onClick={openAdd}>
            <i className="ri-user-add-line me-1" aria-hidden="true" />
            Add staff
          </button>
        </div>

        {error ? (
          <Alert color="danger" className="py-2 small">
            {error}
          </Alert>
        ) : null}

        <Card className="admin-dash-card">
          <CardBody>
            {loading ? (
              <div className="py-3 text-muted">
                <Spinner size="sm" className="me-2" /> Loading…
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-nowrap align-middle mb-0 clinic-data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Login</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted py-4">
                          No reception staff yet. Use Add staff to create a login.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => {
                        const id = row.receptionStaffID ?? row.ReceptionStaffID;
                        return (
                          <tr key={id}>
                            <td className="fw-medium">{row.fullName ?? row.FullName}</td>
                            <td>{row.userID ?? row.UserID}</td>
                            <td>{(row.emailId ?? row.EmailId) || "—"}</td>
                            <td>{(row.contactNumber ?? row.ContactNumber) || "—"}</td>
                            <td className="text-end">
                              <div className="clinic-table-actions">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-primary clinic-action-btn"
                                  onClick={() => openEdit(row)}
                                >
                                  <i className="ri-pencil-line" aria-hidden="true" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-danger clinic-action-btn"
                                  onClick={() => disableRow(row)}
                                >
                                  <i className="ri-user-unfollow-line" aria-hidden="true" />
                                  Disable
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={formOpen} toggle={() => setFormOpen(false)} centered className="clinic-form-modal">
        <ModalHeader toggle={() => setFormOpen(false)}>
          {formMode === "add" ? "Add reception staff" : "Edit reception staff"}
        </ModalHeader>
        <ModalBody>
          <Row className="g-3">
            {formMode === "add" ? (
              <>
                <Col md={6}>
                  <Label className="form-label">Login user id</Label>
                  <Input
                    value={form.userID}
                    invalid={Boolean(fieldErrors.userID)}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, userID: e.target.value }));
                      if (fieldErrors.userID) setFieldErrors((p) => ({ ...p, userID: undefined }));
                    }}
                  />
                  {fieldErrors.userID ? <small className="text-danger">{fieldErrors.userID}</small> : null}
                </Col>
                <Col md={6}>
                  <Label className="form-label">Password</Label>
                  <Input
                    type="password"
                    value={form.password}
                    invalid={Boolean(fieldErrors.password)}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, password: e.target.value }));
                      if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                  />
                  {fieldErrors.password ? <small className="text-danger">{fieldErrors.password}</small> : null}
                </Col>
              </>
            ) : null}
            <Col md={12}>
              <Label className="form-label">Full name</Label>
              <Input
                value={form.fullName}
                invalid={Boolean(fieldErrors.fullName)}
                onChange={(e) => {
                  setForm((p) => ({ ...p, fullName: e.target.value }));
                  if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
                }}
              />
              {fieldErrors.fullName ? <small className="text-danger">{fieldErrors.fullName}</small> : null}
            </Col>
            <Col md={6}>
              <Label className="form-label">Email</Label>
              <Input
                type="email"
                value={form.emailId}
                invalid={Boolean(fieldErrors.emailId)}
                onChange={(e) => {
                  setForm((p) => ({ ...p, emailId: e.target.value }));
                  if (fieldErrors.emailId) setFieldErrors((p) => ({ ...p, emailId: undefined }));
                }}
              />
              {fieldErrors.emailId ? <small className="text-danger">{fieldErrors.emailId}</small> : null}
            </Col>
            <Col md={6}>
              <Label className="form-label">Mobile</Label>
              <Input
                value={form.contactNumber}
                invalid={Boolean(fieldErrors.contactNumber)}
                onChange={(e) => {
                  setForm((p) => ({ ...p, contactNumber: e.target.value }));
                  if (fieldErrors.contactNumber) setFieldErrors((p) => ({ ...p, contactNumber: undefined }));
                }}
              />
              {fieldErrors.contactNumber ? (
                <small className="text-danger">{fieldErrors.contactNumber}</small>
              ) : null}
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <ModalActionButton action="cancel" onClick={() => setFormOpen(false)}>
            Cancel
          </ModalActionButton>
          <ModalActionButton action="save" onClick={saveForm} disabled={saving} loading={saving}>
            Save
          </ModalActionButton>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ReceptionStaffPage;
