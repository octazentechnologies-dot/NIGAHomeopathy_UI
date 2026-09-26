import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner } from "reactstrap";
import { getAuthDoctorId } from "../../../helpers/appointmentSlotHelper";
import { feeHistory, getPublicFee, saveFee, s4Message, unwrapS4 } from "../../../helpers/s4Week4Api";

/**
 * PAY-01.03 — doctor consult fee tab (in-clinic / tele / pay-at-clinic).
 * Amounts feed public booking and CreateConsultOrder; Razorpay keys stay on the server.
 */
const DoctorConsultFeesPage = () => {
  const doctorId = Number(getAuthDoctorId() || 0);
  const [form, setForm] = useState({
    inClinicFee: "",
    teleFee: "",
    instantSurcharge: "0",
    currency: "INR",
    payAtClinicEnabled: true,
    effectiveFrom: new Date().toISOString().slice(0, 10),
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  document.title = "Consult fees | Niga Homeocentrum";

  const load = async () => {
    if (!doctorId) {
      setLoading(false);
      setError("Open this page while signed in as a doctor.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await feeHistory(doctorId);
      const rows = unwrapS4(response);
      const list = Array.isArray(rows) ? rows : Array.isArray(rows?.data) ? rows.data : [];
      setHistory(list);
      const latest = list[0];
      if (latest) {
        setForm({
          inClinicFee: String(latest.inClinicFee ?? latest.InClinicFee ?? ""),
          teleFee: String(latest.teleFee ?? latest.TeleFee ?? ""),
          instantSurcharge: String(latest.instantSurcharge ?? latest.InstantSurcharge ?? 0),
          currency: latest.currency || latest.Currency || "INR",
          payAtClinicEnabled: Boolean(latest.payAtClinicEnabled ?? latest.PayAtClinicEnabled ?? true),
          effectiveFrom: String(latest.effectiveFrom || latest.EffectiveFrom || new Date().toISOString()).slice(0, 10),
        });
      } else {
        const published = unwrapS4(await getPublicFee(doctorId));
        const fee = published?.data && typeof published.data === "object" ? published.data : published;
        if (fee) {
          setForm((current) => ({
            ...current,
            inClinicFee: String(fee.inClinicFee ?? fee.InClinicFee ?? current.inClinicFee),
            teleFee: String(fee.teleFee ?? fee.TeleFee ?? current.teleFee),
            instantSurcharge: String(fee.instantSurcharge ?? fee.InstantSurcharge ?? current.instantSurcharge),
            currency: fee.currency || fee.Currency || current.currency,
            payAtClinicEnabled: Boolean(fee.payAtClinicEnabled ?? fee.PayAtClinicEnabled ?? current.payAtClinicEnabled),
          }));
        }
      }
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [doctorId]);

  const onSave = async () => {
    setSaving(true);
    setError("");
    setNote("");
    try {
      await saveFee({
        doctorId,
        inClinicFee: Number(form.inClinicFee || 0),
        teleFee: Number(form.teleFee || 0),
        instantSurcharge: Number(form.instantSurcharge || 0),
        currency: form.currency || "INR",
        payAtClinicEnabled: Boolean(form.payAtClinicEnabled),
        effectiveFrom: form.effectiveFrom,
      });
      setNote("Consult fees saved. Public booking and checkout will use these amounts.");
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <h4>Consult fees</h4>
        <p className="text-muted">
          Set in-clinic and tele fees for this doctor. Payment still uses the existing Razorpay keys on the New API.
        </p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        {loading ? (
          <div className="py-4"><Spinner size="sm" /> Loading…</div>
        ) : (
          <Row className="g-3">
            <Col lg={6}>
              <Card>
                <CardBody>
                  <FormGroup>
                    <Label>In-clinic fee</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.inClinicFee}
                      onChange={(e) => setForm({ ...form, inClinicFee: e.target.value })}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Tele fee</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.teleFee}
                      onChange={(e) => setForm({ ...form, teleFee: e.target.value })}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Instant surcharge</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.instantSurcharge}
                      onChange={(e) => setForm({ ...form, instantSurcharge: e.target.value })}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Effective from</Label>
                    <Input
                      type="date"
                      value={form.effectiveFrom}
                      onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                    />
                  </FormGroup>
                  <FormGroup check className="mb-3">
                    <Input
                      id="pay-at-clinic"
                      type="checkbox"
                      checked={form.payAtClinicEnabled}
                      onChange={(e) => setForm({ ...form, payAtClinicEnabled: e.target.checked })}
                    />
                    <Label check htmlFor="pay-at-clinic">
                      Allow pay at clinic
                    </Label>
                  </FormGroup>
                  <Button color="primary" disabled={saving || !doctorId} onClick={onSave}>
                    {saving ? "Saving…" : "Save fees"}
                  </Button>
                </CardBody>
              </Card>
            </Col>
            <Col lg={6}>
              <Card>
                <CardBody>
                  <h5>Change history</h5>
                  {history.length === 0 ? (
                    <p className="text-muted mb-0">No fee rows yet.</p>
                  ) : (
                    <ul className="list-unstyled mb-0">
                      {history.map((row) => {
                        const id = row.consultFeeConfigId || row.ConsultFeeConfigId;
                        return (
                          <li key={id} className="border-bottom py-2">
                            <div className="fw-medium">
                              In-clinic ₹{row.inClinicFee ?? row.InClinicFee} · Tele ₹{row.teleFee ?? row.TeleFee}
                            </div>
                            <div className="text-muted small">
                              From {String(row.effectiveFrom || row.EffectiveFrom || "").slice(0, 10)}
                              {" · "}
                              {(row.payAtClinicEnabled ?? row.PayAtClinicEnabled) ? "Pay at clinic on" : "Pay at clinic off"}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default DoctorConsultFeesPage;
