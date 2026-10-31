import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Card, CardBody, Col, Container, Row, Spinner, Table } from "reactstrap";
import {
  clinicPerformance,
  followUpDue,
  followUpSummary,
  medicineReport,
  s4Message,
  unwrapS4,
} from "../../../helpers/s5Week5Api";

const titles = {
  followup: ["Follow-ups due", "Open follow-ups that are due or overdue. Missed follow-up appointments notify the doctor.", "ri-calendar-todo-line"],
  performance: ["Clinic performance", "Visits by mode and paid collections for the last 30 days.", "ri-bar-chart-grouped-line"],
  medicine: ["Medicine orders", "Order counts, quote totals, patients, and recent order detail.", "ri-capsule-line"],
};

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatWhen = (value) => {
  if (value == null || value === "") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

const ClinicReportPage = ({ mode = "followup" }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [title, subtitle, icon] = titles[mode] || titles.followup;
  const isMedicineAdmin = mode === "medicine";

  document.title = `${title} | Niga Homeocentrum`;

  const load = useCallback(() => {
    setReloadKey((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response =
          mode === "performance"
            ? await clinicPerformance({})
            : mode === "medicine"
              ? await medicineReport()
              : await Promise.all([followUpDue(), followUpSummary()]);
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
  }, [mode, reloadKey]);

  const due = mode === "followup" ? unwrapS4(data?.[0]) : [];
  const summary = mode === "followup" ? unwrapS4(data?.[1]) : [];
  const visits = Array.isArray(data?.visits) ? data.visits : Array.isArray(data?.Visits) ? data.Visits : [];
  const paid = data?.paid || data?.Paid || null;

  const medicinePayload = useMemo(() => {
    if (mode !== "medicine") return { byStatus: [], recent: [], totals: null };
    const unwrapped = unwrapS4(data);
    if (Array.isArray(unwrapped)) {
      return {
        byStatus: unwrapped.map((row) => ({
          status: row.name || row.Name || row.status || row.Status,
          orders: row.cnt ?? row.Cnt ?? row.orders ?? row.Orders ?? 0,
          patients: row.patients ?? row.Patients ?? null,
          pharmacies: row.pharmacies ?? row.Pharmacies ?? null,
          quoteTotal: row.quoteTotal ?? row.QuoteTotal ?? null,
          lastCreatedAt: row.lastCreatedAt ?? row.LastCreatedAt ?? null,
        })),
        recent: [],
        totals: null,
      };
    }
    const body = unwrapped?.data && !Array.isArray(unwrapped.data) ? unwrapped.data : unwrapped || {};
    const byStatusRaw = body.byStatus || body.ByStatus || body.rows || body.Rows || [];
    const recentRaw = body.recent || body.Recent || [];
    const recent = Array.isArray(recentRaw) ? recentRaw : [];
    const byStatus = (Array.isArray(byStatusRaw) ? byStatusRaw : []).map((row) => ({
      status: row.status || row.Status || row.name || row.Name || "—",
      orders: row.orders ?? row.Orders ?? row.cnt ?? row.Cnt ?? 0,
      patients: row.patients ?? row.Patients ?? 0,
      pharmacies: row.pharmacies ?? row.Pharmacies ?? 0,
      quoteTotal: row.quoteTotal ?? row.QuoteTotal ?? 0,
      lastCreatedAt: row.lastCreatedAt ?? row.LastCreatedAt ?? null,
    }));
    const totalsRaw = body.totals || body.Totals || null;
    const orderCount =
      totalsRaw?.orders ?? totalsRaw?.Orders ?? byStatus.reduce((n, r) => n + Number(r.orders || 0), 0);
    const quoteTotal =
      totalsRaw?.quoteTotal ??
      totalsRaw?.QuoteTotal ??
      byStatus.reduce((n, r) => n + Number(r.quoteTotal || 0), 0);
    // Prefer distinct counts from recent when it covers all orders (avoids summing per-status).
    const coversAll = recent.length > 0 && recent.length >= Number(orderCount || 0);
    const distinct = (camel, pascal) => {
      const set = new Set();
      for (const row of recent) {
        const value = pick(row, camel, pascal);
        if (value != null && value !== "") set.add(String(value));
      }
      return set.size;
    };
    return {
      byStatus,
      recent,
      totals: {
        orders: orderCount,
        patients: coversAll
          ? distinct("patientId", "PatientId")
          : (totalsRaw?.patients ?? totalsRaw?.Patients ?? null),
        pharmacies: coversAll
          ? distinct("pharmacyPartnerId", "PharmacyPartnerId")
          : (totalsRaw?.pharmacies ?? totalsRaw?.Pharmacies ?? null),
        quoteTotal,
      },
    };
  }, [mode, data]);

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title"><i className={icon} aria-hidden="true" />{title}</h2>
            <p className="clinic-page-subtitle mb-0">{subtitle}</p>
          </div>
          {isMedicineAdmin ? (
            <div className="clinic-table-actions">
              <Link to="/dashboard" className="btn btn-sm btn-soft-secondary clinic-action-btn">
                <i className="ri-home-4-line" aria-hidden="true" />
                Admin home
              </Link>
              <Link to="/admin/reports" className="btn btn-sm btn-soft-secondary clinic-action-btn">
                <i className="ri-bar-chart-line" aria-hidden="true" />
                Reports
              </Link>
              <button
                type="button"
                className="btn btn-sm btn-soft-secondary clinic-action-btn"
                onClick={load}
                disabled={loading}
              >
                <i className="ri-refresh-line" aria-hidden="true" />
                Refresh
              </button>
            </div>
          ) : null}
        </div>
        {error ? (
          <Alert color="danger" className="py-2 small">
            {error}
          </Alert>
        ) : null}
        {loading ? (
          <div className="py-3 text-muted">
            <Spinner size="sm" className="me-2" /> Loading…
          </div>
        ) : null}
        {mode === "followup" && !loading ? (
          <Row className="g-3">
            <Col md={4}>
              <Card className="admin-dash-card admin-kpi-card">
                <CardBody>
                  <div className="text-muted small mb-2">By status</div>
                  {(summary || []).map((row) => (
                    <div key={row.name || row.Name}>
                      {row.name || row.Name}: {row.cnt ?? row.Cnt}
                    </div>
                  ))}
                  {(summary || []).length === 0 ? <div className="text-muted">No follow-up tasks.</div> : null}
                </CardBody>
              </Card>
            </Col>
            <Col md={8}>
              <Card className="admin-dash-card">
                <CardBody>
                  <Table responsive className="mb-0 clinic-data-table">
                    <thead>
                      <tr>
                        <th>Due</th>
                        <th>Title</th>
                        <th>Patient</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(due || []).length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-muted">
                            No open follow-ups are due.
                          </td>
                        </tr>
                      ) : (
                        (due || []).map((row) => (
                          <tr key={row.followUpTaskId || row.FollowUpTaskId}>
                            <td>{String(row.dueDate || row.DueDate || "").slice(0, 10)}</td>
                            <td>{row.title || row.Title}</td>
                            <td>{row.patientId || row.PatientId}</td>
                            <td>{row.status || row.Status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            </Col>
          </Row>
        ) : null}
        {mode === "performance" && !loading && data ? (
          <Row className="g-3">
            <Col md={4}>
              <Card className="admin-dash-card admin-kpi-card">
                <CardBody>
                  <div className="text-muted small">Paid orders</div>
                  <div className="fs-4">{paid?.cnt ?? paid?.Cnt ?? 0}</div>
                  <div>₹ {Number(paid?.amount ?? paid?.Amount ?? 0).toLocaleString("en-IN")}</div>
                </CardBody>
              </Card>
            </Col>
            <Col md={8}>
              <Card className="admin-dash-card">
                <CardBody>
                  {visits.length === 0 ? (
                    <div className="text-muted">No visits in this window.</div>
                  ) : (
                    visits.map((row) => (
                      <div key={row.name || row.Name}>
                        {row.name || row.Name}: {row.cnt ?? row.Cnt}
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        ) : null}
        {mode === "medicine" && !loading ? (
          <>
            <Row className="g-3 mb-3">
              <Col md={3}>
                <Card className="admin-dash-card admin-kpi-card">
                  <CardBody>
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <div className="text-muted small">Total orders</div>
                        <div className="fs-4">
                          {medicinePayload.totals?.orders ??
                            medicinePayload.byStatus.reduce((n, r) => n + Number(r.orders || 0), 0)}
                        </div>
                      </div>
                      <i className="ri-file-list-3-line kpi-tile-icon" aria-hidden="true" />
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="admin-dash-card admin-kpi-card">
                  <CardBody>
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <div className="text-muted small">Patients</div>
                        <div className="fs-4">
                          {medicinePayload.totals?.patients ?? "—"}
                        </div>
                      </div>
                      <i className="ri-group-line kpi-tile-icon" aria-hidden="true" />
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="admin-dash-card admin-kpi-card">
                  <CardBody>
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <div className="text-muted small">Pharmacies</div>
                        <div className="fs-4">
                          {medicinePayload.totals?.pharmacies ?? "—"}
                        </div>
                      </div>
                      <i className="ri-store-2-line kpi-tile-icon" aria-hidden="true" />
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="admin-dash-card admin-kpi-card">
                  <CardBody>
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <div className="text-muted small">Quote total</div>
                        <div className="fs-4">
                          {money(
                            medicinePayload.totals?.quoteTotal ??
                              medicinePayload.byStatus.reduce((n, r) => n + Number(r.quoteTotal || 0), 0)
                          )}
                        </div>
                      </div>
                      <i className="ri-wallet-3-line kpi-tile-icon" aria-hidden="true" />
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Card className="admin-dash-card mb-3">
              <CardBody>
                <h5 className="mb-2">By status</h5>
                <Table responsive className="mb-0 clinic-data-table align-middle">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Orders</th>
                      <th>Patients</th>
                      <th>Pharmacies</th>
                      <th>Quote total</th>
                      <th>Last order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicinePayload.byStatus.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-muted">
                          No medicine orders.
                        </td>
                      </tr>
                    ) : (
                      medicinePayload.byStatus.map((row) => (
                        <tr key={row.status}>
                          <td className="fw-medium">{row.status}</td>
                          <td>{row.orders}</td>
                          <td>{row.patients ?? "—"}</td>
                          <td>{row.pharmacies ?? "—"}</td>
                          <td>{row.quoteTotal == null ? "—" : money(row.quoteTotal)}</td>
                          <td>{formatWhen(row.lastCreatedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </CardBody>
            </Card>

            <Card className="admin-dash-card">
              <CardBody>
                <h5 className="mb-2">Recent orders</h5>
                <p className="text-muted small mb-2">Latest 50 medicine orders with pharmacy, items, and payment info.</p>
                <Table responsive className="mb-0 clinic-data-table align-middle">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Patient</th>
                      <th>Pharmacy</th>
                      <th>Items</th>
                      <th>Quote</th>
                      <th>Pay mode</th>
                      <th>Consent</th>
                      <th>Created</th>
                      <th>Last event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicinePayload.recent.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-muted">
                          No medicine orders yet. Empty is valid until a patient places an order.
                        </td>
                      </tr>
                    ) : (
                      medicinePayload.recent.map((row) => {
                        const id = pick(row, "medicineOrderId", "MedicineOrderId");
                        const patientName = pick(row, "patientName", "PatientName");
                        const patientId = pick(row, "patientId", "PatientId");
                        const pharmacy = pick(row, "pharmacyName", "PharmacyName");
                        return (
                          <tr key={id}>
                            <td className="fw-medium">{id}</td>
                            <td>{pick(row, "status", "Status") || "—"}</td>
                            <td>
                              {patientName ? `${patientName}` : "—"}
                              {patientId ? (
                                <span className="text-muted small d-block">#{patientId}</span>
                              ) : null}
                            </td>
                            <td>{pharmacy || pick(row, "pharmacyPartnerId", "PharmacyPartnerId") || "—"}</td>
                            <td>{pick(row, "itemCount", "ItemCount") ?? "—"}</td>
                            <td>{money(pick(row, "quoteAmount", "QuoteAmount"))}</td>
                            <td>{pick(row, "payMode", "PayMode") || "—"}</td>
                            <td>
                              {pick(row, "consentGranted", "ConsentGranted") === true ||
                              pick(row, "consentGranted", "ConsentGranted") === 1
                                ? "Yes"
                                : "No"}
                            </td>
                            <td>{formatWhen(pick(row, "createdAt", "CreatedAt"))}</td>
                            <td>{formatWhen(pick(row, "lastEventAt", "LastEventAt"))}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </>
        ) : null}
      </Container>
    </div>
  );
};

export default ClinicReportPage;
