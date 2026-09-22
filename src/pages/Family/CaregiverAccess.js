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
  getCaregiverMe,
  grantCaregiver,
  listCaregiverActingFor,
  listMyCaregivers,
  lookupCaregiver,
  requestOtp,
  revokeCaregiver,
} from "../../helpers/realbackend_helper";
import { unwrapApiList } from "../../helpers/menuByRole";

const emptyGrant = {
  caregiverContact: "",
  otpCode: "",
};

const CaregiverAccess = () => {
  document.title = "Caregiver | Niga Homeocentrum";
  const [mine, setMine] = useState([]);
  const [actingFor, setActingFor] = useState([]);
  const [form, setForm] = useState(emptyGrant);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPatientId, setOwnerPatientId] = useState(null);
  const [otpDestination, setOtpDestination] = useState("");
  const [matchedCaregiver, setMatchedCaregiver] = useState(null);
  const [otpChallengeId, setOtpChallengeId] = useState(null);
  const [devCode, setDevCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRaw, mineRaw, actingRaw] = await Promise.all([
        getCaregiverMe(),
        listMyCaregivers(),
        listCaregiverActingFor(),
      ]);
      const me = meRaw?.data ?? meRaw;
      setOwnerName(me?.ownerPatientName ?? me?.OwnerPatientName ?? "");
      setOwnerPatientId(me?.ownerPatientId ?? me?.OwnerPatientId ?? null);
      setOtpDestination(me?.otpDestination ?? me?.OtpDestination ?? "");
      setMine(unwrapApiList(mineRaw?.data ?? mineRaw));
      setActingFor(unwrapApiList(actingRaw?.data ?? actingRaw));
    } catch (err) {
      setError(typeof err === "string" ? err : "Could not load caregiver grants.");
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
    if (name === "caregiverContact") {
      setMatchedCaregiver(null);
      setOtpChallengeId(null);
      setDevCode(null);
    }
  };

  const resolveCaregiver = async () => {
    const contact = form.caregiverContact.trim();
    if (!contact) {
      setError("Enter the caregiver mobile or email.");
      return null;
    }
    const raw = await lookupCaregiver(contact);
    const found = raw?.data ?? raw;
    if (!found) {
      setError("No Homeocentrum login found for that mobile or email.");
      return null;
    }
    setMatchedCaregiver(found);
    return found;
  };

  const onRequestOtp = async (event) => {
    event.preventDefault();
    if (!ownerPatientId) {
      setError("Your patient record could not be resolved. Try refresh.");
      return;
    }
    if (!otpDestination) {
      setError("No mobile or email is on your login to send OTP.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    setDevCode(null);
    try {
      const found = await resolveCaregiver();
      if (!found) {
        setSaving(false);
        return;
      }
      const raw = await requestOtp({
        action: "GrantCaregiver",
        entityType: "Patient",
        entityId: String(ownerPatientId),
        destination: otpDestination,
      });
      const data = raw?.data ?? raw;
      const challengeId = data?.otpChallengeId ?? data?.OtpChallengeId;
      setOtpChallengeId(challengeId || null);
      setDevCode(data?.devCode ?? data?.DevCode ?? null);
      const name = found.displayName ?? found.DisplayName;
      setMessage(
        data?.message ||
          `OTP sent to your login contact. Grant access for ${name || "this caregiver"} after you enter the code.`
      );
    } catch (err) {
      setError(typeof err === "string" ? err : "OTP request failed.");
    } finally {
      setSaving(false);
    }
  };

  const onGrant = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await grantCaregiver({
        caregiverContact: form.caregiverContact.trim(),
        scope: "booking",
        otpChallengeId: Number(otpChallengeId || 0),
        otpCode: form.otpCode,
      });
      setMessage("Caregiver access granted.");
      setForm(emptyGrant);
      setMatchedCaregiver(null);
      setOtpChallengeId(null);
      setDevCode(null);
      await load();
    } catch (err) {
      setError(typeof err === "string" ? err : "Grant failed. Request OTP first.");
    } finally {
      setSaving(false);
    }
  };

  const onRevoke = async (row) => {
    const id = row.caregiverAuthorizationId ?? row.CaregiverAuthorizationId;
    if (!id) return;
    if (!window.confirm("Revoke this caregiver grant?")) return;
    setSaving(true);
    setError(null);
    try {
      await revokeCaregiver({ caregiverAuthorizationId: id });
      setMessage("Grant revoked.");
      await load();
    } catch (err) {
      setError(typeof err === "string" ? err : "Revoke failed.");
    } finally {
      setSaving(false);
    }
  };

  const renderGrantTable = (rows, showRevoke, mode) => (
    <div className="table-responsive">
      <Table className="table-nowrap mb-0">
        <thead>
          <tr>
            {mode === "acting" ? <th>Patient</th> : <th>Caregiver</th>}
            <th>Contact</th>
            <th>Scope</th>
            <th>Active</th>
            {showRevoke ? <th></th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={showRevoke ? 5 : 4}>None.</td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = row.caregiverAuthorizationId ?? row.CaregiverAuthorizationId;
              const active = row.isActive ?? row.IsActive;
              const caregiverName = row.caregiverName ?? row.CaregiverName ?? "—";
              const patientName = row.patientName ?? row.PatientName ?? "—";
              const contact = row.caregiverContact ?? row.CaregiverContact ?? "—";
              return (
                <tr key={id}>
                  <td>{mode === "acting" ? patientName : caregiverName}</td>
                  <td>{contact}</td>
                  <td>{row.scope ?? row.Scope}</td>
                  <td>{active ? "Yes" : "No"}</td>
                  {showRevoke ? (
                    <td className="text-end">
                      {active ? (
                        <Button color="link" size="sm" className="text-danger" onClick={() => onRevoke(row)}>
                          Revoke
                        </Button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );

  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={5}>
            <Card>
              <CardHeader>
                <h5 className="mb-0">Grant caregiver (OTP)</h5>
              </CardHeader>
              <CardBody>
                {message ? <Alert color="success">{message}</Alert> : null}
                {error ? <Alert color="danger">{error}</Alert> : null}
                {devCode ? (
                  <Alert color="warning">Development OTP: {devCode}</Alert>
                ) : null}
                {ownerName ? (
                  <p className="text-muted small mb-3">
                    Granting access to your login{ownerName ? ` (${ownerName})` : ""}.
                  </p>
                ) : null}
                <Form onSubmit={onRequestOtp} className="mb-3">
                  <FormGroup>
                    <Label>Caregiver mobile or email</Label>
                    <Input
                      name="caregiverContact"
                      value={form.caregiverContact}
                      onChange={onChange}
                      placeholder="Their registered mobile or email"
                      required
                    />
                  </FormGroup>
                  {matchedCaregiver ? (
                    <p className="text-muted small">
                      Found: {matchedCaregiver.displayName ?? matchedCaregiver.DisplayName} (
                      {matchedCaregiver.contact ?? matchedCaregiver.Contact})
                    </p>
                  ) : null}
                  {otpDestination ? (
                    <p className="text-muted small">OTP will be sent to your contact: {otpDestination}</p>
                  ) : null}
                  <Button color="secondary" type="submit" disabled={saving}>
                    Request OTP
                  </Button>
                </Form>
                <Form onSubmit={onGrant}>
                  <FormGroup>
                    <Label>OTP code</Label>
                    <Input name="otpCode" value={form.otpCode} onChange={onChange} />
                  </FormGroup>
                  <Button color="primary" type="submit" disabled={saving || !otpChallengeId}>
                    Grant
                  </Button>
                </Form>
                <p className="text-muted mt-3 mb-0 small">
                  SMS is stubbed until a provider is wired. The caregiver must already have a Homeocentrum login.
                </p>
              </CardBody>
            </Card>
          </Col>
          <Col lg={7}>
            <Card className="mb-3">
              <CardHeader className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Caregivers I granted</h5>
                <Button color="light" size="sm" onClick={load} disabled={loading}>
                  Refresh
                </Button>
              </CardHeader>
              <CardBody>
                {loading ? <Spinner size="sm" /> : renderGrantTable(mine, true, "mine")}
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <h5 className="mb-0">Patients I may act for</h5>
              </CardHeader>
              <CardBody>
                {loading ? <Spinner size="sm" /> : renderGrantTable(actingFor, false, "acting")}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CaregiverAccess;
