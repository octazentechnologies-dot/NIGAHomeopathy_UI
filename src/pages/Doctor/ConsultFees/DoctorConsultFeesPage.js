import React, { useCallback, useEffect, useState } from "react";
import { Alert, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner } from "reactstrap";
import { getAuthDoctorId } from "../../../helpers/appointmentSlotHelper";
import { getDoctorProfileMe } from "../../../helpers/realbackend_helper";
import { feeHistory, getPublicFee, saveFee, s4Message, unwrapS4 } from "../../../helpers/s4Week4Api";

/**
 * Doctor consult fees — Present (in-clinic / profile) + Tele only.
 * Saves through /Fees and mirrors onto doctor profile ConsultFee* columns.
 */
const DoctorConsultFeesPage = () => {
  const doctorId = Number(getAuthDoctorId() || 0);
  const [form, setForm] = useState({
    presentFee: "",
    teleFee: "",
    currency: "INR",
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  document.title = "Consult fees | Niga Homeocentrum";

  const load = useCallback(async () => {
    if (!doctorId) {
      setLoading(false);
      setError("Open this page while signed in as a doctor.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let present = "";
      let tele = "";
      let currency = "INR";

      try {
        const profile = await getDoctorProfileMe();
        const me = profile?.data ?? profile?.Data ?? profile;
        if (me) {
          present = String(me.consultFeeInClinic ?? me.ConsultFeeInClinic ?? "");
          tele = String(me.consultFeeTele ?? me.ConsultFeeTele ?? "");
          currency = me.feeCurrency || me.FeeCurrency || currency;
        }
      } catch {
        // Fall through to fee config / public fee.
      }

      const response = await feeHistory(doctorId);
      const rows = unwrapS4(response);
      const list = Array.isArray(rows) ? rows : Array.isArray(rows?.data) ? rows.data : [];
      setHistory(list);
      const latest = list[0];
      if (latest) {
        present = String(latest.inClinicFee ?? latest.InClinicFee ?? present);
        tele = String(latest.teleFee ?? latest.TeleFee ?? tele);
        currency = latest.currency || latest.Currency || currency;
      } else if (!present && !tele) {
        const published = unwrapS4(await getPublicFee(doctorId));
        const fee = published?.data && typeof published.data === "object" ? published.data : published;
        if (fee) {
          present = String(fee.inClinicFee ?? fee.InClinicFee ?? present);
          tele = String(fee.teleFee ?? fee.TeleFee ?? tele);
          currency = fee.currency || fee.Currency || currency;
        }
      }

      setForm({
        presentFee: present === "null" || present === "undefined" ? "" : present,
        teleFee: tele === "null" || tele === "undefined" ? "" : tele,
        currency: currency || "INR",
      });
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    setSaving(true);
    setError("");
    setNote("");
    const present = Number(form.presentFee);
    const tele = Number(form.teleFee);
    if (!Number.isFinite(present) || present <= 0 || !Number.isFinite(tele) || tele <= 0) {
      setSaving(false);
      setError("Enter Present and Tele fees greater than 0.");
      return;
    }
    try {
      await saveFee({
        doctorId,
        inClinicFee: present,
        teleFee: tele,
        instantSurcharge: 0,
        currency: form.currency || "INR",
        payAtClinicEnabled: true,
        effectiveFrom: new Date().toISOString().slice(0, 10),
      });
      setNote("Fees saved. Present fee syncs with your doctor profile.");
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title">Consult fees</h2>
            <p className="clinic-page-subtitle mb-0">
              Present fee matches your profile in-clinic fee. Tele fee is for online visits.
            </p>
          </div>
        </div>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        {loading ? (
          <div className="py-4">
            <Spinner size="sm" /> Loading…
          </div>
        ) : (
          <Row className="g-3">
            <Col lg={6}>
              <Card className="admin-dash-card">
                <CardBody>
                  <FormGroup>
                    <Label>Present</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.presentFee}
                      onChange={(e) => setForm({ ...form, presentFee: e.target.value })}
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
                  <button
                    type="button"
                    className="btn clinic-primary-btn"
                    disabled={saving || !doctorId}
                    onClick={onSave}
                  >
                    {saving ? "Saving…" : "Save fees"}
                  </button>
                </CardBody>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="admin-dash-card">
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
                              Present ₹{row.inClinicFee ?? row.InClinicFee} · Tele ₹
                              {row.teleFee ?? row.TeleFee}
                            </div>
                            <div className="text-muted small">
                              From {String(row.effectiveFrom || row.EffectiveFrom || "").slice(0, 10)}
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
