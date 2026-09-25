import React, { useState } from "react";
import { Alert, Button, Card, CardBody, FormGroup, Input, Label } from "reactstrap";
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
          ? `Request #${id} sent. Reception or admin will book for you.`
          : "Request sent. Reception or admin will book for you."
      );
      setNotes("");
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.message || data?.Message || "Could not send assistance request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-3" data-testid="patient-assisted-booking-cta">
      <CardBody>
        <h5 className="mb-1">Need help booking?</h5>
        <p className="text-muted small mb-3">
          Ask the clinic to book an appointment for you. Staff use Assisted booking — you are not charged here.
        </p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {ok ? <Alert color="success">{ok}</Alert> : null}
        <FormGroup>
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
        <FormGroup>
          <Label htmlFor="assist-date">Preferred date (optional)</Label>
          <Input
            id="assist-date"
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            data-testid="assist-preferred-date"
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="assist-mobile">Contact mobile (optional)</Label>
          <Input
            id="assist-mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            data-testid="assist-mobile"
          />
        </FormGroup>
        <Button color="primary" onClick={submit} disabled={saving} data-testid="assist-request-submit">
          {saving ? "Sending…" : "Request booking help"}
        </Button>
      </CardBody>
    </Card>
  );
};

export default PatientAssistedBookingCta;
