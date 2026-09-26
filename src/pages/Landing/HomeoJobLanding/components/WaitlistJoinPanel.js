import React, { useState } from "react";
import { Alert, Button, FormGroup, Input, Label } from "reactstrap";
import { joinWaitlist, toIsoDate } from "../../../../helpers/publicBookingApi";

const WaitlistJoinPanel = ({ doctorId, requestedDate, consultMode }) => {
  const [contactName, setContactName] = useState("");
  const [contactMobile, setContactMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const submit = async () => {
    setError("");
    setNote("");
    if (!contactName.trim() || !contactMobile.trim()) {
      setError("Name and mobile are required to join the waitlist.");
      return;
    }
    setBusy(true);
    try {
      await joinWaitlist({
        doctorId,
        requestedDate: toIsoDate(requestedDate),
        consultMode: consultMode === "tele" ? "Tele" : "InClinic",
        contactName: contactName.trim(),
        contactMobile: contactMobile.trim(),
      });
      setNote("You are on the waitlist. We will offer a slot if one opens — this does not reserve time.");
    } catch (err) {
      setError(err?.message || "Could not join the waitlist.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 p-3 border rounded">
      <h3 className="h6 mb-2">Join waitlist</h3>
      <p className="text-muted small">
        This day is full. Leave your details. You are not booked until a slot is offered.
      </p>
      {error ? <Alert color="danger">{error}</Alert> : null}
      {note ? <Alert color="success">{note}</Alert> : null}
      <FormGroup>
        <Label>Name</Label>
        <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
      </FormGroup>
      <FormGroup>
        <Label>Mobile</Label>
        <Input value={contactMobile} onChange={(e) => setContactMobile(e.target.value)} />
      </FormGroup>
      <Button color="primary" disabled={busy} onClick={submit}>
        {busy ? "Saving…" : "Join waitlist"}
      </Button>
    </div>
  );
};

export default WaitlistJoinPanel;
