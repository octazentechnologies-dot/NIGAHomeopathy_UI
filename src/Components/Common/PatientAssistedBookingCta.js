import React, { useState } from "react";
import { Alert, Button, Card, CardBody, CardHeader, Col, FormGroup, Input, Label, Row } from "reactstrap";
import { requestBookingAssistance } from "../../helpers/realbackend_helper";

/**
 * SUP-07.03 — patient CTA: ask clinic staff to book on their behalf.
 */
const PatientAssistedBookingCta = ({ patientId, contactMobile }) => {
  const [notes, setNotes] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [mobile, setMobile] = useState(contactMobile || "");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    setOk("");
    setSaving(true);
    try {
      const payload = {
        notes: notes.trim() || undefined,
        preferredDate: preferredDate || undefined,
        contactMobile: mobile.trim() || undefined,
      };
      if (patientId) payload.patientId = Number(patientId);
      const response = await requestBookingAssistance(payload);
      const body = response?.data ?? response;
      const id = body?.supportTicketId ?? body?.SupportTicketId;
      setOk(
        id
          ? `Request ${id} sent. Reception or admin will book for you.`
          : "Request sent. Reception or admin will book for you."
      );
      setNotes("");
      setPreferredDate("");
      setMobile(contactMobile || "");
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.message || data?.Message || "Could not send assistance request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-0 family-assist-card" data-testid="patient-assisted-booking-cta">
      <CardHeader>
        <h5 className="mb-0">Need help booking?</h5>
      </CardHeader>
      <CardBody>
        <p className="text-muted small mb-2">
          Ask the clinic to book an appointment for you. Staff use Assisted booking — you are not charged here.
        </p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {ok ? <Alert color="success">{ok}</Alert> : null}
        <Row className="g-2 align-items-end">
          <Col xs={12}>
            <FormGroup className="mb-0">
              <Label htmlFor="assist-notes">What do you need?</Label>
              <Input
                id="assist-notes"
                type="textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Prefer morning tele visit next week"
                data-testid="assist-notes"
              />
            </FormGroup>
          </Col>
          <Col sm={6} lg={3}>
            <FormGroup className="mb-0">
              <Label htmlFor="assist-date">Preferred date (optional)</Label>
              <Input
                id="assist-date"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                data-testid="assist-preferred-date"
              />
            </FormGroup>
          </Col>
          <Col sm={6} lg={3}>
            <FormGroup className="mb-0">
              <Label htmlFor="assist-mobile">Contact mobile (optional)</Label>
              <Input
                id="assist-mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                data-testid="assist-mobile"
              />
            </FormGroup>
          </Col>
          <Col xs="auto" className="family-assist-card__action">
            <Button color="primary" onClick={submit} disabled={saving} data-testid="assist-request-submit">
              {saving ? "Sending…" : "Request booking help"}
            </Button>
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

export default PatientAssistedBookingCta;
