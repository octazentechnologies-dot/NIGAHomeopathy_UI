import React, { useEffect, useState } from "react";
import { Alert, Card, CardBody, Container, Spinner } from "reactstrap";
import { s4Message, securityPosture } from "../../../helpers/s5Week5Api";

/** NFR-01.01 — shows where secrets live. This page does not rotate keys. */
const SecurityPosturePage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  document.title = "Security posture | Niga Homeocentrum";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await securityPosture();
        if (!cancelled) setData(response);
      } catch (err) {
        if (!cancelled) setError(s4Message(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const flag = (value) => (value ? "Yes" : "No");

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">Security posture</h2>
        <p className="clinic-page-subtitle">Directory browsing stays off. Live keys are changed in server configuration, not from this page.</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {loading ? <Spinner size="sm" /> : null}
        {data ? (
          <Card className="admin-dash-card"><CardBody>
            <div>Directory browsing enabled: {flag(data.directoryBrowsingEnabled)}</div>
            <div>Secrets stored in: {data.secretsStoredIn}</div>
            <div>Key Vault configured: {flag(data.keyVaultConfigured)}</div>
            <div>SMS provider configured: {flag(data.smsConfigured)}</div>
            <div>Push provider configured: {flag(data.fcmConfigured)}</div>
            <p className="text-muted mt-2 mb-0">{data.message}</p>
          </CardBody></Card>
        ) : null}
      </Container>
    </div>
  );
};

export default SecurityPosturePage;
