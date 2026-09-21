import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
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
  addFamilyRelation,
  createFamilyMember,
  deleteFamilyMember,
  getFamilyMembers,
  getFamilyMe,
  getFamilyRelations,
  updateFamilyMember,
} from "../../helpers/realbackend_helper";
import { unwrapApiList } from "../../helpers/menuByRole";

const emptyForm = {
  relationId: "",
  relation: "",
  patientName: "",
  mobileNo: "",
  email: "",
};

const ADD_NEW_VALUE = "__new__";

const FamilyMembers = () => {
  document.title = "Family | Niga Homeocentrum";
  const [members, setMembers] = useState([]);
  const [relations, setRelations] = useState([]);
  const [ownerName, setOwnerName] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [newRelationName, setNewRelationName] = useState("");
  const [showNewRelation, setShowNewRelation] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const relationOptions = useMemo(() => {
    const rows = unwrapApiList(relations)
      .map((row) => {
        const id = row.relationId ?? row.RelationId;
        const name = row.relationName ?? row.RelationName;
        if (id == null || !String(name || "").trim() || String(name).toLowerCase() === "undefined") {
          return null;
        }
        return { value: String(id), label: String(name).trim() };
      })
      .filter(Boolean);
    return [...rows, { value: ADD_NEW_VALUE, label: "+ Add new relation" }];
  }, [relations]);

  const selectedRelation = useMemo(() => {
    if (showNewRelation) {
      return relationOptions.find((o) => o.value === ADD_NEW_VALUE) || null;
    }
    if (form.relationId) {
      return relationOptions.find((o) => o.value === String(form.relationId)) || {
        value: String(form.relationId),
        label: form.relation || "Relation",
      };
    }
    if (form.relation) {
      const byName = relationOptions.find(
        (o) => o.value !== ADD_NEW_VALUE && o.label.toLowerCase() === form.relation.toLowerCase()
      );
      return byName || { value: form.relation, label: form.relation };
    }
    return null;
  }, [form.relationId, form.relation, relationOptions, showNewRelation]);

  const loadRelations = async () => {
    const raw = await getFamilyRelations();
    setRelations(unwrapApiList(raw?.data ?? raw));
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadRelations();
    } catch {
      setRelations([]);
    }
    try {
      const [meRaw, listRaw] = await Promise.all([getFamilyMe(), getFamilyMembers()]);
      const me = meRaw?.data ?? meRaw;
      setOwnerName(me?.ownerPatientName ?? me?.OwnerPatientName ?? "");
      setMembers(unwrapApiList(listRaw?.data ?? listRaw));
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
    setForm(emptyForm);
    setEditingId(null);
    setShowNewRelation(false);
    setNewRelationName("");
  };

  const onRelationChange = (option) => {
    if (!option) {
      setForm((prev) => ({ ...prev, relationId: "", relation: "" }));
      setShowNewRelation(false);
      return;
    }
    if (option.value === ADD_NEW_VALUE) {
      setShowNewRelation(true);
      setForm((prev) => ({ ...prev, relationId: "", relation: "" }));
      return;
    }
    setShowNewRelation(false);
    setForm((prev) => ({ ...prev, relationId: option.value, relation: option.label }));
  };

  const onSaveNewRelation = async (event) => {
    event.preventDefault();
    const name = newRelationName.trim();
    if (!name) {
      setError("Enter a relation name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const raw = await addFamilyRelation({ relationName: name });
      const created = raw?.data ?? raw;
      const id = created?.relationId ?? created?.RelationId;
      const label = created?.relationName ?? created?.RelationName ?? name;
      await loadRelations();
      setForm((prev) => ({ ...prev, relationId: String(id || ""), relation: label }));
      setShowNewRelation(false);
      setNewRelationName("");
      setMessage(`Relation "${label}" added.`);
    } catch (err) {
      setError(typeof err === "string" ? err : "Could not add relation.");
    } finally {
      setSaving(false);
    }
  };

  const onSave = async (event) => {
    event.preventDefault();
    if (!form.patientName || !String(form.patientName).trim()) {
      setError("Name is required.");
      return;
    }
    if (showNewRelation && !form.relationId) {
      setError("Save the new relation first, or pick one from the list.");
      return;
    }
    if (!form.relationId || !String(form.relation || "").trim()) {
      setError("Select a relation.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        relationId: form.relationId ? Number(form.relationId) : undefined,
        relation: form.relation,
        patientName: form.patientName,
        mobileNo: form.mobileNo || null,
        email: form.email || null,
      };
      if (editingId) {
        await updateFamilyMember(editingId, payload);
        setMessage("Family member updated.");
      } else {
        await createFamilyMember(payload);
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
    setShowNewRelation(false);
    setForm({
      relationId: String(row.relationId ?? row.RelationId ?? ""),
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
                {ownerName ? (
                  <p className="text-muted small mb-3">
                    Adding members under your login{ownerName ? ` (${ownerName})` : ""}. You do not enter a PatientId.
                  </p>
                ) : null}
                <Form onSubmit={onSave}>
                  <FormGroup>
                    <Label htmlFor="family-relation">Relation <span className="text-danger">*</span></Label>
                    <Select
                      classNamePrefix="react-select"
                      className="react-select-container"
                      inputId="family-relation"
                      isSearchable
                      isClearable
                      placeholder="Search relation..."
                      options={relationOptions}
                      value={selectedRelation}
                      getOptionLabel={(option) => option.label || ""}
                      getOptionValue={(option) => option.value || ""}
                      filterOption={(option, input) => {
                        const label = String(option?.label || option?.data?.label || "");
                        const query = String(input || "").trim().toLowerCase();
                        if (!query || query === "undefined") return true;
                        return label.toLowerCase().includes(query);
                      }}
                      onInputChange={(value) => (value === "undefined" ? "" : value)}
                      noOptionsMessage={() =>
                        relations.length ? "No matching relation" : "Loading relations..."
                      }
                      onChange={onRelationChange}
                    />
                  </FormGroup>
                  {showNewRelation ? (
                    <FormGroup>
                      <Label>New relation name</Label>
                      <div className="d-flex gap-2">
                        <Input
                          value={newRelationName}
                          onChange={(e) => setNewRelationName(e.target.value)}
                          placeholder="e.g. Guardian"
                        />
                        <Button color="secondary" type="button" onClick={onSaveNewRelation} disabled={saving}>
                          Save
                        </Button>
                      </div>
                    </FormGroup>
                  ) : null}
                  <FormGroup>
                    <Label>Name <span className="text-danger">*</span></Label>
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
                  <Button
                    color="primary"
                    type="submit"
                    disabled={
                      saving
                      || !String(form.patientName || "").trim()
                      || !form.relationId
                      || showNewRelation
                    }
                  >
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
