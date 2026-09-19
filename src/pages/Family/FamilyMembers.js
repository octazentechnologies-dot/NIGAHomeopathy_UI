import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Spinner,
  Table,
} from "reactstrap";
import {
  createFamilyMember,
  deleteFamilyMember,
  getFamilyMembers,
  linkPrimaryPatient,
  updateFamilyMember,
} from "../../helpers/realbackend_helper";
import { unwrapApiList } from "../../helpers/menuByRole";

const emptyForm = {
  ownerPatientId: "",
  relation: "",
  patientName: "",
  mobileNo: "",
  email: "",
};

const FamilyMembers = () => {
  document.title = "Family | Niga Homeocentrum";
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await getFamilyMembers();
      setMembers(unwrapApiList(raw?.data ?? raw));
    } catch (err) {
      setError(typeof err === "string" ? err : "Could not load family members.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm((prev) => ({ ...emptyForm, ownerPatientId: prev.ownerPatientId }));
    setEditingId(null);
  };

  const onLinkPrimary = async (event) => {
    event.preventDefault();
    const ownerPatientId = Number(form.ownerPatientId);
    if (!ownerPatientId) {
      setError("Primary PatientId is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await linkPrimaryPatient({ patientId: ownerPatientId });
      setMessage("Primary patient linked for this login.");
    } catch (err) {
      setError(typeof err === "string" ? err : "Link primary failed.");
    } finally {
      setSaving(false);
    }
  };

  const onSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        await updateFamilyMember(editingId, {
          relation: form.relation,
          patientName: form.patientName,
          mobileNo: form.mobileNo || null,
          email: form.email || null,
        });
        setMessage("Family member updated.");
      } else {
        await createFamilyMember({
          ownerPatientId: Number(form.ownerPatientId),
          relation: form.relation,
          patientName: form.patientName,
          mobileNo: form.mobileNo || null,
          email: form.email || null,
        });
        setMessage("Family member added.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(typeof err === "string" ? err : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row) => {
    setEditingId(row.familyMemberId ?? row.FamilyMemberId);
    setForm({
      ownerPatientId: String(row.ownerPatientId ?? row.OwnerPatientId ?? form.ownerPatientId),
      relation: row.relation ?? row.Relation ?? "",
      patientName: row.patientName ?? row.PatientName ?? "",
      mobileNo: row.mobileNo ?? row.MobileNo ?? "",
      email: row.email ?? row.Email ?? "",
    });
  };

  const onDelete = async (row) => {
    const id = row.familyMemberId ?? row.FamilyMemberId;
    if (!id) return;
    if (!window.confirm("Remove this family member?")) return;
    setSaving(true);
    setError(null);
    try {
      await deleteFamilyMember(id);
      setMessage("Family member removed.");
      await load();
    } catch (err) {
      setError(typeof err === "string" ? err : "Delete failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={5}>
            <Card>
              <CardHeader>
                <h5 className="mb-0">{editingId ? "Edit family member" : "Add family member"}</h5>
              </CardHeader>
              <CardBody>
                {message ? <Alert color="success">{message}</Alert> : null}
                {error ? <Alert color="danger">{error}</Alert> : null}
                <Form onSubmit={onLinkPrimary} className="mb-4">
                  <FormGroup>
                    <Label>Primary PatientId</Label>
                    <Input
                      name="ownerPatientId"
                      value={form.ownerPatientId}
                      onChange={onChange}
                      placeholder="Clinical PatientId for this login"
                    />
                  </FormGroup>
                  <Button color="secondary" type="submit" disabled={saving}>
                    Link primary patient
                  </Button>
                </Form>
                <Form onSubmit={onSave}>
                  <FormGroup>
                    <Label>Relation</Label>
                    <Input name="relation" value={form.relation} onChange={onChange} required />
                  </FormGroup>
                  <FormGroup>
                    <Label>Name</Label>
                    <Input name="patientName" value={form.patientName} onChange={onChange} required />
                  </FormGroup>
                  <FormGroup>
                    <Label>Mobile</Label>
                    <Input name="mobileNo" value={form.mobileNo} onChange={onChange} />
                  </FormGroup>
                  <FormGroup>
                    <Label>Email</Label>
                    <Input type="email" name="email" value={form.email} onChange={onChange} />
                  </FormGroup>
                  <Button color="primary" type="submit" disabled={saving}>
                    {editingId ? "Update" : "Add"}
                  </Button>{" "}
                  {editingId ? (
                    <Button color="light" type="button" onClick={resetForm}>
                      Cancel
                    </Button>
                  ) : null}
                </Form>
              </CardBody>
            </Card>
          </Col>
          <Col lg={7}>
            <Card>
              <CardHeader className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Family members</h5>
                <Button color="light" size="sm" onClick={load} disabled={loading}>
                  Refresh
                </Button>
              </CardHeader>
              <CardBody>
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <div className="table-responsive">
                    <Table className="table-nowrap mb-0">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Relation</th>
                          <th>PatientId</th>
                          <th>Mobile</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.length === 0 ? (
                          <tr>
                            <td colSpan={5}>No family members yet.</td>
                          </tr>
                        ) : (
                          members.map((row) => {
                            const id = row.familyMemberId ?? row.FamilyMemberId;
                            return (
                              <tr key={id}>
                                <td>{row.patientName ?? row.PatientName}</td>
                                <td>{row.relation ?? row.Relation}</td>
                                <td>{row.memberPatientId ?? row.MemberPatientId}</td>
                                <td>{row.mobileNo ?? row.MobileNo}</td>
                                <td className="text-end">
                                  <Button color="link" size="sm" onClick={() => onEdit(row)}>
                                    Edit
                                  </Button>
                                  <Button color="link" size="sm" className="text-danger" onClick={() => onDelete(row)}>
                                    Delete
                                  </Button>
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
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default FamilyMembers;
