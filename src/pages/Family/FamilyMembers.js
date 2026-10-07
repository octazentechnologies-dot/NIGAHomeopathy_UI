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
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
  Table,
} from "reactstrap";
import Swal from "sweetalert2";
import {
  addFamilyRelation,
  createFamilyMember,
  deleteFamilyMember,
  getConsentNotice,
  getFamilyMembers,
  getFamilyMe,
  getFamilyRelations,
  getPrivacyConsentStatus,
  grantConsent,
  updateFamilyMember,
} from "../../helpers/realbackend_helper";
import { unwrapApiList } from "../../helpers/menuByRole";
import PatientAssistedBookingCta from "../../Components/Common/PatientAssistedBookingCta";

const emptyForm = {
  relationId: "",
  relation: "",
  patientName: "",
  mobileNo: "",
  email: "",
  dateOfBirth: "",
};

const ADD_NEW_VALUE = "__new__";

const toDateInput = (value) => {
  const text = value ? String(value) : "";
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "";
};

const memberPatientIdOf = (row) => row.memberPatientId ?? row.MemberPatientId;

const FamilyMembers = () => {
  document.title = "Family | Niga Homeocentrum";
  const [members, setMembers] = useState([]);
  const [relations, setRelations] = useState([]);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPatientId, setOwnerPatientId] = useState(null);
  const [ownerMobile, setOwnerMobile] = useState("");
  const [actingAsCaregiver, setActingAsCaregiver] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [newRelationName, setNewRelationName] = useState("");
  const [showNewRelation, setShowNewRelation] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [consentByPatient, setConsentByPatient] = useState({});
  const [consentFor, setConsentFor] = useState(null);
  const [privacyNotice, setPrivacyNotice] = useState(null);
  const [guardianDeclared, setGuardianDeclared] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState(null);

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
      setOwnerPatientId(me?.ownerPatientId ?? me?.OwnerPatientId ?? me?.patientId ?? me?.PatientId ?? null);
      setOwnerMobile(me?.ownerMobileNo ?? me?.OwnerMobileNo ?? me?.mobileNo ?? me?.MobileNo ?? "");
      setActingAsCaregiver(!!(me?.isActingAsCaregiver ?? me?.IsActingAsCaregiver ?? listRaw?.isActingAsCaregiver));
      const rows = unwrapApiList(listRaw?.data ?? listRaw);
      setMembers(rows);
      loadConsents(rows);
    } catch (err) {
      setError(typeof err === "string" ? err : "Could not load family members.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadConsents = async (rows) => {
    const entries = await Promise.all(
      rows
        .map(memberPatientIdOf)
        .filter(Boolean)
        .map(async (patientId) => {
          try {
            const raw = await getPrivacyConsentStatus(patientId);
            return [patientId, raw?.data ?? raw];
          } catch {
            return [patientId, null];
          }
        })
    );
    setConsentByPatient(Object.fromEntries(entries));
  };

  useEffect(() => {
    load();
  }, []);

  const openGuardianConsent = async (row) => {
    setConsentFor(row);
    setGuardianDeclared(false);
    setConsentError(null);
    try {
      const raw = await getConsentNotice("Privacy");
      setPrivacyNotice(raw?.data ?? raw);
    } catch {
      setPrivacyNotice(null);
      setConsentError("The privacy notice could not be loaded.");
    }
  };

  const closeGuardianConsent = () => {
    setConsentFor(null);
    setPrivacyNotice(null);
  };

  const submitGuardianConsent = async () => {
    if (!consentFor || !privacyNotice) return;
    setConsentBusy(true);
    setConsentError(null);
    try {
      await grantConsent({
        consentTypeCode: "Privacy",
        subjectType: "Patient",
        subjectId: memberPatientIdOf(consentFor),
        noticeVersion: privacyNotice.version,
        noticeLanguage: privacyNotice.language,
        guardian: {
          method: "FamilyAccount",
          declaresLegalGuardian: guardianDeclared,
          relationship: consentFor.relation ?? consentFor.Relation ?? null,
        },
      });
      const name = consentFor.patientName ?? consentFor.PatientName ?? "the child";
      closeGuardianConsent();
      setMessage(`Privacy consent recorded for ${name} (notice version ${privacyNotice.version}).`);
      await loadConsents(members);
    } catch (err) {
      if (err?.data?.code === "NOTICE_OUTDATED") {
        await openGuardianConsent(consentFor);
        setConsentError("The notice was updated. Please read the new version and confirm again.");
      } else {
        setConsentError(err?.data?.message || (typeof err === "string" ? err : err?.message) || "Consent could not be recorded.");
      }
    } finally {
      setConsentBusy(false);
    }
  };

  const consentCell = (row) => {
    const status = consentByPatient[memberPatientIdOf(row)];
    const isMinor = status?.isMinor ?? row.isMinor ?? row.IsMinor;
    if (status?.granted) {
      return (
        <span className="badge bg-success-subtle text-success">
          Granted v{status.grantedNoticeVersion || "?"}
          {status.grantedForMinor ? " (guardian)" : ""}
        </span>
      );
    }
    if (isMinor) {
      return (
        <Button color="warning" size="sm" outline onClick={() => openGuardianConsent(row)}>
          Give guardian consent
        </Button>
      );
    }
    if (status?.reconsentRequired) {
      return <span className="badge bg-warning-subtle text-warning">Needs fresh consent</span>;
    }
    return <span className="text-muted small">{isMinor === false ? "Adult · consents themselves" : "Add date of birth"}</span>;
  };

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
        dateOfBirth: form.dateOfBirth || null,
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
      dateOfBirth: toDateInput(row.dateOfBirth ?? row.DateOfBirth),
    });
  };

  const onDelete = async (row) => {
    const id = row.familyMemberId ?? row.FamilyMemberId;
    if (!id) return;
    const name = row.patientName ?? row.PatientName ?? "this family member";
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Remove family member?",
      text: `${name} will be removed from your family list.`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;
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
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <Row>
          <Col xs={12}>
            <h2 className="clinic-page-title">
              {actingAsCaregiver ? "Family you manage" : "Family"}
              {ownerName ? ` · ${ownerName}` : ""}
            </h2>
            <p className="clinic-page-subtitle">Add family members and book appointments on their behalf.</p>
            {actingAsCaregiver ? (
              <Alert color="info" className="mb-3">
                Signed in as caregiver for <strong>{ownerName || "this patient"}</strong>.
                This is their family list, the same one they see after patient login.
              </Alert>
            ) : null}
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            {/* SUP-07.03 — patient CTA for assisted booking */}
            <PatientAssistedBookingCta patientId={ownerPatientId} contactMobile={ownerMobile} />
          </Col>
        </Row>
        <Row>
          <Col lg={5}>
            <Card>
              <CardHeader>
                <h5 className="mb-0">{editingId ? "Edit family member" : "Add family member"}</h5>
              </CardHeader>
              <CardBody>
                {message ? <Alert color="success">{message}</Alert> : null}
                {error ? <Alert color="danger">{error}</Alert> : null}
                {actingAsCaregiver && ownerName ? (
                  <p className="text-muted small mb-3">
                    Managing family for {ownerName} as caregiver.
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
                  <FormGroup>
                    <Label htmlFor="family-dob">Date of birth</Label>
                    <Input
                      id="family-dob"
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={onChange}
                    />
                    <small className="text-muted">Needed so a parent or guardian can consent for children under 18.</small>
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
                          <th>Mobile</th>
                          <th>Privacy consent</th>
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
                                <td>{row.mobileNo ?? row.MobileNo}</td>
                                <td>{consentCell(row)}</td>
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
      <Modal isOpen={Boolean(consentFor)} toggle={closeGuardianConsent} size="lg" scrollable>
        <ModalHeader toggle={closeGuardianConsent}>
          Guardian consent for {consentFor?.patientName ?? consentFor?.PatientName ?? "child"}
        </ModalHeader>
        <ModalBody>
          {consentError ? <Alert color="danger">{consentError}</Alert> : null}
          <p className="text-muted">
            This family member is under 18. Under the DPDP Act 2023 a parent or legal guardian gives consent for them.
            The consent is recorded against your account and the notice version below.
          </p>
          {privacyNotice ? (
            <>
              <h6>
                {privacyNotice.title || "Privacy notice"} (version {privacyNotice.version})
              </h6>
              <div className="border rounded p-2 mb-3 small" style={{ whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto" }}>
                {privacyNotice.body}
              </div>
            </>
          ) : (
            <Spinner size="sm" />
          )}
          <FormGroup check>
            <Input
              id="guardian-declaration"
              type="checkbox"
              checked={guardianDeclared}
              onChange={(e) => setGuardianDeclared(e.target.checked)}
            />
            <Label check htmlFor="guardian-declaration">
              I am this child&apos;s parent or legal guardian, I am 18 or older, and I consent on their behalf.
            </Label>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={closeGuardianConsent} disabled={consentBusy}>
            Cancel
          </Button>
          <Button color="primary" onClick={submitGuardianConsent} disabled={consentBusy || !guardianDeclared || !privacyNotice}>
            {consentBusy ? "Saving…" : "Give consent"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default FamilyMembers;
