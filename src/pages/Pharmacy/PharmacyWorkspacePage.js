import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Alert, Badge, Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner, Table } from "reactstrap";
import {
  acceptMedicineOrder,
  deliverMedicine,
  dispatchMedicine,
  markMedicineReady,
  medicineAcceptOtp,
  medicineTracking,
  onboardPharmacy,
  listPharmacyPartners,
  pharmacyQueue,
  quoteMedicineOrder,
  rejectMedicineOrder,
  s4Message,
  unwrapS4,
} from "../../helpers/s4Week4Api";
import "./components/pharmacyDashboard.css";

const orderStatus = (row) => String(row.status || row.Status || "").toUpperCase();
const orderIdOf = (row) => row.medicineOrderId || row.MedicineOrderId || row.id;
const quoteAmountOf = (row) => row.quoteAmount ?? row.QuoteAmount ?? "";
const field = (row, camel) => row?.[camel] ?? row?.[camel.charAt(0).toUpperCase() + camel.slice(1)];

const STATUS_META = {
  OFFERED: { color: "warning", label: "New offer", hint: "Confirm patient consent, send OTP, then accept or reject." },
  ACCEPTED: { color: "info", label: "Accepted", hint: "Send a price quote to the patient." },
  QUOTED: { color: "primary", label: "Quoted", hint: "Waiting for the patient to accept the quote." },
  QUOTED_ACCEPTED: { color: "primary", label: "Quote accepted", hint: "Waiting for the patient to pay." },
  PAID: { color: "success", label: "Paid", hint: "Pack the order and mark it ready." },
  COD_PENDING: { color: "success", label: "Cash on delivery", hint: "Pack the order and mark it ready." },
  READY: { color: "dark", label: "Ready", hint: "Hand over to delivery and mark dispatched." },
  DISPATCHED: { color: "info", label: "Dispatched", hint: "Mark delivered when the patient receives it." },
  DELIVERED: { color: "secondary", label: "Delivered", hint: "Completed." },
  REJECTED: { color: "danger", label: "Rejected", hint: "Closed." },
};

