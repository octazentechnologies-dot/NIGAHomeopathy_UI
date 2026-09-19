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
  grantCaregiver,
  listCaregiverActingFor,
  listMyCaregivers,
  requestOtp,
  revokeCaregiver,
} from "../../helpers/realbackend_helper";
import { unwrapApiList } from "../../helpers/menuByRole";

const emptyGrant = {
  patientId: "",
  caregiverUserId: "",
  destination: "",
  otpCode: "",
};

const CaregiverAccess = () => {
  document.title = "Caregiver | Niga Homeocentrum";
  const [mine, setMine] = useState([]);
  const [actingFor, setActingFor] = useState([]);
  const [form, setForm] = useState(emptyGrant);
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
      const [mineRaw, actingRaw] = await Promise.all([
        listMyCaregivers(),
        listCaregiverActingFor(),
      ]);
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
  };

  const onRequestOtp = async (event) => {
    event.preventDefault();
    const patientId = Number(form.patientId);
    if (!patientId || !form.destination) {
      setError("PatientId and destination (mobile/email) are required for OTP.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    setDevCode(null);
    try {
      const raw = await requestOtp({
        action: "GrantCaregiver",
        entityType: "Patient",
        entityId: String(patientId),
        destination: form.destination,
      });
      const data = raw?.data ?? raw;
      const challengeId = data?.otpChallengeId ?? data?.OtpChallengeId;
      setOtpChallengeId(challengeId || null);
      setDevCode(data?.devCode ?? data?.DevCode ?? null);
      setMessage(
        data?.message ||
          "OTP requested (SMS stub). Enter the code, then Grant."
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
        patientId: Number(form.patientId),
        caregiverUserId: Number(form.caregiverUserId),
        scope: "booking",
        otpChallengeId: Number(otpChallengeId || 0),
        otpCode: form.otpCode,
      });
      setMessage("Caregiver access granted.");
      setForm(emptyGrant);
      setOtpChallengeId(null);
      setDevCode(null);
      await load();
    } catch (err) {
      setError(typeof err === "string" ? err : "Grant failed. Request OTP first unless you are Admin.");
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

  const renderGrantTable = (rows, showRevoke) => (
    <div className="table-responsive">
      <Table className="table-nowrap mb-0">
        <thead>
          <tr>
            <th>Id</th>
            <th>PatientId</th>
            <th>Caregiver user</th>
            <th>Scope</th>
            <th>Active</th>
            {showRevoke ? <th></th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={showRevoke ? 6 : 5}>None.</td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = row.caregiverAuthorizationId ?? row.CaregiverAuthorizationId;
              const active = row.isActive ?? row.IsActive;
              return (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{row.patientId ?? row.PatientId}</td>
                  <td>{row.caregiverUserId ?? row.CaregiverUserId}</td>
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
                <Form onSubmit={onRequestOtp} className="mb-3">
                  <FormGroup>
                    <Label>PatientId</Label>
                    <Input name="patientId" value={form.patientId} onChange={onChange} required />
                  </FormGroup>
                  <FormGroup>
                    <Label>Caregiver UserId</Label>
                    <Input name="caregiverUserId" value={form.caregiverUserId} onChange={onChange} required />
                  </FormGroup>
                  <FormGroup>
                    <Label>OTP destination (mobile or email)</Label>
                    <Input name="destination" value={form.destination} onChange={onChange} required />
                  </FormGroup>
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
                  SMS is stubbed until a provider is wired. AdminPortal can grant without OTP via API.
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
                {loading ? <Spinner size="sm" /> : renderGrantTable(mine, true)}
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <h5 className="mb-0">Patients I may act for</h5>
              </CardHeader>
              <CardBody>
                {loading ? <Spinner size="sm" /> : renderGrantTable(actingFor, false)}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CaregiverAccess;
