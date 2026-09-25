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

const unwrapList = (payload) =>
  payload?.resultObject ??
  payload?.ResultObject ??
  payload?.data ??
  payload?.Data ??
  (Array.isArray(payload) ? payload : []);

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
    setFormOpen(true);
  };

  const saveForm = async () => {
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
                className="mb-2"
                value={form.userID}
                onChange={(e) => setForm((p) => ({ ...p, userID: e.target.value }))}
              />
              <Label>Password</Label>
              <Input
                type="password"
                className="mb-2"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </>
          ) : null}
          <Label>Full name</Label>
          <Input
            className="mb-2"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
          />
          <Label>Email</Label>
          <Input
            type="email"
            className="mb-2"
            value={form.emailId}
            onChange={(e) => setForm((p) => ({ ...p, emailId: e.target.value }))}
          />
          <Label>Mobile</Label>
          <Input
            value={form.contactNumber}
            onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))}
          />
        </ModalBody>
        <ModalFooter>
          <ModalActionButton color="light" onClick={() => setFormOpen(false)}>
            Cancel
          </ModalActionButton>
          <ModalActionButton color="primary" onClick={saveForm}>
            Save
          </ModalActionButton>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ReceptionStaffPage;