const REJECT_REASONS = { OUT_OF_STOCK: "Out of stock", CLOSED: "Pharmacy closed", OTHER: "Other" };

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const formatAmount = (value) => {
  if (value === "" || value === null || value === undefined) return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toFixed(2)}` : String(value);
};

const PharmacyWorkspacePage = ({ mode = "orders" }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [otpById, setOtpById] = useState({});
  const [otpSentById, setOtpSentById] = useState({});
  const [quoteById, setQuoteById] = useState({});
  const [detailById, setDetailById] = useState({});
  const [openId, setOpenId] = useState(null);
  const [onboard, setOnboard] = useState({
    name: "",
    mobile: "",
    licenceNumber: "",
    expiryDate: "",
    area: "",
  });
  const [submitted, setSubmitted] = useState(null);
  const [mine, setMine] = useState([]);

  const pageTitle =
    mode === "onboarding"
      ? "Pharmacy onboarding"
      : mode === "quotes"
        ? "Quotes"
        : mode === "stock"
          ? "Stock confirmation"
          : mode === "prescriptions"
            ? "Prescriptions"
            : "Medicine orders";
  const pageIcon =
    mode === "onboarding"
      ? "ri-store-3-line"
      : mode === "quotes"
        ? "ri-price-tag-3-line"
        : mode === "stock"
          ? "ri-checkbox-circle-line"
          : mode === "prescriptions"
            ? "ri-file-list-3-line"
            : "ri-capsule-line";
  document.title = `${pageTitle} | Niga Homeocentrum`;

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = mode === "onboarding" ? { data: [] } : await pharmacyQueue();
      const data = unwrapS4(response);
      const list = Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : Array.isArray(data?.data) ? data.data : [];
      setRows(list);
    } catch (err) {
      setRows([]);
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  const loadMine = async () => {
    try {
      const response = await listPharmacyPartners();
      const data = unwrapS4(response);
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setMine(list);
    } catch (err) {
      setMine([]);
      setError(s4Message(err));
    }
  };

  useEffect(() => {
    if (mode === "orders" || mode === "quotes" || mode === "stock" || mode === "prescriptions") loadOrders();
    else {
      setLoading(false);
      loadMine();
    }
  }, [mode]);

  const isQuotes = mode === "quotes";
  const isStock = mode === "stock";
  const isPrescriptions = mode === "prescriptions";
  const visibleRows = isQuotes
    ? rows.filter((row) => {
        const status = orderStatus(row);
        return status === "ACCEPTED" || status === "QUOTED";
      })
    : isStock
      ? rows.filter((row) => orderStatus(row) === "OFFERED")
      : rows;

  const runAction = async (id, work, successText, reload = true) => {
    setBusyId(id);
    setError("");
    setNote("");
    try {
      const result = await work();
      if (successText) setNote(typeof successText === "function" ? successText(result) : successText);
      if (reload) {
        setDetailById((prev) => ({ ...prev, [id]: undefined }));
        await loadOrders();
      }
      return result;
    } catch (err) {
      setError(s4Message(err));
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const requestOtp = (id) =>
    runAction(
      id,
      async () => {
        const response = await medicineAcceptOtp(id);
        const devCode = response?.devCode ?? response?.data?.devCode;
        setOtpSentById((prev) => ({ ...prev, [id]: true }));
        if (devCode) setOtpById((prev) => ({ ...prev, [id]: String(devCode) }));
        return response;
      },
      `OTP created for order ${id}. Enter it to accept.`,
      false
    );

  const acceptOrder = (id) =>
    runAction(
      id,
      () => acceptMedicineOrder(id, { otp: otpById[id] || "", stockConfirmed: true }),
      `Order ${id} accepted. Remedy names are now visible. Send a quote next.`
    ).then((result) => {
      if (result) {
        setOtpById((prev) => ({ ...prev, [id]: "" }));
        setOtpSentById((prev) => ({ ...prev, [id]: false }));
      }
    });

  const rejectOrder = async (id) => {
    const choice = await Swal.fire({
      title: `Reject order ${id}?`,
      input: "select",
      inputOptions: REJECT_REASONS,
      inputPlaceholder: "Select a reason",
      showCancelButton: true,
      confirmButtonText: "Reject order",
      confirmButtonColor: "#dc3545",
      inputValidator: (value) => (!value ? "Select a reason." : undefined),
    });
    if (!choice.isConfirmed) return;
    await runAction(id, () => rejectMedicineOrder(id, { reason: choice.value }), `Order ${id} rejected.`);
  };

  const saveQuote = (id) => {
    const amount = Number(quoteById[id] || 0);
    if (!(amount > 0)) {
      setError("Enter a quote amount greater than 0.");
      return;
    }
    runAction(id, () => quoteMedicineOrder(id, { amount }), `Quote of ${formatAmount(amount)} sent for order ${id}.`).then(
      (result) => {
        if (result) setQuoteById((prev) => ({ ...prev, [id]: "" }));
      }
    );
  };

  const toggleDetail = async (id) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (detailById[id]) return;
    try {
      const response = await medicineTracking(id);
      setDetailById((prev) => ({ ...prev, [id]: unwrapS4(response) || {} }));
    } catch (err) {
      setDetailById((prev) => ({ ...prev, [id]: { error: s4Message(err) } }));
    }
  };

  const saveOnboard = async () => {
    setBusyId("onboard");
    setError("");
    setNote("");
    if (!onboard.name.trim() || onboard.name.trim().length < 2) {
      setError("Pharmacy name is required.");
      setBusyId(null);
      return;
    }
    const mobile = String(onboard.mobile || "").replace(/\D/g, "");
    if (mobile.length < 8) {
      setError("A valid mobile is required.");
      setBusyId(null);
      return;
    }
    if (!onboard.licenceNumber.trim() || onboard.licenceNumber.trim().length < 3) {
      setError("Licence number is required.");
      setBusyId(null);
      return;
    }
    if (!onboard.expiryDate) {
      setError("Licence expiry is required.");
      setBusyId(null);
      return;
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    if (onboard.expiryDate < todayIso) {
      setError("Licence expiry must be today or later.");
      setBusyId(null);
      return;
    }
    try {
      const payload = {
        name: onboard.name.trim(),
        mobile: onboard.mobile.trim(),
        licenceNumber: onboard.licenceNumber.trim(),
        expiryDate: onboard.expiryDate,
        area: onboard.area.trim(),
      };
      const response = await onboardPharmacy(payload);
      const inner = unwrapS4(response);
      const message =
        response?.message ||
        inner?.message ||
        "Pharmacy stored as pending until admin activation.";
      setSubmitted({
        ...payload,
        pharmacyPartnerId: inner?.pharmacyPartnerId || inner?.PharmacyPartnerId,
        status: inner?.status || inner?.Status || "PENDING",
        message,
      });
      setNote(message);
      setOnboard({ name: "", mobile: "", licenceNumber: "", expiryDate: "", area: "" });
      await loadMine();
    } catch (err) {
      setSubmitted(null);
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  if (mode === "onboarding") {
    return (
      <div className="page-content admin-dashboard-page pharmacy-dashboard-page clinic-workspace-page">
        <Container fluid>
          <h2 className="pharmacy-page-title"><i className="ri-store-3-line" aria-hidden="true" />Pharmacy onboarding</h2>
          {error ? <Alert color="danger">{error}</Alert> : null}
          <div className="pharmacy-stack">
          {submitted ? (
            <>
              <Alert color="success">
                {submitted.message || "Pharmacy stored as pending until admin activation."}
              </Alert>
              <Card className="admin-dash-card mb-0">
                <CardBody>
                  <h5 className="pharmacy-section-title">Submitted for activation</h5>
                  <Row className="g-2 pharmacy-form">
                    <Col md={4}>
                      <FormGroup>
                        <Label>Pharmacy name</Label>
                        <Input value={submitted.name} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Mobile</Label>
                        <Input value={submitted.mobile} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Licence number</Label>
                        <Input value={submitted.licenceNumber} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Licence expiry</Label>
                        <Input value={submitted.expiryDate} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Service area</Label>
                        <Input value={submitted.area} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Status</Label>
                        <Input value={submitted.status || "PENDING"} disabled />
                      </FormGroup>
                    </Col>
                  </Row>
                  <p className="text-muted small mb-3">
                    {submitted.name} is {String(submitted.status || "PENDING").toUpperCase() === "ACTIVE" ? "activated" : "pending"}.
                    {submitted.pharmacyPartnerId ? ` Id ${submitted.pharmacyPartnerId}.` : ""}
                  </p>
                  <Button
                    className="btn btn-sm btn-soft-secondary"
                    onClick={() => {
                      setSubmitted(null);
                      setNote("");
                      setError("");
                    }}
                  >
                    <i className="ri-store-2-line" aria-hidden="true" /> Submit another pharmacy
                  </Button>
                </CardBody>
              </Card>
            </>
          ) : (
            <Card className="admin-dash-card mb-0">
              <CardBody>
                <Row className="g-2 pharmacy-form">
                  <Col md={4}>
                    <FormGroup>
                      <Label>Pharmacy name</Label>
                      <Input value={onboard.name} onChange={(e) => setOnboard({ ...onboard, name: e.target.value })} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Mobile</Label>
                      <Input value={onboard.mobile} onChange={(e) => setOnboard({ ...onboard, mobile: e.target.value })} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Licence number</Label>
                      <Input value={onboard.licenceNumber} onChange={(e) => setOnboard({ ...onboard, licenceNumber: e.target.value })} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Licence expiry</Label>
                      <Input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={onboard.expiryDate}
                        onChange={(e) => setOnboard({ ...onboard, expiryDate: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Service area</Label>
                      <Input value={onboard.area} onChange={(e) => setOnboard({ ...onboard, area: e.target.value })} />
                    </FormGroup>
                  </Col>
                </Row>
                <div className="pharmacy-form-actions">
                  <Button className="btn btn-sm btn-soft-primary" disabled={busyId === "onboard"} onClick={saveOnboard}>
                    <i className="ri-checkbox-circle-line" aria-hidden="true" />
                    {busyId === "onboard" ? "Submitting…" : "Submit for activation"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
          <Card className="admin-dash-card mb-0">
            <div className="pharmacy-card-head">
              <h5 className="mb-0">Submitted pharmacies</h5>
              <button type="button" className="btn btn-sm btn-soft-secondary" onClick={loadMine}>
                <i className="ri-refresh-line" aria-hidden="true" />
                Refresh
              </button>
            </div>
            <CardBody>
              <p className="pharmacy-hint">Pending means submitted and waiting for admin. Active means activated.</p>
              {mine.length === 0 ? (
                <p className="text-muted mb-0">Nothing submitted on this login yet.</p>
              ) : (
                <Table size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Name</th>
                      <th>Area</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mine.map((row) => {
                      const id = row.pharmacyPartnerId || row.PharmacyPartnerId || row.id;
                      const status = String(row.status || row.Status || "PENDING");
                      return (
                        <tr key={id}>
                          <td>{id || "—"}</td>
                          <td>{row.name || row.Name || "—"}</td>
                          <td>{row.area || row.Area || "—"}</td>
                          <td>{status.toUpperCase() === "ACTIVE" ? "Activated" : status || "Pending"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
          </div>
        </Container>
      </div>
    );
  }

  const renderActions = (row) => {
    const id = orderIdOf(row);
    const status = orderStatus(row);
    const busy = busyId === id;
    const consent = Boolean(field(row, "consentGranted"));

    if (status === "OFFERED") {
      if (!consent) {
        return <span className="small text-muted">Waiting for patient consent.</span>;
      }
      const otp = String(otpById[id] || "");
      return (
        <div className="d-flex flex-wrap gap-1 align-items-center">
          <button type="button" className="btn btn-sm btn-soft-secondary clinic-action-btn" disabled={busy} onClick={() => requestOtp(id)}>
            {otpSentById[id] ? "Resend OTP" : "Send OTP"}
          </button>
          <Input
            bsSize="sm"
            style={{ width: 90 }}
            placeholder="OTP"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            disabled={busy || !otpSentById[id]}
            onChange={(e) => setOtpById({ ...otpById, [id]: e.target.value.replace(/\D/g, "").slice(0, 6) })}
          />
          <button type="button" className="btn btn-sm btn-soft-success clinic-action-btn" disabled={busy || otp.length !== 6} onClick={() => acceptOrder(id)}>
            Accept
          </button>
          <button type="button" className="btn btn-sm btn-soft-danger clinic-action-btn" disabled={busy} onClick={() => rejectOrder(id)}>
            Reject
          </button>
        </div>
      );
    }

    if (status === "ACCEPTED") {
      return (
        <div className="d-flex flex-wrap gap-1 align-items-center">
          <Input
            bsSize="sm"
            type="number"
            min="1"
            style={{ width: 110 }}
            placeholder="Amount ₹"
            value={quoteById[id] || ""}
            disabled={busy}
            onChange={(e) => setQuoteById({ ...quoteById, [id]: e.target.value })}
          />
          <button
            type="button"
            className="btn btn-sm btn-soft-primary clinic-action-btn"
            disabled={busy || !(Number(quoteById[id]) > 0)}
            onClick={() => saveQuote(id)}
          >
            <i className="ri-send-plane-line" aria-hidden="true" /> Send quote
          </button>
          {!isQuotes ? (
            <button type="button" className="btn btn-sm btn-soft-danger clinic-action-btn" disabled={busy} onClick={() => rejectOrder(id)}>
              <i className="ri-close-circle-line" aria-hidden="true" /> Reject
            </button>
          ) : null}
        </div>
      );
    }

    if (status === "PAID" || status === "COD_PENDING") {
      return (
        <Button
          size="sm"
          color="soft-info"
          disabled={busy}
          onClick={() => runAction(id, () => markMedicineReady(id), `Order ${id} marked ready.`)}
        >
          <i className="ri-checkbox-circle-line" aria-hidden="true" /> Mark ready
        </Button>
      );
    }

    if (status === "READY") {
      return (
        <Button
          size="sm"
          color="soft-dark"
          disabled={busy}
          onClick={() => runAction(id, () => dispatchMedicine(id), `Order ${id} dispatched.`)}
        >
          <i className="ri-truck-line" aria-hidden="true" /> Dispatch
        </Button>
      );
    }

    if (status === "DISPATCHED") {
      return (
        <Button
          size="sm"
          color="soft-success"
          disabled={busy}
          onClick={() => runAction(id, () => deliverMedicine(id), `Order ${id} delivered.`)}
        >
          <i className="ri-checkbox-circle-line" aria-hidden="true" /> Mark delivered
        </Button>
      );
    }

    return <span className="small text-muted">{STATUS_META[status]?.hint || "No action."}</span>;
  };

  const renderDetail = (id) => {
    const detail = detailById[id];
    if (!detail) {
      return (
        <div className="small text-muted">
          <Spinner size="sm" /> Loading order details…
        </div>
      );
    }
    if (detail.error) return <div className="small text-danger">{detail.error}</div>;
    const items = detail.items || detail.Items || [];
    const events = detail.events || detail.Events || [];
    return (
      <Row className="g-3">
        <Col md={6}>
          <h6 className="mb-2">Medicines</h6>
          {items.length === 0 ? (
            <p className="small text-muted mb-0">No medicines on this order.</p>
          ) : (
            <ul className="small mb-0 ps-3">
              {items.map((item, index) => (
                <li key={`${field(item, "remedyCode")}-${index}`}>
                  {field(item, "remedyName") || `Remedy code ${field(item, "remedyCode") || "—"} (name shown after accept)`}
                </li>
              ))}
            </ul>
          )}
        </Col>
        <Col md={6}>
          <h6 className="mb-2">Timeline</h6>
          {events.length === 0 ? (
            <p className="small text-muted mb-0">No events yet.</p>
          ) : (
            <ul className="small mb-0 ps-3">
              {events.map((event, index) => (
                <li key={index}>
                  <strong>{field(event, "status")}</strong> · {formatDateTime(field(event, "at"))}
                  {field(event, "detail") ? ` · ${field(event, "detail")}` : ""}
                </li>
              ))}
            </ul>
          )}
        </Col>
      </Row>
    );
  };

  return (
    <div className="page-content admin-dashboard-page pharmacy-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title pharmacy-page-title"><i className={pageIcon} aria-hidden="true" />{pageTitle}</h2>
            <p className="clinic-page-subtitle pharmacy-page-subtitle mb-0">
              {isQuotes
                ? "Accepted orders waiting for a price, and quotes waiting for the patient."
                : isStock
                  ? "Confirm the pack is in stock when you accept. There is no separate stock catalogue."
                  : isPrescriptions
                    ? "Each order is the signed prescription. Remedy names stay hidden until you accept with the OTP."
                    : "Send the OTP and accept or reject new offers, quote a price, then mark ready and dispatch after the patient pays."}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-soft-secondary clinic-action-btn"
            onClick={loadOrders}
            disabled={loading}
          >
            <i className="ri-refresh-line" aria-hidden="true" />
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
        {error ? <Alert color="danger" className="py-2 small" toggle={() => setError("")}>{error}</Alert> : null}
        {note ? <Alert color="success" className="py-2 small" toggle={() => setNote("")}>{note}</Alert> : null}
        <Card className="admin-dash-card pharmacy-list-card mb-0">
          <CardBody>
            {loading ? (
              <div className="text-center py-4"><Spinner size="sm" /> Loading…</div>
            ) : visibleRows.length === 0 ? (
              <p className="text-muted mb-0">
                {isQuotes
                  ? "No orders are waiting for a quote. Accept the order on Medicine orders first."
                  : isStock
                    ? "No orders are waiting for a stock check."
                    : isPrescriptions
                      ? "No signed prescriptions have been handed to your pharmacy yet."
                      : "No medicine orders assigned to your pharmacy yet."}
              </p>
            ) : (
              <div className="table-responsive">
                <Table size="sm" className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Patient</th>
                      <th>Status</th>
                      <th>Quote</th>
                      <th>Received</th>
                      <th>Action</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => {
                      const id = orderIdOf(row);
                      const status = orderStatus(row);
                      const meta = STATUS_META[status] || { color: "secondary", label: status || "—" };
                      const patientName = field(row, "patientName");
                      const mobile = field(row, "patientMobile");
                      const address = field(row, "patientAddress");
                      const payMode = field(row, "payMode");
                      return (
                        <React.Fragment key={id}>
                          <tr>
                            <td>
                              <div className="fw-semibold">#{id}</div>
                              <div className="small text-muted">
                                eRx #{field(row, "erxSnapshotId") ?? "—"} · {field(row, "itemCount") ?? 0} item(s)
                              </div>
                              {field(row, "pharmacyName") ? (
                                <div className="small text-muted">{field(row, "pharmacyName")}</div>
                              ) : null}
                            </td>
                            <td>
                              {patientName ? (
                                <>
                                  <div>{patientName}</div>
                                  <div className="small text-muted">
                                    {[mobile, address].filter(Boolean).join(" · ") || "—"}
                                  </div>
                                </>
                              ) : (
                                <span className="small text-muted">Shown after accept</span>
                              )}
                            </td>
                            <td>
                              <Badge color={meta.color}>{meta.label}</Badge>
                              {status === "OFFERED" && !field(row, "consentGranted") ? (
                                <div className="small text-muted">No consent yet</div>
                              ) : null}
                              {payMode ? <div className="small text-muted">Pay: {payMode}</div> : null}
                            </td>
                            <td>{formatAmount(quoteAmountOf(row))}</td>
                            <td className="small">{formatDateTime(field(row, "createdAt"))}</td>
                            <td>{renderActions(row)}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="pharmacy-row-view"
                                title={openId === id ? "Hide details" : "View details"}
                                aria-label={openId === id ? "Hide details" : "View details"}
                                onClick={() => toggleDetail(id)}
                              >
                                <i className={openId === id ? "ri-eye-off-line" : "ri-eye-line"} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                          {openId === id ? (
                            <tr>
                              <td colSpan={7} className="bg-light">
                                {renderDetail(id)}
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default PharmacyWorkspacePage;
