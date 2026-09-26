import React, { useCallback, useEffect, useState } from "react";
import {
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
      <div className="page-content">
        <Container fluid>
          <p>Only the treating doctor can manage reception staff.</p>
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
    <div className="page-content">
      <Container fluid>
        <Row className="mb-3">
          <Col>
            <h4 className="mb-1">Reception staff</h4>
            <p className="text-muted mb-0">List, add, edit, and disable clinic reception logins.</p>
          </Col>
          <Col xs="auto">
            <Button color="primary" onClick={openAdd}>
              Add staff
            </Button>
          </Col>
        </Row>
        <Card>
          <CardBody>
            {loading ? <Spinner color="primary" /> : null}
            {error ? <p className="text-danger">{error}</p> : null}
            {!loading && !error && rows.length === 0 ? (
              <p className="text-muted mb-0">No reception staff yet.</p>
            ) : null}
            {rows.length > 0 ? (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Login</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const id = row.receptionStaffID ?? row.ReceptionStaffID;
                      return (
                        <tr key={id}>
                          <td>{row.fullName ?? row.FullName}</td>
                          <td>{row.userID ?? row.UserID}</td>
                          <td>{row.emailId ?? row.EmailId}</td>
                          <td>{row.contactNumber ?? row.ContactNumber}</td>
                          <td className="text-end">
                            <Button size="sm" color="light" className="me-2" onClick={() => openEdit(row)}>
                              Edit
                            </Button>
                            <Button size="sm" color="danger" outline onClick={() => disableRow(row)}>
                              Disable
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={formOpen} toggle={() => setFormOpen(false)} centered>
        <ModalHeader toggle={() => setFormOpen(false)}>
          {formMode === "add" ? "Add reception staff" : "Edit reception staff"}
        </ModalHeader>
        <ModalBody>
          {formMode === "add" ? (
            <>
              <Label>Login user id</Label>
              <Input
                className={fieldErrors.userID ? "mb-1" : "mb-2"}
                value={form.userID}
                onChange={(e) => {
                  setForm((p) => ({ ...p, userID: e.target.value }));
                  if (fieldErrors.userID) setFieldErrors((p) => ({ ...p, userID: undefined }));
                }}
              />
              {fieldErrors.userID ? (
                <small className="text-danger d-block mb-2">{fieldErrors.userID}</small>
              ) : null}
              <Label>Password</Label>
              <Input
                type="password"
                className={fieldErrors.password ? "mb-1" : "mb-2"}
                value={form.password}
                onChange={(e) => {
                  setForm((p) => ({ ...p, password: e.target.value }));
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
              />
              {fieldErrors.password ? (
                <small className="text-danger d-block mb-2">{fieldErrors.password}</small>
              ) : null}
            </>
          ) : null}
          <Label>Full name</Label>
          <Input
            className={fieldErrors.fullName ? "mb-1" : "mb-2"}
            value={form.fullName}
            onChange={(e) => {
              setForm((p) => ({ ...p, fullName: e.target.value }));
              if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
            }}
          />
          {fieldErrors.fullName ? (
            <small className="text-danger d-block mb-2">{fieldErrors.fullName}</small>
          ) : null}
          <Label>Email</Label>
          <Input
            type="email"
            className={fieldErrors.emailId ? "mb-1" : "mb-2"}
            value={form.emailId}
            onChange={(e) => {
              setForm((p) => ({ ...p, emailId: e.target.value }));
              if (fieldErrors.emailId) setFieldErrors((p) => ({ ...p, emailId: undefined }));
            }}
          />
          {fieldErrors.emailId ? (
            <small className="text-danger d-block mb-2">{fieldErrors.emailId}</small>
          ) : null}
          <Label>Mobile</Label>
          <Input
            className={fieldErrors.contactNumber ? "mb-1" : "mb-2"}
            value={form.contactNumber}
            onChange={(e) => {
              setForm((p) => ({ ...p, contactNumber: e.target.value }));
              if (fieldErrors.contactNumber) setFieldErrors((p) => ({ ...p, contactNumber: undefined }));
            }}
          />
          {fieldErrors.contactNumber ? (
            <small className="text-danger d-block mb-2">{fieldErrors.contactNumber}</small>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <ModalActionButton color="light" onClick={() => setFormOpen(false)}>
            Cancel
          </ModalActionButton>
          <ModalActionButton color="primary" onClick={saveForm} disabled={saving} loading={saving}>
            Save
          </ModalActionButton>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ReceptionStaffPage;
